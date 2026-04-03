using DocumentFormat.OpenXml.Bibliography;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Entities.Orders;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IOrderService
	{
		Task<ServiceResponse<OrderDto>> CreateOrderAsync(OrderDto orderDto, Guid UserId);
        Task<PaginatedServiceResponse<List<Order>>> GetOrdersAsync(
     int pageNumber,
     int pageSize,
     string searchTerm = null,
     string status = null,
     string dateRange = null,
     string couponCode = null,
     string userId = null,
     decimal? minAmount = null,
     decimal? maxAmount = null,
     string shippingStatus = null,
     string shippingState = null,
     string shippingCity = null,
     string shippingProvider = null,
     DateTime? startDate = null,
     DateTime? endDate = null,
     bool? hasDiscount = null,
     string sortBy = "datecreated",
     string sortDirection = "desc");

		Task<PaginatedServiceResponse<List<Order>>> GetUserOrdersAsync(
			Guid userId,
		int pageNumber,
		int pageSize,
		string searchTerm = null,
		string status = null,
		string dateRange = null
		);
		Task<ServiceResponse<Order>> GetOrderByIdAsync(string id);
		Task<ServiceResponse<OrderDto>> UpdateOrderAsync(Guid id, OrderDto orderDto, Guid UserId);
		Task<ServiceResponse<OrderSummaryDto>> OrderSummaryAsync(Guid UserId, OrderSummaryDto dto);
		Task<ServiceResponse<string>> UpdateOrderAsPaidAsync(Guid id, Guid UserId);
		Task<ServiceResponse<OrderDto>> DeleteOrderAsync(Guid id, Guid UserId);
	}
}
