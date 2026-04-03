using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Shared.Constants;
using GaStore.Shared;
using GaStore.Infrastructure.Repository.UnitOfWork;
using AutoMapper;

namespace GaStore.Core.Services.Implementations
{
    public class SubCategoryService : ISubCategoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<SubCategoryService> _logger;
        private readonly IMapper _mapper;

        public SubCategoryService(IUnitOfWork unitOfWork, ILogger<SubCategoryService> logger, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<PaginatedServiceResponse<List<SubCategoryDto>>> GetSubCategoriesAsync(string? searchTerm, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<SubCategoryDto>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                // Build filter expression
                System.Linq.Expressions.Expression<Func<SubCategory, bool>>? filter = null;
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    filter = sc => sc.Name.Contains(searchTerm);
                }

                // Get total count
                var totalRecords = _unitOfWork.SubCategoryRepository.GetAll(filter ?? (sc => true))
                    .Result.Count;

                // Get subcategories with included category
                var subCategories = await _unitOfWork.SubCategoryRepository.GetAllAsync(
                    filter: filter,
                    orderBy: q => q.OrderBy(sc => sc.Name),
                    includeProperties: "Category",
                    trackChanges: false
                );

                var pagedSubCategories = subCategories
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var subCategoriesDto = _mapper.Map<List<SubCategoryDto>>(pagedSubCategories);

                response.Status = 200;
                response.Message = "SubCategories retrieved successfully";
                response.Data = subCategoriesDto;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving subcategories.");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<SubCategoryDto>> GetSubCategoryByIdAsync(Guid id)
        {
            var response = new ServiceResponse<SubCategoryDto>();

            try
            {
                // Get subcategory with included category and product types
                var subCategory = await _unitOfWork.SubCategoryRepository.GetByIdIncluding(
                    id,
                    sc => sc.Category!,
                    sc => sc.ProductTypes!
                );

                if (subCategory == null)
                {
                    response.StatusCode = 404;
                    response.Message = "SubCategory not found.";
                    return response;
                }

                var subCategoryDto = _mapper.Map<SubCategoryDto>(subCategory);

                // Set category name for display
                if (subCategory.Category != null)
                {
                 //   subCategoryDto.Name = subCategory.Category.Name;
                }

                // Get product types count
                //subCategoryDto.ProductTypesCount = subCategory.ProductTypes?.Count ?? 0;

                response.StatusCode = 200;
                response.Message = "SubCategory retrieved successfully";
                response.Data = subCategoryDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving subcategory.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<SubCategoryDto>> CreateSubCategoryAsync(SubCategoryDto subCategoryDto, Guid userId)
        {
            var response = new ServiceResponse<SubCategoryDto>();

            try
            {
                if (subCategoryDto == null)
                {
                    response.StatusCode = 400;
                    response.Message = "SubCategory data is required.";
                    return response;
                }

                // Validate category exists
                var category = await _unitOfWork.CategoryRepository.GetById(subCategoryDto.CategoryId);
                if (category == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Category not found.";
                    return response;
                }

                // Check for name uniqueness within the same category
                var existingSubCategory = await _unitOfWork.SubCategoryRepository.Get(
                    x => x.Name.ToLower() == subCategoryDto.Name.Trim().ToLower() &&
                         x.CategoryId == subCategoryDto.CategoryId
                );
                if (existingSubCategory != null)
                {
                    response.StatusCode = 400;
                    response.Message = "SubCategory name already exists in this category.";
                    return response;
                }

                // Map DTO to entity
                var subCategory = new SubCategory
                {
                    CategoryId = subCategoryDto.CategoryId,
                    Name = subCategoryDto.Name.Trim(),
                    ImageUrl = subCategoryDto.ImageUrl,
                    IsActive = subCategoryDto.IsActive,
                    HasColors = subCategoryDto.HasColors,
                    HasSizes = subCategoryDto.HasSizes,
                    HasStyles = subCategoryDto.HasStyles
                };

                await _unitOfWork.SubCategoryRepository.Add(subCategory);
                await _unitOfWork.CompletedAsync(userId);

                // Return created data with ID
                subCategoryDto.Id = subCategory.Id;

                response.StatusCode = 201;
                response.Message = "SubCategory created successfully";
                response.Data = subCategoryDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating subcategory.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<SubCategoryDto>> UpdateSubCategoryAsync(SubCategoryDto subCategoryDto, Guid userId)
        {
            var response = new ServiceResponse<SubCategoryDto>();

            try
            {
                if (subCategoryDto == null || subCategoryDto.Id == Guid.Empty)
                {
                    response.StatusCode = 400;
                    response.Message = "Valid subcategory data is required.";
                    return response;
                }

                var subCategory = await _unitOfWork.SubCategoryRepository.GetById((Guid)subCategoryDto.Id);
                if (subCategory == null)
                {
                    response.StatusCode = 404;
                    response.Message = "SubCategory not found.";
                    return response;
                }

                // Validate category exists if changing
                if (subCategoryDto.CategoryId != subCategory.CategoryId)
                {
                    var category = await _unitOfWork.CategoryRepository.GetById(subCategoryDto.CategoryId);
                    if (category == null)
                    {
                        response.StatusCode = 400;
                        response.Message = "Category not found.";
                        return response;
                    }
                }

                // Check for name uniqueness (exclude current subcategory)
                var existingWithSameName = await _unitOfWork.SubCategoryRepository.Get(
                    x => x.Name.ToLower() == subCategoryDto.Name.Trim().ToLower() &&
                         x.CategoryId == subCategoryDto.CategoryId &&
                         x.Id != subCategoryDto.Id
                );
                if (existingWithSameName != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Another subcategory with this name already exists in this category.";
                    return response;
                }

                // Update fields
                subCategory.CategoryId = subCategoryDto.CategoryId;
                subCategory.Name = subCategoryDto.Name.Trim();
                subCategory.ImageUrl = subCategoryDto.ImageUrl;
                subCategory.IsActive = subCategoryDto.IsActive;
                subCategory.HasColors = subCategoryDto.HasColors;
                subCategory.HasSizes = subCategoryDto.HasSizes;
                subCategory.HasStyles = subCategoryDto.HasStyles;

                await _unitOfWork.SubCategoryRepository.Upsert(subCategory);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "SubCategory updated successfully";
                response.Data = subCategoryDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating subcategory.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<SubCategoryDto>> DeleteSubCategoryAsync(Guid id, Guid userId)
        {
            var response = new ServiceResponse<SubCategoryDto>();

            try
            {
                var subCategory = await _unitOfWork.SubCategoryRepository.GetByIdIncluding(
                    id,
                    sc => sc.ProductTypes!
                );

                if (subCategory == null)
                {
                    response.StatusCode = 404;
                    response.Message = "SubCategory not found.";
                    return response;
                }

                // Check if subcategory has associated product types
                if (subCategory.ProductTypes != null && subCategory.ProductTypes.Count > 0)
                {
                    response.StatusCode = 400;
                    response.Message = "Cannot delete subcategory that has associated product types.";
                    return response;
                }

                // Delete the subcategory
                await _unitOfWork.SubCategoryRepository.Remove(subCategory.Id);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "SubCategory deleted successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting subcategory.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<SubCategoryDto>>> GetSubCategoriesByCategoryAsync(Guid categoryId)
        {
            var response = new ServiceResponse<List<SubCategoryDto>>();

            try
            {
                var subCategories = await _unitOfWork.SubCategoryRepository.GetAllAsync(
                    filter: sc => sc.CategoryId == categoryId && sc.IsActive,
                    orderBy: q => q.OrderBy(sc => sc.Name),
                    includeProperties: "Category",
                    trackChanges: false
                );

                var subCategoriesDto = _mapper.Map<List<SubCategoryDto>>(subCategories);

                response.StatusCode = 200;
                response.Message = "SubCategories retrieved successfully";
                response.Data = subCategoriesDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving subcategories by category.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<SubCategoryDto>>> GetActiveSubCategoriesAsync()
        {
            var response = new ServiceResponse<List<SubCategoryDto>>();

            try
            {
                var subCategories = await _unitOfWork.SubCategoryRepository.GetAllAsync(
                    filter: sc => sc.IsActive,
                    orderBy: q => q.OrderBy(sc => sc.Name),
                    includeProperties: "Category",
                    trackChanges: false
                );

                var subCategoriesDto = _mapper.Map<List<SubCategoryDto>>(subCategories);

                response.StatusCode = 200;
                response.Message = "Active subcategories retrieved successfully";
                response.Data = subCategoriesDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active subcategories.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }
    }
}