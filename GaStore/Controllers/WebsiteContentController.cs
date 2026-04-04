using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebsiteContentController : RootController
    {
        private readonly IWebsiteContentService _websiteContentService;

        public WebsiteContentController(IWebsiteContentService websiteContentService)
        {
            _websiteContentService = websiteContentService;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResponse<WebsiteContentDto>>> GetWebsiteContent()
        {
            var response = await _websiteContentService.GetWebsiteContentAsync();
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("admin")]
        public async Task<ActionResult<ServiceResponse<WebsiteContentDto>>> GetWebsiteContentAdmin()
        {
            var response = await _websiteContentService.GetWebsiteContentAsync();
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut("admin")]
        public async Task<ActionResult<ServiceResponse<WebsiteContentDto>>> UpdateWebsiteContent([FromBody] UpdateWebsiteContentDto dto)
        {
            var response = await _websiteContentService.UpdateWebsiteContentAsync(UserId, dto);
            return StatusCode(response.StatusCode, response);
        }
    }
}
