using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class ProductImageService : IProductImageService
    {
        private readonly DatabaseContext _context;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<ProductImageService> _logger;
        private readonly IImageUploadService _imageUploadService;

        public ProductImageService(
            DatabaseContext context,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<ProductImageService> logger,
            IImageUploadService imageUploadService)
        {
            _context = context;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _imageUploadService = imageUploadService;
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

                if (!string.IsNullOrWhiteSpace(productImage.ImageUrl))
                {
                    await SafeDeleteImageAsync(productImage.ImageUrl);
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

                if (!string.IsNullOrWhiteSpace(productImage.ImageUrl))
                {
                    await SafeDeleteImageAsync(productImage.ImageUrl);
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

                var savedProductImageDtos = await ProcessUploadedImagesAsync(productImageDto);

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
            var maxFileSize = 10 * 1024 * 1024;

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

        private async Task<List<ProductImageDto>> ProcessUploadedImagesAsync(ProductImageDto productImageDto)
        {
            var savedProductImageDtos = new List<ProductImageDto>();

            foreach (var imageFile in productImageDto.imageFiles ?? [])
            {
                var upload = await _imageUploadService.UploadAndOptimizeImageAsync(
                    imageFile,
                    Path.Combine("wwwroot", "images", "product-images"));

                if (!upload.IsSuccess || string.IsNullOrWhiteSpace(upload.ImageUrl))
                {
                    throw new InvalidOperationException($"Error uploading file {imageFile.FileName}: {upload.ErrorMessage}");
                }

                var savedProductImageDto = CreateProductImageDto(productImageDto, upload.ImageUrl);
                savedProductImageDtos.Add(savedProductImageDto);
            }

            return savedProductImageDtos;
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

        private async Task SafeDeleteImageAsync(string imageUrl)
        {
            try
            {
                await _imageUploadService.DeleteImageAsync(imageUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Unable to delete product image asset {ImageUrl}", imageUrl);
            }
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
