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
	public interface IFeaturedProductService
	{
		Task<PaginatedServiceResponse<List<FeaturedProduct>>> GetFeaturedProductsAsync(int pageNumber, int pageSize);
		Task<ServiceResponse<FeaturedProduct>> GetFeaturedProductByIdAsync(Guid id);
		Task<ServiceResponse<FeaturedProductDto>> CreateFeaturedProductAsync(FeaturedProductDto featuredProductDto, Guid userId);
		Task<ServiceResponse<FeaturedProductDto>> UpdateFeaturedProductAsync(Guid id, FeaturedProductDto featuredProductDto, Guid userId);
		Task<ServiceResponse<FeaturedProductDto>> DeleteFeaturedProductAsync(Guid id, Guid userId);
	}
}
