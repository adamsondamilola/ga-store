using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.AdsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IBannerService
	{
		Task<PaginatedServiceResponse<List<BannerDto>>> GetSlidersAsync(int pageNumber, int pageSize, string type);
		Task<ServiceResponse<BannerDto>> GetSliderByIdAsync(Guid id);
		Task<ServiceResponse<BannerDto>> CreateSliderAsync(BannerDto sliderDto, Guid userId);
		Task<ServiceResponse<BannerDto>> UpdateSliderAsync(BannerDto sliderDto, Guid userId);
		Task<ServiceResponse<BannerDto>> DeleteSliderAsync(Guid id, Guid userId);

	}
}
