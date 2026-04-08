using System;
using System.ComponentModel.DataAnnotations;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Dtos.WalletsDto
{

	public class BankAccountDto
	{
        public Guid Id { get; set; }

		public Guid UserId { get; set; } // Associated user ID
		//public virtual User User { get; set; } // Navigation property to the user

		[Required]
		[MaxLength(255)]
		public string BankName { get; set; } // Name of the bank (e.g., "First Bank")

		[Required]
		[MaxLength(50)]
		public string AccountNumber { get; set; } // Bank account number

		[Required]
		[MaxLength(255)]
		public string AccountName { get; set; } // Name associated with the bank account

		[MaxLength(50)]
		public string? BankCode { get; set; } // Bank code required by payout gateways

		[MaxLength(50)]
		public string? SwiftCode { get; set; } // SWIFT/BIC code (optional)

		[MaxLength(50)]
		public string? RoutingNumber { get; set; } // Routing number (optional, used in some regions)

		[MaxLength(50)]
		public string? BranchCode { get; set; } // Branch code of the bank (optional)

		[MaxLength(100)]
		public string? Currency { get; set; } // Currency of the account (e.g., "USD", "NGN")

		[MaxLength(50)]
		public string? PreferredPayoutGateway { get; set; }

		public bool IsDefaultPayoutAccount { get; set; } = true;

		public bool IsPayoutVerified { get; set; }
	}

}
