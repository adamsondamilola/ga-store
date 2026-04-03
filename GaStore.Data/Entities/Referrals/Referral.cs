using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Entities.Referrals
{
	public class Referral : EntityBase
	{

		[Required]
		public Guid ReferrerId { get; set; } // The user who referred others
		public virtual User Referrer { get; set; } // Navigation property to the referrer user

		[Required]
		public Guid ReferralId { get; set; } // The user who was referred
		public virtual User Referra { get; set; } // Navigation property to the referred user

		public decimal TotalCommissionEarned { get; set; } = 0; // Total commission earned by the referrer from this referral

		public virtual ICollection<ReferralPurchase> Purchases { get; set; } // List of purchases linked to this referral
	}
}
