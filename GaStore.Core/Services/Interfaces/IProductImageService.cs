using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IProductImageService
	{
		Task<PaginatedServiceResponse<List<ProductImageDto>>> GetProductImagesAsync(Guid variantId, int pageNumber, int pageSize);
		Task<ServiceResponse<ProductImageDto>> GetProductImageByIdAsync(Guid id);
		Task<ServiceResponse<List<ProductImageDto>>> CreateProductImageAsync(ProductImageDto productImageDto, Guid userId);
		Task<ServiceResponse<ProductImageDto>> UpdateProductImageAsync(Guid id, ProductImageDto productImageDto, Guid userId);
		Task<ServiceResponse<ProductImageDto>> DeleteProductImageAsync(Guid id, Guid userId);
		Task<ServiceResponse<ProductImageDto>> DeleteProductImageByUrlAsync(string imageUrl, Guid userId);

    }
}
