using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Entities.Orders;

namespace GaStore.Data.Dtos.CheckOutDto
{
	public class CheckOutDto
	{
		public string ModeOfPayment { get; set; } //Wallet, Payment Gateway
		public virtual ICollection<Order> Order { get; set; }
	}
}
