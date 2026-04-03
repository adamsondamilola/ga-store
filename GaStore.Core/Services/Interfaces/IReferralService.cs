using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ReferralDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IReferralService
	{
		Task<PaginatedServiceResponse<List<ReferralDto>>> GetPaginatedReferralsAsync(
			Guid? referrerId, Guid? referralId, int pageNumber, int pageSize);

		Task<ServiceResponse<ReferralDto>> GetReferralByIdAsync(Guid referralId);
		Task<ServiceResponse<ReferralDto>> CreateReferralAsync(ReferralDto referralDto);
		Task<ServiceResponse<ReferralDto>> UpdateReferralAsync(Guid referralId, ReferralDto referralDto);
		Task<ServiceResponse<bool>> DeleteReferralAsync(Guid referralId);

	}
}
