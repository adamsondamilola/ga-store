using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Entities.Products
{
	public class ProductReview : EntityBase
	{
		[Required]
		public Guid ProductId { get; set; }

		[Required]
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
	}
}
