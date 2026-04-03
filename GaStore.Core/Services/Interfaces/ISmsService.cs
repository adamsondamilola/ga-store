using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos;
using GaStore.Data.Dtos.MessagingDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface ISmsService
	{
		Task<ServiceResponse<string>> SendOtp(SmsOtpRequestDto otp);
		Task<ServiceResponse<MessageDto>> SendMessage(MessageDto msg);

    }
}
