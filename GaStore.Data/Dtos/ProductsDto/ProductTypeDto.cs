using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Products;

namespace GaStore.Data.Dtos.ProductsDto
{
    public class ProductTypeDto
    {
        public Guid? Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public string? ImageUrl { get; set; }

        [Required]
        public Guid SubCategoryId { get; set; }

        public SubCategoryDto? SubCategory { get; set; }

        public virtual ICollection<ProductSubTypeDto> ProductSubTypes { get; set; } = new List<ProductSubTypeDto>();

        public virtual ICollection<ProductDto> Products { get; set; } = new List<ProductDto>();
    }

    public class CreateProductTypeDto
    {
        public Guid? Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public string? ImageUrl { get; set; }

        [Required]
        public Guid SubCategoryId { get; set; }

        public IFormFile? ImageFile { get; set; }
    }
}
