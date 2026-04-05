using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
	public class Product : EntityBase
	{
		[Required]
        public Guid UserId { get; set; }
        [Required]
		[MaxLength(255)]
		public string Name { get; set; }
		public string? Description { get; set; }
		public string? Highlights { get; set; }
		public string? Weight { get; set; }

		public string? PrimaryColor { get; set; }
		public int StockQuantity { get; set; }
        public bool IsAvailable { get; set; }
		public bool IsApproved { get; set; } = false;

        public virtual ICollection<ProductVariant>? Variants { get; set; }

		public virtual ICollection<PricingTier>? PricingTiers { get; set; }

		public Guid? BrandId { get; set; }
		public Guid? CategoryId { get; set; }
		public Guid? SubCategoryId { get; set; }
        public Guid? ProductTypeId { get; set; }
        public Guid? ProductSubTypeId { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? DateApproved { get; set; } = DateTime.UtcNow;
        public virtual Category? Category { get; set; }
        public virtual SubCategory? SubCategory { get; set; }
        public virtual ProductType? ProductType { get; set; }
        public virtual ProductSubType? ProductSubType { get; set; }
        [JsonIgnore]
		public virtual Brand? Brand { get; set; }
		public virtual ICollection<ProductImage>? Images { get; set; } // List of product images
		public virtual ICollection<FeaturedProduct>? FeaturedEntries { get; set; } = new List<FeaturedProduct>();
		public virtual ICollection<LimitedOfferProduct>? LimitedOfferEntries { get; set; } = new List<LimitedOfferProduct>();
		public virtual ProductSpecification? Specifications { get; set; }
		public ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();

		//public virtual ICollection<ProductSpecification>? Specifications { get; set; } = new List<ProductSpecification>();
	}
}
