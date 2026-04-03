using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Products;

namespace GaStore.Data.Entities.Shippings
{
    public class DeliveryLocation : EntityBase
    {
        [MaxLength(255)]
        public string? Code { get; set; }
        public string? PickupAddress { get; set; }
        public decimal? PickupDeliveryAmount { get; set; } = 0;
        public decimal? DoorDeliveryAmount { get; set; } = 0;

        [Required]
        [MaxLength(100)]
        public string City { get; set; } // City

        [Required]
        [MaxLength(100)]
        public string State { get; set; } // State or region

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
        public virtual ICollection<PriceByWeight> PriceByWeights { get; set; } = new List<PriceByWeight>();

    }
}
