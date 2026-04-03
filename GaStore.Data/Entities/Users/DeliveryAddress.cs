using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.UsersDto;

namespace GaStore.Data.Entities.Users
{
	public class DeliveryAddress : EntityBase
	{
		[Required]
		public Guid UserId { get; set; }
		public List<User>? Users { get; set; }
		public string FullName { get; set; }
		public bool? IsPrimary { get; set; }
		public string? PhoneNumber { get; set; } // User's phone number (optional)

		[MaxLength(255)]
		public string? Address { get; set; } // User's residential address (optional)

		[MaxLength(100)]
		public string? City { get; set; } // User's city (optional)

		[MaxLength(100)]
		public string? State { get; set; } // User's state or province (optional)

		[MaxLength(100)]
		public string? Country { get; set; } // User's country (optional)
        public Guid? DeliveryLocationId { get; set; }
        public decimal? Longitude { get; set; }
        public decimal? Latitude { get; set; }
    }
}
