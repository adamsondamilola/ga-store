using System.ComponentModel.DataAnnotations;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Entities.Wallets
{
    public class VendorPayout : EntityBase
    {
        [Required]
        public Guid VendorId { get; set; }
        public virtual User Vendor { get; set; }

        [Required]
        public Guid BankAccountId { get; set; }
        public virtual BankAccount BankAccount { get; set; }

        [Required]
        public Guid ProcessedByAdminId { get; set; }
        public virtual User ProcessedByAdmin { get; set; }

        [MaxLength(50)]
        public string Gateway { get; set; } = "Paystack";

        [MaxLength(50)]
        public string Status { get; set; } = "Processing";

        public decimal GrossAmount { get; set; }

        public decimal PlatformCommissionAmount { get; set; }

        public decimal FlatFeeAmount { get; set; }

        public decimal NetAmount { get; set; }

        public int EarningsCount { get; set; }

        [MaxLength(150)]
        public string? Reference { get; set; }

        [MaxLength(150)]
        public string? ExternalTransferId { get; set; }

        [MaxLength(500)]
        public string? FailureReason { get; set; }

        public DateTime InitiatedOn { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedOn { get; set; }

        public virtual ICollection<VendorEarning> Earnings { get; set; } = new List<VendorEarning>();
    }
}
