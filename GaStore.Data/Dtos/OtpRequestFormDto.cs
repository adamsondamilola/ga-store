using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos
{
	public class OtpRequestFormDto
	{
		public string? token { get; set; }
		public string? senderID { get; set; }
		public string? recipient { get; set; }
		public string? otp { get; set; }
		public string? appnamecode { get; set; }
		public string? templatecode { get; set; }
	}
}
