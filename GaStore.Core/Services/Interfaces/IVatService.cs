using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IVatService
	{
		Task<ServiceResponse<VatDto>> GetByIdAsync(Guid vatId);
		Task<ServiceResponse<VatDto>> CreateAsync(VatDto vatDto);
		Task<ServiceResponse<VatDto>> UpdateAsync(VatDto vatDto);
		Task<ServiceResponse<string>> DeleteAsync(Guid vatId);
		Task<PaginatedServiceResponse<List<VatDto>>> GetAllVatsAsync(
			int pageNumber = 1,
			int pageSize = 10,
			bool? isActive = null);
		Task<ServiceResponse<VatDto>> GetActiveVatAsync();
	}
}
