using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.AuthDto
{
	public class OtpRequestDto
	{
		public string? Phone { get; set; }
		public string? Email { get; set; }
		public string? Otp { get; set; }
		public string? Password1 { get; set; }
		public string? Password2 { get; set; }
		public string? PreferredMethod { get; set; } //email or phone
		public string? Description { get; set; }
	}
}
