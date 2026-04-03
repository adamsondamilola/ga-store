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
using GaStore.Data.Dtos.UsersDto;

namespace GaStore.Core.Services.Implementations
{
	public class ReferralService : IReferralService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<ReferralService> _logger;
		private readonly DatabaseContext _context;

		public ReferralService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<ReferralService> logger, DatabaseContext context)
		{
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
			_context = context;
		}

        public async Task<PaginatedServiceResponse<List<ReferralDto>>> GetPaginatedReferralsAsync(
    Guid? referrerId, Guid? referralId, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<ReferralDto>>();

            try
            {
                var query = _context.Referrals
                    .Include(r => r.Referrer)  // Include the Referrer navigation property
                    .Include(r => r.Referra)   // Include the Referral navigation property
					.Include(r => r.Purchases)
                    .AsQueryable();

                if (referrerId.HasValue)
                    query = query.Where(r => r.ReferrerId == referrerId);

                if (referralId.HasValue)
                    query = query.Where(r => r.ReferralId == referralId);

                int totalRecords = await query.CountAsync();

                var referrals = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(r => new ReferralDto
                    {
                        ReferrerId = r.ReferrerId,
                        ReferralId = r.ReferralId,
                        PurchasesDto = r.Purchases
                    .Select(p => new ReferralPurchaseDto
                    {
                        ReferralId = p.ReferralId,
                        OrderId = p.OrderId,
                        CommissionAmount = p.CommissionAmount
                    })
                    .ToList(),
                        ReferralUserDto = new UserDto
                        {
                            Id = r.Referra.Id,
                            FirstName = r.Referra.FirstName,
                            LastName = r.Referra.LastName,
                            //Email = r.Referra.Email,
							
                            Username = r.Referra.Username,
                            DateCreated = r.DateCreated.ToString()
                        },
                        ReferraDto = new UserDto
                        {
                            Id = r.Referrer.Id,
                            FirstName = r.Referrer.FirstName,
                            LastName = r.Referrer.LastName,
                            //Email = r.Referrer.Email,
                            Username = r.Referrer.Username,
                            DateCreated = r.DateCreated.ToString()

                        },
                        TotalCommissionEarned = r.TotalCommissionEarned
                    })
                    .ToListAsync();

                response.Status = 200;
                response.Message = "Referrals retrieved successfully.";
                response.Data = referrals;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching referrals: {ex.Message}");
                response.Status = 500;
                response.Message = "An error occurred while retrieving referrals.";
            }

            return response;
        }

        public async Task<ServiceResponse<ReferralDto>> GetReferralByIdAsync(Guid referralId)
		{
			var response = new ServiceResponse<ReferralDto>();

			var referral = await _context.Referrals.FindAsync(referralId);
			if (referral == null)
			{
				response.StatusCode = 404;
				response.Message = "Referral not found.";
				return response;
			}

			response.StatusCode = 200;
			response.Message = "Referral retrieved successfully.";
			response.Data = _mapper.Map<ReferralDto>(referral);

			return response;
		}

		public async Task<ServiceResponse<ReferralDto>> CreateReferralAsync(ReferralDto referralDto)
		{
			var response = new ServiceResponse<ReferralDto>();

			var newReferral = _mapper.Map<Referral>(referralDto);

			await _unitOfWork.ReferralRepository.Add(newReferral);
			await _unitOfWork.CompletedAsync(referralDto.ReferrerId);

			response.StatusCode = 201;
			response.Message = "Referral created successfully.";
			response.Data = referralDto;

			return response;
		}

		public async Task<ServiceResponse<ReferralDto>> UpdateReferralAsync(Guid id, ReferralDto referralDto)
		{
			var response = new ServiceResponse<ReferralDto>();

			var referral = await _context.Referrals.FindAsync(id);
			if (referral == null)
			{
				response.StatusCode = 404;
				response.Message = "Referral not found.";
				return response;
			}

			referral.TotalCommissionEarned = referralDto.TotalCommissionEarned;

			await _unitOfWork.ReferralRepository.Upsert(referral);
			await _unitOfWork.CompletedAsync(referralDto.ReferrerId);

			response.StatusCode = 200;
			response.Message = "Referral updated successfully.";
			response.Data = referralDto;

			return response;
		}

		public async Task<ServiceResponse<bool>> DeleteReferralAsync(Guid referralId)
		{
			var response = new ServiceResponse<bool>();

			var referral = await _unitOfWork.ReferralRepository.GetById(referralId);
			if (referral == null)
			{
				response.StatusCode = 404;
				response.Message = "Referral not found.";
				response.Data = false;
				return response;
			}

			await _unitOfWork.ReferralRepository.Remove(referral.Id);
			await _unitOfWork.CompletedAsync(referral.ReferrerId);

			response.StatusCode = 200;
			response.Message = "Referral deleted successfully.";
			response.Data = true;

			return response;
		}
	}
}
