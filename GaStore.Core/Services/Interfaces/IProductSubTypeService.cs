using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IProductSubTypeService
    { 
        Task<PaginatedServiceResponse<List<ProductSubTypeDto>>> GetProductSubTypesAsync(string? searchTerm, Guid? productTypeId, int pageNumber, int pageSize);
        Task<ServiceResponse<ProductSubTypeDto>> GetProductSubTypeByIdAsync(Guid id);
        Task<ServiceResponse<ProductSubTypeDto>> CreateProductSubTypeAsync(CreateProductSubTypeDto productSubTypeDto, Guid userId);
        Task<ServiceResponse<ProductSubTypeDto>> UpdateProductSubTypeAsync(CreateProductSubTypeDto productSubTypeDto, Guid userId);
        Task<ServiceResponse<ProductSubTypeDto>> DeleteProductSubTypeAsync(Guid id, Guid userId);
        Task<ServiceResponse<List<ProductSubTypeDto>>> GetProductSubTypesByProductTypeAsync(Guid productTypeId);
    }
}