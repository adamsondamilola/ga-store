using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class BrandDto
	{

		public Guid? Id { get; set; }
		[Required]
		[MaxLength(255)]
		public string Name { get; set; }

		[Required]
		[MaxLength(50)]
		public string Code { get; set; }

		public string? LogoUrl { get; set; }

		//public virtual ICollection<ProductDto>? ProductsDto { get; set; }
	}
}
