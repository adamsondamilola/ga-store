using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Entities.Wallets
{
	public class Wallet : EntityBase
	{

		[Required]
		public Guid UserId { get; set; } // Associated user ID
		public virtual User User { get; set; } // Navigation property to the user

		[Required]
		public decimal Balance { get; set; } = 0.0m; // Current wallet balance

		[Required]
		public decimal Commission { get; set; } = 0.0m; // Total commission earned

		[Required]
		public decimal Withdrawn { get; set; } = 0.0m; // Total amount withdrawn by the user

		[Required]
		public decimal PendingWithdrawal { get; set; } = 0.0m; // Total amount pending withdrawal
		public virtual ICollection<Transaction> Transactions { get; set; } // List of transactions
	}
}
