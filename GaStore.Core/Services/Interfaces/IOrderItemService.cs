using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IOrderItemService
	{
		Task<ServiceResponse<OrderItemDto>> CreateOrderItemAsync(OrderItemDto orderItemDto, Guid UserId);
		Task<ServiceResponse<OrderItemDto>> GetOrderItemByIdAsync(Guid id);
		Task<ServiceResponse<OrderItemDto>> UpdateOrderItemAsync(Guid id, OrderItemDto orderItemDto, Guid UserId);
		Task<ServiceResponse<OrderItemDto>> DeleteOrderItemAsync(Guid id, Guid UserId);

	}
}
