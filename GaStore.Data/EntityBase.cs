using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data
{
	public class EntityBase
	{
		[Key]
		public Guid Id { get; set; }
		public DateTime? DateCreated { get; set; } = DateTime.UtcNow;
		public DateTime? DateUpdated { get; set; } = DateTime.UtcNow;
	}
}
