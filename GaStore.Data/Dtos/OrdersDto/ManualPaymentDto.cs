using Microsoft.AspNetCore.Http;
using GaStore.Data.Dtos.WalletsDto;

namespace GaStore.Data.Dtos.OrdersDto
{
    public class ManualPaymentDto
    {
        public Guid? Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid UserId { get; set; }
        public Guid? BankAccountId { get; set; }
        public BankAccountDto? BankAccount { get; set; }
        public string Status { get; set; } = "AwaitingProof";
        public decimal AmountExpected { get; set; }
        public string? PaymentReference { get; set; }
        public string? CustomerNote { get; set; }
        public string? ProofImageUrl { get; set; }
        public DateTime? ProofUploadedAt { get; set; }
        public Guid? ReviewedByUserId { get; set; }
        public string? ReviewedByName { get; set; }
        public string? ReviewNote { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public List<BankAccountDto> AvailableAccounts { get; set; } = new();
    }

    public class SubmitManualPaymentProofDto
    {
        public Guid OrderId { get; set; }
        public Guid? BankAccountId { get; set; }
        public string? PaymentReference { get; set; }
        public string? CustomerNote { get; set; }
        public IFormFile ProofFile { get; set; }
    }

    public class ReviewManualPaymentDto
    {
        public string Status { get; set; } = string.Empty;
        public string? ReviewNote { get; set; }
    }
}
