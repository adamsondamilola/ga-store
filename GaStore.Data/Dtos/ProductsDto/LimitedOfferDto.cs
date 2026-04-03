using System.ComponentModel.DataAnnotations;

namespace GaStore.Data.Dtos.ProductsDto
{
    public class LimitedOfferProductAssignmentDto
    {
        public Guid? Id { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        public int DisplayOrder { get; set; }
    }

    public class LimitedOfferUpsertDto
    {
        public Guid? Id { get; set; }

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

        public List<LimitedOfferProductAssignmentDto> Products { get; set; } = new();
    }

    public class LimitedOfferListDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? BadgeText { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public bool ShowOnHomepage { get; set; }
        public string? CtaText { get; set; }
        public string? CtaLink { get; set; }
        public string? BackgroundImageUrl { get; set; }
        public int DisplayOrder { get; set; }
        public int ProductCount { get; set; }
        public bool IsLive { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? DateCreated { get; set; }
        public DateTime? DateUpdated { get; set; }
    }

    public class LimitedOfferDetailsDto : LimitedOfferUpsertDto
    {
        public bool IsLive { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? DateCreated { get; set; }
        public DateTime? DateUpdated { get; set; }
        public List<LimitedOfferAssignedProductDto> AssignedProducts { get; set; } = new();
    }

    public class LimitedOfferAssignedProductDto
    {
        public Guid? Id { get; set; }
        public Guid ProductId { get; set; }
        public int DisplayOrder { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsApproved { get; set; }
        public string? ImageUrl { get; set; }
        public decimal? Price { get; set; }
        public decimal? OriginalPrice { get; set; }
    }

    public class LimitedOfferHomepageDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? BadgeText { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public bool ShowOnHomepage { get; set; }
        public string? CtaText { get; set; }
        public string? CtaLink { get; set; }
        public string? BackgroundImageUrl { get; set; }
        public int DisplayOrder { get; set; }
        public List<LimitedOfferHomepageProductDto> Products { get; set; } = new();
    }

    public class LimitedOfferHomepageProductDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsApproved { get; set; }
        public List<ProductVariantDto> VariantsDto { get; set; } = new();
        public List<ProductImageDto> Images { get; set; } = new();
    }
}
