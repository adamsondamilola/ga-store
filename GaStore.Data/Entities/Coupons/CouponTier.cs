using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Coupons
{
    public class CouponTier : EntityBase
    {
        public Guid CouponId { get; set; }
        public int UsageNumber { get; set; } // 1 = first use, 2 = second, etc.
        public decimal DiscountPercentage { get; set; } // 10 = 10%
        public decimal? FixedDiscountAmount { get; set; } // optional for ₦-based discounts
        public Coupon Coupon { get; set; } = default!;
    }

}
