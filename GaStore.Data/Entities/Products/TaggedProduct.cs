using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
    public class TaggedProduct : EntityBase
    {
        public Guid ProductId { get; set; }
        public Guid TagId { get; set; }
        public Tag? Tag { get; set; }
        public Product? Product { get; set; }
    }
}
