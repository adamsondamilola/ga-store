using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface ISubCategoryService
	{
		Task<PaginatedServiceResponse<List<SubCategoryDto>>> GetSubCategoriesAsync(string? searchTerm, int pageNumber, int pageSize);
		Task<ServiceResponse<SubCategoryDto>> GetSubCategoryByIdAsync(Guid id);
		Task<ServiceResponse<SubCategoryDto>> CreateSubCategoryAsync(SubCategoryDto categoryDto, Guid UserId);
		Task<ServiceResponse<SubCategoryDto>> UpdateSubCategoryAsync(SubCategoryDto categoryDto, Guid UserId);
		Task<ServiceResponse<SubCategoryDto>> DeleteSubCategoryAsync(Guid id, Guid UserId);
	}
}
