using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.UsersDto;

namespace GaStore.Data.Dtos.ReferralDto
{
	public class ReferralDto
	{

		//[Required]
		public Guid ReferrerId { get; set; } 
		public Guid ReferralId { get; set; } // The user who was referred
		public virtual UserDto ReferraDto { get; set; } // Navigation property to the referred user
		public virtual UserDto ReferralUserDto { get; set; }
		public decimal TotalCommissionEarned { get; set; } = 0; // Total commission earned by the referrer from this referral

		public virtual ICollection<ReferralPurchaseDto> PurchasesDto { get; set; } // List of purchases linked to this referral
	}
}
