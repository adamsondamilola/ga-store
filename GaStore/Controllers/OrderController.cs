using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Entities.Orders;
using GaStore.Shared;
using GaStore.Shared.Constants;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class OrderController : RootController
	{
		private readonly IOrderService _orderService;
		private readonly ILogger<OrderController> _logger;

		public OrderController(
			IOrderService orderService,
			ILogger<OrderController> logger)
		{
			_orderService = orderService;
			_logger = logger;
		}

		[HttpPost]
		[ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<OrderDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<OrderDto>>> CreateOrder([FromBody] OrderDto orderDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<OrderDto>
				{
					StatusCode = 400,
					Message = "Invalid input data.",
					Data = null
				});
			}

			var response = await _orderService.CreateOrderAsync(orderDto, UserId);

			if (response.StatusCode == 201)
			{
				return Ok(response);
			}

			_logger.LogError("Error creating order: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[HttpPost("summary")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<OrderSummaryDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<OrderSummaryDto>>> OrderSummaryAsync([FromBody] OrderSummaryDto orderDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<OrderSummaryDto>
				{
					StatusCode = 400,
					Message = "Invalid input data.",
					Data = null
				});
			}

			var response = await _orderService.OrderSummaryAsync(UserId, orderDto);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error creating order: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[HttpGet("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<Order>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<Order>>> GetOrderById(string id)
		{
			var response = await _orderService.GetOrderByIdAsync(id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error retrieving order with Id: {Id}. Error: {ErrorMessage}", id, response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpGet()]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<OrderDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<PaginatedServiceResponse<List<Order>>>> GetOrders(
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string searchTerm = null,
    [FromQuery] string status = null,
    [FromQuery] string dateRange = null,
    [FromQuery] string couponCode = null,
    [FromQuery] string userId = null,
    [FromQuery] decimal? minAmount = null,
    [FromQuery] decimal? maxAmount = null,
    [FromQuery] string shippingStatus = null,
    [FromQuery] string shippingState = null,
    [FromQuery] string shippingCity = null,
    [FromQuery] string shippingProvider = null,
    [FromQuery] DateTime? startDate = null,
    [FromQuery] DateTime? endDate = null,
    [FromQuery] bool? hasDiscount = null,
    [FromQuery] string sortBy = "datecreated",
    [FromQuery] string sortDirection = "desc")
        {

			var response = await _orderService.GetOrdersAsync(pageNumber, pageSize, searchTerm, status, dateRange,
        couponCode, userId, minAmount, maxAmount, shippingStatus,
        shippingState, shippingCity, shippingProvider, startDate,
        endDate, hasDiscount, sortBy, sortDirection);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error orders. Error: {ErrorMessage}", response.Message);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet("by-user")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<OrderDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<PaginatedServiceResponse<List<Order>>>> GetUserOrdersGetOrders([FromQuery] int pageNumber, int pageSize,
			string searchTerm = null,
		string status = null,
		string dateRange = null)
		{

			var response = await _orderService.GetUserOrdersAsync(UserId, pageNumber, pageSize, searchTerm, status, dateRange);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error orders. Error: {ErrorMessage}", response.Message);
			return StatusCode(response.Status, response);
		}

		[HttpPut("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<OrderDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<OrderDto>>> UpdateOrder(Guid id, [FromBody] OrderDto orderDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<OrderDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _orderService.UpdateOrderAsync(id, orderDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error updating order with Id: {Id}. Error: {ErrorMessage}", id, response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpGet("{id}/paid")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<OrderDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<OrderDto>>> UpdateOrderAsPaid(Guid id)
		{
			var response = await _orderService.UpdateOrderAsPaidAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error updating order with Id: {Id}. Error: {ErrorMessage}", id, response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<OrderDto>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<OrderDto>>> DeleteOrder(Guid id)
		{
			var response = await _orderService.DeleteOrderAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error deleting order with Id: {Id}. Error: {ErrorMessage}", id, response.Message);
			return StatusCode(response.StatusCode, response);
		}
	}
}