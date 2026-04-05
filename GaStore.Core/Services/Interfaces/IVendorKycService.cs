using GaStore.Data.Dtos.UsersDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IVendorKycService
    {
        Task<ServiceResponse<VendorKycStatusDto>> BecomeVendorAsync(Guid userId);
        Task<ServiceResponse<VendorKycDto>> UpsertKycAsync(Guid userId, VendorKycUpsertDto dto, bool submitForReview);
        Task<ServiceResponse<VendorKycStatusDto>> GetStatusAsync(Guid userId);
        Task<PaginatedServiceResponse<List<VendorKycDto>>> GetPendingKycAsync(int pageNumber, int pageSize);
        Task<ServiceResponse<VendorKycDto>> ApproveKycAsync(Guid kycId, Guid adminId);
        Task<ServiceResponse<VendorKycDto>> RejectKycAsync(Guid kycId, Guid adminId, string? reason);
    }
}
