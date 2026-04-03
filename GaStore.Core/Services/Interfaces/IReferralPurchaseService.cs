using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ReferralDto;
using GaStore.Data.Entities.Referrals;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IReferralPurchaseService
	{
		Task<PaginatedServiceResponse<List<ReferralPurchase>>> GetPaginatedReferralPurchasesAsync(
			Guid? referralId, Guid? orderId, int pageNumber, int pageSize);
		Task<ServiceResponse<ReferralPurchase>> GetReferralPurchaseByIdAsync(Guid referralPurchaseId);
		Task<ServiceResponse<ReferralPurchaseDto>> CreateReferralPurchaseAsync(ReferralPurchaseDto referralPurchaseDto);
		Task<ServiceResponse<bool>> DeleteReferralPurchaseAsync(Guid referralPurchaseId);
	}
}
