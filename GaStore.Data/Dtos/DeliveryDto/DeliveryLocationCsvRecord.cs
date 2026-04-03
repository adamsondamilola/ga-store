using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.DeliveryDto
{
	public class DeliveryLocationCsvRecord
	{
		public string City { get; set; }
		public string State { get; set; }
		public string Country { get; set; }
		public string PostalCode { get; set; }
		public string PhoneNumber { get; set; }
		public string Email { get; set; }
		public string PickupAddress { get; set; }
		public decimal? PickupDeliveryAmount { get; set; }
		public decimal? DoorDeliveryAmount { get; set; }
		public bool? IsActive { get; set; }
        public int? EstimatedDeliveryDays { get; set; }
        public bool? IsHomeDelivery { get; set; }
        public string? ShippingProvider { get; set; }
		public decimal WeightRangeOnePrice { get; set; } //0-1kg
		public decimal WeightRangeTwoPrice { get; set; } //1.1-2kg
		public decimal WeightRangeThreePrice { get; set; } //2.1-10kg
		public decimal WeightRangeFourPrice { get; set; } //10.1-20kg
    }
}
