using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;
using AutoMapper;

namespace GaStore.Core.Services.Implementations
{
    public class TagService : ITagService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<TagService> _logger;
        private readonly IMapper _mapper;

        public TagService(IUnitOfWork unitOfWork, ILogger<TagService> logger, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<PaginatedServiceResponse<List<TagDto>>> GetTagsAsync(string? searchTerm, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<TagDto>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                IQueryable<Tag> queryable = _unitOfWork.TagRepository.GetAllIncluding(
                    t => t.TaggedProducts!
                );

                if (!string.IsNullOrEmpty(searchTerm))
                {
                    queryable = queryable.Where(t => t.Name.Contains(searchTerm) ||
                                                    (t.Description != null && t.Description.Contains(searchTerm)));
                }

                var totalRecords = await queryable.CountAsync();

                var pagedTags = await queryable
                    .OrderBy(t => t.Name)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var tags = _mapper.Map<List<Tag>, List<TagDto>>(pagedTags);

                // Get product counts for each tag
                foreach (var tag in tags)
                {
                    tag.ProductCount = _unitOfWork.TaggedProductRepository.GetAll(tp => tp.TagId == tag.Id).Result.Count;
                }

                response.Status = 200;
                response.Message = "Tags retrieved successfully";
                response.Data = tags;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tags.");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<TagDto>> GetTagByIdAsync(Guid id)
        {
            var response = new ServiceResponse<TagDto>();

            try
            {
                var tag = await _unitOfWork.TagRepository.GetByIdIncluding(
                    id,
                    t => t.TaggedProducts!
                );

                if (tag == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Tag not found.";
                    return response;
                }

                var tagDto = _mapper.Map<TagDto>(tag);
                tagDto.ProductCount =  _unitOfWork.TaggedProductRepository.GetAll(tp => tp.TagId == id)
                    .Result
                    .Count;

                response.StatusCode = 200;
                response.Message = "Tag retrieved successfully";
                response.Data = tagDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tag.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<TagDto>> CreateTagAsync(TagDto tagDto, Guid userId)
        {
            var response = new ServiceResponse<TagDto>();

            try
            {
                if (tagDto == null || string.IsNullOrWhiteSpace(tagDto.Name))
                {
                    response.StatusCode = 400;
                    response.Message = "Tag name is required.";
                    return response;
                }

                // Check for name uniqueness
                var existingTag = await _unitOfWork.TagRepository.Get(
                    x => x.Name.ToLower() == tagDto.Name.Trim().ToLower()
                );
                if (existingTag != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Tag name already exists.";
                    return response;
                }

                // Map DTO to entity
                var tag = new Tag
                {
                    Name = tagDto.Name.Trim(),
                    Description = tagDto.Description?.Trim()
                };

                await _unitOfWork.TagRepository.Add(tag);
                await _unitOfWork.CompletedAsync(userId);

                // Return created data
                tagDto.Id = tag.Id;

                response.StatusCode = 201;
                response.Message = "Tag created successfully";
                response.Data = tagDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tag.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<TagDto>>> CreateBulkTagsAsync(List<TagDto> tagDtos, Guid userId)
        {
            var response = new ServiceResponse<List<TagDto>>();

            try
            {
                if (tagDtos == null || !tagDtos.Any())
                {
                    response.StatusCode = 400;
                    response.Message = "No tags provided.";
                    return response;
                }

                // Normalize input (trim and distinct by name)
                var normalizedTags = tagDtos
                    .Where(t => !string.IsNullOrWhiteSpace(t.Name))
                    .GroupBy(t => t.Name.Trim().ToLower())
                    .Select(g => g.First())
                    .ToList();

                if (!normalizedTags.Any())
                {
                    response.StatusCode = 400;
                    response.Message = "All tag names are empty or invalid.";
                    return response;
                }

                // Get existing tag names from DB
                var existingTags = await _unitOfWork.TagRepository.GetAll(
                    x => normalizedTags.Select(t => t.Name.Trim().ToLower()).Contains(x.Name.ToLower())
                );

                var existingNames = existingTags.Select(x => x.Name.ToLower()).ToHashSet();

                // Filter out existing tags
                var newTags = normalizedTags
                    .Where(t => !existingNames.Contains(t.Name.Trim().ToLower()))
                    .ToList();

                if (!newTags.Any())
                {
                    response.StatusCode = 409;
                    response.Message = "All provided tag names already exist.";
                    return response;
                }

                // Map DTOs to entities
                var tagEntities = newTags.Select(t => new Tag
                {
                    Name = t.Name.Trim(),
                    Description = t.Description?.Trim()
                }).ToList();

                // Add all new tags
                await _unitOfWork.TagRepository.AddRange(tagEntities);
                await _unitOfWork.CompletedAsync(userId);

                // Update DTOs with IDs from entities
                for (int i = 0; i < tagEntities.Count; i++)
                {
                    newTags[i].Id = tagEntities[i].Id;
                }

                response.StatusCode = 201;
                response.Message = $"{tagEntities.Count} tag(s) created successfully.";
                response.Data = newTags;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tags.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<ServiceResponse<TagDto>> UpdateTagAsync(TagDto tagDto, Guid userId)
        {
            var response = new ServiceResponse<TagDto>();

            try
            {
                if (tagDto == null || tagDto.Id == Guid.Empty || string.IsNullOrWhiteSpace(tagDto.Name))
                {
                    response.StatusCode = 400;
                    response.Message = "Valid tag data is required.";
                    return response;
                }

                var tag = await _unitOfWork.TagRepository.GetById(tagDto.Id);
                if (tag == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Tag not found.";
                    return response;
                }

                // Check for name uniqueness (exclude current tag)
                var existingWithSameName = await _unitOfWork.TagRepository.Get(
                    x => x.Name.ToLower() == tagDto.Name.Trim().ToLower() && x.Id != tagDto.Id
                );
                if (existingWithSameName != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Another tag with this name already exists.";
                    return response;
                }

                // Update fields
                tag.Name = tagDto.Name.Trim();
                tag.Description = tagDto.Description?.Trim();

                await _unitOfWork.TagRepository.Upsert(tag);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Tag updated successfully";
                response.Data = tagDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating tag.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<TagDto>> DeleteTagAsync(Guid id, Guid userId)
        {
            var response = new ServiceResponse<TagDto>();

            try
            {
                var tag = await _unitOfWork.TagRepository.GetById(id);

                if (tag == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Tag not found.";
                    return response;
                }

                // Get all tagged products for this tag
                var taggedProducts = await _unitOfWork.TaggedProductRepository.GetAll(
                    x => x.TagId == id
                );

                // Delete all associated tagged products
                if (taggedProducts != null && taggedProducts.Count > 0)
                {
                    foreach (var taggedProduct in taggedProducts)
                    {
                        await _unitOfWork.TaggedProductRepository.Remove(taggedProduct.Id);
                    }
                }

                // Delete the tag
                await _unitOfWork.TagRepository.Remove(tag.Id);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Tag deleted successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting tag.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<TaggedProductDto>> AddTagToProductAsync(TaggedProductDto taggedProductDto, Guid userId)
        {
            var response = new ServiceResponse<TaggedProductDto>();

            try
            {
                if (taggedProductDto == null || taggedProductDto.ProductId == Guid.Empty || taggedProductDto.TagId == Guid.Empty)
                {
                    response.StatusCode = 400;
                    response.Message = "Product ID and Tag ID are required.";
                    return response;
                }

                // Validate product exists
                var product = await _unitOfWork.ProductRepository.GetById(taggedProductDto.ProductId);
                if (product == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Product not found.";
                    return response;
                }

                // Validate tag exists
                var tag = await _unitOfWork.TagRepository.GetById(taggedProductDto.TagId);
                if (tag == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Tag not found.";
                    return response;
                }

                // Check if tag is already assigned to product
                var existingTaggedProduct = await _unitOfWork.TaggedProductRepository.Get(
                    x => x.ProductId == taggedProductDto.ProductId && x.TagId == taggedProductDto.TagId
                );
                if (existingTaggedProduct != null)
                {
                    response.StatusCode = 400;
                    response.Message = "This tag is already assigned to the product.";
                    return response;
                }

                // Create tagged product
                var taggedProduct = new TaggedProduct
                {
                    ProductId = taggedProductDto.ProductId,
                    TagId = taggedProductDto.TagId
                };

                await _unitOfWork.TaggedProductRepository.Add(taggedProduct);
                await _unitOfWork.CompletedAsync(userId);

                taggedProductDto.Id = taggedProduct.Id;

                response.StatusCode = 201;
                response.Message = "Tag added to product successfully";
                response.Data = taggedProductDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding tag to product.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<TaggedProductDto>>> AddBulkTagToProductAsync(
    List<TaggedProductDto> taggedProductDtos, Guid userId)
        {
            var response = new ServiceResponse<List<TaggedProductDto>>();

            try
            {
                if (taggedProductDtos == null || !taggedProductDtos.Any())
                {
                    response.StatusCode = 400;
                    response.Message = "No tag-product pairs provided.";
                    return response;
                }

                // Filter invalid entries
                var validPairs = taggedProductDtos
                    .Where(x => x.ProductId != Guid.Empty && x.TagId != Guid.Empty)
                    .ToList();

                if (!validPairs.Any())
                {
                    response.StatusCode = 400;
                    response.Message = "All provided tag-product pairs are invalid.";
                    return response;
                }

                // Collect all productIds and tagIds
                var productIds = validPairs.Select(x => x.ProductId).Distinct().ToList();
                var tagIds = validPairs.Select(x => x.TagId).Distinct().ToList();

                // Validate products and tags exist
                var existingProducts = await _unitOfWork.ProductRepository.GetAll(p => productIds.Contains(p.Id));
                var existingTags = await _unitOfWork.TagRepository.GetAll(t => tagIds.Contains(t.Id));

                var existingProductIds = existingProducts.Select(p => p.Id).ToHashSet();
                var existingTagIds = existingTags.Select(t => t.Id).ToHashSet();

                // Filter out invalid products/tags
                var validCombinations = validPairs
                    .Where(x => existingProductIds.Contains(x.ProductId) && existingTagIds.Contains(x.TagId))
                    .ToList();

                if (!validCombinations.Any())
                {
                    response.StatusCode = 400;
                    response.Message = "No valid product-tag combinations found.";
                    return response;
                }

                // Get already existing tagged products (to prevent duplicates)
                var existingTaggedProducts = await _unitOfWork.TaggedProductRepository.GetAll(
                    x => validCombinations.Select(v => v.ProductId).Contains(x.ProductId)
                      && validCombinations.Select(v => v.TagId).Contains(x.TagId)
                );

                var existingPairs = existingTaggedProducts
                    .Select(x => (x.ProductId, x.TagId))
                    .ToHashSet();

                // Filter out duplicates
                var newTaggedProducts = validCombinations
                    .Where(x => !existingPairs.Contains((x.ProductId, x.TagId)))
                    .Select(x => new TaggedProduct
                    {
                        ProductId = x.ProductId,
                        TagId = x.TagId
                    })
                    .ToList();

                if (!newTaggedProducts.Any())
                {
                    response.StatusCode = 409;
                    response.Message = "All tag-product pairs already exist.";
                    return response;
                }

                // Bulk add and commit once
                await _unitOfWork.TaggedProductRepository.AddRange(newTaggedProducts);
                await _unitOfWork.CompletedAsync(userId);

                // Map IDs back to DTOs
                var createdDtos = newTaggedProducts
                    .Select(tp => new TaggedProductDto
                    {
                        Id = tp.Id,
                        ProductId = tp.ProductId,
                        TagId = tp.TagId
                    })
                    .ToList();

                response.StatusCode = 201;
                response.Message = $"{createdDtos.Count} tag(s) successfully added to product(s).";
                response.Data = createdDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding tags to products.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<ServiceResponse<TaggedProductDto>> RemoveTagFromProductAsync(Guid productId, Guid tagId, Guid userId)
        {
            var response = new ServiceResponse<TaggedProductDto>();

            try
            {
                var taggedProduct = await _unitOfWork.TaggedProductRepository.Get(
                    x => x.ProductId == productId && x.TagId == tagId
                );

                if (taggedProduct == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Tag is not assigned to this product.";
                    return response;
                }

                await _unitOfWork.TaggedProductRepository.Remove(taggedProduct.Id);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Tag removed from product successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing tag from product.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<TagDto>>> GetTagsByProductAsync(Guid productId)
        {
            var response = new ServiceResponse<List<TagDto>>();

            try
            {
                var taggedProducts = await _unitOfWork.TaggedProductRepository.GetAllIncluding(
                    tp => tp.Tag!
                )
                .Where(tp => tp.ProductId == productId)
                .ToListAsync();

                var tags = taggedProducts.Select(tp => tp.Tag).Where(t => t != null).ToList();

                var tagDtos = _mapper.Map<List<TagDto>>(tags);

                response.StatusCode = 200;
                response.Message = "Product tags retrieved successfully";
                response.Data = tagDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product tags.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<ProductDto>>> GetProductsByTagAsync(Guid tagId)
        {
            var response = new ServiceResponse<List<ProductDto>>();

            try
            {
                var taggedProducts = await _unitOfWork.TaggedProductRepository.GetAllIncluding(
                    tp => tp.Product!
                )
                .Where(tp => tp.TagId == tagId)
                .ToListAsync();

                var products = taggedProducts.Select(tp => tp.Product).Where(p => p != null).ToList();

                var productDtos = _mapper.Map<List<ProductDto>>(products);

                response.StatusCode = 200;
                response.Message = "Tagged products retrieved successfully";
                response.Data = productDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tagged products.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<TagDto>>> SearchTagsAsync(string searchTerm)
        {
            var response = new ServiceResponse<List<TagDto>>();

            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    response.StatusCode = 400;
                    response.Message = "Search term is required.";
                    return response;
                }

                // Using GetAllAsync with filter
                var tags = await _unitOfWork.TagRepository.GetAllAsync(
                    filter: t => t.Name.Contains(searchTerm) ||
                                (t.Description != null && t.Description.Contains(searchTerm)),
                    orderBy: q => q.OrderBy(t => t.Name),
                    trackChanges: false
                );

                var tagDtos = _mapper.Map<List<TagDto>>(tags.Take(20).ToList()); // Limit results

                response.StatusCode = 200;
                response.Message = "Tags search completed successfully";
                response.Data = tagDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching tags.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

    }
}