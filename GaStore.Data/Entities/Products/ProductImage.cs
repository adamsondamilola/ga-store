using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
	public class ProductImage : EntityBase
	{
		public string? ImageUrl { get; set; }
		public string? Style { get; set; } // Style of the image (e.g., "Front View", "Side View")
        public string? CloudinaryId { get; set; }
        public Guid ProductId { get; set; } 
		public Guid? VariantId { get; set; } 
		public virtual Product? Product { get; set; } 
		public virtual ProductVariant? Variant { get; set; } 
		public string? AltText { get; set; }

		public int DisplayOrder { get; set; } // Order of the image display
	}
}
