using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Dtos.AdsDto
{
	public class BannerDto
	{
		public Guid? Id { get; set; } // Associated user ID
		public Guid? UserId { get; set; } // Associated user ID
		//public virtual User User { get; set; } // Navigation property to the user
		public IFormFile? ImageFile { get; set; }
		public string? Type { get; set; }
		public string Title { get; set; }
		public string? ImageUrl { get; set; }
		public bool HasLink { get; set; }
		public string? Link { get; set; }
		public bool IsActive { get; set; }

	}
}
