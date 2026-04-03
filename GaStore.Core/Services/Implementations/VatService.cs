using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class VatService : IVatService
	{
		private readonly DatabaseContext _context;
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<VatService> _logger;
		private readonly IMapper _mapper;

		public VatService(DatabaseContext context, IUnitOfWork unitOfWork, ILogger<VatService> logger, IMapper mapper)
		{
			_context = context;
			_unitOfWork = unitOfWork;
			_logger = logger;
			_mapper = mapper;
		}

		public async Task<ServiceResponse<VatDto>> GetByIdAsync(Guid vatId)
		{
			var response = new ServiceResponse<VatDto>();
			response.StatusCode = 400;
			response.Data = null;

			try
			{
				var vat = await _context.Vats
					.FirstOrDefaultAsync(v => v.Id == vatId);

				if (vat == null)
				{
					response.StatusCode = 404;
					response.Message = "VAT rate not found.";
					return response;
				}

				var vatDto = _mapper.Map<Vat, VatDto>(vat);

				response.StatusCode = 200;
				response.Message = "VAT details retrieved successfully";
				response.Data = vatDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving VAT rate.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<VatDto>> CreateAsync(VatDto vatDto)
		{
			var response = new ServiceResponse<VatDto>();
			response.StatusCode = 400;

			try
			{
				// Validate percentage
				if (vatDto.Percentage < 0 || vatDto.Percentage > 100)
				{
					response.Message = "VAT percentage must be between 0 and 100.";
					return response;
				}

				var existingVat = await _unitOfWork.VatRepository.Get(x => x.IsActive == true);
				if (existingVat != null)
				{
					response.StatusCode = 400;
					response.Message = "You already created VAT. Update the existing one.";
					return response;
				}

				var vat = _mapper.Map<VatDto, Vat>(vatDto);
				vat.Id = Guid.NewGuid();
				vat.DateCreated = DateTime.UtcNow;

				await _context.Vats.AddAsync(vat);
				await _context.SaveChangesAsync();

				var createdVatDto = _mapper.Map<Vat, VatDto>(vat);

				response.StatusCode = 201;
				response.Message = "VAT rate created successfully";
				response.Data = createdVatDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating VAT rate.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<VatDto>> UpdateAsync(VatDto vatDto)
		{
			var response = new ServiceResponse<VatDto>();
			response.StatusCode = 400;

			try
			{
				// Validate percentage
				if (vatDto.Percentage < 0 || vatDto.Percentage > 100)
				{
					response.Message = "VAT percentage must be between 0 and 100.";
					return response;
				}

				var existingVat = await _context.Vats.FindAsync(vatDto.Id);
				if (existingVat == null)
				{
					response.StatusCode = 404;
					response.Message = "VAT rate not found.";
					return response;
				}

				_mapper.Map(vatDto, existingVat);
				existingVat.DateUpdated = DateTime.UtcNow;

				_context.Vats.Update(existingVat);
				await _context.SaveChangesAsync();

				var updatedVatDto = _mapper.Map<Vat, VatDto>(existingVat);

				response.StatusCode = 200;
				response.Message = "VAT rate updated successfully";
				response.Data = updatedVatDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating VAT rate.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<string>> DeleteAsync(Guid vatId)
		{
			var response = new ServiceResponse<string>();

			try
			{
				var vat = await _context.Vats.FindAsync(vatId);
				if (vat == null)
				{
					response.StatusCode = 404;
					response.Message = "VAT rate not found.";
					return response;
				}

				_context.Vats.Remove(vat);
				await _context.SaveChangesAsync();

				response.StatusCode = 200;
				response.Message = "VAT rate deleted successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting VAT rate.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<PaginatedServiceResponse<List<VatDto>>> GetAllVatsAsync(
			int pageNumber = 1,
			int pageSize = 10,
			bool? isActive = null)
		{
			var response = new PaginatedServiceResponse<List<VatDto>>();

			try
			{
				// Validate page number and page size
				if (pageNumber < 1) pageNumber = 1;
				if (pageSize < 1) pageSize = 10;

				// Build the base query
				var query = _context.Vats.AsQueryable();

				// Apply filters
				if (isActive.HasValue)
				{
					query = query.Where(v => v.IsActive == isActive.Value);
				}

				// Get total number of records
				response.TotalRecords = await query.CountAsync();

				// Apply pagination
				var vats = await query
					.OrderByDescending(v => v.DateCreated)
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.ToListAsync();

				// Map to DTOs
				var vatDtos = _mapper.Map<List<Vat>, List<VatDto>>(vats);

				// Set response
				response.Status = 200;
				response.Message = "VAT rates retrieved successfully";
				response.Data = vatDtos;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving VAT rates.");
				response.Status = 500;
				response.Message = "An error occurred while retrieving VAT rates.";
			}

			return response;
		}

		public async Task<ServiceResponse<VatDto>> GetActiveVatAsync()
		{
			var response = new ServiceResponse<VatDto>();
			response.StatusCode = 400;
			response.Data = null;

			try
			{
				var activeVat = await _context.Vats
					.FirstOrDefaultAsync(v => v.IsActive);

				if (activeVat == null)
				{
					response.StatusCode = 404;
					response.Message = "No active VAT rate found.";
					return response;
				}

				var vatDto = _mapper.Map<Vat, VatDto>(activeVat);

				response.StatusCode = 200;
				response.Message = "Active VAT rate retrieved successfully";
				response.Data = vatDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving active VAT rate.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}
	}
}