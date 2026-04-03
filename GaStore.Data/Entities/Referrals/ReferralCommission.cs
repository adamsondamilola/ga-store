using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Referrals
{
	public class ReferralCommission : EntityBase
	{
        public Guid CreatedBy { get; set; }
        public decimal Percentage { get; set; } = 0;
		public decimal MinAmount { get; set; } = 0;
		public decimal MaxAmount { get; set; } = 0;
		public bool IsDefault {  get; set; }
	}
}
