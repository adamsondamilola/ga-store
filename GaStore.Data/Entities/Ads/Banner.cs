using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Entities.Ads
{
	public class Banner : EntityBase
	{
		[Required]
		public Guid UserId { get; set; } // Associated user ID
		public string? Type { get; set; }
		public string Title { get; set; }
		public virtual User? User { get; set; } // Navigation property to the user

		[Required]
		public string ImageUrl { get; set; }

		[Required]
		public bool HasLink { get; set; }

		public string? Link { get; set; }
		public bool IsActive { get; set; }

	}
}
