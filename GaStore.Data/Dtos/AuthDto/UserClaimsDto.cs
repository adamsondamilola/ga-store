using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Users;

namespace GaStore.Data.Dtos.AuthDto
{
	public class UserClaimsDto
	{
		public Guid UserId { get; set; }
		public string Email { get; set; }
		public string ClientIp { get; set; }
		public List<Role> Roles { get; set; }
		public DateTime? LastLoginDate { get; set; }
	}
}
