using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using GaStore.Data.Dtos.MessagingDto;
using GaStore.Data.Enums;
using GaStore.Data.Models;
using GaStore.Shared;

namespace GaStore.Core.Services.SMS
{
    public class TermiiSmsService : ITermiiSmsService
    {
        private readonly HttpClient _httpClient;
        private readonly Termii _termiiConfig;
        private readonly ILogger<TermiiSmsService> _logger;

        public TermiiSmsService(
            HttpClient httpClient,
            IOptions<Termii> termiiConfig,
            ILogger<TermiiSmsService> logger)
        {
            _httpClient = httpClient;
            _termiiConfig = termiiConfig.Value;
            _logger = logger;

            // Configure HttpClient
            _httpClient.BaseAddress = new Uri(_termiiConfig.BaseUrl);
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public MessagingChannels Channel => MessagingChannels.SMS;

        public async Task<ServiceResponse<MessageDto>> SendMessageAsync(MessageDto message)
        {
            var response = new ServiceResponse<MessageDto>
            {
                Data = message,
                StatusCode = 400
            };

            try
            {
                // Validate phone number format
                if (message.Channel == MessagingChannels.SMS && !IsValidPhoneNumber(message.Recipient))
                {
                    response.Message = "Invalid phone number format";
                    return response;
                }

                // Prepare Termii request
                var request = new TermiiSendSmsRequestDto
                {
                    To = FormatPhoneNumber(message.Recipient),
                    From = _termiiConfig.SenderId,
                    Sms = message.Content,
                    Type = "plain",
                    Channel = _termiiConfig.Channel,
                    ApiKey = _termiiConfig.ApiKey
                };

                _logger.LogInformation("Sending SMS via Termii to {Recipient}", request.To);

                // Send request to Termii API
                var httpResponse = await _httpClient.PostAsJsonAsync("/api/sms/send", request);

                if (httpResponse.IsSuccessStatusCode)
                {
                    var termiiResponse = await httpResponse.Content.ReadFromJsonAsync<TermiiSendSmsResponseDto>();

                    response.StatusCode = 200;
                    response.Message = "SMS sent successfully via Termii";

                    _logger.LogInformation("SMS sent successfully. Message ID: {MessageId}, Balance: {Balance}",
                        termiiResponse?.MessageId, termiiResponse?.Balance);
                }
                else
                {
                    var errorContent = await httpResponse.Content.ReadAsStringAsync();
                    var errorMessage = await ParseErrorResponse(httpResponse, errorContent);

                    response.Message = errorMessage;

                    _logger.LogError("Termii API error: {StatusCode} - {ErrorMessage}",
                        httpResponse.StatusCode, errorMessage);
                }
            }
            catch (HttpRequestException ex)
            {
                response.Message = ex.Message;

                _logger.LogError(ex, "Network error while sending SMS via Termii");
            }
            catch (Exception ex)
            {

                response.Message = ex.Message;

                _logger.LogError(ex, "Unexpected error while sending SMS via Termii");
            }

            return response;
        }

        private async Task<string> ParseErrorResponse(HttpResponseMessage httpResponse, string errorContent)
        {
            try
            {
                var errorResponse = JsonSerializer.Deserialize<TermiiErrorResponseDto>(errorContent);
                return errorResponse?.Message ?? $"HTTP {httpResponse.StatusCode}: {errorContent}";
            }
            catch
            {
                return $"HTTP {httpResponse.StatusCode}: {errorContent}";
            }
        }

        private bool IsValidPhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return false;

            // Basic validation - you might want to enhance this
            var cleanedNumber = new string(phoneNumber.Where(char.IsDigit).ToArray());
            return cleanedNumber.Length >= 10 && cleanedNumber.Length <= 15;
        }

        private string FormatPhoneNumber(string phoneNumber)
        {
            // Remove any non-digit characters and ensure proper format for Termii
            var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());

            // If number starts with '0', replace with country code (assuming Nigeria +234)
            if (digits.StartsWith("0") && digits.Length == 11)
            {
                return "+234" + digits[1..];
            }

            // If number doesn't start with '+', add it
            if (!digits.StartsWith("+"))
            {
                return "+" + digits;
            }

            return digits;
        }
    }
}
