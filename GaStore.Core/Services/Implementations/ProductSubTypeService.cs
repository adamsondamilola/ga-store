using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class ProductSubTypeService : IProductSubTypeService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<ProductSubTypeService> _logger;
        private readonly IMapper _mapper;
        private readonly AppSettings _appSettings;

        public ProductSubTypeService(IUnitOfWork unitOfWork, ILogger<ProductSubTypeService> logger, IMapper mapper, IOptions<AppSettings> appSettings)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _mapper = mapper;
            _appSettings = appSettings.Value;
        }

        public async Task<PaginatedServiceResponse<List<ProductSubTypeDto>>> GetProductSubTypesAsync(string? searchTerm, Guid? productTypeId, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<ProductSubTypeDto>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                IQueryable<ProductSubType> queryable = _unitOfWork.ProductSubTypeRepository.GetAllIncluding(
                    pst => pst.ProductType!
                );

                if (!string.IsNullOrEmpty(searchTerm))
                {
                    queryable = queryable.Where(pst => pst.Name.Contains(searchTerm));
                }

                if (productTypeId.HasValue)
                {
                    queryable = queryable.Where(pst => pst.ProductTypeId == productTypeId.Value);
                }

                var totalRecords = await queryable.CountAsync();

                var pagedProductSubTypes = await queryable
                    .OrderBy(pst => pst.Name)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var productSubTypes = _mapper.Map<List<ProductSubType>, List<ProductSubTypeDto>>(pagedProductSubTypes);

                response.Status = 200;
                response.Message = "Product sub-types retrieved successfully";
                response.Data = productSubTypes;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product sub-types.");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductSubTypeDto>> GetProductSubTypeByIdAsync(Guid id)
        {
            var response = new ServiceResponse<ProductSubTypeDto>();

            try
            {
                var productSubType = await _unitOfWork.ProductSubTypeRepository.GetByIdIncluding(
                    id,
                    pst => pst.ProductType!
                );

                if (productSubType == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product sub-type not found.";
                    return response;
                }

                var productSubTypeDto = _mapper.Map<ProductSubTypeDto>(productSubType);

                response.StatusCode = 200;
                response.Message = "Product sub-type retrieved successfully";
                response.Data = productSubTypeDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product sub-type.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductSubTypeDto>> CreateProductSubTypeAsync(CreateProductSubTypeDto productSubTypeDto, Guid userId)
        {
            var response = new ServiceResponse<ProductSubTypeDto>();

            try
            {
                if (productSubTypeDto == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Product sub-type data is required.";
                    return response;
                }

                // Validate ProductType exists
                var productType = await _unitOfWork.ProductTypeRepository.GetById(productSubTypeDto.ProductTypeId);
                if (productType == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Product type not found.";
                    return response;
                }

                // Check for name uniqueness within the same product type
                var existingProductSubType = await _unitOfWork.ProductSubTypeRepository.Get(
                    x => x.Name == productSubTypeDto.Name && x.ProductTypeId == productSubTypeDto.ProductTypeId
                );
                if (existingProductSubType != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Product sub-type name already exists in this product type.";
                    return response;
                }

                // Handle image upload
                string? imageUrl = null;
                if (productSubTypeDto.ImageFile != null && productSubTypeDto.ImageFile.Length > 0)
                {
                    imageUrl = await UploadImageAsync(productSubTypeDto.ImageFile, "productsubtypes");
                    if (imageUrl == null)
                    {
                        response.StatusCode = 400;
                        response.Message = "Invalid image file.";
                        return response;
                    }
                }

                // Map DTO to entity
                var productSubType = new ProductSubType
                {
                    Name = productSubTypeDto.Name,
                    ProductTypeId = productSubTypeDto.ProductTypeId,
                    ImageUrl = imageUrl,
                    IsActive = productSubTypeDto.IsActive
                };

                await _unitOfWork.ProductSubTypeRepository.Add(productSubType);
                await _unitOfWork.CompletedAsync(userId);

                // Return created data
                productSubTypeDto.Id = productSubType.Id;
                productSubTypeDto.ImageUrl = productSubType.ImageUrl;

                response.StatusCode = 201;
                response.Message = "Product sub-type created successfully";
                response.Data = _mapper.Map<ProductSubTypeDto>(productSubTypeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product sub-type.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductSubTypeDto>> UpdateProductSubTypeAsync(CreateProductSubTypeDto productSubTypeDto, Guid userId)
        {
            var response = new ServiceResponse<ProductSubTypeDto>();

            try
            {
                if (productSubTypeDto == null || productSubTypeDto.Id == Guid.Empty)
                {
                    response.StatusCode = 400;
                    response.Message = "Valid product sub-type data is required.";
                    return response;
                }

                var productSubType = await _unitOfWork.ProductSubTypeRepository.GetById((Guid)productSubTypeDto.Id);
                if (productSubType == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product sub-type not found.";
                    return response;
                }

                // Validate ProductType exists if changing
                if (productSubTypeDto.ProductTypeId != productSubType.ProductTypeId)
                {
                    var productType = await _unitOfWork.ProductTypeRepository.GetById(productSubTypeDto.ProductTypeId);
                    if (productType == null)
                    {
                        response.StatusCode = 400;
                        response.Message = "Product type not found.";
                        return response;
                    }
                }

                // Check for name uniqueness
                var existingWithSameName = await _unitOfWork.ProductSubTypeRepository.Get(
                    x => x.Name == productSubTypeDto.Name &&
                         x.ProductTypeId == productSubTypeDto.ProductTypeId &&
                         x.Id != productSubTypeDto.Id
                );
                if (existingWithSameName != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Another product sub-type with this name already exists in this product type.";
                    return response;
                }

                // Handle image update
                if (productSubTypeDto.ImageFile != null && productSubTypeDto.ImageFile.Length > 0)
                {
                    var imageUrl = await UploadImageAsync(productSubTypeDto.ImageFile, "productsubtypes");
                    if (imageUrl == null)
                    {
                        response.StatusCode = 400;
                        response.Message = "Invalid image file.";
                        return response;
                    }

                    // Delete old image
                    if (!string.IsNullOrEmpty(productSubType.ImageUrl))
                    {
                        DeleteImage(productSubType.ImageUrl, "productsubtypes");
                    }

                    productSubType.ImageUrl = imageUrl;
                }

                // Update fields
                productSubType.Name = productSubTypeDto.Name;
                productSubType.ProductTypeId = productSubTypeDto.ProductTypeId;
                productSubType.IsActive = productSubTypeDto.IsActive;

                await _unitOfWork.ProductSubTypeRepository.Upsert(productSubType);
                await _unitOfWork.CompletedAsync(userId);

                productSubTypeDto.ImageUrl = productSubType.ImageUrl;

                response.StatusCode = 200;
                response.Message = "Product sub-type updated successfully";
                response.Data = _mapper.Map<ProductSubTypeDto>(productSubTypeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product sub-type.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductSubTypeDto>> DeleteProductSubTypeAsync(Guid id, Guid userId)
        {
            var response = new ServiceResponse<ProductSubTypeDto>();

            try
            {
                var productSubType = await _unitOfWork.ProductSubTypeRepository.GetById(id);

                if (productSubType == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product sub-type not found.";
                    return response;
                }

                // Delete image file
                if (!string.IsNullOrEmpty(productSubType.ImageUrl))
                {
                    DeleteImage(productSubType.ImageUrl, "productsubtypes");
                }

                await _unitOfWork.ProductSubTypeRepository.Remove(productSubType.Id);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Product sub-type deleted successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product sub-type.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<ProductSubTypeDto>>> GetProductSubTypesByProductTypeAsync(Guid productTypeId)
        {
            var response = new ServiceResponse<List<ProductSubTypeDto>>();

            try
            {
                var productSubTypes = await _unitOfWork.ProductSubTypeRepository.GetAll(
                    x => x.ProductTypeId == productTypeId && x.IsActive
                );

                var productSubTypeDtos = _mapper.Map<List<ProductSubTypeDto>>(productSubTypes);

                response.StatusCode = 200;
                response.Message = "Product sub-types retrieved successfully";
                response.Data = productSubTypeDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product sub-types by product type.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        private async Task<string?> UploadImageAsync(IFormFile imageFile, string folderName)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var maxFileSize = 5 * 1024 * 1024; // 5MB
            var uploadsFolder = Path.Combine("wwwroot", "images", folderName);
            var fileExtension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension) || imageFile.Length > maxFileSize)
            {
                return null;
            }

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            return $"{_appSettings.ApiRoot}/images/{folderName}/{uniqueFileName}";
        }

        private void DeleteImage(string imageUrl, string folderName)
        {
            var fileName = Path.GetFileName(imageUrl);
            var imagePath = Path.Combine("wwwroot", "images", folderName, fileName);
            if (File.Exists(imagePath))
            {
                File.Delete(imagePath);
            }
        }
    }
}