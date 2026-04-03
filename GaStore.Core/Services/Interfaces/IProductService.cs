using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IProductService
	{
        Task<PaginatedServiceResponse<List<ProductDto>>> GetProductsAsync(string? searchTerm, int pageNumber, int pageSize);
        Task<PaginatedServiceResponse<List<ProductDto>>> GetProductsAdminAsync(
            string? searchTerm,
    int pageNumber,
    int pageSize,
    bool? isAvailable = null,
    DateTime? startDate = null,
    DateTime? endDate = null,
    bool? isApproved = null
            );
		Task<ServiceResponse<bool>> ProductApprovalAsync(Guid productId, Guid UserId);
        Task<PaginatedServiceResponse<List<Product>>> GetProductsWithDetailsAsync(string? searchTerm, int pageNumber, int pageSize);
		Task<ServiceResponse<ProductListDto>> GetProductByIdAsync(Guid id);
		Task<ServiceResponse<ProductDto>> CreateProductAsync(ProductDto productDto, Guid UserId);
		Task<ServiceResponse<ProductDto>> UpdateProductAsync(Guid id, ProductDto productDto, Guid UserId);
		Task<ServiceResponse<ProductDto>> DeleteProductAsync(Guid id, Guid UserId);
	}
}
