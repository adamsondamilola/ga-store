using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.ReferralDto
{
	public class ReferralCommissionDto
	{
		public Guid? Id { get; set; }
		public decimal Percentage { get; set; } = 0;
		public decimal MinAmount { get; set; } = 0;
		public decimal MaxAmount { get; set; } = 0;
		public bool IsDefault { get; set; }
	}
}
