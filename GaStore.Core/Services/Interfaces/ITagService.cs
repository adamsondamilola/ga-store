using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface ITagService
    {
        Task<PaginatedServiceResponse<List<TagDto>>> GetTagsAsync(string? searchTerm, int pageNumber, int pageSize);
        Task<ServiceResponse<TagDto>> GetTagByIdAsync(Guid id);
        Task<ServiceResponse<TagDto>> CreateTagAsync(TagDto tagDto, Guid userId);
        Task<ServiceResponse<List<TagDto>>> CreateBulkTagsAsync(List<TagDto> tagDtos, Guid userId);
        Task<ServiceResponse<TagDto>> UpdateTagAsync(TagDto tagDto, Guid userId);
        Task<ServiceResponse<TagDto>> DeleteTagAsync(Guid id, Guid userId);

        // TaggedProduct operations
        Task<ServiceResponse<TaggedProductDto>> AddTagToProductAsync(TaggedProductDto taggedProductDto, Guid userId);
        Task<ServiceResponse<List<TaggedProductDto>>> AddBulkTagToProductAsync(List<TaggedProductDto> taggedProductDtos, Guid userId);
        Task<ServiceResponse<TaggedProductDto>> RemoveTagFromProductAsync(Guid productId, Guid tagId, Guid userId);
        Task<ServiceResponse<List<TagDto>>> GetTagsByProductAsync(Guid productId);
        Task<ServiceResponse<List<ProductDto>>> GetProductsByTagAsync(Guid tagId);

        // Utility methods
        Task<ServiceResponse<List<TagDto>>> SearchTagsAsync(string searchTerm);
    }
}