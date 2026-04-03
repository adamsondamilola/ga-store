using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Entities.Orders
{
	public class Shipping : EntityBase
	{
		[Required]
		[MaxLength(255)]
		public string FullName { get; set; } // Full name of the recipient

		[Required]
		[MaxLength(255)]
		public string AddressLine1 { get; set; } // Address line 1

		[MaxLength(255)]
		public string? AddressLine2 { get; set; } // Address line 2 (optional)

		[Required]
		[MaxLength(100)]
		public string City { get; set; } // City

		[Required]
		[MaxLength(100)]
		public string State { get; set; } // State or region

		[MaxLength(20)]
		public string? PostalCode { get; set; } // Postal or ZIP code (optional)

		[Required]
		[MaxLength(100)]
		public string Country { get; set; } // Country

		[Required]
		[MaxLength(20)]
		public string PhoneNumber { get; set; } // Contact phone number

		[EmailAddress]
		public string? Email { get; set; } // Contact email (optional)

		public string? Status { get; set; } // Status: Pending, Canceled, Delivered

		[Required]
		public string ShippingMethod { get; set; } // Shipping method (e.g., Standard, Express)

		[Required]
		public decimal ShippingCost { get; set; } // Cost of shipping

		public DateTime EstimatedDeliveryDate { get; set; } // Estimated delivery date

		[Required]
		public Guid OrderId { get; set; }

        public string? ShippingProvider { get; set; }
        public string? ShippingProviderTrackingId { get; set; }
        public virtual Order Order { get; set; } // Navigation property to the order

		public Guid? UserId { get; set; }
		public virtual User User { get; set; } // Navigation property to the user

	}

}
