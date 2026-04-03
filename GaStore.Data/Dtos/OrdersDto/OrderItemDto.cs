using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;

namespace GaStore.Data.Dtos.OrdersDto
{
	public class OrderItemDto
	{
		public Guid? Id { get; set; }
		public Guid? UserId { get; set; }
		[Required]
		public Guid OrderId { get; set; }
		//public virtual OrderDto OrderDto { get; set; }

		public Guid? ProductId { get; set; }
		//public virtual ProductDto? ProductDto { get; set; }

		public Guid? VariantId { get; set; }
		//public virtual ProductVariantDto? VariantDto { get; set; }

		[Required]
		public int Quantity { get; set; }

		[Required]
		public decimal Price { get; set; }
	}
}
