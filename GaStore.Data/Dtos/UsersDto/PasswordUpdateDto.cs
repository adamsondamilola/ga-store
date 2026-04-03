using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.UsersDto
{
	public class PasswordUpdateDto
	{
		public string? CurrentPassword { get; set; }
		public string? NewPassword { get; set; }
		public string? ConfirmPassword { get; set; }
	}

    public class PasswordUserUpdateDto
    {
        public string? NewPassword { get; set; }
        public string? ConfirmPassword { get; set; }
    }
}
