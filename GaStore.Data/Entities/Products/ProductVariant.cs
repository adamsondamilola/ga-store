using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
	public class ProductVariant : EntityBase
	{

		[Required]
		public Guid ProductId { get; set; }
        public string Name { get; set; } = string.Empty;

        [JsonIgnore]
		public virtual Product Product { get; set; }

		public string? Color { get; set; }
        public string? Size { get; set; }
        public decimal? Weight { get; set; }
        public string? Style { get; set; }
		public string SellerSKU { get; set; }
		public string? BarCode { get; set; }
		public int StockQuantity { get; set; }
		public int StockSold { get; set; }
        public DateTime? SaleStartDate { get; set; }
		public DateTime? SaleEndDate { get; set; }
		public virtual ICollection<PricingTier> PricingTiers { get; set; }
		public virtual ICollection<ProductImage> Images { get; set; } // List of images for this variant
	}
}
