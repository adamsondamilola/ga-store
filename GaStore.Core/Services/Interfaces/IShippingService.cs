using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Entities.Orders;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IShippingService
	{
        Task<PaginatedServiceResponse<List<ShippingProviderListDto>>> GetShippingProvidersAsync(string? searchTerm, int pageNumber, int pageSize);
        Task<ServiceResponse<ShippingProviderDto>> CreateShippingProviderAsync(ShippingProviderDto providerDto, Guid userId);
        Task<ServiceResponse<ShippingProviderDto>> UpdateShippingProviderAsync(Guid id, ShippingProviderDto providerDto, Guid userId);
        Task<ServiceResponse<string>> DeleteShippingProviderAsync(Guid id, Guid userId);
        Task<ServiceResponse<ShippingProviderListDto>> GetShippingProviderByIdAsync(Guid id);

        Task<PaginatedServiceResponse<List<Shipping>>> GetPaginatedShippingsAsync(
    string? searchTerm,
    string? status,
    string? state,
    string? city,
    string? provider,
    decimal? minPrice,
    decimal? maxPrice,
    DateTime? startDate,
    DateTime? endDate,
    string sortField = "dateCreated",
    string sortDirection = "desc",
    int pageNumber = 1,
    int pageSize = 10);
        Task<ServiceResponse<bool>> UpdateShippingProviderTrackingId(UpdateShippingProviderTrackingIdDto request, Guid userId);
        Task<ServiceResponse<Dictionary<string, List<string>>>> GetShippingLocationDataAsync();

        Task<ServiceResponse<ShippingDto>> CreateShippingAsync(ShippingDto shippingDto, Guid userId);
		Task<ServiceResponse<Shipping>> GetShippingByIdAsync(Guid UserId, Guid id);
		Task<ServiceResponse<Shipping>> GetShippingByTrackingIdAsync(UpdateShippingProviderDto providerDto);
        Task<ServiceResponse<ShippingDto>> UpdateShippingAsync(Guid id, ShippingDto shippingDto, Guid userId);
		Task<ServiceResponse<string>> UpdateShippingStatusAsync(UpdateBulkShippingDto dto, Guid userId);
		Task<ServiceResponse<string>> UpdateBulkShippingStatusAsync(List<UpdateBulkShippingDto> dto, Guid userId);

        Task<ServiceResponse<ShippingDto>> UpdateShippingProviderAsync(Guid id, UpdateShippingProviderDto shippingDto, Guid userId);
        Task<ServiceResponse<ShippingDto>> DeleteShippingAsync(Guid id, Guid userId);
	}
}
