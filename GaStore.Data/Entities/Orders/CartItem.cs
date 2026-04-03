using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Orders
{
    public class CartItem : EntityBase
    {
        public Guid CartId { get; set; }
        public Guid VariantId { get; set; }

        public int Quantity { get; set; }

        // Navigation
        public Cart Cart { get; set; }
    }
}
