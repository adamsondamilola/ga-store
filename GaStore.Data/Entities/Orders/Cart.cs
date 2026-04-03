using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.CheckOutDto;

namespace GaStore.Data.Entities.Orders
{
    public class Cart : EntityBase
    {
        public Guid UserId { get; set; }
        public List<CartItem> Items { get; set; } = new();
    }
}
