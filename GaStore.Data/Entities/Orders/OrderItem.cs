using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Products;

namespace GaStore.Data.Entities.Orders
{
	public class OrderItem : EntityBase
	{
		[Required]
		public Guid? UserId { get; set; }
		[Required]
		public Guid OrderId { get; set; }
		public virtual Order Order { get; set; }

		public Guid? ProductId { get; set; }
		public virtual Product? Product { get; set; }

		public Guid? VariantId { get; set; }
		public virtual ProductVariant? Variant { get; set; }

		[Required]
		public int Quantity { get; set; }

		[Required]
		public decimal Price { get; set; }
	}
}
