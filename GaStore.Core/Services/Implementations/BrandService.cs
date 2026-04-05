using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class BrandService : IBrandService
	{
		private readonly DatabaseContext _context;
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<UserService> _logger;
		private readonly IMapper _mapper;

		public BrandService(DatabaseContext context, IUnitOfWork unitOfWork, ILogger<UserService> logger, IMapper mapper)
		{
			_context = context;
			_unitOfWork = unitOfWork;
			_logger = logger;
			_mapper = mapper;
		}

		public async Task<PaginatedServiceResponse<List<Brand>>> GetBrandsAsync(string? searchTerm, int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<Brand>>();
			response.Status = 400;
			try
			{
				var query = _unitOfWork.BrandRepository;
				var query_ = new List<Brand>();


				// Apply search filter
				if (!string.IsNullOrEmpty(searchTerm))
				{
					query_ = await query.GetOffsetAndLimitAsync(b => b.Name.Contains(searchTerm) || b.Code.Contains(searchTerm), pageNumber, pageSize);
				}
				else
				{
					query_ = await query.GetOffsetAndLimitAsync(x => x.Name != null, pageNumber, pageSize);
				}

				// Get total records count
                var totalRecords = _unitOfWork.BrandRepository.GetAll().Result.Count();

                // Apply pagination
                var brands = query_;

				// Create paginated response
				var response_ = new PaginatedServiceResponse<List<Brand>>
				{
					Status = 200,
					Message = "Brands retrieved successfully",
					Data = brands,
					PageNumber = pageNumber,
					PageSize = pageSize,
					TotalRecords = totalRecords
				};

				return response_;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving brands.");
				response.Status = 500; // Internal Server Error
				response.Message = ErrorMessages.InternalServerError;
			}
			return response;

		}

		public async Task<ServiceResponse<Brand>> GetBrandByIdAsync(Guid Id)
		{
			try
			{
				var brand = await _unitOfWork.BrandRepository.GetById(Id);

				if (brand == null)
				{
					return new ServiceResponse<Brand>
					{
						StatusCode = 404,
						Message = "Brand not found"
					};
				}

				return new ServiceResponse<Brand>
				{
					StatusCode = 200,
					Message = "Brand retrieved successfully",
					Data = brand
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving brand.");
				return new ServiceResponse<Brand>
				{
					StatusCode = 500,
					Message = ErrorMessages.InternalServerError
				};
			}
		}

		public async Task<ServiceResponse<Brand>> CreateBrandAsync(BrandDto brand)
		{
			var response = new ServiceResponse<Brand>();

			try
			{
				// Validate the brand object
				if (brand == null)
				{
					response.StatusCode = 400;
					response.Message = "Brand data is required.";
					return response;
				}

				// Find the category by ID
				var brand_check = await _unitOfWork.BrandRepository.Get(x => x.Name == brand.Name || x.Code == brand.Code);

				if (brand_check != null)
				{
					response.StatusCode = 400;
					response.Message = "Brand name or code already exists.";
					return response;
				}

				var brand_ = _mapper.Map<BrandDto, Brand>(brand);
				// Add the brand to the database
				_context.Brands.Add(brand_);
				await _context.SaveChangesAsync();

				// Return success response
				response.StatusCode = 200;
				response.Message = "Brand created successfully";
				response.Data = brand_;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating brand.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<Brand>> UpdateBrandAsync(Guid Id, BrandDto brand)
		{
			var response = new ServiceResponse<Brand>();

			try
			{

				// Check if the brand exists
				var existingBrand = await _context.Brands.FindAsync(Id);
				if (existingBrand == null)
				{
					response.StatusCode = 404;
					response.Message = "Brand not found.";
					return response;
				}

                //check duplicate name or code
                var brand_check = await _unitOfWork.BrandRepository.Get(x => (x.Name == brand.Name || x.Code == brand.Code) && x.Id != Id);
                if (brand_check != null)
                {
                    response.StatusCode = 400;
                    response.Message = "Brand name or code already exists.";
                    return response;
                }

                // Update the brand
                _context.Entry(existingBrand).CurrentValues.SetValues(brand);
				await _context.SaveChangesAsync();

				// Return success response
				response.StatusCode = 200;
				response.Message = "Brand updated successfully";
				response.Data = existingBrand;
			}
			catch (DbUpdateConcurrencyException ex)
			{
				_logger.LogError(ex, "Concurrency error updating brand.");
				response.StatusCode = 409;
				response.Message = "A concurrency error occurred while updating the brand.";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating brand.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<Brand>> DeleteBrandAsync(Guid Id)
		{
			var response = new ServiceResponse<Brand>();

			try
			{
				// Find the brand by ID
				var brand = await _context.Brands.FindAsync(Id);
				if (brand == null)
				{
					response.StatusCode = 404;
					response.Message = "Brand not found.";
					return response;
				}

				// Delete the brand
				_context.Brands.Remove(brand);
				await _context.SaveChangesAsync();

				// Return success response
				response.StatusCode = 200;
				response.Message = "Brand deleted successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting brand.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

	}

}
