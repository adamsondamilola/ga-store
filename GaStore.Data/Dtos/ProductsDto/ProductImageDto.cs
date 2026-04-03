using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class ProductImageDto
	{
		public string? ImageUrl { get; set; }
		public List<IFormFile>? imageFiles { get; set; }
        public string[]? ImageUrls { get; set; }
        public string? Style { get; set; } 
		public Guid ProductId { get; set; }
		public Guid? VariantId { get; set; }
        public string? AltText { get; set; }
        public string? CloudinaryId { get; set; }

        public int DisplayOrder { get; set; } 
	}
}
