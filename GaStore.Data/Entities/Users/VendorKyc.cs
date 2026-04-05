using GaStore.Data.Enums;

namespace GaStore.Data.Entities.Users
{
    public class VendorKyc : EntityBase
    {
        public Guid UserId { get; set; }
        public string? LivePictureUrl { get; set; }
        public string? ValidIdUrl { get; set; }
        public string? BusinessCertificateUrl { get; set; }
        public string? IdType { get; set; }
        public string? BusinessName { get; set; }
        public string? BusinessAddress { get; set; }
        public KycStatus Status { get; set; } = KycStatus.NotStarted;
        public string? RejectionReason { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public Guid? ReviewedByAdminId { get; set; }

        public virtual User User { get; set; } = null!;
        public virtual User? ReviewedByAdmin { get; set; }
    }
}
