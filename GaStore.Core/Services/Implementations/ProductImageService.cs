using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using GaStore.Core.Services.Cloudinary;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;
using SixLabors.ImageSharp.Formats.Gif;
using GaStore.Data.Enums;
using GaStore.Data.Dtos.ImageUploads;

namespace GaStore.Core.Services.Implementations
{
    public class ProductImageService : IProductImageService
    {
        private readonly DatabaseContext _context;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<ProductImageService> _logger;
        private readonly AppSettings _appSettings;
        private readonly ICloudinaryService _cloudinaryService;


        // Image optimization settings
        private readonly ImageOptimizationSettings _imageSettings;

        public ProductImageService(
            DatabaseContext context,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<ProductImageService> logger,
            IOptions<AppSettings> appSettings,
            ICloudinaryService cloudinaryService,
            IOptions<ImageOptimizationSettings> imageSettings = null)
        {
            _context = context;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _appSettings = appSettings.Value;
            _cloudinaryService = cloudinaryService;
            _imageSettings = imageSettings?.Value ?? new ImageOptimizationSettings();
        }

        public async Task<PaginatedServiceResponse<List<ProductImageDto>>> GetProductImagesAsync(Guid variantId, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<ProductImageDto>>();

            try
            {
                // Validate page number and page size
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                // Get the base query
                var productImages = await _unitOfWork.ProductImageRepository.GetOffsetAndLimitAsync(pi => pi.VariantId == variantId, pageNumber, pageSize);

                // Get total records count
                var totalRecords = productImages.Count;

                var productImageDto = _mapper.Map<List<ProductImageDto>>(productImages);

                // Create paginated response
                response.Status = 200;
                response.Message = "Product images retrieved successfully";
                response.Data = productImageDto;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product images for VariantId: {VariantId}", variantId);
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductImageDto>> GetProductImageByIdAsync(Guid id)
        {
            var response = new ServiceResponse<ProductImageDto>();

            try
            {
                // Find the product image by ID
                var productImage = await _unitOfWork.ProductImageRepository.GetById(id);

                if (productImage == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product image not found.";
                    return response;
                }

                // Map to DTO
                var productImageDto = _mapper.Map<ProductImageDto>(productImage);

                // Return success response
                response.StatusCode = 200;
                response.Message = "Product image retrieved successfully";
                response.Data = productImageDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product image with Id: {Id}", id);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductImageDto>> UpdateProductImageAsync(Guid id, ProductImageDto productImageDto, Guid userId)
        {
            var response = new ServiceResponse<ProductImageDto>();

            try
            {
                // Validate the DTO
                if (productImageDto == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Product image data is required.";
                    return response;
                }

                // Find the product image by ID
                var productImage = await _unitOfWork.ProductImageRepository.GetById(id);

                if (productImage == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product image not found.";
                    return response;
                }

                // Update the product image
                _mapper.Map(productImageDto, productImage);

                // Save changes
                await _unitOfWork.ProductImageRepository.Upsert(productImage);
                await _unitOfWork.CompletedAsync(userId);

                // Return success response
                response.StatusCode = 200;
                response.Message = "Product image updated successfully";
                response.Data = productImageDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product image with Id: {Id}", id);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductImageDto>> DeleteProductImageAsync(Guid id, Guid userId)
        {
            var response = new ServiceResponse<ProductImageDto>();

            try
            {
                // Find the product image by ID
                var productImage = await _unitOfWork.ProductImageRepository.GetById(id);

                if (productImage == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product image not found.";
                    return response;
                }

                // Delete the product image
                await _unitOfWork.ProductImageRepository.Remove(productImage.Id);
                await _unitOfWork.CompletedAsync(userId);

                // Return success response
                response.StatusCode = 200;
                response.Message = "Product image deleted successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product image with Id: {Id}", id);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<ServiceResponse<ProductImageDto>> DeleteProductImageByUrlAsync(string imageUrl, Guid userId)
        {
            var response = new ServiceResponse<ProductImageDto>();

            try
            {
                // Find the product image by ID
                var productImage = await _unitOfWork.ProductImageRepository.Get(p => p.ImageUrl == imageUrl);

                if (productImage == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product image not found.";
                    return response;
                }

                // Delete the product image
                await _unitOfWork.ProductImageRepository.Remove(productImage.Id);
                await _unitOfWork.CompletedAsync(userId);

                // Return success response
                response.StatusCode = 200;
                response.Message = "Product image deleted successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product image with Id: {ImageUrl}", imageUrl);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<ServiceResponse<List<ProductImageDto>>> CreateProductImageAsync(ProductImageDto productImageDto, Guid userId)
        {
            var response = new ServiceResponse<List<ProductImageDto>>();

            try
            {
                // Validate input
                var validationResult = await ValidateProductImageInputAsync(productImageDto);
                if (!validationResult.IsValid)
                {
                    response.StatusCode = 400;
                    response.Message = validationResult.ErrorMessage;
                    return response;
                }

                // Process images based on storage type
                var savedProductImageDtos = _appSettings.UseCloudinary
                    ? await ProcessImagesWithCloudinaryAsync(productImageDto)
                    : await ProcessImagesLocallyAsync(productImageDto);

                // Process external image URLs if provided
                if (productImageDto.ImageUrls?.Any() == true)
                {
                    var externalImageDtos = await ProcessExternalImageUrlsAsync(productImageDto);
                    savedProductImageDtos.AddRange(externalImageDtos);
                }

                // Save to database
                await SaveProductImagesToDatabaseAsync(savedProductImageDtos, userId);

                // Return success response
                response.StatusCode = 201;
                response.Message = "Product images created successfully";
                response.Data = savedProductImageDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product images for VariantId: {VariantId}", productImageDto.VariantId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        // Helper methods for better separation of concerns

        private async Task<ValidationResult> ValidateProductImageInputAsync(ProductImageDto productImageDto)
        {
            if (productImageDto == null)
                return ValidationResult.Failure("Product image data is required.");

            if ((productImageDto.imageFiles == null || !productImageDto.imageFiles.Any()) &&
                (productImageDto.ImageUrls == null || !productImageDto.ImageUrls.Any()))
                return ValidationResult.Failure("Either image files or image URLs are required.");

            if (productImageDto.imageFiles?.Any() == true)
            {
                var validationError = await ValidateImageFilesAsync(productImageDto.imageFiles);
                if (validationError != null)
                    return ValidationResult.Failure(validationError);
            }

            return ValidationResult.Success();
        }

        private async Task<string> ValidateImageFilesAsync(IEnumerable<IFormFile> imageFiles)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };
            var maxFileSize = _imageSettings.MaxOriginalFileSize; // Use configurable setting

            foreach (var imageFile in imageFiles)
            {
                // Validate file type
                var fileExtension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return $"Invalid file type for file {imageFile.FileName}. Allowed types: {string.Join(", ", allowedExtensions)}.";
                }

                // Validate file size
                if (imageFile.Length > maxFileSize)
                {
                    var maxSizeMB = maxFileSize / (1024 * 1024);
                    return $"File size for {imageFile.FileName} exceeds the limit of {maxSizeMB}MB.";
                }

                // Additional validation: check if file is actually an image
                if (!await IsValidImageFileAsync(imageFile))
                {
                    return $"File {imageFile.FileName} is not a valid image file.";
                }
            }

            return null;
        }

        private async Task<bool> IsValidImageFileAsync(IFormFile file)
        {
            try
            {
                // Basic image validation by checking magic numbers
                await using var stream = file.OpenReadStream();
                var buffer = new byte[12]; // Increased buffer for more formats
                await stream.ReadAsync(buffer.AsMemory(0, buffer.Length));
                stream.Position = 0; // Reset stream position

                return IsImageSignatureValid(buffer);
            }
            catch
            {
                return false;
            }
        }

        private bool IsImageSignatureValid(byte[] buffer)
        {
            // Check for common image file signatures
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

            // WebP - RIFF format
            if (buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46 &&
                buffer[8] == 0x57 && buffer[9] == 0x45 && buffer[10] == 0x42 && buffer[11] == 0x50)
                return true;

            return false;
        }

        private async Task<List<ProductImageDto>> ProcessImagesWithCloudinaryAsync(ProductImageDto productImageDto)
        {
            var savedProductImageDtos = new List<ProductImageDto>();

            foreach (var imageFile in productImageDto.imageFiles)
            {
                CloudinaryUploadResult uploadResult;

                // Optimize image before uploading if enabled
                if (_imageSettings.OptimizeBeforeUpload && _imageSettings.EnableOptimization)
                {
                    try
                    {
                        var optimizedImage = await OptimizeImageFileAsync(imageFile);

                        if (optimizedImage is OptimizedFormFile)
                        {
                            // Use the optimized image
                            uploadResult = await _cloudinaryService.UploadImageAsync(optimizedImage);
                        }
                        else
                        {
                            // Fallback to regular upload
                            uploadResult = await _cloudinaryService.UploadImageAsync(imageFile);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to optimize image, uploading original: {FileName}", imageFile.FileName);
                        uploadResult = await _cloudinaryService.UploadImageAsync(imageFile);
                    }
                }
                else
                {
                    // Upload without optimization
                    uploadResult = await _cloudinaryService.UploadImageAsync(imageFile);
                }

                if (!uploadResult.IsSuccess)
                {
                    throw new InvalidOperationException($"Error uploading file {imageFile.FileName}: {uploadResult.ErrorMessage}");
                }

                var savedProductImageDto = CreateProductImageDto(productImageDto, uploadResult.Url);
                savedProductImageDtos.Add(savedProductImageDto);
            }

            return savedProductImageDtos;
        }

        private async Task<List<ProductImageDto>> ProcessImagesLocallyAsync(ProductImageDto productImageDto)
        {
            var savedProductImageDtos = new List<ProductImageDto>();

            foreach (var imageFile in productImageDto.imageFiles)
            {
                var optimizedImage = await OptimizeImageFileAsync(imageFile);
                var savedProductImageDto = await SaveOptimizedImageLocallyAsync(productImageDto, optimizedImage);
                savedProductImageDtos.Add(savedProductImageDto);
            }

            return savedProductImageDtos;
        }

        private async Task<ProductImageDto> SaveOptimizedImageLocallyAsync(ProductImageDto productImageDto, IFormFile optimizedImage)
        {
            var uploadsFolder = Path.Combine("wwwroot", "images", "product-images");

            // Ensure the uploads folder exists
            Directory.CreateDirectory(uploadsFolder);

            // Generate optimized file name
            var originalExtension = Path.GetExtension(optimizedImage.FileName).ToLowerInvariant();
            var optimizedExtension = _imageSettings.PreferredFormat == ImageFormat.Auto
                ? originalExtension
                : $".{_imageSettings.PreferredFormat.ToString().ToLower()}";

            var fileName = $"{Guid.NewGuid()}{optimizedExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save the optimized file
            await using var stream = new FileStream(filePath, FileMode.Create);
            await optimizedImage.CopyToAsync(stream);

            var imageUrl = $"{_appSettings.ApiRoot}/images/product-images/{fileName}";
            return CreateProductImageDto(productImageDto, imageUrl);
        }

        private async Task<IFormFile> OptimizeImageFileAsync(IFormFile imageFile)
        {
            // Skip optimization if disabled
            if (!_imageSettings.EnableOptimization)
                return imageFile;

            try
            {
                await using var inputStream = imageFile.OpenReadStream();

                // Determine output format
                var outputFormat = DetermineOutputFormat(imageFile);

                using var image = await Image.LoadAsync(inputStream);

                // Resize if needed
                if (ShouldResizeImage(image))
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = CalculateTargetSize(image),
                        Mode = ResizeMode.Max,
                        Compand = true
                    }));
                }

                // Create output memory stream
                var outputStream = new MemoryStream();

                // Encode with optimization settings
                await EncodeImageWithOptimizationAsync(image, outputStream, outputFormat);

                outputStream.Position = 0;

                // Get the optimized bytes
                var optimizedBytes = outputStream.ToArray();

                // Dispose the stream
                await outputStream.DisposeAsync();

                // Create optimized IFormFile
                var optimizedFileName = Path.GetFileNameWithoutExtension(imageFile.FileName) +
                                      GetExtensionForFormat(outputFormat);

                return new OptimizedFormFile(
                    optimizedBytes,
                    optimizedFileName,
                    GetContentTypeForFormat(outputFormat), // Use the correct content type method
                    optimizedBytes.Length
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to optimize image {FileName}, using original", imageFile.FileName);
                return imageFile; // Fallback to original
            }
        }

        // Helper method to get proper MIME types
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

        private ImageFormat DetermineOutputFormat(IFormFile imageFile)
        {
            // Use preferred format from settings
            if (_imageSettings.PreferredFormat != ImageFormat.Auto)
                return _imageSettings.PreferredFormat;

            // Auto-detect based on requirements
            var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            return extension switch
            {
                ".png" => _imageSettings.PreserveTransparency ? ImageFormat.Png : ImageFormat.WebP,
                ".gif" => ImageFormat.Gif, // Preserve animation
                _ => ImageFormat.WebP // Default to WebP for best compression
            };
        }

        private bool ShouldResizeImage(Image image)
        {
            return image.Width > _imageSettings.MaxWidth ||
                   image.Height > _imageSettings.MaxHeight ||
                   _imageSettings.ForceResizeToMaxDimensions;
        }

        private Size CalculateTargetSize(Image image)
        {
            var maxWidth = _imageSettings.MaxWidth;
            var maxHeight = _imageSettings.MaxHeight;

            // Calculate while maintaining aspect ratio
            var ratioX = (double)maxWidth / image.Width;
            var ratioY = (double)maxHeight / image.Height;
            var ratio = Math.Min(ratioX, ratioY);

            return new Size(
                (int)(image.Width * ratio),
                (int)(image.Height * ratio)
            );
        }

        private async Task EncodeImageWithOptimizationAsync(Image image, Stream outputStream, ImageFormat format)
        {
            switch (format)
            {
                case ImageFormat.Jpeg:
                    var jpegEncoder = new JpegEncoder
                    {
                        Quality = _imageSettings.JpegQuality,
                        // Remove ColorType property entirely
                        SkipMetadata = _imageSettings.StripMetadata
                    };
                    await image.SaveAsJpegAsync(outputStream, jpegEncoder);
                    break;

                case ImageFormat.Png:
                    var pngEncoder = new PngEncoder
                    {
                        CompressionLevel = _imageSettings.PngCompressionLevel,
                        // Remove ColorType property
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
                    // Fallback to original format
                    await image.SaveAsync(outputStream, image.Metadata.DecodedImageFormat);
                    break;
            }
        }

        private class OptimizedFormFile : IFormFile
        {
            private readonly byte[] _fileData;
            private readonly string _fileName;
            private readonly string _contentType;
            private readonly long _length;

            public OptimizedFormFile(byte[] fileData, string fileName, string contentType, long length)
            {
                _fileData = fileData ?? throw new ArgumentNullException(nameof(fileData));
                _fileName = fileName ?? "optimized-image.jpg";
                _contentType = contentType ?? "application/octet-stream";
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
                if (target == null)
                    throw new ArgumentNullException(nameof(target));

                target.Write(_fileData, 0, _fileData.Length);
            }

            public async Task CopyToAsync(Stream target, CancellationToken cancellationToken = default)
            {
                if (target == null)
                    throw new ArgumentNullException(nameof(target));

                await target.WriteAsync(_fileData, cancellationToken);
            }

            public Stream OpenReadStream()
            {
                return new MemoryStream(_fileData, false); // false = non-writable stream
            }
        }
        private async Task<List<ProductImageDto>> ProcessExternalImageUrlsAsync(ProductImageDto productImageDto)
        {
            var externalImageDtos = new List<ProductImageDto>();

            foreach (var imageUrl in productImageDto.ImageUrls)
            {
                // Validate external URL if needed
                if (!await IsValidImageUrlAsync(imageUrl))
                {
                    _logger.LogWarning("Invalid image URL provided: {ImageUrl}", imageUrl);
                    continue; // Skip invalid URLs but continue processing others
                }

                var savedProductImageDto = CreateProductImageDto(productImageDto, imageUrl);
                externalImageDtos.Add(savedProductImageDto);
            }

            return externalImageDtos;
        }

        private async Task<bool> IsValidImageUrlAsync(string imageUrl)
        {
            try
            {
                if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri))
                    return false;

                // Check for potentially malicious URLs
                if (uri.IsFile || uri.IsUnc)
                    return false;

                // You might want to add domain whitelisting
                var allowedDomains = new[] { "cdn.example.com", "trusted-cdn.com" };
                if (!allowedDomains.Any(d => uri.Host.EndsWith(d)))
                {
                    _logger.LogWarning("Image URL from untrusted domain: {Domain}", uri.Host);
                    return false;
                }

                return true;
            }
            catch
            {
                return false;
            }
        }

        private ProductImageDto CreateProductImageDto(ProductImageDto source, string imageUrl)
        {
            return new ProductImageDto
            {
                ImageUrl = imageUrl,
                Style = source.Style,
                ProductId = source.ProductId,
                VariantId = source.VariantId,
                AltText = source.AltText,
                DisplayOrder = source.DisplayOrder
            };
        }

        private async Task SaveProductImagesToDatabaseAsync(List<ProductImageDto> productImageDtos, Guid userId)
        {
            foreach (var productImageDto in productImageDtos)
            {
                var productImage = _mapper.Map<ProductImage>(productImageDto);
                await _unitOfWork.ProductImageRepository.Add(productImage);
            }

            await _unitOfWork.CompletedAsync(userId);
        }

        // Helper class for validation results
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

    }

}