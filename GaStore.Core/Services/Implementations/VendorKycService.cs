using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Cloudinary;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ImageUploads;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Users;
using GaStore.Data.Enums;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Core.Services.Implementations
{
    public class VendorKycService : IVendorKycService
    {
        private static readonly string[] AllowedDocumentExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
        private static readonly string[] AllowedDocumentContentTypes = ["image/jpeg", "image/png", "application/pdf"];
        private const long MaxDocumentSizeBytes = 10 * 1024 * 1024;

        private readonly DatabaseContext _context;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IImageUploadService _imageUploadService;
        private readonly ICloudinaryService? _cloudinaryService;
        private readonly IMapper _mapper;
        private readonly ILogger<VendorKycService> _logger;
        private readonly AppSettings _appSettings;

        public VendorKycService(
            DatabaseContext context,
            IUnitOfWork unitOfWork,
            IImageUploadService imageUploadService,
            IMapper mapper,
            ILogger<VendorKycService> logger,
            IOptions<AppSettings> appSettings,
            ICloudinaryService? cloudinaryService = null)
        {
            _context = context;
            _unitOfWork = unitOfWork;
            _imageUploadService = imageUploadService;
            _mapper = mapper;
            _logger = logger;
            _appSettings = appSettings.Value;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<ServiceResponse<VendorKycStatusDto>> BecomeVendorAsync(Guid userId)
        {
            var response = new ServiceResponse<VendorKycStatusDto>();

            try
            {
                var user = await GetUserAsync(userId);
                if (user == null)
                {
                    response.StatusCode = 404;
                    response.Message = "User not found.";
                    return response;
                }

                if (!user.IsVendor)
                {
                    user.IsVendor = true;
                    await EnsureVendorRoleAsync(userId);
                    await _unitOfWork.CompletedAsync(userId);
                }

                response.StatusCode = 200;
                response.Message = "Vendor account activated successfully.";
                response.Data = await BuildStatusDtoAsync(user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating vendor account for user {UserId}", userId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<VendorKycDto>> UpsertKycAsync(Guid userId, VendorKycUpsertDto dto, bool submitForReview)
        {
            var response = new ServiceResponse<VendorKycDto>();

            try
            {
                var user = await GetUserAsync(userId);
                if (user == null)
                {
                    response.StatusCode = 404;
                    response.Message = "User not found.";
                    return response;
                }

                if (!user.IsVendor)
                {
                    user.IsVendor = true;
                    await EnsureVendorRoleAsync(userId);
                }

                var kyc = await _context.VendorKycs
                    .Include(x => x.User)
                    .FirstOrDefaultAsync(x => x.UserId == userId);

                if (kyc == null)
                {
                    kyc = new VendorKyc
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Status = KycStatus.NotStarted
                    };
                    await _unitOfWork.VendorKycRepository.Add(kyc);
                }

                if (!string.IsNullOrWhiteSpace(dto.BusinessName))
                {
                    kyc.BusinessName = dto.BusinessName.Trim();
                }

                if (!string.IsNullOrWhiteSpace(dto.BusinessAddress))
                {
                    kyc.BusinessAddress = dto.BusinessAddress.Trim();
                }

                if (!string.IsNullOrWhiteSpace(dto.IdType))
                {
                    kyc.IdType = dto.IdType.Trim();
                }

                if (dto.LivePicture != null)
                {
                    var livePictureUpload = await _imageUploadService.UploadAndOptimizeImageAsync(dto.LivePicture, "wwwroot/uploads/vendor-kyc/live");
                    if (!livePictureUpload.IsSuccess)
                    {
                        response.StatusCode = 400;
                        response.Message = livePictureUpload.ErrorMessage ?? "Invalid live picture.";
                        return response;
                    }

                    kyc.LivePictureUrl = livePictureUpload.ImageUrl;
                }

                if (dto.ValidId != null)
                {
                    var validIdUpload = await UploadDocumentAsync(dto.ValidId, "wwwroot/uploads/vendor-kyc/documents");
                    if (!validIdUpload.IsSuccess)
                    {
                        response.StatusCode = 400;
                        response.Message = validIdUpload.ErrorMessage ?? "Invalid valid ID document.";
                        return response;
                    }

                    kyc.ValidIdUrl = validIdUpload.Url;
                }

                if (dto.BusinessCertificate != null)
                {
                    var certificateUpload = await UploadDocumentAsync(dto.BusinessCertificate, "wwwroot/uploads/vendor-kyc/certificates");
                    if (!certificateUpload.IsSuccess)
                    {
                        response.StatusCode = 400;
                        response.Message = certificateUpload.ErrorMessage ?? "Invalid business certificate.";
                        return response;
                    }

                    kyc.BusinessCertificateUrl = certificateUpload.Url;
                }

                if (submitForReview)
                {
                    var validationError = ValidateSubmissionReadiness(kyc);
                    if (!string.IsNullOrWhiteSpace(validationError))
                    {
                        response.StatusCode = 400;
                        response.Message = validationError;
                        return response;
                    }

                    kyc.Status = KycStatus.Pending;
                    kyc.RejectionReason = null;
                    kyc.SubmittedAt = DateTime.UtcNow;
                    kyc.ReviewedAt = null;
                    kyc.ReviewedByAdminId = null;
                    user.KycStatus = KycStatus.Pending;
                    user.CanPost = false;
                }
                else if (kyc.Status == KycStatus.NotStarted)
                {
                    user.KycStatus = KycStatus.NotStarted;
                    user.CanPost = false;
                }

                await _unitOfWork.CompletedAsync(userId);

                var savedKyc = await _context.VendorKycs.Include(x => x.User).FirstAsync(x => x.UserId == userId);
                response.StatusCode = 200;
                response.Message = submitForReview ? "KYC submitted successfully." : "KYC draft saved successfully.";
                response.Data = _mapper.Map<VendorKycDto>(savedKyc);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting vendor KYC for user {UserId}", userId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<VendorKycStatusDto>> GetStatusAsync(Guid userId)
        {
            var response = new ServiceResponse<VendorKycStatusDto>();

            try
            {
                var status = await BuildStatusDtoAsync(userId);
                if (status == null)
                {
                    response.StatusCode = 404;
                    response.Message = "User not found.";
                    return response;
                }

                response.StatusCode = 200;
                response.Message = "Vendor KYC status retrieved successfully.";
                response.Data = status;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vendor KYC status for user {UserId}", userId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<PaginatedServiceResponse<List<VendorKycDto>>> GetPendingKycAsync(int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<VendorKycDto>>();

            try
            {
                pageNumber = Math.Max(pageNumber, 1);
                pageSize = Math.Max(pageSize, 1);

                var query = _context.VendorKycs
                    .Include(x => x.User)
                    .Where(x => x.Status == KycStatus.Pending)
                    .OrderBy(x => x.SubmittedAt ?? x.DateCreated);

                response.TotalRecords = await query.CountAsync();
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.Status = 200;
                response.Message = "Pending KYC submissions retrieved successfully.";
                var items = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
                response.Data = items.Select(x => _mapper.Map<VendorKycDto>(x)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending vendor KYC submissions");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public Task<ServiceResponse<VendorKycDto>> ApproveKycAsync(Guid kycId, Guid adminId)
        {
            return ModerateKycAsync(kycId, adminId, true, null);
        }

        public Task<ServiceResponse<VendorKycDto>> RejectKycAsync(Guid kycId, Guid adminId, string? reason)
        {
            return ModerateKycAsync(kycId, adminId, false, reason);
        }

        private async Task<ServiceResponse<VendorKycDto>> ModerateKycAsync(Guid kycId, Guid adminId, bool approve, string? reason)
        {
            var response = new ServiceResponse<VendorKycDto>();

            try
            {
                var admin = await GetUserAsync(adminId);
                if (admin == null || (!admin.IsAdmin && !admin.IsSuperAdmin))
                {
                    response.StatusCode = 403;
                    response.Message = "You are not authorized to review KYC submissions.";
                    return response;
                }

                var kyc = await _context.VendorKycs
                    .Include(x => x.User)
                    .FirstOrDefaultAsync(x => x.Id == kycId);

                if (kyc == null)
                {
                    response.StatusCode = 404;
                    response.Message = "KYC submission not found.";
                    return response;
                }

                if (kyc.Status != KycStatus.Pending)
                {
                    response.StatusCode = 400;
                    response.Message = "Only pending KYC submissions can be reviewed.";
                    return response;
                }

                kyc.Status = approve ? KycStatus.Approved : KycStatus.Rejected;
                kyc.ReviewedAt = DateTime.UtcNow;
                kyc.ReviewedByAdminId = adminId;
                kyc.RejectionReason = approve ? null : string.IsNullOrWhiteSpace(reason) ? "KYC submission was rejected." : reason.Trim();
                kyc.User.KycStatus = kyc.Status;
                kyc.User.CanPost = approve;

                await _unitOfWork.CompletedAsync(adminId);

                response.StatusCode = 200;
                response.Message = approve ? "KYC approved successfully." : "KYC rejected successfully.";
                response.Data = _mapper.Map<VendorKycDto>(kyc);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reviewing KYC submission {KycId}", kycId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        private async Task<User?> GetUserAsync(Guid userId)
        {
            return await _context.Users.Include(x => x.VendorKyc).FirstOrDefaultAsync(x => x.Id == userId);
        }

        private async Task EnsureVendorRoleAsync(Guid userId)
        {
            var existingRole = await _unitOfWork.RoleRepository.Get(x => x.UserId == userId && x.Name == CustomRoles.Vendor);
            if (existingRole == null)
            {
                await _unitOfWork.RoleRepository.Add(new Role
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = CustomRoles.Vendor,
                    Description = "Marketplace vendor"
                });
            }
        }

        private async Task<VendorKycStatusDto?> BuildStatusDtoAsync(Guid userId)
        {
            var user = await _context.Users.Include(x => x.VendorKyc).FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null)
            {
                return null;
            }

            VendorKycDto? kycDto = null;
            if (user.VendorKyc != null)
            {
                user.VendorKyc.User = user;
                kycDto = _mapper.Map<VendorKycDto>(user.VendorKyc);
            }

            return new VendorKycStatusDto
            {
                IsVendor = user.IsVendor,
                CanPost = user.CanPost,
                KycStatus = user.KycStatus,
                Kyc = kycDto
            };
        }

        private static string? ValidateSubmissionReadiness(VendorKyc kyc)
        {
            if (string.IsNullOrWhiteSpace(kyc.BusinessName))
            {
                return "Business name is required before submitting KYC.";
            }

            if (string.IsNullOrWhiteSpace(kyc.IdType))
            {
                return "ID type is required before submitting KYC.";
            }

            if (string.IsNullOrWhiteSpace(kyc.BusinessAddress))
            {
                return "Business address is required before submitting KYC.";
            }

            if (string.IsNullOrWhiteSpace(kyc.LivePictureUrl))
            {
                return "Live/selfie image is required before submitting KYC.";
            }

            if (string.IsNullOrWhiteSpace(kyc.ValidIdUrl))
            {
                return "A valid ID upload is required before submitting KYC.";
            }

            return null;
        }

        private async Task<(bool IsSuccess, string? Url, string? ErrorMessage)> UploadDocumentAsync(IFormFile file, string folder)
        {
            if (!await ValidateDocumentAsync(file))
            {
                return (false, null, "Only JPG, PNG, or PDF files up to 10MB are allowed.");
            }

            if (_appSettings.UseCloudinary && _cloudinaryService != null)
            {
                var upload = await _cloudinaryService.UploadFileAsync(file);
                return upload.IsSuccess ? (true, upload.Url, null) : (false, null, upload.ErrorMessage);
            }

            var monthFolder = Path.Combine(Directory.GetCurrentDirectory(), folder, DateTime.UtcNow.ToString("yyyy-MM"));
            Directory.CreateDirectory(monthFolder);

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid():N}{extension}";
            var fullPath = Path.Combine(monthFolder, fileName);

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = fullPath.Replace(Directory.GetCurrentDirectory(), string.Empty).Replace("\\", "/");
            var url = $"{_appSettings.ApiRoot?.TrimEnd('/')}{relativePath.Replace("/wwwroot", string.Empty)}";
            return (true, url, null);
        }

        private async Task<bool> ValidateDocumentAsync(IFormFile file)
        {
            if (file == null || file.Length == 0 || file.Length > MaxDocumentSizeBytes)
            {
                return false;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedDocumentExtensions.Contains(extension))
            {
                return false;
            }

            if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedDocumentContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            {
                return false;
            }

            if (extension != ".pdf")
            {
                return await _imageUploadService.ValidateImageFileAsync(file);
            }

            await using var stream = file.OpenReadStream();
            var header = new byte[4];
            var bytesRead = await stream.ReadAsync(header);
            return bytesRead == 4 && header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46;
        }
    }
}
