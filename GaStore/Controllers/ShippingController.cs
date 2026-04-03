using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Users;
using GaStore.Shared;
using GaStore.Shared.Constants;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShippingController : RootController
    {
        private readonly IShippingService _shippingService;
        private readonly ILogger<ShippingController> _logger;

        public ShippingController(
            IShippingService shippingService,
            ILogger<ShippingController> logger)
        {
            _shippingService = shippingService;
            _logger = logger;
        }

        //[Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("providers")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedServiceResponse<List<ShippingProviderListDto>>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PaginatedServiceResponse<List<ShippingProviderListDto>>>> GetShippingProviders(
    [FromQuery] string? searchTerm,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
        {
            if (pageNumber < 1 || pageSize < 1)
            {
                return BadRequest(new PaginatedServiceResponse<List<ShippingProviderListDto>>
                {
                    Status = 400,
                    Message = "Page number and page size must be greater than 0."
                });
            }

            var response = await _shippingService.GetShippingProvidersAsync(searchTerm, pageNumber, pageSize);

            return StatusCode(response.Status, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost("providers")]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<ShippingProviderDto>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<ShippingProviderDto>>> CreateShippingProvider([FromBody] ShippingProviderDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<ShippingProviderDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _shippingService.CreateShippingProviderAsync(dto, UserId);

            return StatusCode(response.StatusCode, response);
        }


        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("providers/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ShippingProviderListDto>))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<ShippingProviderListDto>>> GetShippingProviderById(Guid id)
        {
            var response = await _shippingService.GetShippingProviderByIdAsync(id);
            return StatusCode(response.StatusCode, response);
        }


        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut("providers/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ShippingProviderDto>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<ShippingProviderDto>>> UpdateShippingProvider(
    Guid id, [FromBody] ShippingProviderDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<ShippingProviderDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _shippingService.UpdateShippingProviderAsync(id, dto, UserId);

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpDelete("providers/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<string>))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<string>>> DeleteShippingProvider(Guid id)
        {
            var response = await _shippingService.DeleteShippingProviderAsync(id, UserId);
            return StatusCode(response.StatusCode, response);
        }


        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedServiceResponse<List<Shipping>>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PaginatedServiceResponse<List<Shipping>>>> GetShippings(
    [FromQuery] string? searchTerm,
    [FromQuery] string? status = "all",
    [FromQuery] string? state = null,
    [FromQuery] string? city = null,
    [FromQuery] string? provider = null,
    [FromQuery] decimal? minPrice = null,
    [FromQuery] decimal? maxPrice = null,
    [FromQuery] DateTime? startDate = null,
    [FromQuery] DateTime? endDate = null,
    [FromQuery] string sortField = "dateCreated",
    [FromQuery] string sortDirection = "desc",
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
        {
            if (pageNumber < 1 || pageSize < 1)
            {
                return BadRequest(new PaginatedServiceResponse<List<Shipping>>
                {
                    Status = 400,
                    Message = "Page number and page size must be greater than 0."
                });
            }

            var response = await _shippingService.GetPaginatedShippingsAsync(
        searchTerm, status, state, city, provider,
        minPrice, maxPrice, startDate, endDate,
        sortField, sortDirection, pageNumber, pageSize);

            if (response.Status == 200)
            {
                return Ok(response);
            }

            _logger.LogError("Error retrieving shipping records. SearchTerm: {SearchTerm}, Page: {PageNumber}, Size: {PageSize}. Error: {ErrorMessage}",
                searchTerm, pageNumber, pageSize, response.Message);

            return StatusCode(response.Status, response);
        }

        [NonAction]
        [HttpGet("location-data")]
        public async Task<IActionResult> GetShippingLocationData()
        {
            var result = await _shippingService.GetShippingLocationDataAsync();
            return StatusCode(result.StatusCode, result);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<ShippingDto>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<ShippingDto>>> CreateShipping([FromBody] ShippingDto shippingDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<ShippingDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _shippingService.CreateShippingAsync(shippingDto, UserId);

            if (response.StatusCode == 201)
            {
                return Ok(response);
            }

            _logger.LogError("Error creating shipping information by UserId: {UserId}. Error: {ErrorMessage}", UserId, response.Message);
            return StatusCode(response.StatusCode, response);
        }
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPatch("update-waybill-id")]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<bool>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<bool>>> UpdateShippingProviderTrackingId([FromBody] UpdateShippingProviderTrackingIdDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<bool>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _shippingService.UpdateShippingProviderTrackingId(request, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            _logger.LogError("Error updating shipping waybill ID by UserId: {UserId}. Error: {ErrorMessage}", UserId, response.Message);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<Shipping>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<Shipping>>> GetShippingById(Guid id)
		{
			var response = await _shippingService.GetShippingByIdAsync(UserId, id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error retrieving shipping information with Id: {Id}. Error: {ErrorMessage}", id, response.Message);
			return StatusCode(response.StatusCode, response);
		}

        [HttpPost("track")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<Shipping>))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<Shipping>>> GetShippingByTrackingId(UpdateShippingProviderDto providerDto)
        {
            var response = await _shippingService.GetShippingByTrackingIdAsync(providerDto);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            _logger.LogError("Error retrieving provider shipping information with Id: {Id}. Error: {ErrorMessage}", providerDto.ShippingProviderTrackingId, response.Message);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ShippingDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ShippingDto>>> UpdateShipping(Guid id, [FromBody] ShippingDto shippingDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ShippingDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _shippingService.UpdateShippingAsync(id, shippingDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error updating shipping information with Id: {Id} by UserId: {UserId}. Error: {ErrorMessage}", id, UserId, response.Message);
			return StatusCode(response.StatusCode, response);
		}

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut("update-status")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<string>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<string>>> UpdateShippingStatus([FromBody] UpdateBulkShippingDto shippingDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<string>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _shippingService.UpdateShippingStatusAsync(shippingDto, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            _logger.LogError("Error updating shipping status with Id: {Id} by UserId: {UserId}. Error: {ErrorMessage}", shippingDto.Id, UserId, response.Message);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut("update-bulk-status")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<string>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<string>>> UpdateBulkShippingStatus([FromBody] List<UpdateBulkShippingDto> shippingDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<string>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _shippingService.UpdateBulkShippingStatusAsync(shippingDto, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            _logger.LogError("Error updating shipping status by UserId: {UserId}. Error: {ErrorMessage}", UserId, response.Message);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpDelete("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ShippingDto>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ShippingDto>>> DeleteShipping(Guid id)
		{
			var response = await _shippingService.DeleteShippingAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error deleting shipping information with Id: {Id} by UserId: {UserId}. Error: {ErrorMessage}", id, UserId, response.Message);
			return StatusCode(response.StatusCode, response);
		}
	}
}