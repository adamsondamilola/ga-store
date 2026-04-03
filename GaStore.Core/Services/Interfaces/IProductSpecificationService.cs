using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IProductSpecificationService
	{
		Task<PaginatedServiceResponse<List<ProductSpecificationDto>>> GetProductSpecificationsAsync(Guid productId, int pageNumber, int pageSize);
		Task<ServiceResponse<ProductSpecificationDto>> GetProductSpecificationByIdAsync(Guid id);
		Task<ServiceResponse<ProductSpecificationDto>> CreateProductSpecificationAsync(ProductSpecificationDto productSpecificationDto, Guid userId);
		Task<ServiceResponse<ProductSpecificationDto>> UpdateProductSpecificationAsync(Guid id, ProductSpecificationDto productSpecificationDto, Guid userId);
		Task<ServiceResponse<ProductSpecificationDto>> DeleteProductSpecificationAsync(Guid id, Guid userId);
	}
}
