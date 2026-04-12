using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Formats.Gif;
using SixLabors.ImageSharp.Processing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.AdsDto;
using GaStore.Data.Entities.Ads;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;
using GaStore.Shared.Uploads;

namespace GaStore.Core.Services.Implementations
{
    public class BannerService : IBannerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<BannerService> _logger;
        private readonly IMapper _mapper;
        private readonly AppSettings _appSettings;
        private readonly UploadServiceOptions _uploadServiceOptions;
        private readonly IImageUploadService _imageUploadService;
        private readonly IUploadServiceClient? _uploadServiceClient;

        public BannerService(
            IUnitOfWork unitOfWork,
            ILogger<BannerService> logger,
            IMapper mapper,
            IOptions<AppSettings> appSettings,
            IOptions<UploadServiceOptions>? uploadServiceOptions,
            IImageUploadService imageUploadService,
            IUploadServiceClient? uploadServiceClient = null)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _mapper = mapper;
            _appSettings = appSettings.Value;
            _uploadServiceOptions = uploadServiceOptions?.Value ?? new UploadServiceOptions();
            _imageUploadService = imageUploadService;
            _uploadServiceClient = uploadServiceClient;
        }

        public async Task<PaginatedServiceResponse<List<BannerDto>>> GetBannersAsync(int pageNumber, int pageSize, string type)
        {
            var response = new PaginatedServiceResponse<List<BannerDto>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                IQueryable<Banner> query = _unitOfWork.SliderRepository
                    .GetAllIncluding(s => s.User)
                    .Where(x => x.Type == type);

                var totalRecords = await query.CountAsync();

                var pagedBanners = await query
                    .OrderByDescending(s => s.DateCreated)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var banners = _mapper.Map<List<BannerDto>>(pagedBanners);

                response.Status = 200;
                response.Message = "Banners retrieved successfully";
                response.Data = banners;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving banners.");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<BannerDto>> GetBannerByIdAsync(Guid id)
        {
            var response = new ServiceResponse<BannerDto>();

            try
            {
                var banner = await _unitOfWork.SliderRepository.GetById(id);

                if (banner == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Banner not found.";
                    return response;
                }

                var bannerDto = _mapper.Map<BannerDto>(banner);

                response.StatusCode = 200;
                response.Message = "Banner retrieved successfully";
                response.Data = bannerDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving banner.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<BannerDto>> CreateBannerAsync(BannerDto bannerDto, Guid userId)
        {
            var response = new ServiceResponse<BannerDto>();
            try
            {
                // Validate input
                var validationResult = ValidateBannerInput(bannerDto);
                if (!validationResult.IsValid)
                {
                    response.StatusCode = 400;
                    response.Message = validationResult.ErrorMessage;
                    return response;
                }

                // Validate image file
                if (!await IsValidBannerMediaFileAsync(bannerDto))
                {
                    response.StatusCode = 400;
                    response.Message = "Invalid slider media format or size.";
                    return response;
                }

                string imageUrl = await UploadBannerMediaAsync(bannerDto);
                if (string.IsNullOrEmpty(imageUrl))
                {
                    response.StatusCode = 400;
                    response.Message = "Failed to upload slider media.";
                    return response;
                }

                // Create banner entity
                var banner = new Banner
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Title = bannerDto.Title,
                    Type = bannerDto.Type,
                    ImageUrl = imageUrl,
                    HasLink = bannerDto.HasLink,
                    Link = bannerDto.HasLink ? bannerDto.Link : null,
                    IsActive = true,
                    DateCreated = DateTime.UtcNow
                };

                // Save to database
                await _unitOfWork.SliderRepository.Add(banner);
                await _unitOfWork.CompletedAsync(userId);

                // Prepare response
                bannerDto.Id = banner.Id;
                bannerDto.ImageUrl = banner.ImageUrl;
                bannerDto.UserId = userId;

                response.StatusCode = 201;
                response.Message = "Banner created successfully";
                response.Data = bannerDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating banner.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<BannerDto>> UpdateBannerAsync(BannerDto bannerDto, Guid userId)
        {
            var response = new ServiceResponse<BannerDto>();

            try
            {
                // Validate input
                if (bannerDto == null || bannerDto.Id == Guid.Empty)
                {
                    response.StatusCode = 400;
                    response.Message = "Valid banner data is required.";
                    return response;
                }

                // Find existing banner
                var banner = await _unitOfWork.SliderRepository.GetById(bannerDto.Id.Value);
                if (banner == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Banner not found.";
                    return response;
                }

                // Validate link if HasLink is true
                if (bannerDto.HasLink && string.IsNullOrWhiteSpace(bannerDto.Link))
                {
                    response.StatusCode = 400;
                    response.Message = "Link is required when HasLink is true.";
                    return response;
                }

                // Handle image update if new image is provided
                if (bannerDto.ImageFile != null && bannerDto.ImageFile.Length > 0)
                {
                    // Validate new image
                    if (!await IsValidBannerMediaFileAsync(bannerDto))
                    {
                        response.StatusCode = 400;
                        response.Message = "Invalid slider media format or size.";
                        return response;
                    }

                    await DeleteBannerMediaAsync(banner.ImageUrl);

                    string newImageUrl = await UploadBannerMediaAsync(bannerDto);
                    if (string.IsNullOrEmpty(newImageUrl))
                    {
                        response.StatusCode = 400;
                        response.Message = "Failed to upload new media.";
                        return response;
                    }
                    banner.ImageUrl = newImageUrl;
                }

                // Update banner properties
                banner.Title = bannerDto.Title;
                banner.HasLink = bannerDto.HasLink;
                banner.Link = bannerDto.HasLink ? bannerDto.Link : null;
                banner.IsActive = bannerDto.IsActive;
                banner.UserId = userId;

                // Save changes
                await _unitOfWork.SliderRepository.Upsert(banner);
                await _unitOfWork.CompletedAsync(userId);

                // Prepare response
                bannerDto.ImageUrl = banner.ImageUrl;
                bannerDto.UserId = userId;

                response.StatusCode = 200;
                response.Message = "Banner updated successfully";
                response.Data = bannerDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating banner.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<BannerDto>> DeleteBannerAsync(Guid id, Guid userId)
        {
            var response = new ServiceResponse<BannerDto>();

            try
            {
                var banner = await _unitOfWork.SliderRepository.GetById(id);
                if (banner == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Banner not found.";
                    return response;
                }

                // Delete image file
                await DeleteBannerMediaAsync(banner.ImageUrl);

                // Delete from database
                await _unitOfWork.SliderRepository.Remove(banner.Id);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Banner deleted successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting banner.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        #region Image Handling Methods

        private async Task<string?> UploadBannerMediaAsync(BannerDto bannerDto)
        {
            try
            {
                if (bannerDto.ImageFile == null)
                {
                    return null;
                }

                if (IsSliderVideoUpload(bannerDto))
                {
                    if (_uploadServiceClient?.IsEnabled == true)
                    {
                        var fileUpload = await _uploadServiceClient.UploadFileAsync(
                            bannerDto.ImageFile,
                            Path.Combine("wwwroot", "videos", "sliders"),
                            "videos");
                        return fileUpload.IsSuccess ? fileUpload.FileUrl : null;
                    }

                    return await SaveVideoLocallyAsync(bannerDto.ImageFile);
                }

                if (IsSliderType(bannerDto.Type))
                {
                    if (_uploadServiceClient?.IsEnabled == true)
                    {
                        var imageUpload = await _uploadServiceClient.UploadImageAsync(
                            bannerDto.ImageFile,
                            Path.Combine("wwwroot", "images", "sliders"));
                        return imageUpload.IsSuccess ? imageUpload.FileUrl : null;
                    }

                    return await SaveSliderImageLocallyAsync(bannerDto.ImageFile);
                }

                var uploadPath = string.Equals(bannerDto.Type, "Slider", StringComparison.OrdinalIgnoreCase)
                    ? Path.Combine("wwwroot", "images", "sliders")
                    : Path.Combine("wwwroot", "images", "banners");

                var upload = await _imageUploadService.UploadAndOptimizeImageAsync(
                    bannerDto.ImageFile,
                    uploadPath);
                return upload.IsSuccess ? upload.ImageUrl : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading banner media.");
                return null;
            }
        }


        private async Task DeleteBannerMediaAsync(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
                return;

            try
            {
                if (IsVideoUrl(imageUrl))
                {
                    if (_uploadServiceClient?.IsEnabled == true)
                    {
                        await _uploadServiceClient.DeleteFileAsync(imageUrl);
                        return;
                    }

                    var localPath = TryMapUrlToLocalPath(imageUrl);
                    if (!string.IsNullOrWhiteSpace(localPath) && File.Exists(localPath))
                    {
                        File.Delete(localPath);
                    }

                    return;
                }

                await _imageUploadService.DeleteImageAsync(imageUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting banner media: {ImageUrl}", imageUrl);
            }
        }

        private async Task<bool> IsValidBannerMediaFileAsync(BannerDto bannerDto)
        {
            var imageFile = bannerDto.ImageFile;
            if (imageFile == null || imageFile.Length == 0)
                return false;

            // Check file size
            if (imageFile.Length > 10 * 1024 * 1024)
                return false;

            // Check file extension
            var allowedExtensions = string.Equals(bannerDto.Type, "Slider", StringComparison.OrdinalIgnoreCase)
                ? new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".mp4", ".webm", ".mov", ".avi", ".m4v" }
                : new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };
            var fileExtension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
                return false;

            if (IsVideoExtension(fileExtension))
            {
                return string.IsNullOrWhiteSpace(imageFile.ContentType) ||
                       imageFile.ContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase) ||
                       imageFile.ContentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase);
            }

            // Check image signature
            try
            {
                await using var stream = imageFile.OpenReadStream();
                var buffer = new byte[12];
                await stream.ReadAsync(buffer.AsMemory(0, buffer.Length));

                return IsImageSignatureValid(buffer);
            }
            catch
            {
                return false;
            }
        }

        private async Task<string?> SaveVideoLocallyAsync(IFormFile videoFile)
        {
            var uploadsFolder = Path.Combine(GetUploadServiceProjectRoot(), "wwwroot", "videos", "sliders");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(videoFile.FileName).ToLowerInvariant()}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using var fileStream = new FileStream(filePath, FileMode.Create);
            await videoFile.CopyToAsync(fileStream);

            return BuildUploadServiceFileUrl("videos/sliders", fileName);
        }

        private async Task<string?> SaveSliderImageLocallyAsync(IFormFile imageFile)
        {
            var uploadPath = Path.Combine(GetUploadServiceProjectRoot(), "wwwroot", "images", "sliders");
            var upload = await _imageUploadService.UploadAndOptimizeImageAsync(imageFile, uploadPath);

            if (!upload.IsSuccess)
            {
                return null;
            }

            if (!string.IsNullOrWhiteSpace(upload.PublicId))
            {
                return upload.ImageUrl;
            }

            var fileName = Path.GetFileName(upload.FilePath);
            return string.IsNullOrWhiteSpace(fileName)
                ? upload.ImageUrl
                : BuildUploadServiceFileUrl("images/sliders", fileName);
        }

        private static bool IsSliderVideoUpload(BannerDto bannerDto)
        {
            return IsSliderType(bannerDto.Type) &&
                   bannerDto.ImageFile != null &&
                   IsVideoExtension(Path.GetExtension(bannerDto.ImageFile.FileName).ToLowerInvariant());
        }

        private static bool IsSliderType(string? type)
        {
            return string.Equals(type, "Slider", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsVideoUrl(string url)
        {
            return IsVideoExtension(Path.GetExtension(url).ToLowerInvariant());
        }

        private static bool IsVideoExtension(string extension)
        {
            return extension is ".mp4" or ".webm" or ".mov" or ".avi" or ".m4v";
        }

        private string? TryMapUrlToLocalPath(string url)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            {
                return null;
            }

            var localPath = uri.LocalPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var storageRoot = IsSliderMediaPath(uri.LocalPath)
                ? Path.Combine(GetUploadServiceProjectRoot(), "wwwroot")
                : Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            return Path.Combine(storageRoot, localPath.Replace($"wwwroot{Path.DirectorySeparatorChar}", string.Empty));
        }

        private static bool IsSliderMediaPath(string localPath)
        {
            return localPath.Contains("/images/sliders/", StringComparison.OrdinalIgnoreCase) ||
                   localPath.Contains("/videos/sliders/", StringComparison.OrdinalIgnoreCase);
        }

        private string GetUploadServiceProjectRoot()
        {
            return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "GaStore.UploadService"));
        }

        private string BuildUploadServiceFileUrl(string folder, string fileName)
        {
            var baseUrl = string.IsNullOrWhiteSpace(_uploadServiceOptions.BaseUrl)
                ? _appSettings.ApiRoot
                : _uploadServiceOptions.BaseUrl;

            return $"{baseUrl?.TrimEnd('/')}/{folder.Trim('/')}/{fileName}";
        }

        private bool IsImageSignatureValid(byte[] buffer)
        {
            // JPEG
            if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF)
                return true;

            // PNG
            if (buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47)
                return true;

            // GIF
            if (buffer[0] == 0x47 && buffer[1] == 0x49 && buffer[2] == 0x46)
                return true;

            // BMP
            if (buffer[0] == 0x42 && buffer[1] == 0x4D)
                return true;

            // WebP
            if (buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46 &&
                buffer[8] == 0x57 && buffer[9] == 0x45 && buffer[10] == 0x42 && buffer[11] == 0x50)
                return true;

            return false;
        }

        #endregion

        #region Helper Classes and Methods

        private ValidationResult ValidateBannerInput(BannerDto bannerDto)
        {
            if (bannerDto == null)
                return ValidationResult.Failure("Banner data is required.");

            if (bannerDto.ImageFile == null || bannerDto.ImageFile.Length == 0)
                return ValidationResult.Failure("Banner media is required.");

            if (string.IsNullOrWhiteSpace(bannerDto.Type))
                return ValidationResult.Failure("Banner type is required.");

            if (bannerDto.HasLink && string.IsNullOrWhiteSpace(bannerDto.Link))
                return ValidationResult.Failure("Link is required when HasLink is true.");

            return ValidationResult.Success();
        }

        private class ValidationResult
        {
            public bool IsValid { get; }
            public string ErrorMessage { get; }

            private ValidationResult(bool isValid, string errorMessage = null)
            {
                IsValid = isValid;
                ErrorMessage = errorMessage;
            }

            public static ValidationResult Success() => new ValidationResult(true);
            public static ValidationResult Failure(string errorMessage) => new ValidationResult(false, errorMessage);
        }

        #endregion

        // Keep backward compatibility
        [Obsolete("Use GetBannersAsync instead")]
        public Task<PaginatedServiceResponse<List<BannerDto>>> GetSlidersAsync(int pageNumber, int pageSize, string type)
            => GetBannersAsync(pageNumber, pageSize, type);

        [Obsolete("Use GetBannerByIdAsync instead")]
        public Task<ServiceResponse<BannerDto>> GetSliderByIdAsync(Guid id)
            => GetBannerByIdAsync(id);

        [Obsolete("Use CreateBannerAsync instead")]
        public Task<ServiceResponse<BannerDto>> CreateSliderAsync(BannerDto bannerDto, Guid userId)
            => CreateBannerAsync(bannerDto, userId);

        [Obsolete("Use UpdateBannerAsync instead")]
        public Task<ServiceResponse<BannerDto>> UpdateSliderAsync(BannerDto bannerDto, Guid userId)
            => UpdateBannerAsync(bannerDto, userId);

        [Obsolete("Use DeleteBannerAsync instead")]
        public Task<ServiceResponse<BannerDto>> DeleteSliderAsync(Guid id, Guid userId)
            => DeleteBannerAsync(id, userId);
    }
}
