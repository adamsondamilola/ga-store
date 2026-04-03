using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
	public class Vat : EntityBase
	{
		public decimal Percentage { get; set; }
		public bool IsActive { get; set; } = true;
	}
}
