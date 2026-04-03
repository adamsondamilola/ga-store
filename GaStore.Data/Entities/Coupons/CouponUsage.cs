using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Coupons
{
    public class CouponUsage : EntityBase
    {
        public Guid CouponId { get; set; }
        public Guid UserId { get; set; }
        public int UsageCount { get; set; } = 0;
        public Coupon Coupon { get; set; } = default!;
    }

}
