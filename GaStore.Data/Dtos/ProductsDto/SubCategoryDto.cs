using System;
using Microsoft.AspNetCore.Http;
using GaStore.Data.Entities.Products;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class SubCategoryDto
	{
		public Guid? Id { get; set; }
		public Guid CategoryId { get; set; }
		public string Name { get; set; }
		public bool HasColors { get; set; }
		public bool HasSizes { get; set; }
		public bool HasStyles { get; set; }
		public bool IsActive { get; set; } = true;
		public string? ImageUrl { get; set; }
		public IFormFile? ImageFile { get; set; }
        public Category? Category { get; set; }
    }
}
