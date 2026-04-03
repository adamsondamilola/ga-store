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

    public class ProductSubTypeDto
    {
        public Guid? Id { get; set; }

        [Required, MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public bool HasProducts { get; set; } = false;
        public string? ImageUrl { get; set; }

        [Required]
        public Guid ProductTypeId { get; set; }

        public string? ProductTypeName { get; set; }
    }


    public class CreateProductSubTypeDto
    {
        public Guid? Id { get; set; }
        [Required, MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public string? ImageUrl { get; set; }
        public IFormFile? ImageFile { get; set; }

        [Required]
        public Guid ProductTypeId { get; set; }

    }
}
