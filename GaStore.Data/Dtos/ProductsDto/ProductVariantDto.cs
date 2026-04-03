using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class ProductVariantDto
	{
		public Guid? Id { get; set; }
		[Required]
		public Guid ProductId { get; set; }
		public string? Name { get; set; }
		public virtual ProductDto? ProductDto { get; set; }

		public string? Color { get; set; }
		public string? Size { get; set; }
		public string? Style { get; set; }
        public decimal? Weight { get; set; }
        public string SellerSKU { get; set; }
		public string? BarCode { get; set; }
		public int StockQuantity { get; set; }
        public int StockSold { get; set; }
        public DateTime? SaleStartDate { get; set; }
		public DateTime? SaleEndDate { get; set; }
		public virtual ICollection<PricingTierDto>? PricingTiersDto { get; set; }
		public List<IFormFile>? imageFiles { get; set; }
		
		public virtual ICollection<ProductImageDto>? Images { get; set; } // List of images for this variant

		public decimal? Price { get; set; }
	}
}
