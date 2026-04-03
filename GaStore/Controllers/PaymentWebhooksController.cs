using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Models;

namespace GaStore.Controllers
{
    [ApiController]
    [AllowAnonymous]
    [Route("api/payment-webhooks")]
    public class PaymentWebhooksController : ControllerBase
    {
        private readonly ICheckoutService _checkoutService;
        private readonly AppSettings _appSettings;
        private readonly ILogger<PaymentWebhooksController> _logger;

        public PaymentWebhooksController(
            ICheckoutService checkoutService,
            IOptions<AppSettings> appSettings,
            ILogger<PaymentWebhooksController> logger)
        {
            _checkoutService = checkoutService;
            _appSettings = appSettings.Value;
            _logger = logger;
        }

        [HttpPost("paystack")]
        public async Task<IActionResult> Paystack()
        {
            var payload = await ReadRequestBodyAsync();
            if (!IsValidPaystackSignature(payload))
            {
                _logger.LogWarning("Rejected Paystack webhook due to invalid signature.");
                return Unauthorized();
            }

            using var document = JsonDocument.Parse(payload);
            var root = document.RootElement;
            var eventName = root.TryGetProperty("event", out var eventElement)
                ? eventElement.GetString()
                : null;

            if (!string.Equals(eventName, "charge.success", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { received = true });
            }

            if (!root.TryGetProperty("data", out var data))
            {
                return BadRequest("Missing transaction data.");
            }

            var reference = GetString(data, "reference");
            if (string.IsNullOrWhiteSpace(reference))
            {
                return BadRequest("Missing transaction reference.");
            }
            Guid? orderId = null;
            Guid? userId = null;

            if (data.TryGetProperty("metadata", out var metadata))
            {
                orderId = TryParseGuid(GetString(metadata, "orderId"))
                    ?? TryParseGuid(FindCustomFieldValue(metadata, "order_id"));
                userId = TryParseGuid(GetString(metadata, "userId"))
                    ?? TryParseGuid(FindCustomFieldValue(metadata, "user_id"));
            }

            var response = await _checkoutService.ProcessGatewayWebhookAsync(
                "Paystack",
                reference,
                reference,
                orderId,
                userId);

            return StatusCode(response.StatusCode == 404 ? 202 : response.StatusCode, response);
        }

        [HttpPost("flutterwave")]
        public async Task<IActionResult> Flutterwave()
        {
            var configuredHash = _appSettings.Flutterwave?.WebhookSecretHash;
            if (string.IsNullOrWhiteSpace(configuredHash))
            {
                _logger.LogError("Flutterwave webhook hash is not configured.");
                return StatusCode(StatusCodes.Status500InternalServerError, "Flutterwave webhook hash is not configured.");
            }

            var suppliedHash = Request.Headers["verif-hash"].FirstOrDefault();
            if (!string.Equals(suppliedHash, configuredHash, StringComparison.Ordinal))
            {
                _logger.LogWarning("Rejected Flutterwave webhook due to invalid signature.");
                return Unauthorized();
            }

            var payload = await ReadRequestBodyAsync();
            using var document = JsonDocument.Parse(payload);
            var root = document.RootElement;

            if (!root.TryGetProperty("event", out var eventElement) ||
                !string.Equals(eventElement.GetString(), "charge.completed", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { received = true });
            }

            if (!root.TryGetProperty("data", out var data))
            {
                return BadRequest("Missing transaction data.");
            }

            var status = GetString(data, "status");
            if (!string.Equals(status, "successful", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { received = true });
            }

            var transactionId = GetString(data, "id");
            if (string.IsNullOrWhiteSpace(transactionId))
            {
                return BadRequest("Missing transaction ID.");
            }

            var txRef = GetString(data, "tx_ref");
            Guid? orderId = TryParseGuid(txRef);
            Guid? userId = null;

            if (data.TryGetProperty("meta", out var meta))
            {
                orderId ??= TryParseGuid(GetString(meta, "orderId"));
                userId = TryParseGuid(GetString(meta, "userId"));
            }

            var response = await _checkoutService.ProcessGatewayWebhookAsync(
                "Flutterwave",
                transactionId,
                txRef,
                orderId,
                userId);

            return StatusCode(response.StatusCode == 404 ? 202 : response.StatusCode, response);
        }

        private async Task<string> ReadRequestBodyAsync()
        {
            Request.EnableBuffering();
            Request.Body.Position = 0;

            using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
            var payload = await reader.ReadToEndAsync();
            Request.Body.Position = 0;
            return payload;
        }

        private bool IsValidPaystackSignature(string payload)
        {
            var signature = Request.Headers["x-paystack-signature"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(signature) || string.IsNullOrWhiteSpace(_appSettings.Paystack?.SecretKey))
            {
                return false;
            }

            using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(_appSettings.Paystack.SecretKey));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var computedSignature = Convert.ToHexString(hash).ToLowerInvariant();

            return string.Equals(signature.Trim(), computedSignature, StringComparison.OrdinalIgnoreCase);
        }

        private static string? GetString(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var value))
            {
                return null;
            }

            return value.ValueKind switch
            {
                JsonValueKind.String => value.GetString(),
                JsonValueKind.Number => value.GetRawText(),
                JsonValueKind.True => bool.TrueString,
                JsonValueKind.False => bool.FalseString,
                _ => value.GetRawText()
            };
        }

        private static Guid? TryParseGuid(string? value)
        {
            return Guid.TryParse(value, out var parsed) ? parsed : null;
        }

        private static string? FindCustomFieldValue(JsonElement metadata, string variableName)
        {
            if (!metadata.TryGetProperty("custom_fields", out var customFields) ||
                customFields.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            foreach (var field in customFields.EnumerateArray())
            {
                if (!field.TryGetProperty("variable_name", out var variable) ||
                    !string.Equals(variable.GetString(), variableName, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                return GetString(field, "value");
            }

            return null;
        }
    }
}
