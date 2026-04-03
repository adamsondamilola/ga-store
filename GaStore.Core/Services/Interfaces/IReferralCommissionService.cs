using GaStore.Shared;
using GaStore.Data.Dtos.ReferralDto;

namespace GaStore.Core.Services.Interfaces
{
	public interface IReferralCommissionService
	{
		Task<PaginatedServiceResponse<List<ReferralCommissionDto>>> GetPaginatedCommissionsAsync(int pageNumber, int pageSize);
		Task<ServiceResponse<ReferralCommissionDto>> GetCommissionByIdAsync(Guid commissionId);
		Task<ServiceResponse<ReferralCommissionDto>> CreateCommissionAsync(ReferralCommissionDto commissionDto, Guid userId);
		Task<ServiceResponse<ReferralCommissionDto>> UpdateCommissionAsync(Guid commissionId, ReferralCommissionDto commissionDto, Guid userId);
		Task<ServiceResponse<bool>> DeleteCommissionAsync(Guid commissionId, Guid userId);
	}
}
