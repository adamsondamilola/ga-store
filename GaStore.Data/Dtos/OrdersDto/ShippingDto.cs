using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.UsersDto;

namespace GaStore.Data.Dtos.OrdersDto
{
	public class ShippingDto
	{
		[MaxLength(255)]
		public string? FullName { get; set; } // Full name of the recipient

		[MaxLength(255)]
		public string? AddressLine1 { get; set; } // Address line 1

		public string? AddressLine2 { get; set; } // Address line 2 (optional)

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

		public string? Status { get; set; } // Status: Pending, Canceled, Delivered

		public string? ShippingMethod { get; set; } // Shipping method (e.g., Standard, Express)

		public decimal ShippingCost { get; set; } // Cost of shipping

		public DateTime EstimatedDeliveryDate { get; set; } // Estimated delivery date

		public Guid? OrderId { get; set; }
        //public virtual OrderDto OrderDto { get; set; } // Navigation property to the order
        public string? ShippingProvider { get; set; }
        public string? ShippingProviderTrackingId { get; set; }
        public Guid? UserId { get; set; }
		public DateTime DateUpdated { get; set; }
		//public virtual UserDto UserDto { get; set; } // Navigation property to the user

	}

    public class UpdateShippingProviderTrackingIdDto
    {
        public Guid ShippingId { get; set; }
        public string? ShippingProviderTrackingId { get; set; }
    }
    public class UpdateShippingProviderDto
    {
        public string? ShippingProvider { get; set; }
        public string? ShippingProviderTrackingId { get; set; }
    }

    public class UpdateBulkShippingDto
	{
		public Guid Id { get; set; }
		public string? Status { get; set; }
	}
}
