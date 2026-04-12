using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class ProductTypeService : IProductTypeService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<ProductTypeService> _logger;
        private readonly IMapper _mapper;
        private readonly AppSettings _appSettings;
        private readonly IImageUploadService _imageUploadService;

        public ProductTypeService(
            IUnitOfWork unitOfWork,
            ILogger<ProductTypeService> logger,
            IMapper mapper,
            IOptions<AppSettings> appSettings,
            IImageUploadService imageUploadService)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _mapper = mapper;
            _appSettings = appSettings.Value;
            _imageUploadService = imageUploadService;
        }

        public async Task<PaginatedServiceResponse<List<ProductTypeDto>>> GetProductTypesAsync(string? searchTerm, Guid? subCategoryId, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<ProductTypeDto>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                IQueryable<ProductType> queryable = _unitOfWork.ProductTypeRepository.GetAllIncluding(
                    pt => pt.SubCategory!,
                    pt => pt.ProductSubTypes!
                );

                if (!string.IsNullOrEmpty(searchTerm))
                {
                    queryable = queryable.Where(pt => pt.Name.Contains(searchTerm));
                }

                if (subCategoryId.HasValue)
                {
                    queryable = queryable.Where(pt => pt.SubCategoryId == subCategoryId.Value);
                }

                var totalRecords = await queryable.CountAsync();

                var pagedProductTypes = await queryable
                    .OrderByDescending(pt => pt.DateCreated)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var productTypes = _mapper.Map<List<ProductType>, List<ProductTypeDto>>(pagedProductTypes);

                response.Status = 200;
                response.Message = "Product types retrieved successfully";
                response.Data = productTypes;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product types.");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductTypeDto>> GetProductTypeByIdAsync(Guid id)
        {
            var response = new ServiceResponse<ProductTypeDto>();

            try
            {
                var productType = await _unitOfWork.ProductTypeRepository.GetByIdIncluding(
                    id,
                    pt => pt.SubCategory!,
                    pt => pt.ProductSubTypes!
                );

                if (productType == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product type not found.";
                    return response;
                }

                var productTypeDto = _mapper.Map<ProductTypeDto>(productType);

                response.StatusCode = 200;
                response.Message = "Product type retrieved successfully";
                response.Data = productTypeDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product type.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductTypeDto>> CreateProductTypeAsync(CreateProductTypeDto productTypeDto, Guid userId)
        {
            var response = new ServiceResponse<ProductTypeDto>();

            try
            {
                if (productTypeDto == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Product type data is required.";
                    return response;
                }

                // Validate SubCategory exists
                var subCategory = await _unitOfWork.SubCategoryRepository.GetById(productTypeDto.SubCategoryId);
                if (subCategory == null)
                {
                    response.StatusCode = 400;
                    response.Message = "SubCategory not found.";
                    return response;
                }

                // Check for name uniqueness within the same subcategory
                var existingProductType = await _unitOfWork.ProductTypeRepository.Get(
                    x => x.Name == productTypeDto.Name && x.SubCategoryId == productTypeDto.SubCategoryId
                );
                if (existingProductType != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Product type name already exists in this subcategory.";
                    return response;
                }

                var imageUrl = await ResolveImageUrlAsync(productTypeDto.ImageFile, productTypeDto.ImageUrl);
                if (productTypeDto.ImageFile != null && imageUrl == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Invalid image file.";
                    return response;
                }

                // Map DTO to entity
                var productType = new ProductType
                {
                    Name = productTypeDto.Name,
                    SubCategoryId = productTypeDto.SubCategoryId,
                    ImageUrl = imageUrl,
                    IsActive = productTypeDto.IsActive
                };

                await _unitOfWork.ProductTypeRepository.Add(productType);
                await _unitOfWork.CompletedAsync(userId);

                // Return created data
                productTypeDto.Id = productType.Id;
                productTypeDto.ImageUrl = productType.ImageUrl;

                response.StatusCode = 201;
                response.Message = "Product type created successfully";
                response.Data = _mapper.Map<ProductTypeDto>(productTypeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product type.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductTypeDto>> UpdateProductTypeAsync(CreateProductTypeDto productTypeDto, Guid userId)
        {
            var response = new ServiceResponse<ProductTypeDto>();

            try
            {
                if (productTypeDto == null || productTypeDto.Id == Guid.Empty)
                {
                    response.StatusCode = 400;
                    response.Message = "Valid product type data is required.";
                    return response;
                }

                var productType = await _unitOfWork.ProductTypeRepository.GetById((Guid)productTypeDto.Id);
                if (productType == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product type not found.";
                    return response;
                }

                // Validate SubCategory exists if changing
                if (productTypeDto.SubCategoryId != productType.SubCategoryId)
                {
                    var subCategory = await _unitOfWork.SubCategoryRepository.GetById(productTypeDto.SubCategoryId);
                    if (subCategory == null)
                    {
                        response.StatusCode = 400;
                        response.Message = "SubCategory not found.";
                        return response;
                    }
                }

                // Check for name uniqueness
                var existingWithSameName = await _unitOfWork.ProductTypeRepository.Get(
                    x => x.Name == productTypeDto.Name &&
                         x.SubCategoryId == productTypeDto.SubCategoryId &&
                         x.Id != productTypeDto.Id
                );
                if (existingWithSameName != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Another product type with this name already exists in this subcategory.";
                    return response;
                }

                var imageUrl = await ResolveImageUrlAsync(productTypeDto.ImageFile, productTypeDto.ImageUrl, productType.ImageUrl);
                if (productTypeDto.ImageFile != null && imageUrl == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Invalid image file.";
                    return response;
                }

                if (productTypeDto.ImageFile != null &&
                    !string.IsNullOrWhiteSpace(productType.ImageUrl) &&
                    !string.Equals(productType.ImageUrl, imageUrl, StringComparison.OrdinalIgnoreCase))
                {
                    DeleteImage(productType.ImageUrl, "producttypes");
                }

                productType.ImageUrl = imageUrl;

                // Update fields
                productType.Name = productTypeDto.Name;
                productType.SubCategoryId = productTypeDto.SubCategoryId;
                productType.IsActive = productTypeDto.IsActive;

                await _unitOfWork.ProductTypeRepository.Upsert(productType);
                await _unitOfWork.CompletedAsync(userId);

                productTypeDto.ImageUrl = productType.ImageUrl;

                response.StatusCode = 200;
                response.Message = "Product type updated successfully";
                response.Data = _mapper.Map<ProductTypeDto>(productTypeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product type.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductTypeDto>> DeleteProductTypeAsync(Guid id, Guid userId)
        {
            var response = new ServiceResponse<ProductTypeDto>();

            try
            {
                var productType = await _unitOfWork.ProductTypeRepository.GetByIdIncluding(
                    id,
                    pt => pt.Products!,
                    pt => pt.ProductSubTypes!
                );

                if (productType == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product type not found.";
                    return response;
                }

                // Check if product type has associated products
                if (productType.Products != null && productType.Products.Any())
                {
                    response.StatusCode = 400;
                    response.Message = "Cannot delete product type that has associated products.";
                    return response;
                }

                // Delete associated product sub-types
                if (productType.ProductSubTypes != null && productType.ProductSubTypes.Any())
                {
                    foreach (var subType in productType.ProductSubTypes.ToList())
                    {
                        await _unitOfWork.ProductSubTypeRepository.Remove(subType.Id);
                    }
                }

                // Delete image file
                if (!string.IsNullOrEmpty(productType.ImageUrl))
                {
                    DeleteImage(productType.ImageUrl, "producttypes");
                }

                await _unitOfWork.ProductTypeRepository.Remove(productType.Id);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Product type deleted successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product type.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<ProductTypeDto>>> GetProductTypesBySubCategoryAsync(Guid subCategoryId)
        {
            var response = new ServiceResponse<List<ProductTypeDto>>();

            try
            {
                var productTypes = await _unitOfWork.ProductTypeRepository.GetAllAsync(
                    x => x.SubCategoryId == subCategoryId && x.IsActive,
                    includeProperties: "ProductSubTypes"
                );

                var productTypeDtos = _mapper.Map<List<ProductTypeDto>>(productTypes);

                response.StatusCode = 200;
                response.Message = "Product types retrieved successfully";
                response.Data = productTypeDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product types by subcategory.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        private async Task<string?> UploadImageAsync(IFormFile imageFile, string folderName)
        {
            var upload = await _imageUploadService.UploadAndOptimizeImageAsync(imageFile, Path.Combine("wwwroot", "images", folderName));
            return upload.IsSuccess ? upload.ImageUrl : null;
        }

        private async Task<string?> ResolveImageUrlAsync(IFormFile? imageFile, string? imageUrl, string? existingImageUrl = null)
        {
            if (imageFile != null && imageFile.Length > 0)
            {
                return await UploadImageAsync(imageFile, "producttypes");
            }

            if (!string.IsNullOrWhiteSpace(imageUrl))
            {
                return imageUrl.Trim();
            }

            return existingImageUrl;
        }

        private void DeleteImage(string imageUrl, string folderName)
        {
            _imageUploadService.DeleteImageAsync(imageUrl).GetAwaiter().GetResult();
        }
    }
}
