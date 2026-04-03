using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IPricingTierService
	{
		Task<PaginatedServiceResponse<List<PricingTierDto>>> GetPricingTiersAsync(Guid productId, int pageNumber, int pageSize);
		Task<ServiceResponse<PricingTierDto>> GetPricingTierByIdAsync(Guid id);
		Task<ServiceResponse<PricingTierDto>> GetPricingTierByVariantIdAsync(Guid id);
		Task<ServiceResponse<PricingTierDto>> CreatePricingTierAsync(PricingTierDto pricingTierDto, Guid userId);
		Task<ServiceResponse<PricingTierDto>> UpdatePricingTierAsync(Guid id, PricingTierDto pricingTierDto, Guid userId);
		Task<ServiceResponse<PricingTierDto>> DeletePricingTierAsync(Guid id, Guid userId);
	}
}
