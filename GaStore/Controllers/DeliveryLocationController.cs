using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Users;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
    [EnableRateLimiting("FixedPolicy")]
    public class DeliveryLocationController : RootController
	{
		private readonly IDeliveryLocationService _deliveryLocationService;

		public DeliveryLocationController(IDeliveryLocationService deliveryLocationService)
		{
			_deliveryLocationService = deliveryLocationService;
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet]
		public async Task<IActionResult> GetAll([FromQuery] string? searchTerm, string? state, string? city, string? provider, bool? isHomeDelivery, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
		{
			var response = await _deliveryLocationService.GetAllAsync(searchTerm, state, city, provider, isHomeDelivery, pageNumber, pageSize);
			return StatusCode(response.Status, response);
		}

		//[Authorize(Roles = CustomRoles.Admin)]
		[HttpGet("{id}")]
		public async Task<IActionResult> GetById(Guid id)
		{
			var response = await _deliveryLocationService.GetByIdAsync(id);
			return StatusCode(response.StatusCode, response);
		}

		[HttpGet("get-by-state-city")]
		public async Task<IActionResult> GetByStateCityAsync([FromQuery] string State, [FromQuery] string City)
		{
			var response = await _deliveryLocationService.GetByStateCityAsync(State, City);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost("")]
		public async Task<IActionResult> CreateOrUpdate([FromBody] DeliveryLocationDto dto)
		{
			var response = await _deliveryLocationService.CreateOrUpdateAsync(UserId, dto);
			return StatusCode(response.StatusCode, response);
		}

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut("")]
        public async Task<IActionResult> Update([FromBody] DeliveryLocationDto dto)
        {
            var response = await _deliveryLocationService.CreateOrUpdateAsync(UserId, dto);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
		[HttpPost("bulk-upload-list")]
		public async Task<IActionResult> BulkUpload([FromBody] List<DeliveryLocationDto> dto)
		{
			var response = await _deliveryLocationService.BulkUploadAsync(UserId, dto);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost("bulk-upload-file")]
		public async Task<IActionResult> BulkUploadFromFile(IFormFile file)
		{
			if (file == null || file.Length == 0)
			{
				return BadRequest("No file uploaded");
			}

			var fileType = Path.GetExtension(file.FileName).TrimStart('.');
			if (!new[] { "csv", "xlsx", "xls" }.Contains(fileType.ToLower()))
			{
				return BadRequest("Only CSV and Excel files are supported");
			}

			using var stream = file.OpenReadStream();
			var response = await _deliveryLocationService.BulkUploadFromFileAsync(
				UserId,
				stream,
				fileType,
				file.FileName);
			return StatusCode(response.StatusCode, response);
		}



		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(Guid id)
		{
			var response = await _deliveryLocationService.DeleteAsync(UserId, id);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPut("{id}/set-active-status")]
		public async Task<IActionResult> SetActiveStatus(Guid id, [FromQuery] bool isActive)
		{
			var response = await _deliveryLocationService.SetActiveStatusAsync(UserId, id, isActive);
			return StatusCode(response.StatusCode, response);
		}
	}
}
