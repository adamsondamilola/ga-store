using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
    public class SubCategory : EntityBase
    {
        [Required]
        public Guid CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public Category? Category { get; set; }

        [Required, MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        public bool HasColors { get; set; }
        public bool HasSizes { get; set; }
        public bool HasStyles { get; set; }
        public bool IsActive { get; set; } = true;
        public string? ImageUrl { get; set; }

        [JsonIgnore]
        public virtual ICollection<ProductType> ProductTypes { get; set; } = new List<ProductType>();

        [JsonIgnore]
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }

}