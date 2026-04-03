using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.AdsDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
    [EnableRateLimiting("FixedPolicy")]
    public class BannerController : RootController
	{
		private readonly IBannerService _sliderService;

		public BannerController(IBannerService sliderService)
		{
			_sliderService = sliderService;
		}

		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<BannerDto>>>> GetSliders(
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10,
			[FromQuery] string type = null)
		{
			var response = await _sliderService.GetSlidersAsync(pageNumber, pageSize, type);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.Status, response);
		}

		[HttpGet("{id}")]
		public async Task<ActionResult<ServiceResponse<BannerDto>>> GetSlider(Guid id)
		{
			var response = await _sliderService.GetSliderByIdAsync(id);
			if (response.StatusCode == 200)
			{
				return Ok(response);
			}
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost]
		public async Task<ActionResult<ServiceResponse<BannerDto>>> CreateSlider(
			[FromForm] BannerDto sliderDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<BannerDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _sliderService.CreateSliderAsync(sliderDto, UserId);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetSlider), new { id = response.Data?.Id }, response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPut]
		public async Task<ActionResult<ServiceResponse<BannerDto>>> UpdateSlider(
			[FromForm] BannerDto sliderDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<BannerDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _sliderService.UpdateSliderAsync(sliderDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{id}")]
		public async Task<ActionResult<ServiceResponse<BannerDto>>> DeleteSlider(Guid id)
		{
			var response = await _sliderService.DeleteSliderAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}
	}
}