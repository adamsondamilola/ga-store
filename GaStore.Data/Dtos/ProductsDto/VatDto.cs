using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class VatDto
	{
		public Guid? Id { get; set; }
		public decimal Percentage { get; set; }
		public bool IsActive { get; set; } = true;
	}
}
