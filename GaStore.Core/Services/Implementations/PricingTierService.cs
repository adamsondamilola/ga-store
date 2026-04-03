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
	public class PricingTierService : IPricingTierService
	{
		private readonly DatabaseContext _context;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<ProductVariantService> _logger;

		public PricingTierService(DatabaseContext context, IUnitOfWork unitOfWork, IMapper mapper, ILogger<ProductVariantService> logger)
		{
			_context = context;
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
		}

		public async Task<PaginatedServiceResponse<List<PricingTierDto>>> GetPricingTiersAsync(Guid productId, int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<PricingTierDto>>();

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
				var query = _context.PricingTiers
					.Where(pt => pt.ProductId == productId)
					.AsQueryable();

				// Get total records count
				var totalRecords = await query.CountAsync();

				// Apply pagination
				var pricingTiers = await query
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.Select(pt => new PricingTierDto
					{
						ProductId = pt.ProductId,
						VariantId = pt.VariantId,
						MinQuantity = pt.MinQuantity,
						PricePerUnitGlobal = pt.PricePerUnitGlobal,
						PricePerUnit = pt.PricePerUnit
					})
					.ToListAsync();

				// Create paginated response
				response.Status = 200;
				response.Message = "Pricing tiers retrieved successfully";
				response.Data = pricingTiers;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving pricing tiers.");
				response.Status = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<PricingTierDto>> GetPricingTierByIdAsync(Guid id)
		{
			var response = new ServiceResponse<PricingTierDto>();

			try
			{
				// Find the pricing tier by ID
				var pricingTier = await _context.PricingTiers.FindAsync(id);

				if (pricingTier == null)
				{
					response.StatusCode = 404;
					response.Message = "Pricing tier not found.";
					return response;
				}

				// Map to DTO
				var pricingTierDto = new PricingTierDto
				{
					ProductId = pricingTier.ProductId,
					VariantId = pricingTier.VariantId,
					MinQuantity = pricingTier.MinQuantity,
					PricePerUnitGlobal = pricingTier.PricePerUnitGlobal,
					PricePerUnit = pricingTier.PricePerUnit
				};

				// Return success response
				response.StatusCode = 200;
				response.Message = "Pricing tier retrieved successfully";
				response.Data = pricingTierDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving pricing tier.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<PricingTierDto>> GetPricingTierByVariantIdAsync(Guid id)
		{
			var response = new ServiceResponse<PricingTierDto>();

			try
			{
				// Find the pricing tier by ID
				var pricingTier = await _unitOfWork.PricingTierRepository.Get(pr => pr.VariantId == id);

				if (pricingTier == null)
				{
					response.StatusCode = 404;
					response.Message = "Pricing tier not found.";
					return response;
				}

				// Map to DTO
				var pricingTierDto = new PricingTierDto
				{
					ProductId = pricingTier.ProductId,
					VariantId = pricingTier.VariantId,
					MinQuantity = pricingTier.MinQuantity,
					PricePerUnitGlobal = pricingTier.PricePerUnitGlobal,
					PricePerUnit = pricingTier.PricePerUnit
				};

				// Return success response
				response.StatusCode = 200;
				response.Message = "Pricing tier retrieved successfully";
				response.Data = pricingTierDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving pricing tier.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<PricingTierDto>> CreatePricingTierAsync(PricingTierDto pricingTierDto, Guid userId)
		{
			var response = new ServiceResponse<PricingTierDto>();

			try
			{
				// Validate the DTO
				if (pricingTierDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Pricing tier data is required.";
					return response;
				}

                
                //check if variant price tire exists
                var pricing = await _unitOfWork.PricingTierRepository.Get(x => x.VariantId == pricingTierDto.VariantId && x.ProductId == pricingTierDto.ProductId && x.MinQuantity == pricingTierDto.MinQuantity);
				if (pricing != null)
				{
					// Update all properties from the DTO
					pricing.ProductId = pricingTierDto.ProductId;
					pricing.VariantId = pricingTierDto.VariantId;
					pricing.MinQuantity = pricingTierDto.MinQuantity;
					pricing.PricePerUnitGlobal = pricingTierDto.PricePerUnitGlobal;
					pricing.PricePerUnit = pricingTierDto.PricePerUnit;

                        // Update database
                        await _unitOfWork.PricingTierRepository.Upsert(pricing);
					//await _unitOfWork.CompletedAsync(userId);

					response.StatusCode = 200;
					response.Message = "Pricing tier updated successfully";
					response.Data = pricingTierDto;
					return response;
				}

				// Map DTO to entity
				var pricingTier = new PricingTier
				{
					Id = Guid.NewGuid(),
					ProductId = pricingTierDto.ProductId,
					VariantId = pricingTierDto.VariantId,
					MinQuantity = pricingTierDto.MinQuantity,
					PricePerUnitGlobal = pricingTierDto.PricePerUnitGlobal,
					PricePerUnit = pricingTierDto.PricePerUnit
				};

				
				// Add to database
				await _unitOfWork.PricingTierRepository.Add(pricingTier);
				//await _unitOfWork.CompletedAsync(userId);

				var pTDto = _mapper.Map<PricingTier, PricingTierDto>(pricingTier);
				// Return success response
				response.StatusCode = 201;
				response.Message = "Pricing tier created successfully";
				response.Data = pTDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating pricing tier.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<PricingTierDto>> UpdatePricingTierAsync(Guid id, PricingTierDto pricingTierDto, Guid userId)
		{
			var response = new ServiceResponse<PricingTierDto>();

			try
			{
				// Validate the DTO
				if (pricingTierDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Pricing tier data is required.";
					return response;
				}

				// Find the pricing tier by ID
				var pricingTier = await _unitOfWork.PricingTierRepository.GetById(id);

				if (pricingTier == null)
				{
					response.StatusCode = 404;
					response.Message = "Pricing tier not found.";
					return response;
				}

				// Update the pricing tier
				pricingTier.ProductId = pricingTierDto.ProductId;
				pricingTier.VariantId = pricingTierDto.VariantId;
				pricingTier.MinQuantity = pricingTierDto.MinQuantity;
				pricingTier.PricePerUnitGlobal = pricingTierDto.PricePerUnitGlobal;
				pricingTier.PricePerUnit = pricingTierDto.PricePerUnit;

				await _unitOfWork.PricingTierRepository.Upsert(pricingTier);
				await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Pricing tier updated successfully";
				response.Data = pricingTierDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating pricing tier.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<PricingTierDto>> DeletePricingTierAsync(Guid id, Guid userId)
		{
			var response = new ServiceResponse<PricingTierDto>();

			try
			{
				// Find the pricing tier by ID
				var pricingTier = await _unitOfWork.PricingTierRepository.GetById(id);

				if (pricingTier == null)
				{
					response.StatusCode = 404;
					response.Message = "Pricing tier not found.";
					return response;
				}

				// Soft delete (set IsActive to false)
				await _unitOfWork.PricingTierRepository.Remove(pricingTier.Id);
				await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Pricing tier deleted successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting pricing tier.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}
	}
}
