using GaStore.Data.Dtos;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IWebsiteContentService
    {
        Task<ServiceResponse<WebsiteContentDto>> GetWebsiteContentAsync();
        Task<ServiceResponse<WebsiteContentDto>> UpdateWebsiteContentAsync(Guid userId, UpdateWebsiteContentDto dto);
    }
}
