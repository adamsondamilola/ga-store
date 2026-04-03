using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Gif;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Core.Services.Cloudinary;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ImageUploads;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;
using GaStore.Data.Enums;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;
using static Org.BouncyCastle.Asn1.Cmp.Challenge;

namespace GaStore.Core.Services.Implementations
{
	public class CategoryService : ICategoryService
	{
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<CategoryService> _logger;
        private readonly IMapper _mapper;
        private readonly AppSettings _appSettings;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ImageOptimizationSettings _imageSettings;

        public CategoryService(
            IUnitOfWork unitOfWork,
            ILogger<CategoryService> logger,
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

        public async Task<PaginatedServiceResponse<List<CategoryDto>>> GetCategoriesAsync(string? searchTerm, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<CategoryDto>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                // Build filter expression
                System.Linq.Expressions.Expression<Func<Category, bool>>? filter = null;
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    filter = c => c.Name.Contains(searchTerm);
                }

                // Get total count
                var totalRecords =  _unitOfWork.CategoryRepository.GetAll(filter ?? (c => true))
                    .Result.Count;

                // Get categories with all nested relationships
                var categories = await _unitOfWork.CategoryRepository.GetAllAsync(
                    filter: filter,
                    orderBy: q => q.OrderBy(c => c.Name),
                    includeProperties: "SubCategories,SubCategories.ProductTypes,SubCategories.ProductTypes.ProductSubTypes",
                    trackChanges: false
                );

                var pagedCategories = categories
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var categoryDtos = _mapper.Map<List<CategoryDto>>(pagedCategories);

                // Calculate counts for each category
                foreach (var categoryDto in categoryDtos)
                {
                    var category = pagedCategories.FirstOrDefault(c => c.Id == categoryDto.Id);
                    if (category != null)
                    {
                      /*  categoryDto.SubCategoriesCount = category.SubCategories?.Count ?? 0;
                        categoryDto.ProductTypesCount = category.SubCategories?
                            .SelectMany(sc => sc.ProductTypes ?? new List<ProductType>())
                            .Count() ?? 0;
                        categoryDto.ProductSubTypesCount = category.SubCategories?
                            .SelectMany(sc => sc.ProductTypes ?? new List<ProductType>())
                            .SelectMany(pt => pt.ProductSubTypes ?? new List<ProductSubType>())
                            .Count() ?? 0;*/
                    }
                }

                response.Status = 200;
                response.Message = "Categories retrieved successfully";
                response.Data = categoryDtos;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving categories.");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<CategoryHierarchyDto>> GetCategoryHierarchyAsync(Guid id)
        {
            var response = new ServiceResponse<CategoryHierarchyDto>();

            try
            {
                // Get category with full hierarchy
                var category = await _unitOfWork.CategoryRepository.GetByIdIncluding(
                    id,
                    c => c.SubCategories!,
                    c => c.SubCategories!.OrderBy(sc => sc.Name)
                );

                if (category == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Category not found.";
                    return response;
                }

                // Get product types for all subcategories
                var subCategoryIds = category.SubCategories?.Select(sc => sc.Id).ToList() ?? new List<Guid>();
                var productTypes = await _unitOfWork.ProductTypeRepository.GetAllAsync(
                    filter: pt => subCategoryIds.Contains(pt.SubCategoryId),
                    includeProperties: "ProductSubTypes",
                    trackChanges: false
                );

                // Get product sub-types for all product types
                var productTypeIds = productTypes.Select(pt => pt.Id).ToList();
                var productSubTypes = await _unitOfWork.ProductSubTypeRepository.GetAllAsync(
                    filter: pst => productTypeIds.Contains(pst.ProductTypeId),
                    trackChanges: false
                );

                // Build hierarchy DTO
                var hierarchyDto = new CategoryHierarchyDto
                {
                    Category = _mapper.Map<CategoryDto>(category),
                    SubCategories = _mapper.Map<List<SubCategoryHierarchyDto>>(category.SubCategories)
                };

                // Populate product types and sub-types
                foreach (var subCategoryDto in hierarchyDto.SubCategories)
                {
                    var subCategoryProductTypes = productTypes
                        .Where(pt => pt.SubCategoryId == subCategoryDto.Id)
                        .ToList();

                    subCategoryDto.ProductTypes = _mapper.Map<List<ProductTypeHierarchyDto>>(subCategoryProductTypes);

                    foreach (var productTypeDto in subCategoryDto.ProductTypes)
                    {
                        var typeProductSubTypes = productSubTypes
                            .Where(pst => pst.ProductTypeId == productTypeDto.Id)
                            .ToList();
                        productTypeDto.ProductSubTypes = _mapper.Map<List<ProductSubTypeDto>>(typeProductSubTypes);
                    }
                }

                response.StatusCode = 200;
                response.Message = "Category hierarchy retrieved successfully";
                response.Data = hierarchyDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving category hierarchy.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<CategoryDto>> GetCategoryByIdAsync(Guid id)
        {
            var response = new ServiceResponse<CategoryDto>();

            try
            {
                // Get category with subcategories
                var category = await _unitOfWork.CategoryRepository.GetByIdIncluding(
                    id,
                    c => c.SubCategories!
                );

                if (category == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Category not found.";
                    return response;
                }

                var categoryDto = _mapper.Map<CategoryDto>(category);

                // Calculate counts
                categoryDto.SubCategoriesCount = category.SubCategories?.Count ?? 0;

                // Get product types count
                var subCategoryIds = category.SubCategories?.Select(sc => sc.Id).ToList() ?? new List<Guid>();
                if (subCategoryIds.Count > 0)
                {
                    categoryDto.ProductTypesCount = _unitOfWork.ProductTypeRepository.GetAll(pt => subCategoryIds.Contains(pt.SubCategoryId))
                        .Result.Count;

                    categoryDto.ProductSubTypesCount = _unitOfWork.ProductSubTypeRepository.GetAll(pst => subCategoryIds.Contains(pst.ProductType.SubCategoryId))
                        .Result.Count;
                }

                response.StatusCode = 200;
                response.Message = "Category retrieved successfully";
                response.Data = categoryDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving category.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<CategoryWithHierarchyDto>>> GetCategoriesWithFullHierarchyAsync()
        {
            var response = new ServiceResponse<List<CategoryWithHierarchyDto>>();

            try
            {
                // Get all active categories with full hierarchy
                var categories = await _unitOfWork.CategoryRepository.GetAllAsync(
                    filter: c => c.IsActive,
                    orderBy: q => q.OrderBy(c => c.Name),
                    includeProperties: "SubCategories.ProductTypes.ProductSubTypes",
                    trackChanges: false
                );

                // Get all active products separately to avoid lazy loading issues
                var allProducts = await _unitOfWork.ProductRepository.GetAllAsync(
                    filter: p => p.IsAvailable && p.IsApproved,
                    includeProperties: "Category,SubCategory,ProductType,ProductSubType",
                    trackChanges: false
                );

                var categoryDtos = new List<CategoryWithHierarchyDto>();

                foreach (var category in categories)
                {
                    var categoryDto = _mapper.Map<CategoryWithHierarchyDto>(category);

                    // Check category products
                    var categoryProducts = allProducts.Where(p => p.CategoryId == category.Id).ToList();
                    categoryDto.HasProducts = categoryProducts.Any();
                    Console.WriteLine($"Category: {category.Name}, Direct Products: {categoryProducts.Count}, HasProducts: {categoryDto.HasProducts}");

                    // Process subcategories
                    foreach (var subCategoryDto in categoryDto.SubCategories)
                    {
                        var subCategory = category.SubCategories?.FirstOrDefault(sc => sc.Id == subCategoryDto.Id);

                        if (subCategory != null)
                        {
                            // Check subcategory products
                            var subCategoryProducts = allProducts.Where(p => p.SubCategoryId == subCategory.Id).ToList();
                            subCategoryDto.HasProducts = subCategoryProducts.Any();
                            Console.WriteLine($"  SubCategory: {subCategory.Name}, Direct Products: {subCategoryProducts.Count}, HasProducts: {subCategoryDto.HasProducts}");

                            // Process product types
                            foreach (var productTypeDto in subCategoryDto.ProductTypes)
                            {
                                var productType = subCategory.ProductTypes?.FirstOrDefault(pt => pt.Id == productTypeDto.Id);

                                if (productType != null)
                                {
                                    // Check product type products
                                    var productTypeProducts = allProducts.Where(p => p.ProductTypeId == productType.Id).ToList();
                                    productTypeDto.HasProducts = productTypeProducts.Any();
                                    Console.WriteLine($"    ProductType: {productType.Name}, Direct Products: {productTypeProducts.Count}, HasProducts: {productTypeDto.HasProducts}");

                                    // Process product sub-types
                                    foreach (var productSubTypeDto in productTypeDto.ProductSubTypes)
                                    {
                                        var productSubType = productType.ProductSubTypes?.FirstOrDefault(pst => pst.Id == productSubTypeDto.Id);

                                        if (productSubType != null)
                                        {
                                            var productSubTypeProducts = allProducts.Where(p => p.ProductSubTypeId == productSubType.Id).ToList();
                                            productSubTypeDto.HasProducts = productSubTypeProducts.Any();
                                            Console.WriteLine($"      ProductSubType: {productSubType.Name}, Direct Products: {productSubTypeProducts.Count}, HasProducts: {productSubTypeDto.HasProducts}");
                                        }
                                    }

                                    // If product type has no direct products but has sub-types with products, mark it as having products
                                    if (!productTypeDto.HasProducts && productTypeDto.ProductSubTypes.Any(pst => pst.HasProducts))
                                    {
                                        productTypeDto.HasProducts = true;
                                        Console.WriteLine($"    ProductType {productType.Name} updated to HasProducts: true due to sub-types");
                                    }
                                }
                            }

                            // If subcategory has no direct products but has product types with products, mark it as having products
                            if (!subCategoryDto.HasProducts && subCategoryDto.ProductTypes.Any(pt => pt.HasProducts))
                            {
                                subCategoryDto.HasProducts = true;
                                Console.WriteLine($"  SubCategory {subCategory.Name} updated to HasProducts: true due to product types");
                            }
                        }
                    }

                    // If category has no direct products but has subcategories with products, mark it as having products
                    if (!categoryDto.HasProducts && categoryDto.SubCategories.Any(sc => sc.HasProducts))
                    {
                        categoryDto.HasProducts = true;
                        Console.WriteLine($"Category {category.Name} updated to HasProducts: true due to subcategories");
                    }

                    categoryDtos.Add(categoryDto);
                }

                response.StatusCode = 200;
                response.Message = "Categories with full hierarchy retrieved successfully";
                response.Data = categoryDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving categories with hierarchy.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<ServiceResponse<CategoryDto>> CreateCategoryAsync(CategoryDto categoryDto, Guid userId)
        {
            var response = new ServiceResponse<CategoryDto>();

            try
            {
                // Validate the DTO
                var validationResult = ValidateCategoryInput(categoryDto);
                if (!validationResult.IsValid)
                {
                    response.StatusCode = 400;
                    response.Message = validationResult.ErrorMessage;
                    return response;
                }

                // Check for name uniqueness
                var existingCategory = await _unitOfWork.CategoryRepository.Get(x => x.Name == categoryDto.Name);
                if (existingCategory != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Category name already exists.";
                    return response;
                }

                // Handle image upload (if provided)
                string? imageUrl = null;
                if (categoryDto.imageFile != null && categoryDto.imageFile.Length > 0)
                {
                    // Validate image file
                    if (!await IsValidImageFileAsync(categoryDto.imageFile))
                    {
                        response.StatusCode = 400;
                        response.Message = "Invalid image file format or size.";
                        return response;
                    }

                    // Upload image with optimization
                    imageUrl = await UploadCategoryImageAsync(categoryDto.imageFile);
                    if (string.IsNullOrEmpty(imageUrl))
                    {
                        response.StatusCode = 400;
                        response.Message = "Failed to upload category image.";
                        return response;
                    }
                }

                // Map DTO to entity
                var category = new Category
                {
                    Name = categoryDto.Name.Trim(),
                    ImageUrl = imageUrl,
                    IsActive = categoryDto.IsActive,
                 //   DisplayOrder = categoryDto.DisplayOrder ?? 0,
                    };

                // Add and save to database
                await _unitOfWork.CategoryRepository.Add(category);
                await _unitOfWork.CompletedAsync(userId);

                // Return created data
                categoryDto.Id = category.Id;
                categoryDto.ImageUrl = category.ImageUrl;

                response.StatusCode = 201;
                response.Message = "Category created successfully";
                response.Data = categoryDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating category.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<CategoryDto>> UpdateCategoryAsync(CategoryDto categoryDto, Guid userId)
        {
            var response = new ServiceResponse<CategoryDto>();

            try
            {
                // Validate the DTO
                if (categoryDto == null || categoryDto.Id == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Valid category data is required.";
                    return response;
                }

                // Find the category by ID
                var category = await _unitOfWork.CategoryRepository.GetById(categoryDto.Id.Value);
                if (category == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Category not found.";
                    return response;
                }

                // Check for name uniqueness (exclude current category)
                var existingWithSameName = await _unitOfWork.CategoryRepository.Get(x =>
                    x.Name == categoryDto.Name && x.Id != category.Id);
                if (existingWithSameName != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Another category with this name already exists.";
                    return response;
                }

                // Handle image update
                if (categoryDto.imageFile != null && categoryDto.imageFile.Length > 0)
                {
                    // Validate new image file
                    if (!await IsValidImageFileAsync(categoryDto.imageFile))
                    {
                        response.StatusCode = 400;
                        response.Message = "Invalid image file format or size.";
                        return response;
                    }

                    // Delete old image
                    await DeleteCategoryImageAsync(category.ImageUrl);

                    // Upload new image with optimization
                    var newImageUrl = await UploadCategoryImageAsync(categoryDto.imageFile);
                    if (string.IsNullOrEmpty(newImageUrl))
                    {
                        response.StatusCode = 400;
                        response.Message = "Failed to upload new category image.";
                        return response;
                    }
                    category.ImageUrl = newImageUrl;
                }

                // Update other fields
                category.Name = categoryDto.Name.Trim();
                category.IsActive = categoryDto.IsActive;

                await _unitOfWork.CategoryRepository.Upsert(category);
                await _unitOfWork.CompletedAsync(userId);

                // Return updated data
                categoryDto.ImageUrl = category.ImageUrl;

                response.StatusCode = 200;
                response.Message = "Category updated successfully";
                response.Data = categoryDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating category.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<CategoryDto>> DeleteCategoryAsync(Guid id, Guid userId)
        {
            var response = new ServiceResponse<CategoryDto>();

            try
            {
                // Find the category by ID
                var category = await _unitOfWork.CategoryRepository.GetByIdIncluding(
                    id,
                    c => c.SubCategories!
                );

                if (category == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Category not found.";
                    return response;
                }

                // Check if category has subcategories
                if (category.SubCategories?.Any() == true)
                {
                    response.StatusCode = 400;
                    response.Message = "Cannot delete category that has subcategories. Please delete subcategories first.";
                    return response;
                }

                // Check if category has products
                var hasProducts = await _unitOfWork.ProductRepository.Get(p => p.CategoryId == id);
                if (hasProducts != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Cannot delete category that has products. Please reassign or delete products first.";
                    return response;
                }

                // Delete image file (handles both Cloudinary and local storage)
                await DeleteCategoryImageAsync(category.ImageUrl);

                // Delete the category
                await _unitOfWork.CategoryRepository.Remove(category.Id);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Category deleted successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting category.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        #region Image Handling Methods

        private async Task<string> UploadCategoryImageAsync(IFormFile imageFile)
        {
            try
            {
                // Optimize image
                var optimizedImage = await OptimizeCategoryImageAsync(imageFile);

                // Upload based on configuration
                if (_appSettings.UseCloudinary && _cloudinaryService != null)
                {
                    return await UploadToCloudinaryAsync(optimizedImage, "categories");
                }
                else
                {
                    return await SaveToLocalStorageAsync(optimizedImage, "categories");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading category image.");
                return null;
            }
        }

        private async Task<IFormFile> OptimizeCategoryImageAsync(IFormFile imageFile)
        {
            if (!_imageSettings.EnableOptimization)
                return imageFile;

            try
            {
                await using var inputStream = imageFile.OpenReadStream();
                using var image = await Image.LoadAsync(inputStream);

                // Resize if needed (category images are typically smaller)
                if (image.Width > _imageSettings.MaxWidth || image.Height > _imageSettings.MaxHeight)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = CalculateCategoryImageSize(image),
                        Mode = ResizeMode.Pad,
                        Compand = true
                    }));
                }

                // Determine output format
                var outputFormat = DetermineCategoryImageFormat(imageFile);
                var outputStream = new MemoryStream();

                // Encode with optimization
                await EncodeCategoryImageAsync(image, outputStream, outputFormat);
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
                _logger.LogWarning(ex, "Failed to optimize category image, using original");
                return imageFile;
            }
        }

        private Size CalculateCategoryImageSize(Image image)
        {
            // Category images might need different sizing - smaller than banners
            var targetWidth = Math.Min(_imageSettings.MaxWidth, 800); // Max 800px for categories
            var targetHeight = Math.Min(_imageSettings.MaxHeight, 600); // Max 600px for categories

            var ratioX = (double)targetWidth / image.Width;
            var ratioY = (double)targetHeight / image.Height;
            var ratio = Math.Min(ratioX, ratioY);

            return new Size(
                (int)(image.Width * ratio),
                (int)(image.Height * ratio)
            );
        }

        private ImageFormat DetermineCategoryImageFormat(IFormFile imageFile)
        {
            if (_imageSettings.PreferredFormat != ImageFormat.Auto)
                return _imageSettings.PreferredFormat;

            var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            // For category images, WebP is usually best for web display
            return extension switch
            {
                ".png" => _imageSettings.PreserveTransparency ? ImageFormat.Png : ImageFormat.WebP,
                ".gif" => ImageFormat.Gif, // Keep GIF for animated category icons if needed
                _ => ImageFormat.WebP
            };
        }

        private async Task EncodeCategoryImageAsync(Image image, Stream outputStream, ImageFormat format)
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
                    await image.SaveAsWebpAsync(outputStream, new WebpEncoder { Quality = 80 });
                    break;
            }
        }

        private async Task<string> UploadToCloudinaryAsync(IFormFile imageFile, string folder)
        {
            var uploadResult = await _cloudinaryService.UploadImageAsync(imageFile);

            if (!uploadResult.IsSuccess)
            {
                _logger.LogError("Cloudinary upload failed: {Error}", uploadResult.ErrorMessage);
                return null;
            }

            return uploadResult.Url;
        }

        private async Task<string> SaveToLocalStorageAsync(IFormFile imageFile, string folder)
        {
            var uploadsFolder = Path.Combine("wwwroot", "images", folder);
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(imageFile.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using var fileStream = new FileStream(filePath, FileMode.Create);
            await imageFile.CopyToAsync(fileStream);

            return $"{_appSettings.ApiRoot}/images/{folder}/{fileName}";
        }

        private async Task DeleteCategoryImageAsync(string imageUrl)
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
                    var imagePath = Path.Combine("wwwroot", "images", "categories", fileName);

                    if (File.Exists(imagePath))
                    {
                        File.Delete(imagePath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting category image: {ImageUrl}", imageUrl);
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
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg" };
            var fileExtension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
                return false;

            // For SVG, we don't need to check image signature
            if (fileExtension == ".svg")
                return true;

            // Check image signature for raster images
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
                _fileName = fileName ?? "optimized-category.jpg";
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

        private ValidationResult ValidateCategoryInput(CategoryDto categoryDto)
        {
            if (categoryDto == null)
                return ValidationResult.Failure("Category data is required.");

            if (string.IsNullOrWhiteSpace(categoryDto.Name))
                return ValidationResult.Failure("Category name is required.");

            if (categoryDto.Name.Length > 100)
                return ValidationResult.Failure("Category name cannot exceed 100 characters.");

            //if (categoryDto.Description?.Length > 500)
            //    return ValidationResult.Failure("Category description cannot exceed 500 characters.");

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


	}
}
