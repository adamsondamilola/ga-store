using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.UsersDto
{
	public class UserRolesDto
	{
		public static class CustomRoles
		{
			public const string Employee = "Employee";
			public const string User = "User";
			public const string Vendor = "Vendor";
			public const string Supervisor = "Supervisor";
			//public const string Admin = "Admin";
			public const string AdminOrSuperAdmin = "Admin" + ", Super Admin";
            public const string Admin = AdminOrSuperAdmin;
            public const string SuperAdmin = "Super Admin";
			public const string AdminOrSupervisor = Admin + ", " + Supervisor;
			public const string AdminOrSupervisorOrUser = Admin + ", " + Supervisor + ", " + User;
		}
	}
}
