using System.ComponentModel.DataAnnotations;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Entities.Wallets
{
    public class VendorEarning : EntityBase
    {
        [Required]
        public Guid VendorId { get; set; }
        public virtual User Vendor { get; set; }

        [Required]
        public Guid OrderId { get; set; }
        public virtual Order Order { get; set; }

        [Required]
        public Guid OrderItemId { get; set; }
        public virtual OrderItem OrderItem { get; set; }

        public Guid? ProductId { get; set; }
        public virtual Product? Product { get; set; }

        public Guid? VendorPayoutId { get; set; }
        public virtual VendorPayout? VendorPayout { get; set; }

        [MaxLength(255)]
        public string? ProductName { get; set; }

        [MaxLength(255)]
        public string? VariantName { get; set; }

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal GrossAmount { get; set; }

        public decimal PlatformCommissionRate { get; set; }

        public decimal PlatformCommissionAmount { get; set; }

        public decimal FlatFeeAmount { get; set; }

        public decimal NetAmount { get; set; }

        [MaxLength(10)]
        public string Currency { get; set; } = "NGN";

        [MaxLength(50)]
        public string Status { get; set; } = "Available";

        public DateTime EarnedOn { get; set; } = DateTime.UtcNow;

        public DateTime? PaidOutOn { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
