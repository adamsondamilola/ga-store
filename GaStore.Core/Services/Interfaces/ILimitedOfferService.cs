using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface ILimitedOfferService
    {
        Task<PaginatedServiceResponse<List<LimitedOfferListDto>>> GetLimitedOffersAsync(string? searchTerm, int pageNumber, int pageSize);
        Task<ServiceResponse<LimitedOfferDetailsDto>> GetLimitedOfferByIdAsync(Guid id);
        Task<ServiceResponse<LimitedOfferDetailsDto>> CreateLimitedOfferAsync(LimitedOfferUpsertDto dto, Guid userId);
        Task<ServiceResponse<LimitedOfferDetailsDto>> UpdateLimitedOfferAsync(Guid id, LimitedOfferUpsertDto dto, Guid userId);
        Task<ServiceResponse<bool>> DeleteLimitedOfferAsync(Guid id, Guid userId);
        Task<ServiceResponse<bool>> ToggleActiveAsync(Guid id, Guid userId);
        Task<ServiceResponse<LimitedOfferHomepageDto>> GetActiveHomepageOfferAsync();
    }
}
