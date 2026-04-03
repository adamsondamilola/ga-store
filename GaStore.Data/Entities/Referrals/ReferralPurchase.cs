using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Orders;

namespace GaStore.Data.Entities.Referrals
{
	public class ReferralPurchase : EntityBase
	{

		[Required]
		public Guid ReferralId { get; set; } // Associated referral ID
		public virtual Referral Referral { get; set; } // Navigation property to the referral

		[Required]
		public Guid OrderId { get; set; } // Associated purchase ID
		public virtual Order Order { get; set; } // Navigation property to the purchase

		[Required]
		public decimal CommissionAmount { get; set; } // Commission earned for this purchase
	}
}
