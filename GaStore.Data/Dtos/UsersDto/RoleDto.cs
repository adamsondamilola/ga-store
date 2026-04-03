using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.UsersDto
{
    public class RoleDto
    {
        public string Name { get; set; }     // Name of the role (e.g., Admin, User)
        public string? Description { get; set; } // Optional description of the role
		public Guid UserId { get; set; }
		public List<UserDto> UsersDto { get; set; } // Users assigned to this role

        public RoleDto()
        {
            UsersDto = new List<UserDto>();
        }
    }
}
