using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Services.SMS;
using GaStore.Data.Dtos;
using GaStore.Data.Dtos.MessagingDto;
using GaStore.Data.Enums;
using GaStore.Data.Models;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class SmsService : ISmsService
	{
		private readonly AppSettings _appSettings;
		private readonly ILogger<SmsService> _logger;
		private readonly ITermiiSmsService _ermiiSmsService;

		public SmsService(IOptions<AppSettings> appSettings, ILogger<SmsService> logger, ITermiiSmsService termiiSmsService)
		{
			_appSettings = appSettings.Value;
			_logger = logger;
			_ermiiSmsService = termiiSmsService;
		}

        public async Task<ServiceResponse<MessageDto>> SendMessage(MessageDto msg)
		{
			msg.Channel = MessagingChannels.SMS;
			var sendSms = await _ermiiSmsService.SendMessageAsync(msg);
			return sendSms;
		}


        public async Task<ServiceResponse<string>> SendOtp(SmsOtpRequestDto otp)
		{
			ServiceResponse<string> res = new();
			res.StatusCode = 400;

			string? Phone = otp.Recipient;
			if (Phone.Length == 11)
			{
				Phone = Phone.Substring(1);
				Phone = $"+234{Phone}";
			}
			if (Phone.Length == 10)
			{
				Phone = $"+234{Phone}";
			}

			try
			{
				var msgDto = new MessageDto
				{
					Channel = MessagingChannels.SMS,
					Content = $"Your Ga verification code is {otp.Otp}. This code can only be used once and last for 15 minutes",
					Recipient = Phone
				};
                var sendSms = await _ermiiSmsService.SendMessageAsync(msgDto);

                if (sendSms.StatusCode == 200)
				{
					res.StatusCode = 200;
					res.Message = "OTP sent";
				}
				else
				{
					res.Message = "Operation Failed!";
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				_logger.LogError(message: ex.Message, ex);
				res.Message = ErrorMessages.InternalServerError;
			}
			return res;
		}

	}
}
