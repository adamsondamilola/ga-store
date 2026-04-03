using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LimitedOfferController : RootController
    {
        private readonly ILimitedOfferService _limitedOfferService;

        public LimitedOfferController(ILimitedOfferService limitedOfferService)
        {
            _limitedOfferService = limitedOfferService;
        }

        [HttpGet("active-homepage")]
        public async Task<ActionResult<ServiceResponse<LimitedOfferHomepageDto>>> GetActiveHomepageOffer()
        {
            var response = await _limitedOfferService.GetActiveHomepageOfferAsync();
            return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet]
        public async Task<ActionResult<PaginatedServiceResponse<List<LimitedOfferListDto>>>> GetLimitedOffers(
            [FromQuery] string? searchTerm = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var response = await _limitedOfferService.GetLimitedOffersAsync(searchTerm, pageNumber, pageSize);
            return response.Status == 200 ? Ok(response) : StatusCode(response.Status, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResponse<LimitedOfferDetailsDto>>> GetLimitedOffer(Guid id)
        {
            var response = await _limitedOfferService.GetLimitedOfferByIdAsync(id);
            return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost]
        public async Task<ActionResult<ServiceResponse<LimitedOfferDetailsDto>>> CreateLimitedOffer([FromBody] LimitedOfferUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ServiceResponse<LimitedOfferDetailsDto>.Fail("Invalid input data."));
            }

            var response = await _limitedOfferService.CreateLimitedOfferAsync(dto, UserId);
            return response.StatusCode == 201
                ? CreatedAtAction(nameof(GetLimitedOffer), new { id = response.Data?.Id }, response)
                : StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut("{id}")]
        public async Task<ActionResult<ServiceResponse<LimitedOfferDetailsDto>>> UpdateLimitedOffer(Guid id, [FromBody] LimitedOfferUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ServiceResponse<LimitedOfferDetailsDto>.Fail("Invalid input data."));
            }

            var response = await _limitedOfferService.UpdateLimitedOfferAsync(id, dto, UserId);
            return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPatch("{id}/toggle-active")]
        public async Task<ActionResult<ServiceResponse<bool>>> ToggleActive(Guid id)
        {
            var response = await _limitedOfferService.ToggleActiveAsync(id, UserId);
            return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpDelete("{id}")]
        public async Task<ActionResult<ServiceResponse<bool>>> DeleteLimitedOffer(Guid id)
        {
            var response = await _limitedOfferService.DeleteLimitedOfferAsync(id, UserId);
            return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
        }
    }
}
