using System.ComponentModel.DataAnnotations;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Entities.System
{
    public class Voucher : EntityBase
    {
        [Required]
        [MaxLength(100)]
        public string Code { get; set; } = string.Empty;

        [MaxLength(32)]
        public string PurchaserType { get; set; } = "Individual";

        [MaxLength(255)]
        public string? PurchaserName { get; set; }

        [MaxLength(255)]
        public string? ContactEmail { get; set; }

        public decimal InitialValue { get; set; }
        public decimal RemainingValue { get; set; }

        [MaxLength(16)]
        public string Currency { get; set; } = "NGN";

        public bool IsActive { get; set; } = true;
        public DateTime? ExpiresAt { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        public Guid? CreatedByUserId { get; set; }
        public virtual User? CreatedByUser { get; set; }

        public virtual ICollection<VoucherRedemption> Redemptions { get; set; } = new List<VoucherRedemption>();
    }

    public class VoucherRedemption : EntityBase
    {
        public Guid VoucherId { get; set; }
        public virtual Voucher Voucher { get; set; } = null!;

        public Guid OrderId { get; set; }
        public virtual Order Order { get; set; } = null!;

        public Guid UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public decimal AmountRedeemed { get; set; }
        public decimal BalanceBefore { get; set; }
        public decimal BalanceAfter { get; set; }
    }
}
