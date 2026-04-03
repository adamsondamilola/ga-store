using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class OrderItemController : RootController
	{
		private readonly IOrderItemService _orderItemService;
		private readonly ILogger<OrderItemController> _logger;

		public OrderItemController(
			IOrderItemService orderItemService,
			ILogger<OrderItemController> logger)
		{
			_orderItemService = orderItemService;
			_logger = logger;
		}

		[HttpPost]
		[ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<OrderItemDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<OrderItemDto>>> CreateOrderItem([FromBody] OrderItemDto orderItemDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<OrderItemDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _orderItemService.CreateOrderItemAsync(orderItemDto, UserId);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetOrderItemById), new { id = response.Data?.OrderId }, response);
			}

			_logger.LogError("Error creating order item: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[HttpGet("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<OrderItemDto>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<OrderItemDto>>> GetOrderItemById(Guid id)
		{
			var response = await _orderItemService.GetOrderItemByIdAsync(id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error retrieving order item with Id: {Id}. Error: {ErrorMessage}", id, response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[HttpPut("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<OrderItemDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<OrderItemDto>>> UpdateOrderItem(Guid id, [FromBody] OrderItemDto orderItemDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<OrderItemDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _orderItemService.UpdateOrderItemAsync(id, orderItemDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error updating order item with Id: {Id}. Error: {ErrorMessage}", id, response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[HttpDelete("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<OrderItemDto>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<OrderItemDto>>> DeleteOrderItem(Guid id)
		{
			var response = await _orderItemService.DeleteOrderItemAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error deleting order item with Id: {Id}. Error: {ErrorMessage}", id, response.Message);
			return StatusCode(response.StatusCode, response);
		}
	}
}