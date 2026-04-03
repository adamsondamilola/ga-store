using AutoMapper;
using DocumentFormat.OpenXml.Drawing.Charts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;
using static Org.BouncyCastle.Asn1.Cmp.Challenge;

namespace GaStore.Core.Services.Implementations
{
	public class ProductVariantService : IProductVariantService
	{
		private readonly DatabaseContext _context;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<ProductVariantService> _logger;

		public ProductVariantService(DatabaseContext context, IUnitOfWork unitOfWork, IMapper mapper, ILogger<ProductVariantService> logger)
		{
			_context = context;
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
		}

		public async Task<PaginatedServiceResponse<List<ProductVariantDto>>> GetProductVariantsAsync(Guid productId, int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<ProductVariantDto>>();

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
				var query = _context.ProductVariants
					.Where(pv => pv.ProductId == productId)
					.AsQueryable();

				// Get total records count
				var totalRecords = await query.CountAsync();

				// Apply pagination
				var productVariants = await query
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.Select(pv => new ProductVariantDto
					{
						ProductId = pv.ProductId,
						Name = pv.Name,
						Color = pv.Color,
						Size = pv.Size,
						Style = pv.Style,
						SellerSKU = pv.SellerSKU,
						BarCode = pv.BarCode,
						StockQuantity = pv.StockQuantity,
						SaleStartDate = pv.SaleStartDate,
						SaleEndDate = pv.SaleEndDate
					})
					.ToListAsync();

				// Create paginated response
				response.Status = 200;
				response.Message = "Product variants retrieved successfully";
				response.Data = productVariants;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving product variants.");
				response.Status = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductVariantDto>> GetProductVariantByIdAsync(Guid id)
		{
			var response = new ServiceResponse<ProductVariantDto>();

			try
			{
				// Find the product variant by ID
				var productVariant = await _context.ProductVariants.FindAsync(id);

				if (productVariant == null)
				{
					response.StatusCode = 404;
					response.Message = "Product variant not found.";
					return response;
				}

				// Map to DTO
				var productVariantDto = _mapper.Map<ProductVariant, ProductVariantDto>(productVariant);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Product variant retrieved successfully";
				response.Data = productVariantDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving product variant.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<List<ProductVariantDto>>> GetProductVariantByProductIdAsync(Guid ProductId)
		{
			var response = new ServiceResponse<List<ProductVariantDto>>();

			try
			{
				// Find the product variant by product ID
				var productVariant = await _unitOfWork.ProductVariantRepository.GetAll(p => p.ProductId == ProductId);

				if (productVariant == null)
				{
					response.StatusCode = 404;
					response.Message = "Product variant not found.";
					return response;
				}

				// Map to DTO
				var productVariantDto = _mapper.Map<List<ProductVariant>, List<ProductVariantDto>>(productVariant);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Product variant retrieved successfully";
				response.Data = productVariantDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving product variant.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductVariantDto>> CreateProductVariantAsync(ProductVariantDto productVariantDto, Guid UserId)
		{
			var response = new ServiceResponse<ProductVariantDto>();

			try
			{
				// Validate the DTO
				if (productVariantDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Product variant data is required.";
					return response;
				}

				//check if product variant exists
				var vari = await _unitOfWork.ProductVariantRepository.Get(x => x.Id == productVariantDto.Id);
				if (vari != null)
				{
					// Update all properties from the DTO
					vari.ProductId = productVariantDto.ProductId;
					vari.Name = productVariantDto.Name;
					vari.Color = productVariantDto.Color;
					vari.Size = productVariantDto.Size;
					vari.Style = productVariantDto.Style;
                    vari.Weight = productVariantDto.Weight;
                    vari.SellerSKU = productVariantDto.SellerSKU;
					vari.BarCode = productVariantDto.BarCode;
					vari.StockQuantity = productVariantDto.StockQuantity;
					vari.SaleStartDate = productVariantDto.SaleStartDate;
					vari.SaleEndDate = productVariantDto.SaleEndDate;

					// Update database
					await _unitOfWork.ProductVariantRepository.Upsert(vari);
					await _unitOfWork.CompletedAsync(UserId);

					response.StatusCode = 200;
					response.Message = "Product variant updated successfully";
					response.Data = productVariantDto;
					return response;
				}

				// Map DTO to entity
				var productVariant = new ProductVariant
				{
					Id = Guid.NewGuid(),
					ProductId = productVariantDto.ProductId,
                    Name = productVariantDto.Name,
                    Color = productVariantDto.Color,
					Size = productVariantDto.Size,
					Style = productVariantDto.Style,
                    SellerSKU = productVariantDto.SellerSKU,
                    Weight = productVariantDto.Weight,
                    BarCode = productVariantDto.BarCode,
					StockQuantity = productVariantDto.StockQuantity,
					SaleStartDate = productVariantDto.SaleStartDate,
					SaleEndDate = productVariantDto.SaleEndDate
				};

				// Add to database
				//_context.ProductVariants.Add(productVariant);
				//await _context.SaveChangesAsync();
				await _unitOfWork.ProductVariantRepository.Add(productVariant);
				//await _unitOfWork.CompletedAsync(UserId);

				var pVDto = _mapper.Map<ProductVariant, ProductVariantDto>(productVariant);
				// Return success response
				response.StatusCode = 201;
				response.Message = "Product variant created successfully";
				response.Data = pVDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating product variant.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductVariantDto>> UpdateProductVariantAsync(Guid id, ProductVariantDto productVariantDto, Guid UserId)
		{
			var response = new ServiceResponse<ProductVariantDto>();

			try
			{
				// Validate the DTO
				if (productVariantDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Product variant data is required.";
					return response;
				}

				// Find the product variant by ID
				//var productVariant = await _context.ProductVariants.FindAsync(id);
				var productVariant = await _unitOfWork.ProductVariantRepository.GetById(id);

				if (productVariant == null)
				{
					response.StatusCode = 404;
					response.Message = "Product variant not found.";
					return response;
				}

				// Update the product variant
				productVariant.Name = productVariantDto.Name;
				productVariant.Color = productVariantDto.Color;
				productVariant.Size = productVariantDto.Size;
				productVariant.Style = productVariantDto.Style;
				productVariant.SellerSKU = productVariantDto.SellerSKU;
				productVariant.Weight = productVariantDto.Weight;
				productVariant.BarCode = productVariantDto.BarCode;
				productVariant.StockQuantity = productVariantDto.StockQuantity;
				productVariant.SaleStartDate = productVariantDto.SaleStartDate;
				productVariant.SaleEndDate = productVariantDto.SaleEndDate;

				//_context.Entry(productVariant).State = EntityState.Modified;
				//await _context.SaveChangesAsync();
				await _unitOfWork.ProductVariantRepository.Upsert(productVariant);
				await _unitOfWork.CompletedAsync(UserId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Product variant updated successfully";
				response.Data = productVariantDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating product variant.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductVariantDto>> DeleteProductVariantAsync(Guid id, Guid UserId)
		{
			var response = new ServiceResponse<ProductVariantDto>();

			try
			{
				// Find the product variant by ID
				var productVariant = await _unitOfWork.ProductVariantRepository.GetById(id);

				if (productVariant == null)
				{
					response.StatusCode = 404;
					response.Message = "Product variant not found.";
					return response;
				}

				//remove price tier and images associated with variant
				var prices = await _unitOfWork.PricingTierRepository.GetAll(x => x.VariantId == productVariant.Id);
				if(prices.Count > 0)
				{
					foreach(var pr in prices)
					{
						await _unitOfWork.PricingTierRepository.Remove(pr.Id);
					}
				}
                var images = await _unitOfWork.ProductImageRepository.GetAll(x => x.VariantId == productVariant.Id);
                if (images.Count > 0)
                {
                    foreach (var im in images)
                    {
                        await _unitOfWork.ProductImageRepository.Remove(im.Id);
                    }
                }

                await _unitOfWork.ProductVariantRepository.Remove(productVariant.Id);

				await _unitOfWork.CompletedAsync(UserId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Product variant deleted successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting product variant.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}
	}
}
