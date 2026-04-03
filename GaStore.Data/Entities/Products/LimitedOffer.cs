using System.ComponentModel.DataAnnotations;

namespace GaStore.Data.Entities.Products
{
    public class LimitedOffer : EntityBase
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Subtitle { get; set; }

        [MaxLength(100)]
        public string? BadgeText { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = true;

        public bool ShowOnHomepage { get; set; } = true;

        [MaxLength(100)]
        public string? CtaText { get; set; }

        [MaxLength(500)]
        public string? CtaLink { get; set; }

        [MaxLength(1000)]
        public string? BackgroundImageUrl { get; set; }

        public int DisplayOrder { get; set; }

        public virtual ICollection<LimitedOfferProduct> Products { get; set; } = new List<LimitedOfferProduct>();
    }
}
