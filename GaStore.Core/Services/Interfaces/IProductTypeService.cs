// IProductTypeService.cs
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IProductTypeService
    {
        Task<PaginatedServiceResponse<List<ProductTypeDto>>> GetProductTypesAsync(string? searchTerm, Guid? subCategoryId, int pageNumber, int pageSize);
        Task<ServiceResponse<ProductTypeDto>> GetProductTypeByIdAsync(Guid id);
        Task<ServiceResponse<ProductTypeDto>> CreateProductTypeAsync(CreateProductTypeDto productTypeDto, Guid userId);
        Task<ServiceResponse<ProductTypeDto>> UpdateProductTypeAsync(CreateProductTypeDto productTypeDto, Guid userId);
        Task<ServiceResponse<ProductTypeDto>> DeleteProductTypeAsync(Guid id, Guid userId);
        Task<ServiceResponse<List<ProductTypeDto>>> GetProductTypesBySubCategoryAsync(Guid subCategoryId);
    }
}