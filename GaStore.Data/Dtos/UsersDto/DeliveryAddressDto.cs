using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Shippings;

namespace GaStore.Data.Dtos.UsersDto
{
	public class DeliveryAddressDto
	{
		public Guid? Id { get; set; }
		[Required]
		public Guid UserId { get; set; }
		public List<UserDto>? UsersDto { get; set; }
		public string FullName { get; set; }
		public string? PhoneNumber { get; set; }
		public bool? IsPrimary { get; set; }

		[MaxLength(255)]
		public string? Address { get; set; } // User's residential address (optional)

		[MaxLength(100)]
		public string? City { get; set; }
		public Guid? DeliveryLocationId { get; set; }

        [MaxLength(100)]
		public string? State { get; set; } // User's state or province (optional)

		[MaxLength(100)]
		public string? Country { get; set; }
        public decimal? Longitude { get; set; }
        public decimal? Latitude { get; set; }

    }

    public class DeliveryLocationDto
	{
		public Guid? Id { get; set; }
		[MaxLength(255)]
        public string? Code { get; set; }
        public string? PickupAddress { get; set; }
        public decimal? PickupDeliveryAmount { get; set; }
		public decimal? DoorDeliveryAmount { get; set; }
		
		[MaxLength(100)]
		public string? City { get; set; } // City

		
		[MaxLength(100)]
		public string? State { get; set; } // State or region

		[MaxLength(20)]
		public string? PostalCode { get; set; } // Postal or ZIP code (optional)

		
		[MaxLength(100)]
		public string? Country { get; set; } // Country

		[MaxLength(20)]
		public string? PhoneNumber { get; set; } // Contact phone number

		[EmailAddress]
		public string? Email { get; set; } // Contact email (optional)

		public bool IsActive { get; set; }
        public bool IsHomeDelivery { get; set; } = false;
        public int EstimatedDeliveryDays { get; set; } // Estimated delivery days
        public string? ShippingProvider { get; set; }
		public string? WorkingHours { get; set; }
		public string? HubName { get; set; }
        public List<PriceByWeightDto>? PriceByWeights { get; set; }

    }

    public class PriceByWeightDto
    {
        public decimal MinWeight { get; set; }
        public decimal MaxWeight { get; set; }
        public decimal Price { get; set; }
        public Guid? DeliveryLocationId { get; set; }
    }
}
