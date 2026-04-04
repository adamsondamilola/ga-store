using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IProductReviewService
	{
		Task<ServiceResponse<ProductReviewDto>> GetByIdAsync(Guid id);
		Task<List<ProductReviewDto>> GetAllAsync();
		Task<PaginatedServiceResponse<List<ProductReviewDto>>> GetPaginatedReviewsAsync(Guid? productId, Guid? userId, int pageNumber, int pageSize);
		Task<PaginatedServiceResponse<List<ReviewableProductDto>>> GetReviewableProductsAsync(Guid userId, int pageNumber, int pageSize);
		Task<ServiceResponse<ProductReviewDto>> CreateAsync(Guid userId, ProductReviewDto reviewDto);
		Task<ServiceResponse<ProductReviewDto>> UpdateAsync(Guid id, ProductReviewDto reviewDto);
		Task<ServiceResponse<ProductReviewDto>> DeleteAsync(Guid id);
	}

}
