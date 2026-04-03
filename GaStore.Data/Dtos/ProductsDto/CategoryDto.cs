using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class CategoryDto
	{
		public Guid? Id { get; set; }
		[Required]
		[MaxLength(255)]
		public string Name { get; set; }
		public bool IsActive { get; set; } = true;
		public string? ImageUrl { get; set; }
		public IFormFile? imageFile { get; set; }
        public List<SubCategoryDto>? SubCategories { get; set; }

        public int SubCategoriesCount { get; set; }
        public int ProductTypesCount { get; set; }
        public int ProductSubTypesCount { get; set; }

    }

    public class CategoryHierarchyDto
    {
        public CategoryDto Category { get; set; } = new CategoryDto();
        public List<SubCategoryHierarchyDto> SubCategories { get; set; } = new List<SubCategoryHierarchyDto>();
    }

    public class CategoryWithHierarchyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public bool HasProducts { get; set; } = false;
        public List<SubCategoryHierarchyDto> SubCategories { get; set; } = new List<SubCategoryHierarchyDto>();
    }

    public class SubCategoryHierarchyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public bool HasColors { get; set; }
        public bool HasSizes { get; set; }
        public bool HasStyles { get; set; }
        public bool HasProducts { get; set; } = false;
        public List<ProductTypeHierarchyDto> ProductTypes { get; set; } = new List<ProductTypeHierarchyDto>();
    }

    public class ProductTypeHierarchyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public bool HasProducts { get; set; } = false;
        public List<ProductSubTypeDto> ProductSubTypes { get; set; } = new List<ProductSubTypeDto>();
    }
}
