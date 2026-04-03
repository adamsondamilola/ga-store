using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Shippings
{
    public class ShippingProvider : EntityBase
    {
        public string Name { get; set; }
        public string Code { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
