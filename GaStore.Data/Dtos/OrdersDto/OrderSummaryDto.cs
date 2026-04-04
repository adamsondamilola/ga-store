using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.OrdersDto
{
	public class OrderSummaryDto
	{
		public bool IsDoorStepDelivery { get; set; }
		public decimal SubTotal { get; set; }
        public decimal? SubTotalAfterDiscount { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public string? CouponCode { get; set; }
        public decimal DeliveryFee { get; set; }
		public decimal DoorStepDeliveryFee { get; set; }
		public decimal PickupLocationDeliveryFee { get; set; }
		public decimal Tax { get; set; }
        public decimal Total { get; set; }
        public decimal? TotalAfterDiscount { get; set; }
        public string? State { get; set; }
        public string? City { get; set; }
        public string? ShippingProvider { get; set; }
        public string? CustomerAddress { get; set; }
		public string? CustomerPhone { get; set; }
		public string? FullName { get; set; }
		public string? DeliveryAddress { get; set; }
		public int? DeliveryDays { get; set; } = 0;
        public Guid? OrderId { get; set; }
        public string? PaymentGatewayTransactionId { get; set; }
        public string? PaymentGateway { get; set; }
        public string? VoucherCode { get; set; }
        public decimal? VoucherAmountApplied { get; set; }
        public List<CartProducts>? CartProducts { get; set; }
	}

	public class CartProducts
	{
		public Guid ProductId { get; set; }
		public Guid VariantId { get; set; }
		public int Quantity { get; set; }
	}
}
