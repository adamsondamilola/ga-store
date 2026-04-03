using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Shippings
{
    public class PriceByWeight : EntityBase
    {
        public decimal MinWeight { get; set; }
        public decimal MaxWeight { get; set; }
        public decimal Price { get; set; }
        public Guid DeliveryLocationId { get; set; }
        public DeliveryLocation? DeliveryLocation { get; set; }
    }
}
