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
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GaStore.Core.Services.Cloudinary;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.AdsDto;
using GaStore.Data.Entities.Ads;
using GaStore.Data.Enums;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;
using GaStore.Data.Dtos.ImageUploads;

namespace GaStore.Core.Services.Implementations
{
    public class BannerService : IBannerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<BannerService> _logger;
        private readonly IMapper _mapper;
        private readonly AppSettings _appSettings;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ImageOptimizationSettings _imageSettings;

        public BannerService(
            IUnitOfWork unitOfWork,
            ILogger<BannerService> logger,
            IMapper mapper,
            IOptions<AppSettings> appSettings,
            ICloudinaryService cloudinaryService = null,
            IOptions<ImageOptimizationSettings> imageSettings = null)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _mapper = mapper;
            _appSettings = appSettings.Value;
            _cloudinaryService = cloudinaryService;
            _imageSettings = imageSettings?.Value ?? new ImageOptimizationSettings();
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
                if (!await IsValidImageFileAsync(bannerDto.ImageFile))
                {
                    response.StatusCode = 400;
                    response.Message = "Invalid image file format or size.";
                    return response;
                }

                // Handle image upload
                string imageUrl = await UploadBannerImageAsync(bannerDto.ImageFile);
                if (string.IsNullOrEmpty(imageUrl))
                {
                    response.StatusCode = 400;
                    response.Message = "Failed to upload image.";
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
                    if (!await IsValidImageFileAsync(bannerDto.ImageFile))
                    {
                        response.StatusCode = 400;
                        response.Message = "Invalid image file format or size.";
                        return response;
                    }

                    // Delete old image
                    await DeleteBannerImageAsync(banner.ImageUrl);

                    // Upload new image
                    string newImageUrl = await UploadBannerImageAsync(bannerDto.ImageFile);
                    if (string.IsNullOrEmpty(newImageUrl))
                    {
                        response.StatusCode = 400;
                        response.Message = "Failed to upload new image.";
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
                await DeleteBannerImageAsync(banner.ImageUrl);

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

        private async Task<string> UploadBannerImageAsync(IFormFile imageFile)
        {
            try
            {
                // Optimize image
                var optimizedImage = await OptimizeBannerImageAsync(imageFile);

                // Upload based on configuration
                if (_appSettings.UseCloudinary && _cloudinaryService != null)
                {
                    return await UploadToCloudinaryAsync(optimizedImage);
                }
                else
                {
                    return await SaveToLocalStorageAsync(optimizedImage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading banner image.");
                return null;
            }
        }

        private async Task<IFormFile> OptimizeBannerImageAsync(IFormFile imageFile)
        {
            if (!_imageSettings.EnableOptimization)
                return imageFile;

            try
            {
                await using var inputStream = imageFile.OpenReadStream();
                using var image = await Image.LoadAsync(inputStream);

                // Resize if needed
                if (image.Width > _imageSettings.MaxWidth || image.Height > _imageSettings.MaxHeight)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = CalculateBannerSize(image),
                        Mode = ResizeMode.Pad,
                        Compand = true
                    }));
                }

                // Determine output format
                var outputFormat = DetermineBannerOutputFormat(imageFile);
                var outputStream = new MemoryStream();

                // Encode with optimization
                await EncodeBannerImageAsync(image, outputStream, outputFormat);
                outputStream.Position = 0;

                var optimizedBytes = outputStream.ToArray();
                await outputStream.DisposeAsync();

                return new OptimizedFormFile(
                    optimizedBytes,
                    $"{Guid.NewGuid()}{GetExtensionForFormat(outputFormat)}",
                    GetContentTypeForFormat(outputFormat),
                    optimizedBytes.Length
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to optimize banner image, using original");
                return imageFile;
            }
        }

        private Size CalculateBannerSize(Image image)
        {
            // Maintain aspect ratio but pad to standard banner sizes
            var targetWidth = _imageSettings.MaxWidth;
            var targetHeight = _imageSettings.MaxHeight;

            var ratioX = (double)targetWidth / image.Width;
            var ratioY = (double)targetHeight / image.Height;
            var ratio = Math.Min(ratioX, ratioY);

            return new Size(
                (int)(image.Width * ratio),
                (int)(image.Height * ratio)
            );
        }

        private ImageFormat DetermineBannerOutputFormat(IFormFile imageFile)
        {
            if (_imageSettings.PreferredFormat != ImageFormat.Auto)
                return _imageSettings.PreferredFormat;

            var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            return extension switch
            {
                ".png" => _imageSettings.PreserveTransparency ? ImageFormat.Png : ImageFormat.WebP,
                ".gif" => ImageFormat.Gif,
                _ => ImageFormat.WebP
            };
        }

        private async Task EncodeBannerImageAsync(Image image, Stream outputStream, ImageFormat format)
        {
            switch (format)
            {
                case ImageFormat.Jpeg:
                    var jpegEncoder = new JpegEncoder
                    {
                        Quality = _imageSettings.JpegQuality,
                        SkipMetadata = _imageSettings.StripMetadata
                    };
                    await image.SaveAsJpegAsync(outputStream, jpegEncoder);
                    break;

                case ImageFormat.Png:
                    var pngEncoder = new PngEncoder
                    {
                        CompressionLevel = _imageSettings.PngCompressionLevel,
                        SkipMetadata = _imageSettings.StripMetadata
                    };
                    await image.SaveAsPngAsync(outputStream, pngEncoder);
                    break;

                case ImageFormat.WebP:
                    var webpEncoder = new WebpEncoder
                    {
                        Quality = _imageSettings.WebpQuality,
                        Method = WebpEncodingMethod.Default,
                        SkipMetadata = _imageSettings.StripMetadata
                    };
                    await image.SaveAsWebpAsync(outputStream, webpEncoder);
                    break;

                case ImageFormat.Gif:
                    var gifEncoder = new GifEncoder
                    {
                        SkipMetadata = _imageSettings.StripMetadata
                    };
                    await image.SaveAsGifAsync(outputStream, gifEncoder);
                    break;

                default:
                    await image.SaveAsJpegAsync(outputStream, new JpegEncoder { Quality = 85 });
                    break;
            }
        }

        private async Task<string> UploadToCloudinaryAsync(IFormFile imageFile)
        {
            var uploadResult = await _cloudinaryService.UploadImageAsync(imageFile);

            if (!uploadResult.IsSuccess)
            {
                _logger.LogError("Cloudinary upload failed: {Error}", uploadResult.ErrorMessage);
                return null;
            }

            return uploadResult.Url;
        }

        private async Task<string> SaveToLocalStorageAsync(IFormFile imageFile)
        {
            var uploadsFolder = Path.Combine("wwwroot", "images", "banners");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(imageFile.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using var fileStream = new FileStream(filePath, FileMode.Create);
            await imageFile.CopyToAsync(fileStream);

            return $"{_appSettings.ApiRoot}/images/banners/{fileName}";
        }

        private async Task DeleteBannerImageAsync(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
                return;

            try
            {
                if (_appSettings.UseCloudinary && _cloudinaryService != null)
                {
                    // Extract public ID from Cloudinary URL
                    var uri = new Uri(imageUrl);
                    var segments = uri.Segments;
                    var publicId = Path.GetFileNameWithoutExtension(segments.Last());

                    if (!string.IsNullOrEmpty(publicId))
                    {
                        await _cloudinaryService.DeleteFileAsync(publicId);
                    }
                }
                else
                {
                    // Delete from local storage
                    var fileName = Path.GetFileName(imageUrl);
                    var imagePath = Path.Combine("wwwroot", "images", "banners", fileName);

                    if (File.Exists(imagePath))
                    {
                        File.Delete(imagePath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting banner image: {ImageUrl}", imageUrl);
            }
        }

        private async Task<bool> IsValidImageFileAsync(IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
                return false;

            // Check file size
            if (imageFile.Length > _imageSettings.MaxOriginalFileSize)
                return false;

            // Check file extension
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };
            var fileExtension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
                return false;

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

        private string GetContentTypeForFormat(ImageFormat format)
        {
            return format switch
            {
                ImageFormat.Jpeg => "image/jpeg",
                ImageFormat.Png => "image/png",
                ImageFormat.WebP => "image/webp",
                ImageFormat.Gif => "image/gif",
                _ => "image/jpeg"
            };
        }

        private string GetExtensionForFormat(ImageFormat format)
        {
            return format switch
            {
                ImageFormat.Jpeg => ".jpg",
                ImageFormat.Png => ".png",
                ImageFormat.WebP => ".webp",
                ImageFormat.Gif => ".gif",
                _ => ".jpg"
            };
        }

        #endregion

        #region Helper Classes and Methods

        private class OptimizedFormFile : IFormFile
        {
            private readonly byte[] _fileData;
            private readonly string _fileName;
            private readonly string _contentType;
            private readonly long _length;

            public OptimizedFormFile(byte[] fileData, string fileName, string contentType, long length)
            {
                _fileData = fileData ?? throw new ArgumentNullException(nameof(fileData));
                _fileName = fileName ?? "optimized-banner.jpg";
                _contentType = contentType ?? "image/jpeg";
                _length = length;
            }

            public string ContentType => _contentType;
            public string ContentDisposition => $"form-data; name=\"file\"; filename=\"{_fileName}\"";
            public IHeaderDictionary Headers => new HeaderDictionary();
            public long Length => _length;
            public string Name => "file";
            public string FileName => _fileName;

            public void CopyTo(Stream target)
            {
                target?.Write(_fileData, 0, _fileData.Length);
            }

            public async Task CopyToAsync(Stream target, CancellationToken cancellationToken = default)
            {
                if (target == null)
                    throw new ArgumentNullException(nameof(target));

                await target.WriteAsync(_fileData, cancellationToken);
            }
            public Stream OpenReadStream()
            {
                return new MemoryStream(_fileData, false);
            }
        }

        private ValidationResult ValidateBannerInput(BannerDto bannerDto)
        {
            if (bannerDto == null)
                return ValidationResult.Failure("Banner data is required.");

            if (bannerDto.ImageFile == null || bannerDto.ImageFile.Length == 0)
                return ValidationResult.Failure("Banner image is required.");

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