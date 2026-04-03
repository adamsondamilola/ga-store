using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
    public class ProductType : EntityBase
    {
        [Required, MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public string? ImageUrl { get; set; }

        [Required]
        public Guid SubCategoryId { get; set; }

        [ForeignKey(nameof(SubCategoryId))]
        public SubCategory? SubCategory { get; set; }

        [JsonIgnore]
        public virtual ICollection<ProductSubType> ProductSubTypes { get; set; } = new List<ProductSubType>();

        [JsonIgnore]
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }

}
