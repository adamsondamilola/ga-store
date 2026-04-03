using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Entities.Orders
{
	public class Order : EntityBase
	{
		public Guid? UserId { get; set; }
        public virtual User User { get; set; }
        public bool HasPaid { get; set; }
		public decimal Amount { get; set; } = 0;
        public decimal? AmountAfterDiscount { get; set; }
        public decimal? SubTotal { get; set; }
        public decimal? SubTotalAfterDiscount { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public string? CouponCode { get; set; }
        public decimal? DeliveryFee { get; set; }
        public decimal? Tax { get; set; }
        public string? PaymentGateway { get; set; }
        public string? PaymentGatewayTransactionId { get; set; }
        [Required]
		public DateTime OrderDate { get; set; }

		public virtual ICollection<OrderItem> Items { get; set; }
        
        public virtual Shipping Shipping { get; set; }
        public virtual ManualPayment? ManualPayment { get; set; }
    }
}
