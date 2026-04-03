using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class ProductReviewDto
	{
		public Guid? Id { get; set; }
		public Guid ProductId { get; set; }

		//[Required]
		public Guid? UserId { get; set; }

		[Range(1, 5)]
		[Required]
		public int Rating { get; set; } // 1 to 5 stars

		public string? Title { get; set; }
		[MaxLength(1000)]
		public string? Comment { get; set; }

		// Navigation Properties
		public virtual Product? Product { get; set; }

		public virtual User? User { get; set; }
		public DateTime? DateCreated { get; set; }
		public ICollection<ProductReview>? Reviews { get; set; } = new List<ProductReview>();

	}
}
