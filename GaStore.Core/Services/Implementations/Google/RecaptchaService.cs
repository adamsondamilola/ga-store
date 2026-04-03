using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using GaStore.Core.Services.Interfaces.Google;
using GaStore.Data.Dtos.Google;
using GaStore.Data.Models;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations.Google
{
    public class RecaptchaService : IRecaptchaService
    {
        private readonly HttpClient _httpClient;
        private readonly AppSettings _appSettings;

        public RecaptchaService(HttpClient httpClient, IOptions<AppSettings> appSettings)
        {
            _httpClient = httpClient;
            _appSettings = appSettings.Value;
        }

        public async Task<ServiceResponse<bool>> VerifyAsync(string token)
        {
            try
            {
                var url =
                    $"{_appSettings.Google.RecaptchaVerifyUrl}?secret={_appSettings.Google.RecaptchaSecretKey}&response={token}";

                var result = await _httpClient.GetFromJsonAsync<RecaptchaVerifyResponseDto>(url);

                if (result == null)
                    return ServiceResponse<bool>.Fail("Invalid reCAPTCHA response", 400);

                if (!result.Success)
                {
                    var errorMsg = result.ErrorCodes != null
                        ? string.Join(", ", result.ErrorCodes)
                        : "reCAPTCHA verification failed";

                    return ServiceResponse<bool>.Fail(errorMsg, 400);
                }

                // Optional: If using reCAPTCHA v3, enforce a minimum score
                if (result.Score < 0.5)
                    return ServiceResponse<bool>.Fail("Bot detected (score too low)", 400);

                return ServiceResponse<bool>.Success(true, "reCAPTCHA verified");
            }
            catch (Exception ex)
            {
                return ServiceResponse<bool>.Fail(ex.Message, 500);
            }
        }
    }
}
