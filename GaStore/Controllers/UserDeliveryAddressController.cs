using Microsoft.AspNetCore.Mvc;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Common;
using Microsoft.AspNetCore.Authorization;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class UserDeliveryAddressController : RootController
	{
		private readonly IUserDeliveryAddressService _deliveryAddressService;

		public UserDeliveryAddressController(IUserDeliveryAddressService deliveryAddressService)
		{
			_deliveryAddressService = deliveryAddressService;
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet]
		public async Task<IActionResult> GetUserAddresses()
		{
			var response = await _deliveryAddressService.GetUserDeliveryAddressesAsync(UserId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet("{addressId}")]
		public async Task<IActionResult> GetDeliveryAddress(Guid addressId)
		{
			var response = await _deliveryAddressService.GetDeliveryAddressAsync(addressId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpPost]
		public async Task<IActionResult> CreateOrUpdateAddress([FromBody] DeliveryAddressDto addressDto)
		{
			addressDto.UserId = UserId;
			var response = await _deliveryAddressService.CreateOrUpdateDeliveryAddressAsync(addressDto);
			return StatusCode(response.StatusCode, response);
		}

        [Authorize(Roles = CustomRoles.User)]
        [HttpGet("update-delivery-location-id")]
        public async Task<IActionResult> CreateOrUpdateAddress([FromQuery] Guid id, [FromQuery] Guid deliveryLocationId)
        {
            var response = await _deliveryAddressService.UpdateDeliveryLocationIdAsync(id, deliveryLocationId);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
		[HttpPost("{userId}")]
		public async Task<IActionResult> CreateOrUpdateAddressAdmin(Guid userId, [FromBody] DeliveryAddressDto addressDto)
		{
			addressDto.UserId = userId;
			var response = await _deliveryAddressService.CreateOrUpdateDeliveryAddressAsync(addressDto);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpPut("{addressId}/set-primary")]
		public async Task<IActionResult> SetPrimaryAddress(Guid addressId)
		{
			var response = await _deliveryAddressService.SetPrimaryDeliveryAddressAsync(addressId, UserId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPut("{userId}/{addressId}/set-primary")]
		public async Task<IActionResult> SetPrimaryAddressAdmin(Guid userId, Guid addressId)
		{
			var response = await _deliveryAddressService.SetPrimaryDeliveryAddressAsync(addressId, userId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpDelete("{addressId}")]
		public async Task<IActionResult> DeleteAddress(Guid addressId)
		{
			var response = await _deliveryAddressService.DeleteDeliveryAddressAsync(addressId, UserId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{userId}/{addressId}")]
		public async Task<IActionResult> DeleteAddressAdmin(Guid userId, Guid addressId)
		{
			var response = await _deliveryAddressService.DeleteDeliveryAddressAsync(addressId, userId);
			return StatusCode(response.StatusCode, response);
		}
	}
}