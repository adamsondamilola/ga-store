using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class PricingTierDto
	{
		
		[Required]
		public Guid ProductId { get; set; }
		//public virtual ProductDto ProductDto { get; set; }

		public Guid? VariantId { get; set; }
		//public virtual ProductVariantDto? VariantDto { get; set; }

		[Required]
		public int MinQuantity { get; set; }

		[Required]
		public decimal PricePerUnitGlobal { get; set; }
		public decimal PricePerUnit { get; set; } //sale price
	}
}
