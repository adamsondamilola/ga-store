using System.ComponentModel.DataAnnotations;

namespace GaStore.Data.Dtos.WalletsDto
{
    public class VendorEarningDto
    {
        public Guid Id { get; set; }
        public Guid VendorId { get; set; }
        public string? VendorName { get; set; }
        public Guid OrderId { get; set; }
        public Guid OrderItemId { get; set; }
        public Guid? ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? VariantName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal GrossAmount { get; set; }
        public decimal PlatformCommissionRate { get; set; }
        public decimal PlatformCommissionAmount { get; set; }
        public decimal FlatFeeAmount { get; set; }
        public decimal NetAmount { get; set; }
        public string Currency { get; set; } = "NGN";
        public string Status { get; set; } = "Available";
        public DateTime EarnedOn { get; set; }
        public DateTime? PaidOutOn { get; set; }
        public Guid? VendorPayoutId { get; set; }
    }

    public class VendorEarningsOverviewDto
    {
        public decimal TotalGrossAmount { get; set; }
        public decimal TotalPlatformCommissionAmount { get; set; }
        public decimal TotalFlatFeeAmount { get; set; }
        public decimal TotalNetAmount { get; set; }
        public decimal TotalPaidAmount { get; set; }
        public decimal TotalOutstandingAmount { get; set; }
        public decimal TotalReadyForPayoutAmount { get; set; }
        public int TotalEarningsCount { get; set; }
        public int PaidEarningsCount { get; set; }
        public int OutstandingEarningsCount { get; set; }
        public bool HasDefaultPayoutAccount { get; set; }
        public string? DefaultPayoutGateway { get; set; }
        public DateTime? LastPayoutDate { get; set; }
        public DateTime NextWeekendPayoutDate { get; set; }
    }

    public class VendorPayoutDto
    {
        public Guid Id { get; set; }
        public Guid VendorId { get; set; }
        public string? VendorName { get; set; }
        public Guid BankAccountId { get; set; }
        public string? BankName { get; set; }
        public string? AccountName { get; set; }
        public string? AccountNumberMasked { get; set; }
        public string Gateway { get; set; } = "Paystack";
        public string Status { get; set; } = "Processing";
        public decimal GrossAmount { get; set; }
        public decimal PlatformCommissionAmount { get; set; }
        public decimal FlatFeeAmount { get; set; }
        public decimal NetAmount { get; set; }
        public int EarningsCount { get; set; }
        public string? Reference { get; set; }
        public string? ExternalTransferId { get; set; }
        public string? FailureReason { get; set; }
        public DateTime InitiatedOn { get; set; }
        public DateTime? CompletedOn { get; set; }
    }

    public class VendorPayoutCandidateDto
    {
        public Guid VendorId { get; set; }
        public string? VendorName { get; set; }
        public string? VendorEmail { get; set; }
        public Guid? BankAccountId { get; set; }
        public string? BankName { get; set; }
        public string? AccountName { get; set; }
        public string? AccountNumberMasked { get; set; }
        public string? PreferredPayoutGateway { get; set; }
        public bool HasEligibleBankAccount { get; set; }
        public int EarningsCount { get; set; }
        public int OrderCount { get; set; }
        public decimal GrossAmount { get; set; }
        public decimal PlatformCommissionAmount { get; set; }
        public decimal FlatFeeAmount { get; set; }
        public decimal NetAmount { get; set; }
        public DateTime? OldestEarningDate { get; set; }
        public DateTime? LatestEarningDate { get; set; }
    }

    public class ProcessVendorPayoutRequestDto
    {
        public Guid? VendorId { get; set; }

        [MaxLength(50)]
        public string? Gateway { get; set; }
    }
}
