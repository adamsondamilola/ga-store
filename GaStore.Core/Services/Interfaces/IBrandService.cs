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
	public interface IBrandService
	{
		Task<PaginatedServiceResponse<List<Brand>>> GetBrandsAsync(string? searchTerm, int pageNumber, int pageSize);
		Task<ServiceResponse<Brand>> GetBrandByIdAsync(Guid Id);
		Task<ServiceResponse<Brand>> CreateBrandAsync(BrandDto brand);
		Task<ServiceResponse<Brand>> UpdateBrandAsync(Guid Id, BrandDto brand);
		Task<ServiceResponse<Brand>> DeleteBrandAsync(Guid Id);
	}
}
