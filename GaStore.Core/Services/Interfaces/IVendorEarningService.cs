using GaStore.Data.Dtos.WalletsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IVendorEarningService
    {
        Task ProcessOrderVendorEarningsAsync(Guid orderId, Guid actorId);
        Task<PaginatedServiceResponse<List<VendorEarningDto>>> GetVendorEarningsAsync(
            Guid vendorId,
            string? status,
            Guid? orderId,
            DateTime? startDate,
            DateTime? endDate,
            int pageNumber,
            int pageSize);
        Task<ServiceResponse<VendorEarningsOverviewDto>> GetVendorOverviewAsync(Guid vendorId, DateTime? startDate, DateTime? endDate);
        Task<ServiceResponse<List<VendorPayoutCandidateDto>>> GetAdminPayoutQueueAsync(Guid? vendorId);
        Task<PaginatedServiceResponse<List<VendorPayoutDto>>> GetAdminPayoutHistoryAsync(
            Guid? vendorId,
            string? status,
            string? gateway,
            int pageNumber,
            int pageSize);
        Task<ServiceResponse<List<VendorPayoutDto>>> ProcessWeekendPayoutsAsync(Guid adminId, ProcessVendorPayoutRequestDto dto);
    }
}
