using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.CouponsDto
{
    public class CouponDto
    {
        public Guid? Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int GlobalUsageLimit { get; set; }
        public int UsagePerUserLimit { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
        public bool IsActive { get; set; }
        public bool IsGlobal { get; set; }
        public List<CouponTierDto> Tiers { get; set; } = new();
    }

    public class CouponTierDto
    {
        public int UsageNumber { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal? FixedDiscountAmount { get; set; }
    }

    public class ApplyCouponRequestDto
    {
        public string Code { get; set; } = string.Empty;
        public decimal OrderTotal { get; set; }
    }

    public class ApplyCouponResultDto
    {
        public decimal Discount { get; set; }
        public decimal NewTotal { get; set; }
        public int UsageNumber { get; set; }
        public decimal DiscountPercentage { get; set; }
    }

    public class CouponUserDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public int UsageCount { get; set; }
        public DateTime? LastUsedDate { get; set; }
        public decimal TotalDiscountReceived { get; set; }
    }

}
