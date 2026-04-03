using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IProductVariantService
	{
		Task<PaginatedServiceResponse<List<ProductVariantDto>>> GetProductVariantsAsync(Guid productId, int pageNumber, int pageSize);
		Task<ServiceResponse<ProductVariantDto>> GetProductVariantByIdAsync(Guid id);
		Task<ServiceResponse<List<ProductVariantDto>>> GetProductVariantByProductIdAsync(Guid ProductId);
		Task<ServiceResponse<ProductVariantDto>> CreateProductVariantAsync(ProductVariantDto productVariantDto, Guid UserId);
		Task<ServiceResponse<ProductVariantDto>> UpdateProductVariantAsync(Guid id, ProductVariantDto productVariantDto, Guid UserId);
		Task<ServiceResponse<ProductVariantDto>> DeleteProductVariantAsync(Guid id, Guid UserId);
	}
}
