using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Shared.Constants;
using GaStore.Shared;
using AutoMapper;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;

namespace GaStore.Core.Services.Implementations
{
	public class ProductSpecificationService : IProductSpecificationService
	{
		private readonly DatabaseContext _context;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<ProductVariantService> _logger;

		public ProductSpecificationService(DatabaseContext context, IUnitOfWork unitOfWork, IMapper mapper, ILogger<ProductVariantService> logger)
		{
			_context = context;
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
		}
		public async Task<PaginatedServiceResponse<List<ProductSpecificationDto>>> GetProductSpecificationsAsync(Guid productId, int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<ProductSpecificationDto>>();

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
				var query = _context.ProductSpecifications
					.Where(ps => ps.ProductId == productId)
					.AsQueryable();

				// Get total records count
				var totalRecords = await query.CountAsync();

				// Apply pagination
				var productSpecifications = await query
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.Select(ps => new ProductSpecificationDto
					{
						ProductId = ps.ProductId,
						Certification = ps.Certification,
						MainMaterial = ps.MainMaterial,
						MaterialFamily = ps.MaterialFamily,
						Model = ps.Model,
						Note = ps.Note,
						ProductionCountry = ps.ProductionCountry,
						ProductLine = ps.ProductLine,
						Size = ps.Size,
						WarrantyDuration = ps.WarrantyDuration,
						WarrantyType = ps.WarrantyType,
						YouTubeId = ps.YouTubeId,
                        Nafdac = ps.Nafdac,
                        Fda = ps.Fda,
                        FdaApproved = ps.FdaApproved,
						Disclaimer = ps.Disclaimer,
                        FromTheManufacturer = ps.FromTheManufacturer,
						WhatIsInTheBox = ps.WhatIsInTheBox,
						ProductWarranty = ps.ProductWarranty,
						WarrantyAddress = ps.WarrantyAddress
					})
					.ToListAsync();

				// Create paginated response
				response.Status = 200;
				response.Message = "Product specifications retrieved successfully";
				response.Data = productSpecifications;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving product specifications.");
				response.Status = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductSpecificationDto>> GetProductSpecificationByIdAsync(Guid id)
		{
			var response = new ServiceResponse<ProductSpecificationDto>();

			try
			{
				// Find the product specification by ID
				var productSpecification = await _context.ProductSpecifications.FindAsync(id);

				if (productSpecification == null)
				{
					response.StatusCode = 404;
					response.Message = "Product specification not found.";
					return response;
				}

				// Map to DTO
				var productSpecificationDto = _mapper.Map<ProductSpecification, ProductSpecificationDto>(productSpecification);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Product specification retrieved successfully";
				response.Data = productSpecificationDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving product specification.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductSpecificationDto>> CreateProductSpecificationAsync(ProductSpecificationDto productSpecificationDto, Guid userId)
		{
			var response = new ServiceResponse<ProductSpecificationDto>();

			try
			{
				// Validate the DTO
				if (productSpecificationDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Product specification data is required.";
					return response;
				}

				var productSpecification = _mapper.Map<ProductSpecificationDto, ProductSpecification>(productSpecificationDto);

				//if product exists
				//if product exists
				var spec = await _unitOfWork.ProductSpecificationRepository.Get(x => x.ProductId == productSpecificationDto.ProductId);
				if (spec != null)
				{
					spec.Certification = productSpecificationDto.Certification;
					spec.MainMaterial = productSpecificationDto.MainMaterial;
					spec.MaterialFamily = productSpecificationDto.MaterialFamily;
					spec.Model = productSpecificationDto.Model;
					spec.Note = productSpecificationDto.Note;
					spec.ProductionCountry = productSpecificationDto.ProductionCountry;
					spec.ProductLine = productSpecificationDto.ProductLine;
					spec.Size = productSpecificationDto.Size;
					spec.WarrantyDuration = productSpecificationDto.WarrantyDuration;
					spec.WarrantyType = productSpecificationDto.WarrantyType;
					spec.YouTubeId = productSpecificationDto.YouTubeId;
                    spec.Nafdac = productSpecificationDto.Nafdac;
                    spec.Fda = productSpecificationDto.Fda;
                    spec.FdaApproved = productSpecificationDto.FdaApproved;
					spec.Disclaimer = productSpecificationDto.Disclaimer;
                    spec.FromTheManufacturer = productSpecificationDto.FromTheManufacturer;
					spec.WhatIsInTheBox = productSpecificationDto.WhatIsInTheBox;
					spec.ProductWarranty = productSpecificationDto.ProductWarranty;
					spec.WarrantyAddress = productSpecificationDto.WarrantyAddress;

					// Update database
					await _unitOfWork.ProductSpecificationRepository.Upsert(spec);
					await _unitOfWork.CompletedAsync(userId);

					response.StatusCode = 200;
					response.Message = "Product specification updated successfully";
					response.Data = productSpecificationDto;
					return response;
				}

				// Add to database
				await _unitOfWork.ProductSpecificationRepository.Add(productSpecification);
				//await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 201;
				response.Message = "Product specification created successfully";
				response.Data = productSpecificationDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating product specification.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductSpecificationDto>> UpdateProductSpecificationAsync(Guid id, ProductSpecificationDto productSpecificationDto, Guid userId)
		{
			var response = new ServiceResponse<ProductSpecificationDto>();

			try
			{
				// Validate the DTO
				if (productSpecificationDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Product specification data is required.";
					return response;
				}

				// Find the product specification by ID
				var productSpecification = await _unitOfWork.ProductSpecificationRepository.GetById(id);

				if (productSpecification == null)
				{
					response.StatusCode = 404;
					response.Message = "Product specification not found.";
					return response;
				}

				
				// Update the product specification
				productSpecification.ProductId = productSpecificationDto.ProductId;
				productSpecification.Certification = productSpecificationDto.Certification;
				productSpecification.MainMaterial = productSpecificationDto.MainMaterial;
				productSpecification.MaterialFamily = productSpecificationDto.MaterialFamily;
				productSpecification.Model = productSpecificationDto.Model;
				productSpecification.Note = productSpecificationDto.Note;
				productSpecification.ProductionCountry = productSpecificationDto.ProductionCountry;
				productSpecification.ProductLine = productSpecificationDto.ProductLine;
				productSpecification.Size = productSpecificationDto.Size;
				productSpecification.WarrantyDuration = productSpecificationDto.WarrantyDuration;
				productSpecification.WarrantyType = productSpecificationDto.WarrantyType;
				productSpecification.YouTubeId = productSpecificationDto.YouTubeId;
                productSpecification.Nafdac = productSpecificationDto.Nafdac;
                productSpecification.Fda = productSpecificationDto.Fda;
                productSpecification.FdaApproved = productSpecificationDto.FdaApproved;
				productSpecification.Disclaimer = productSpecificationDto.Disclaimer;
                productSpecification.FromTheManufacturer = productSpecificationDto.FromTheManufacturer;
				productSpecification.WhatIsInTheBox = productSpecificationDto.WhatIsInTheBox;
				productSpecification.ProductWarranty = productSpecificationDto.ProductWarranty;
				productSpecification.WarrantyAddress = productSpecificationDto.WarrantyAddress;

				await _unitOfWork.ProductSpecificationRepository.Upsert(productSpecification);
				await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Product specification updated successfully";
				response.Data = productSpecificationDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating product specification.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductSpecificationDto>> DeleteProductSpecificationAsync(Guid id, Guid userId)
		{
			var response = new ServiceResponse<ProductSpecificationDto>();

			try
			{
				// Find the product specification by ID
				var productSpecification = await _unitOfWork.ProductSpecificationRepository.GetById(id);

				if (productSpecification == null)
				{
					response.StatusCode = 404;
					response.Message = "Product specification not found.";
					return response;
				}

				await _unitOfWork.ProductSpecificationRepository.Remove(productSpecification.Id);
				await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Product specification deleted successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting product specification.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}
	}

}
