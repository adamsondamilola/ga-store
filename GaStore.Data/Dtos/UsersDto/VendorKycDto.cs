using Microsoft.AspNetCore.Http;
using GaStore.Data.Enums;

namespace GaStore.Data.Dtos.UsersDto
{
    public class VendorKycUpsertDto
    {
        public string? BusinessName { get; set; }
        public string? BusinessAddress { get; set; }
        public string? IdType { get; set; }
        public IFormFile? LivePicture { get; set; }
        public IFormFile? ValidId { get; set; }
        public IFormFile? BusinessCertificate { get; set; }
        public bool SubmitForReview { get; set; }
    }

    public class VendorKycDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? LivePictureUrl { get; set; }
        public string? ValidIdUrl { get; set; }
        public string? BusinessCertificateUrl { get; set; }
        public string? IdType { get; set; }
        public string? BusinessName { get; set; }
        public string? BusinessAddress { get; set; }
        public KycStatus Status { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public Guid? ReviewedByAdminId { get; set; }
        public string? VendorName { get; set; }
        public string? VendorEmail { get; set; }
    }

    public class VendorKycStatusDto
    {
        public bool IsVendor { get; set; }
        public bool CanPost { get; set; }
        public KycStatus KycStatus { get; set; }
        public VendorKycDto? Kyc { get; set; }
    }

    public class VendorModerationDecisionDto
    {
        public string? Reason { get; set; }
    }

    public class BecomeVendorDto
    {
        public bool IsVendor { get; set; } = true;
    }
}
