using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.Users
{
    public class Role : EntityBase
	{
		public string Name { get; set; }     // Name of the role (e.g., Admin, User)
        public string Description { get; set; } // Optional description of the role
		public Guid UserId { get; set; }
		public List<User> Users { get; set; } // Users assigned to this role

        public Role()
        {
            Users = new List<User>();
        }
    }
}
