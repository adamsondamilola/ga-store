using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Referrals;
using GaStore.Data.Entities.Wallets;

namespace GaStore.Data.Dtos.UsersDto
{
    public class UserDto
    {
		public Guid? Id { get; set; } 
		public string? Username { get; set; } // Username for login
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
		public string Email { get; set; }    // Email address
        public string Password { get; set; } // Hashed password for security
        public string PasswordConfirmation { get; set; }
        public string? Referrer { get; set; }

        //public bool IsActive { get; set; }   // Indicates if the user is active
        //public bool IsEmailVerified { get; set; }   // Indicates if the email is verified
        public virtual UserProfileDto? ProfileDto { get; set; }
		
		public virtual ICollection<Referral>? Referrals { get; set; } // Referrals made by the user
		public ICollection<ProductReview>? Reviews { get; set; } = new List<ProductReview>();

		//public virtual ICollection<BankAccount> BankAccounts { get; set; } = new List<BankAccount>(); // Navigation property for bank accounts
		//public List<RoleDto> RolesDto { get; set; } // Roles assigned to the user

		//public UserDto() => RolesDto = new List<RoleDto>();
		public string? DateCreated { get; set; }
	}

    public class CreateUserDto
    {
        public Guid? Id { get; set; }
        public string? Username { get; set; } // Username for login
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string Email { get; set; }    // Email address
        public bool IsAdmin { get; set; } = false;
        public bool IsSuperAdmin { get; set; } = false;
        public virtual UserProfileDto? ProfileDto { get; set; }

        public virtual ICollection<Referral>? Referrals { get; set; } // Referrals made by the user
        public ICollection<ProductReview>? Reviews { get; set; } = new List<ProductReview>();
    }

    public class MakeAdminDto
    {
        public Guid? Id { get; set; }
        public bool IsAdmin { get; set; } = false;
        public bool IsSuperAdmin { get; set; } = false;
    }
}
