using Microsoft.EntityFrameworkCore;
using GaStore.Core.Services.Interfaces;
using GaStore.Data;
using GaStore.Shared;
using GaStore.Data.Entities.Referrals;
using AutoMapper;
using Microsoft.Extensions.Logging;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Data.Dtos.ReferralDto;

namespace GaStore.Core.Services.Implementations
{
	public class ReferralCommissionService : IReferralCommissionService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<ReferralCommissionService> _logger;
		private readonly DatabaseContext _context;

		public ReferralCommissionService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<ReferralCommissionService> logger, DatabaseContext context)
		{
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
			_context = context;
		}

		public async Task<PaginatedServiceResponse<List<ReferralCommissionDto>>> GetPaginatedCommissionsAsync(int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<ReferralCommissionDto>>();

			try
			{
				var query = _context.ReferralCommissions.AsQueryable();
				int totalRecords = await query.CountAsync();

				var commissions = await query
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.Select(rc => new ReferralCommissionDto
					{
						Id = rc.Id,
						Percentage = rc.Percentage,
						MinAmount = rc.MinAmount,
						MaxAmount = rc.MaxAmount,
						IsDefault = rc.IsDefault
					})
					.ToListAsync();

				response.Status = 200;
				response.Message = "Referral commissions retrieved successfully.";
				response.Data = commissions;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error fetching referral commissions: {ex.Message}");
				response.Status = 500;
				response.Message = "An error occurred while retrieving referral commissions.";
			}

			return response;
		}

		public async Task<ServiceResponse<ReferralCommissionDto>> GetCommissionByIdAsync(Guid commissionId)
		{
			var response = new ServiceResponse<ReferralCommissionDto>();

			var commission = await _context.ReferralCommissions.FindAsync(commissionId);
			if (commission == null)
			{
				response.StatusCode = 404;
				response.Message = "Referral commission not found.";
				return response;
			}

			response.StatusCode = 200;
			response.Message = "Referral commission retrieved successfully.";
			response.Data = _mapper.Map<ReferralCommissionDto>(commission);

			return response;
		}

        public async Task<ServiceResponse<ReferralCommissionDto>> CreateCommissionAsync(ReferralCommissionDto commissionDto, Guid userId)
        {
            var response = new ServiceResponse<ReferralCommissionDto>();

            try
            {
                // Validate input
                if (commissionDto == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Commission data cannot be null";
                    return response;
                }

                // Business rule validation
                if (commissionDto.Percentage < 0 || commissionDto.Percentage > 100)
                {
                    response.StatusCode = 400;
                    response.Message = "Percentage must be between 0 and 100";
                    return response;
                }

                if (commissionDto.MinAmount < 0)
                {
                    response.StatusCode = 400;
                    response.Message = "Minimum amount cannot be negative";
                    return response;
                }

                if (commissionDto.MaxAmount < commissionDto.MinAmount)
                {
                    response.StatusCode = 400;
                    response.Message = "Maximum amount must be greater than minimum amount";
                    return response;
                }

                // Check for existing default commission if this is being set as default
                if (commissionDto.IsDefault)
                {
                    var existingDefault = await _unitOfWork.ReferralCommissionRepository
                        .Get(rc => rc.IsDefault);

                    if (existingDefault != null)
                    {
                        // Option 1: Prevent creation if default exists
                        response.StatusCode = 400;
                        response.Message = "A default commission already exists";
                        return response;

                        // Option 2: Automatically unset the previous default
                        // existingDefault.IsDefault = false;
                        // await _unitOfWork.ReferralCommissionRepository.Update(existingDefault);
                    }
                }

                // Map and create new commission
                var newCommission = _mapper.Map<ReferralCommission>(commissionDto);
                newCommission.CreatedBy = userId;
                newCommission.DateCreated = DateTime.UtcNow;

                await _unitOfWork.ReferralCommissionRepository.Add(newCommission);
                await _unitOfWork.CompletedAsync(userId);

                // Return the created commission (with any server-set values)
                var createdDto = _mapper.Map<ReferralCommissionDto>(newCommission);

                response.StatusCode = 201;
                response.Message = "Referral commission created successfully";
                response.Data = createdDto;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating referral commission");
                response.StatusCode = 500;
                response.Message = "Failed to save commission due to database error";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating referral commission");
                response.StatusCode = 500;
                response.Message = "An unexpected error occurred";
            }

            return response;
        }

        public async Task<ServiceResponse<ReferralCommissionDto>> UpdateCommissionAsync(Guid commissionId, ReferralCommissionDto commissionDto, Guid userId)
		{
			var response = new ServiceResponse<ReferralCommissionDto>();

			var commission = await _unitOfWork.ReferralCommissionRepository.GetById(commissionId);
			if (commission == null)
			{
				response.StatusCode = 404;
				response.Message = "Referral commission not found.";
				return response;
			}

			commission.Percentage = commissionDto.Percentage;
			commission.MinAmount = commissionDto.MinAmount;
			commission.MaxAmount = commissionDto.MaxAmount;
			commission.IsDefault = commissionDto.IsDefault;

			await _unitOfWork.ReferralCommissionRepository.Upsert(commission);
			await _unitOfWork.CompletedAsync(userId);

			response.StatusCode = 200;
			response.Message = "Referral commission updated successfully.";
			response.Data = _mapper.Map<ReferralCommissionDto>(commission);

			return response;
		}

		public async Task<ServiceResponse<bool>> DeleteCommissionAsync(Guid commissionId, Guid userId)
		{
			var response = new ServiceResponse<bool>();

			var commission = await _unitOfWork.ReferralCommissionRepository.GetById(commissionId);
			if (commission == null)
			{
				response.StatusCode = 404;
				response.Message = "Referral commission not found.";
				response.Data = false;
				return response;
			}

			await _unitOfWork.ReferralCommissionRepository.Remove(commission.Id);
			await _unitOfWork.CompletedAsync(userId);

			response.StatusCode = 200;
			response.Message = "Referral commission deleted successfully.";
			response.Data = true;

			return response;
		}
	}
}
