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
	public class ReferralPurchaseService : IReferralPurchaseService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<ReferralPurchaseService> _logger;
		private readonly DatabaseContext _context;

		public ReferralPurchaseService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<ReferralPurchaseService> logger, DatabaseContext context)
		{
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
			_context = context;
		}

		public async Task<PaginatedServiceResponse<List<ReferralPurchase>>> GetPaginatedReferralPurchasesAsync(
			Guid? referralId, Guid? orderId, int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<ReferralPurchase>>();

			try
			{
				var query = _context.ReferralPurchases.AsQueryable();

				if (referralId.HasValue)
					query = query.Where(rp => rp.ReferralId == referralId);

				if (orderId.HasValue)
					query = query.Where(rp => rp.OrderId == orderId);

				int totalRecords = await query.CountAsync();

				var referralPurchases = await query
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.Select(rp => new ReferralPurchase
					{
						ReferralId = rp.ReferralId,
						OrderId = rp.OrderId,
						CommissionAmount = rp.CommissionAmount
					})
					.ToListAsync();

				response.Status = 200;
				response.Message = "Referral purchases retrieved successfully.";
				response.Data = referralPurchases;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error fetching referral purchases: {ex.Message}");
				response.Status = 500;
				response.Message = "An error occurred while retrieving referral purchases.";
			}

			return response;
		}

		public async Task<ServiceResponse<ReferralPurchase>> GetReferralPurchaseByIdAsync(Guid referralPurchaseId)
		{
			var response = new ServiceResponse<ReferralPurchase>();

			var referralPurchase = await _context.ReferralPurchases.FindAsync(referralPurchaseId);
			if (referralPurchase == null)
			{
				response.StatusCode = 404;
				response.Message = "Referral purchase not found.";
				return response;
			}

			response.StatusCode = 200;
			response.Message = "Referral purchase retrieved successfully.";
			response.Data = _mapper.Map<ReferralPurchase>(referralPurchase);

			return response;
		}

		public async Task<ServiceResponse<ReferralPurchaseDto>> CreateReferralPurchaseAsync(ReferralPurchaseDto referralPurchaseDto)
		{
			var response = new ServiceResponse<ReferralPurchaseDto>();

			var newReferralPurchase = _mapper.Map<ReferralPurchase>(referralPurchaseDto);

			await _unitOfWork.ReferralPurchaseRepository.Add(newReferralPurchase);
			await _unitOfWork.CompletedAsync(referralPurchaseDto.ReferralId);

			response.StatusCode = 201;
			response.Message = "Referral purchase created successfully.";
			response.Data = referralPurchaseDto;

			return response;
		}

		public async Task<ServiceResponse<bool>> DeleteReferralPurchaseAsync(Guid referralPurchaseId)
		{
			var response = new ServiceResponse<bool>();

			var referralPurchase = await _unitOfWork.ReferralPurchaseRepository.GetById(referralPurchaseId);
			if (referralPurchase == null)
			{
				response.StatusCode = 404;
				response.Message = "Referral purchase not found.";
				response.Data = false;
				return response;
			}

			await _unitOfWork.ReferralPurchaseRepository.Remove(referralPurchase.Id);
			await _unitOfWork.CompletedAsync(referralPurchase.ReferralId);

			response.StatusCode = 200;
			response.Message = "Referral purchase deleted successfully.";
			response.Data = true;

			return response;
		}
	}
}
