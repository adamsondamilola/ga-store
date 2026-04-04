using System.ComponentModel.DataAnnotations;

namespace GaStore.Data.Dtos.VouchersDto
{
    public class VoucherDto
    {
        public Guid? Id { get; set; }

        [Required]
        public string Code { get; set; } = string.Empty;

        public string PurchaserType { get; set; } = "Individual";
        public string? PurchaserName { get; set; }
        public string? ContactEmail { get; set; }
        public decimal InitialValue { get; set; }
        public decimal RemainingValue { get; set; }
        public string Currency { get; set; } = "NGN";
        public bool IsActive { get; set; } = true;
        public DateTime? ExpiresAt { get; set; }
        public string? Note { get; set; }
    }

    public class VoucherValidationDto
    {
        public string Code { get; set; } = string.Empty;
        public bool IsValid { get; set; }
        public string? PurchaserType { get; set; }
        public string? PurchaserName { get; set; }
        public decimal RemainingValue { get; set; }
        public string Currency { get; set; } = "NGN";
        public DateTime? ExpiresAt { get; set; }
        public string? Message { get; set; }
    }
}
