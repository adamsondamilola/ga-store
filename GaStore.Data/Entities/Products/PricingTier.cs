using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
	public class PricingTier : EntityBase
	{
		
		[Required]
		public Guid ProductId { get; set; }
		[JsonIgnore]
		public virtual Product Product { get; set; }

		public Guid? VariantId { get; set; }
		[JsonIgnore]
		public virtual ProductVariant? Variant { get; set; }

		[Required]
		public int MinQuantity { get; set; }

		[Required]
		public decimal PricePerUnitGlobal { get; set; }
		public decimal PricePerUnit { get; set; } //sale price
	}
}
