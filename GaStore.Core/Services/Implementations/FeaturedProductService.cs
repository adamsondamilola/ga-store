using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Shared.Constants;
using GaStore.Shared;
using AutoMapper;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Data.Entities.Users;

namespace GaStore.Core.Services.Implementations
{
	public class FeaturedProductService : IFeaturedProductService
	{
		private readonly DatabaseContext _context;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<FeaturedProductService> _logger;

		public FeaturedProductService(DatabaseContext context, IUnitOfWork unitOfWork, IMapper mapper, ILogger<FeaturedProductService> logger)
		{
			_context = context;
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
		}

		public async Task<PaginatedServiceResponse<List<FeaturedProduct>>> GetFeaturedProductsAsync(int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<FeaturedProduct>>();

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
				var query = _context.FeaturedProducts
					.Include(fp => fp.Product) // Include Product details
					.Where(fp => fp.IsActive) // Only active featured products
					.AsQueryable();

				// Get total records count
				var totalRecords = await query.CountAsync();

				// Apply pagination
				var featuredProducts = await query
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.Select(fp => new FeaturedProduct
					{
						ProductId = fp.ProductId,
						StartDate = fp.StartDate,
						EndDate = fp.EndDate,
						Tagline = fp.Tagline,
						IsActive = fp.IsActive,
						Product = new Product // Map Product details
						{
							Id = fp.Product.Id,
							Name = fp.Product.Name,
							Description = fp.Product.Description,
							Highlights = fp.Product.Highlights,
							Weight = fp.Product.Weight,
							PrimaryColor = fp.Product.PrimaryColor,
							StockQuantity = fp.Product.StockQuantity,
							IsAvailable = fp.Product.IsAvailable,
							BrandId = fp.Product.BrandId,
							Variants = fp.Product.Variants
			.Where(v => v.ProductId == fp.Product.Id)
            .Select(v => new ProductVariant
			{
                Id = v.Id,
                Name = v.Name,
                Color = v.Color,
                Weight = v.Weight,
                Style = v.Style,
                Size = v.Size,
                ProductId = fp.Id,
                StockQuantity = v.StockQuantity,
                PricingTiers = v.PricingTiers.Select(pt => new PricingTier
                {
                    VariantId = v.Id,
                    ProductId = fp.Id,
                    PricePerUnit = pt.PricePerUnit,
                    MinQuantity = pt.MinQuantity,
                    PricePerUnitGlobal = pt.PricePerUnitGlobal
                }).ToList(),
                Images = v.Images
                .OrderByDescending(img => img.DisplayOrder)
.Select(img => new ProductImage
{
    ImageUrl = img.ImageUrl,
    AltText = $"{fp.Product.Name} product image"
}).Take(4)
        .ToList()

            })
			.OrderBy(v => v.Weight)
			.ToList()
						}
					})
					.ToListAsync();


				// Create paginated response
				response.Status = 200;
				response.Message = "Featured products retrieved successfully";
				response.Data = featuredProducts;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving featured products.");
				response.Status = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<FeaturedProduct>> GetFeaturedProductByIdAsync(Guid id)
		{
			var response = new ServiceResponse<FeaturedProduct>();

			try
			{
				// Find the featured product by ID
				var featuredProduct = await _context.FeaturedProducts
					.Include(fp => fp.Product) // Include Product details
					.FirstOrDefaultAsync(fp => fp.Id == id || fp.ProductId == id);

				if (featuredProduct == null)
				{
					response.StatusCode = 404;
					response.Message = "Featured product not found.";
					return response;
				}

				// Map to DTO
				var featuredProductDto = new FeaturedProduct
				{
					Id = featuredProduct.Id,
					ProductId = featuredProduct.ProductId,
					StartDate = featuredProduct.StartDate,
					EndDate = featuredProduct.EndDate,
					Tagline = featuredProduct.Tagline,
					IsActive = featuredProduct.IsActive,
					Product = new Product // Map Product details
					{
						Id = featuredProduct.Product.Id,
						Name = featuredProduct.Product.Name,
						Description = featuredProduct.Product.Description,
						Highlights = featuredProduct.Product.Highlights,
						Weight = featuredProduct.Product.Weight,
						PrimaryColor = featuredProduct.Product.PrimaryColor,
						StockQuantity = featuredProduct.Product.StockQuantity,
						IsAvailable = featuredProduct.Product.IsAvailable,
						BrandId = featuredProduct.Product.BrandId,
						//Images = featuredProduct.Product.Images,
						
					}
				};

				// Return success response
				response.StatusCode = 200;
				response.Message = "Featured product retrieved successfully";
				response.Data = featuredProductDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving featured product.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}
			return response;
		}

		public async Task<ServiceResponse<FeaturedProductDto>> CreateFeaturedProductAsync(FeaturedProductDto featuredProductDto, Guid userId)
		{
			var response = new ServiceResponse<FeaturedProductDto>();

			try
			{

				// Validate the DTO
				if (featuredProductDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Featured product data is required.";
					return response;
				}

				//check if product is approved
				var prod = await _unitOfWork.ProductRepository.GetById(featuredProductDto.ProductId);
				if (prod == null)
				{
                    response.StatusCode = 400;
                    response.Message = "Product not found.";
                    return response;
				}
				else
				{
					if (!prod.IsApproved)
					{
                        response.StatusCode = 400;
                        response.Message = "Product must first be approved";
                        return response;
                    }
				}

					// Map DTO to entity
					var featuredProduct = new FeaturedProduct
					{
						ProductId = featuredProductDto.ProductId,
						StartDate = featuredProductDto.StartDate,
						EndDate = featuredProductDto.EndDate,
						Tagline = featuredProductDto.Tagline,
						IsActive = featuredProductDto.IsActive
					};

				// Add to database
				await _unitOfWork.FeaturedProductRepository.Add(featuredProduct);
				await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 201;
				response.Message = "Featured product created successfully";
				response.Data = featuredProductDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating featured product.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<FeaturedProductDto>> UpdateFeaturedProductAsync(Guid id, FeaturedProductDto featuredProductDto, Guid userId)
		{
			var response = new ServiceResponse<FeaturedProductDto>();

			try
			{
				// Validate the DTO
				if (featuredProductDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Featured product data is required.";
					return response;
				}

				// Find the featured product by ID
				var featuredProduct = await _unitOfWork.FeaturedProductRepository.GetById(id);

				if (featuredProduct == null)
				{
					response.StatusCode = 404;
					response.Message = "Featured product not found.";
					return response;
				}

				// Update the featured product
				featuredProduct.ProductId = featuredProductDto.ProductId;
				featuredProduct.StartDate = featuredProductDto.StartDate;
				featuredProduct.EndDate = featuredProductDto.EndDate;
				featuredProduct.Tagline = featuredProductDto.Tagline;
				featuredProduct.IsActive = featuredProductDto.IsActive;

				await _unitOfWork.FeaturedProductRepository.Add(featuredProduct);
				await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Featured product updated successfully";
				response.Data = featuredProductDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating featured product.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<FeaturedProductDto>> DeleteFeaturedProductAsync(Guid id, Guid userId)
		{
			var response = new ServiceResponse<FeaturedProductDto>();

			try
			{
				// Find the featured product by ID
				var featuredProduct = await _unitOfWork.FeaturedProductRepository.GetById(id);

				if (featuredProduct == null)
				{
					response.StatusCode = 404;
					response.Message = "Featured product not found.";
					return response;
				}


				await _unitOfWork.FeaturedProductRepository.Remove(featuredProduct.Id);
				await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Featured product removed successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error removing featured product.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}
	}
}
