using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ProductsDto;

namespace GaStore.Data.Entities.Products
{
    public class Category : EntityBase
    {
        [Required, MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public string? ImageUrl { get; set; }

        [JsonIgnore]
        public virtual ICollection<SubCategory> SubCategories { get; set; } = new List<SubCategory>();
        
        [JsonIgnore]
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }

}
