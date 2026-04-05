using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IVendorProductService
    {
        Task<ServiceResponse<ProductDto>> CreateVendorProductAsync(ProductDto productDto, Guid userId);
        Task<ServiceResponse<ProductDto>> UpdateVendorProductAsync(Guid productId, ProductDto productDto, Guid userId);
        Task<ServiceResponse<ProductDto>> SubmitForReviewAsync(Guid productId, Guid userId);
        Task<PaginatedServiceResponse<List<ProductDto>>> GetVendorProductsAsync(Guid userId, int pageNumber, int pageSize);
        Task<PaginatedServiceResponse<List<ProductDto>>> GetPendingProductsAsync(int pageNumber, int pageSize);
        Task<ServiceResponse<ProductDto>> ApproveProductAsync(Guid productId, Guid adminId);
        Task<ServiceResponse<ProductDto>> RejectProductAsync(Guid productId, Guid adminId, string? reason);
    }
}
