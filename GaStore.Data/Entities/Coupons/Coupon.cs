using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Coupons
{
    public class Coupon : EntityBase
    {
        public string Code { get; set; } = default!;
        public string Description { get; set; } = string.Empty;
        public Guid CreatedBy { get; set; }
        public int GlobalUsageLimit { get; set; } = 0; // Total times coupon can be used
        public int UsagePerUserLimit { get; set; } = 0; // Max per user
        public DateTime ValidFrom { get; set; } = DateTime.UtcNow;
        public DateTime ValidTo { get; set; } = DateTime.UtcNow.AddMonths(1);
        public bool IsActive { get; set; } = true;

        // Optional scope
        public bool IsGlobal { get; set; } = true; // true = global; false = user-specific

        // Navigation
        public ICollection<CouponTier> Tiers { get; set; } = new List<CouponTier>();
        public ICollection<CouponUsage> Usages { get; set; } = new List<CouponUsage>();
    }

}
