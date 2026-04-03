using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Users
{
	
	public class UserProfile : EntityBase
	{
		[Required]
		public Guid UserId { get; set; } // Foreign key to the User model
		public virtual User User { get; set; } // Navigation property

		[Required]
		[MaxLength(255)]
		public string FirstName { get; set; } // User's first name

		[Required]
		[MaxLength(255)]
		public string LastName { get; set; } // User's last name

		[MaxLength(255)]
		public string? MiddleName { get; set; } // User's middle name (optional)

		[Required]
		[EmailAddress]
		public string Email { get; set; } // User's email address

		[Phone]
		public string? PhoneNumber { get; set; } // User's phone number (optional)

		[MaxLength(255)]
		public string? Address { get; set; } // User's residential address (optional)

		[MaxLength(100)]
		public string? City { get; set; } // User's city (optional)

		[MaxLength(100)]
		public string? State { get; set; } // User's state or province (optional)

		[MaxLength(100)]
		public string? Country { get; set; } // User's country (optional)

		public DateTime? DateOfBirth { get; set; } // User's date of birth (optional)

		[MaxLength(50)]
		public string? Gender { get; set; } // User's gender (optional)

		public string? ProfilePictureUrl { get; set; } // URL to the user's profile picture (option
	}

}
