using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.WalletsDto
{
	public class TransactionDto
	{
		public Guid UserId { get; set; }
		public Guid? OrderId { get; set; } // Associated Order ID
		[Required]
		public Guid WalletId { get; set; } // Associated wallet ID
		//public virtual WalletDto WalletDto { get; set; } // Navigation property to the wallet

		[Required]
		public decimal Amount { get; set; } // Amount of the transaction (can be positive or negative)

		[Required]
		public string TransactionType { get; set; } // Type of transaction (e.g., "Credit", "Debit")
		public string Status { get; set; } // Type of transaction (e.g., "Pending", "Completed", "Canceled")
		public string? TransactionId { get; set; }
		public string? Description { get; set; } // Optional transaction description

	}
}
