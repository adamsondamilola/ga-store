using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.OrdersDto;
//using GaStore.Data.Entities.Orders;

namespace GaStore.Data.Dtos.ReferralDto
{
	public class ReferralPurchaseDto
	{

		public Guid ReferralId { get; set; }
		public Guid OrderId { get; set; } // Associated purchase ID

		[Required]
		public decimal CommissionAmount { get; set; } // Commission earned for this purchase
	}
}
