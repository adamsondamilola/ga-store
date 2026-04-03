using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Users;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class OrderItemService : IOrderItemService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<OrderItemService> _logger;

		public OrderItemService(
			IUnitOfWork unitOfWork,
			IMapper mapper,
			ILogger<OrderItemService> logger)
		{
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
		}

		public async Task<ServiceResponse<OrderItemDto>> CreateOrderItemAsync(OrderItemDto orderItemDto, Guid UserId)
		{
			var response = new ServiceResponse<OrderItemDto>();

			try
			{
				// Validate the DTO
				if (orderItemDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Order item data is required.";
					return response;
				}
				orderItemDto.UserId = UserId;

				//check if order item exists
				var orderItem_ = await _unitOfWork.OrderItemRepository.Get(o => o.ProductId == orderItemDto.ProductId && o.Quantity == orderItemDto.Quantity && o.VariantId == orderItemDto.VariantId && o.UserId == orderItemDto.UserId && o.OrderId == orderItemDto.OrderId);
				if(orderItem_ == null)
				{
                // Map DTO to entity
                var orderItem = _mapper.Map<OrderItem>(orderItemDto);
                // Add to database
                await _unitOfWork.OrderItemRepository.Add(orderItem);
				await _unitOfWork.CompletedAsync(UserId	);

				// Map entity back to DTO
				var savedOrderItemDto = _mapper.Map<OrderItemDto>(orderItem);

                }

                // Return success response
                response.StatusCode = 201;
				response.Message = "Order item created successfully.";
				response.Data = orderItemDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating order item for OrderId: {OrderId}", orderItemDto.OrderId);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<OrderItemDto>> GetOrderItemByIdAsync(Guid id)
		{
			var response = new ServiceResponse<OrderItemDto>();

			try
			{
				// Find the order item by ID
				var orderItem = await _unitOfWork.OrderItemRepository.GetById(id);

				if (orderItem == null)
				{
					response.StatusCode = 404;
					response.Message = "Order item not found.";
					return response;
				}

				// Map entity to DTO
				var orderItemDto = _mapper.Map<OrderItemDto>(orderItem);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Order item retrieved successfully.";
				response.Data = orderItemDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving order item with Id: {Id}", id);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<OrderItemDto>> UpdateOrderItemAsync(Guid id, OrderItemDto orderItemDto, Guid UserId)
		{
			var response = new ServiceResponse<OrderItemDto>();

			try
			{
				// Validate the DTO
				if (orderItemDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Order item data is required.";
					return response;
				}

				// Find the order item by ID
				var orderItem = await _unitOfWork.OrderItemRepository.GetById(id);

				if (orderItem == null)
				{
					response.StatusCode = 404;
					response.Message = "Order item not found.";
					return response;
				}

				// Update the order item
				_mapper.Map(orderItemDto, orderItem);

				// Save changes
				await _unitOfWork.OrderItemRepository.Upsert(orderItem);
				await _unitOfWork.CompletedAsync(UserId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Order item updated successfully.";
				response.Data = orderItemDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating order item with Id: {Id}", id);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<OrderItemDto>> DeleteOrderItemAsync(Guid id, Guid UserId)
		{
			var response = new ServiceResponse<OrderItemDto>();

			try
			{
				// Find the order item by ID
				var orderItem = await _unitOfWork.OrderItemRepository.GetById(id);

				if (orderItem == null)
				{
					response.StatusCode = 404;
					response.Message = "Order item not found.";
					return response;
				}

				// Delete the order item
				await _unitOfWork.OrderItemRepository.Remove(orderItem.Id);
				await _unitOfWork.CompletedAsync(UserId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Order item deleted successfully.";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting order item with Id: {Id}", id);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}
	}
}