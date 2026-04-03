using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Products
{
	public class FeaturedProduct : EntityBase
	{

		[Required]
		public Guid ProductId { get; set; } 
		public virtual Product Product { get; set; }

		[Required]
		public DateTime StartDate { get; set; } // Start date for the feature

		[Required]
		public DateTime EndDate { get; set; } // End date for the feature

		[MaxLength(255)]
		public string? Tagline { get; set; } // Optional tagline or promotional message

		public bool IsActive { get; set; } = true; // Indicates if the product is actively featured
	}
}
