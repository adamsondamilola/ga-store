using GaStore.Data.Entities.Users;
using GaStore.Data.Entities.Wallets;

namespace GaStore.Data.Entities.Orders
{
    public class ManualPayment : EntityBase
    {
        public Guid OrderId { get; set; }
        public virtual Order Order { get; set; }

        public Guid UserId { get; set; }
        public virtual User User { get; set; }

        public Guid? BankAccountId { get; set; }
        public virtual BankAccount? BankAccount { get; set; }

        public string Status { get; set; } = "AwaitingProof";
        public decimal AmountExpected { get; set; }
        public string? PaymentReference { get; set; }
        public string? CustomerNote { get; set; }
        public string? ProofImageUrl { get; set; }
        public DateTime? ProofUploadedAt { get; set; }

        public Guid? ReviewedByUserId { get; set; }
        public virtual User? ReviewedByUser { get; set; }
        public string? ReviewNote { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}
