using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos
{
	public class SmsOtpRequestDto
	{
		public string? Recipient { get; set; }
		public string? Otp { get; set; }
	}
}
