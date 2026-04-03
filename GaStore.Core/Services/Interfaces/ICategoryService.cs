using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface ICategoryService
	{
		Task<PaginatedServiceResponse<List<CategoryDto>>> GetCategoriesAsync(string? searchTerm, int pageNumber, int pageSize);
		Task<ServiceResponse<CategoryDto>> GetCategoryByIdAsync(Guid id);
        Task<ServiceResponse<CategoryHierarchyDto>> GetCategoryHierarchyAsync(Guid id);
        Task<ServiceResponse<List<CategoryWithHierarchyDto>>> GetCategoriesWithFullHierarchyAsync();
        Task<ServiceResponse<CategoryDto>> CreateCategoryAsync(CategoryDto categoryDto, Guid UserId);
		Task<ServiceResponse<CategoryDto>> UpdateCategoryAsync(CategoryDto categoryDto, Guid UserId);
		Task<ServiceResponse<CategoryDto>> DeleteCategoryAsync(Guid id, Guid UserId);
	}
}
