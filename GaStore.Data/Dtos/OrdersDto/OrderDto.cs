using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Dtos.OrdersDto
{
	public class OrderDto
	{
		public Guid? Id { get; set; }
        public Guid? UserId { get; set; }
        public string? PaymentGatewayTransactionId { get; set; }
        public string? PaymentGateway { get; set; }
        public Guid? VoucherId { get; set; }
        public string? VoucherCode { get; set; }
        public decimal? VoucherAmountApplied { get; set; }
        public virtual User User { get; set; }
        [Required]
		public bool HasPaid { get; set; }
		public decimal Amount { get; set; }
        public decimal? AmountAfterDiscount { get; set; }
        public decimal? SubTotal { get; set; }
        public decimal? SubTotalAfterDiscount { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public string? CouponCode { get; set; }
        public decimal? DeliveryFee { get; set; }
        public decimal? Tax { get; set; }
        public DateTime OrderDate { get; set; }

		public virtual ICollection<OrderItemDto> Items { get; set; }
        public ManualPaymentDto? ManualPayment { get; set; }
	}
}
