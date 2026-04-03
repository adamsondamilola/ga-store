using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using GaStore.Core.Services.Interfaces.PaymentGateways.Paystack;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.PaymentGatewaysDto.PaystackDto;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations.PaymentGateways.Paystack
{
    public class PaystackService : IPaystackService
    {
        private readonly ILogger<PaystackService> _logger;
        private readonly AppSettings _appSettings;
        private readonly IUnitOfWork _unitOfWork;

        public PaystackService(ILogger<PaystackService> logger, IOptions<AppSettings> appSettings, IUnitOfWork unitOfWork)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _unitOfWork = unitOfWork;
        }

        public async Task<ServiceResponse<PaymentVerificationResponseDto>> VerifyTransactions(string transactionId)
        {
            var response = new ServiceResponse<PaymentVerificationResponseDto>();

            // Validate configuration
            if (string.IsNullOrWhiteSpace(_appSettings?.Paystack?.EndPoint) ||
                string.IsNullOrWhiteSpace(_appSettings?.Paystack?.SecretKey))
            {
                _logger.LogError("Paystack configuration is missing");
                response.StatusCode = 500;
                response.Message = "Payment gateway configuration error";
                return response;
            }

            string url = $"{_appSettings.Paystack.EndPoint}transaction/verify/{transactionId}";
            string secretKey = _appSettings.Paystack.SecretKey;

            try
            {
                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", secretKey);

                    // Set reasonable timeout
                    client.Timeout = TimeSpan.FromSeconds(30);

                    _logger.LogInformation($"Verifying transaction {transactionId} with Paystack");
                    var stopwatch = Stopwatch.StartNew();

                    HttpResponseMessage res = await client.GetAsync(url);
                    string result = await res.Content.ReadAsStringAsync();

                    stopwatch.Stop();
                    _logger.LogInformation($"Paystack verification took {stopwatch.ElapsedMilliseconds}ms");

                    if (!res.IsSuccessStatusCode)
                    {
                        _logger.LogWarning($"Transaction verification failed. Status: {res.StatusCode}, Response: {result}");
                        response.StatusCode = (int)res.StatusCode;
                        response.Message = $"Payment gateway returned error: {res.ReasonPhrase}";
                        return response;
                    }

                    // Safe deserialization with validation
                    var webRes = JsonConvert.DeserializeObject<PaymentVerificationResponseDto>(result);
                    if (webRes?.Data == null)
                    {
                        _logger.LogError("Invalid response structure from Paystack");
                        response.StatusCode = 502;
                        response.Message = "Invalid response from payment gateway";
                        return response;
                    }

                    // Additional validation
                    if (webRes.Data.Amount <= 0)
                    {
                        _logger.LogWarning($"Invalid amount received: {webRes.Data.Amount}");
                        response.StatusCode = 400;
                        response.Message = "Transaction amount is invalid";
                        return response;
                    }

                    response.StatusCode = 200;
                    response.Message = "Transaction verified successfully";
                    response.Data = webRes;

                    _logger.LogInformation($"Successfully verified transaction {transactionId} for amount {webRes.Data.Amount}");
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

        public async Task<ServiceResponse<PaymentInitiationResponseDto>> InitializePayment(OrderSummaryDto summaryDto, Guid userId)
        {
            var response = new ServiceResponse<PaymentInitiationResponseDto>();
            var amount = (decimal)summaryDto.TotalAfterDiscount > 0 ? (decimal)summaryDto.TotalAfterDiscount : (decimal)summaryDto.Total;

            // Validate input
            if (amount <= 0)
            {
                response.StatusCode = 400;
                response.Message = "Amount must be greater than zero";
                return response;
            }

            response = await InitializePayment(amount, userId);           
            return response;
        }

        public async Task<ServiceResponse<PaymentInitiationResponseDto>> InitializePayment(decimal amount, Guid userId)
        {
            var response = new ServiceResponse<PaymentInitiationResponseDto>();

            PaymentInitiationDto dto = new PaymentInitiationDto
            {
                Amount = amount,
                Currency = "NGN",
                Purpose = "Purchase",
                CallbackUrl = ""
            };

            // Validate configuration
            if (string.IsNullOrWhiteSpace(_appSettings?.Paystack?.EndPoint) ||
                string.IsNullOrWhiteSpace(_appSettings?.Paystack?.SecretKey))
            {
                _logger.LogError("Paystack configuration is missing");
                response.StatusCode = 500;
                response.Message = "Payment gateway configuration error";
                return response;
            }

            // Validate input
            if (dto.Amount <= 0)
            {
                response.StatusCode = 400;
                response.Message = "Amount must be greater than zero";
                return response;
            }

            string url = $"{_appSettings.Paystack.EndPoint}transaction/initialize";
            string secretKey = _appSettings.Paystack.SecretKey;

            //get user details
            var user = await _unitOfWork.UserRepository.GetById(userId);
            if (user == null)
            {
                response.StatusCode = 400;
                response.Message = "User not found";
                return response;
            }

            try
            {
                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", secretKey);

                    client.Timeout = TimeSpan.FromSeconds(30);

                    // Prepare payment request payload
                    var latestPendingOrder = await _unitOfWork.OrderRepository.Get(
                        o => o.UserId == userId && !o.HasPaid,
                        q => q.OrderByDescending(o => o.OrderDate));

                    var paymentRequest = new
                    {
                        email = user.Email,
                        amount = dto.Amount * 100, // Convert to kobo (Paystack requirement)
                        currency = dto.Currency ?? "NGN",
                        reference = GenerateTransactionReference(),
                        callback_url = dto.CallbackUrl,
                        metadata = new
                        {
                            userId = userId,
                            orderId = latestPendingOrder?.Id,
                            custom_fields = new object[]
    {
        new { display_name = "User ID", variable_name = "user_id", value = userId },
        new { display_name = "Order ID", variable_name = "order_id", value = latestPendingOrder?.Id },
        new { display_name = "Purpose", variable_name = "purpose", value = dto.Purpose ?? "Product Purchase" }
    }
                        }
                    };

                    var jsonContent = JsonConvert.SerializeObject(paymentRequest);
                    var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                    _logger.LogInformation($"Initializing payment for user {userId}, amount: {dto.Amount}");
                    var stopwatch = Stopwatch.StartNew();

                    HttpResponseMessage httpResponse = await client.PostAsync(url, content);
                    string result = await httpResponse.Content.ReadAsStringAsync();

                    stopwatch.Stop();
                    _logger.LogInformation($"Paystack initialization took {stopwatch.ElapsedMilliseconds}ms");

                    if (!httpResponse.IsSuccessStatusCode)
                    {
                        _logger.LogWarning($"Payment initialization failed. Status: {httpResponse.StatusCode}, Response: {result}");
                        response.StatusCode = (int)httpResponse.StatusCode;
                        response.Message = $"Payment gateway returned error: {httpResponse.ReasonPhrase}";
                        return response;
                    }

                    // Deserialize response
                    var paystackResponse = JsonConvert.DeserializeObject<PaystackInitiationResponse>(result);

                    if (!paystackResponse.Status || paystackResponse.Data == null)
                    {
                        _logger.LogError($"Paystack initialization failed: {paystackResponse.Message}");
                        response.StatusCode = 400;
                        response.Message = paystackResponse.Message ?? "Payment initialization failed";
                        return response;
                    }

                    // Prepare response
                    var initiationResponse = new PaymentInitiationResponseDto
                    {
                        AuthorizationUrl = paystackResponse.Data.authorization_url,
                        AccessCode = paystackResponse.Data.access_code,
                        Reference = paystackResponse.Data.reference,
                        Amount = dto.Amount,
                        Currency = dto.Currency ?? "NGN"
                    };

                    response.StatusCode = 200;
                    response.Message = "Payment initialized successfully";
                    response.Data = initiationResponse;

                    _logger.LogInformation($"Successfully initialized payment for user {userId}. Reference: {paymentRequest.reference}");
                }
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                _logger.LogError($"Timeout while initializing payment for user {userId}");
                response.StatusCode = 504;
                response.Message = "Payment gateway timeout";
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"HTTP error while initializing payment for user {userId}");
                response.StatusCode = 502;
                response.Message = "Payment gateway communication error";
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, $"JSON parsing error while initializing payment for user {userId}");
                response.StatusCode = 502;
                response.Message = "Invalid response from payment gateway";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error initializing payment for user {userId}");
                response.StatusCode = 500;
                response.Message = "Internal server error";
            }

            return response;
        }

        // Helper method to generate unique transaction reference
        private string GenerateTransactionReference()
        {
            return $"PSK_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid().ToString("N").Substring(0, 8)}";
        }

    }
}
