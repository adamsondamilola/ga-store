using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Referrals;
using GaStore.Data.Entities.Wallets;

namespace GaStore.Data.Entities.Users
{
    public class User : EntityBase
    {
		public string? Username { get; set; } // Username for login
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
		public string Email { get; set; }    // Email address
        public string Password { get; set; } // Hashed password for security
        public bool IsActive { get; set; }   // Indicates if the user is active
        public bool IsBlocked { get; set; } = false;  // Indicates if the user is active
        public bool IsAdmin { get; set; } = false;
        public bool IsSuperAdmin { get; set; } = false;
        public bool IsEmailVerified { get; set; }   // Indicates if the email is verified
        public string? Referrer { get; set; }
        public virtual UserProfile Profile { get; set; }
		public virtual ICollection<Referral> Referrals { get; set; } // Referrals made by the user
		public virtual ICollection<BankAccount> BankAccounts { get; set; } = new List<BankAccount>(); // Navigation property for bank accounts
		public List<Role> Roles { get; set; } // Roles assigned to the user

        public User() => Roles = new List<Role>();
		public ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();

	}
}
