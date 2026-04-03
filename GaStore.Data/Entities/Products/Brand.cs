using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
	public class Brand : EntityBase
	{

		[Required]
		[MaxLength(255)]
		public string Name { get; set; }

		[Required]
		[MaxLength(50)]
		public string Code { get; set; }

		public string? LogoUrl { get; set; }

		public virtual ICollection<Product>? Products { get; set; }
	}
}
