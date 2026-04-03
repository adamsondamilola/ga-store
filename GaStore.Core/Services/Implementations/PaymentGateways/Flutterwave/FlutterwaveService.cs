using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces.PaymentGateways.Flutterwave;
using GaStore.Data.Dtos.PaymentGatewaysDto.FlutterwaveDto;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations.PaymentGateways.Flutterwave
{
    public class FlutterwaveService : IFlutterwaveService
    {
        private readonly ILogger<FlutterwaveService> _logger;
        private readonly AppSettings _appSettings;

        public FlutterwaveService(ILogger<FlutterwaveService> logger, IOptions<AppSettings> appSettings)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
        }

        public async Task<ServiceResponse<VerifyTransactionResponse>> VerifyTransactions(int transactionId)
        {
            var response = new ServiceResponse<VerifyTransactionResponse>();

            // Validate configuration
            if (string.IsNullOrWhiteSpace(_appSettings?.Flutterwave?.EndPoint) ||
                string.IsNullOrWhiteSpace(_appSettings?.Flutterwave?.SecretKey))
            {
                _logger.LogError("Flutterwave configuration is missing");
                response.StatusCode = 500;
                response.Message = "Payment gateway configuration error";
                return response;
            }

            string url = $"{_appSettings.Flutterwave.EndPoint}transactions/{transactionId}/verify";
            string secretKey = _appSettings.Flutterwave.SecretKey;

            try
            {
                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", secretKey);

                    // Set reasonable timeout
                    client.Timeout = TimeSpan.FromSeconds(30);

                    _logger.LogInformation($"Verifying transaction {transactionId} with Flutterwave");
                    var stopwatch = Stopwatch.StartNew();

                    HttpResponseMessage res = await client.GetAsync(url);
                    string result = await res.Content.ReadAsStringAsync();

                    stopwatch.Stop();
                    _logger.LogInformation($"Flutterwave verification took {stopwatch.ElapsedMilliseconds}ms");

                    if (!res.IsSuccessStatusCode)
                    {
                        _logger.LogWarning($"Transaction verification failed. Status: {res.StatusCode}, Response: {result}");
                        response.StatusCode = (int)res.StatusCode;
                        response.Message = $"Payment gateway returned error: {res.ReasonPhrase}";
                        return response;
                    }

                    // Safe deserialization with validation
                    var webRes = JsonConvert.DeserializeObject<VerifyTransactionResponse>(result);
                    if (webRes?.data == null)
                    {
                        _logger.LogError("Invalid response structure from Flutterwave");
                        response.StatusCode = 502;
                        response.Message = "Invalid response from payment gateway";
                        return response;
                    }

                    // Additional validation
                    if (webRes.data.amount <= 0)
                    {
                        _logger.LogWarning($"Invalid amount received: {webRes.data.amount}");
                        response.StatusCode = 400;
                        response.Message = "Transaction amount is invalid";
                        return response;
                    }

                    response.StatusCode = 200;
                    response.Message = "Transaction verified successfully";
                    response.Data = webRes;

                    _logger.LogInformation($"Successfully verified transaction {transactionId} for amount {webRes.data.amount}");
                }
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                _logger.LogError($"Timeout while verifying transaction {transactionId}");
                response.StatusCode = 504;
                response.Message = "Payment gateway timeout";
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"HTTP error while verifying transaction {transactionId}");
                response.StatusCode = 502;
                response.Message = "Payment gateway communication error";
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, $"JSON parsing error for transaction {transactionId}");
                response.StatusCode = 502;
                response.Message = "Invalid response from payment gateway";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error verifying transaction {transactionId}");
                response.StatusCode = 500;
                response.Message = "Internal server error";
            }

            return response;
        }
    }
}
