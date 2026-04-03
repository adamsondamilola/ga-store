using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace GaStore.Data.Dtos.PaymentGatewaysDto.PaystackDto
{
    public class PaymentVerificationResponseDto
    {
        [JsonPropertyName("status")]
        public bool? Status { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("data")]
        public PaymentDataDto? Data { get; set; }
    }

    public class PaymentDataDto
    {
        [JsonPropertyName("id")]
        public long? Id { get; set; }

        [JsonPropertyName("domain")]
        public string? Domain { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("reference")]
        public string? Reference { get; set; }

        [JsonPropertyName("receiptNumber")]
        public string? ReceiptNumber { get; set; }

        [JsonPropertyName("amount")]
        public int? Amount { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("gatewayResponse")]
        public string? GatewayResponse { get; set; }

        [JsonPropertyName("paidAt")]
        public DateTime? PaidAt { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; }

        [JsonPropertyName("channel")]
        public string? Channel { get; set; }

        [JsonPropertyName("currency")]
        public string? Currency { get; set; }

        [JsonPropertyName("ipAddress")]
        public string? IpAddress { get; set; }

        //[JsonPropertyName("metadata")]
        //public string? Metadata { get; set; }
        [JsonPropertyName("metadata")]
        public MetadataDto? Metadata { get; set; }

        [JsonPropertyName("log")]
        public LogDto? Log { get; set; }

        [JsonPropertyName("fees")]
        public int? Fees { get; set; }

        [JsonPropertyName("feesSplit")]
        public object? FeesSplit { get; set; }

        [JsonPropertyName("authorization")]
        public AuthorizationDto? Authorization { get; set; }

        [JsonPropertyName("customer")]
        public CustomerDto? Customer { get; set; }

        [JsonPropertyName("plan")]
        public object? Plan { get; set; }

        [JsonPropertyName("split")]
        public Dictionary<string, object>? Split { get; set; }

        [JsonPropertyName("orderId")]
        public object? OrderId { get; set; }

        [JsonPropertyName("paidAt")]
        public DateTime? PaidAtAlt { get; set; } // Duplicate of PaidAt

        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAtAlt { get; set; } // Duplicate of CreatedAt

        [JsonPropertyName("requestedAmount")]
        public int? RequestedAmount { get; set; }

        [JsonPropertyName("posTransactionData")]
        public object? PosTransactionData { get; set; }

        [JsonPropertyName("source")]
        public object? Source { get; set; }

        [JsonPropertyName("feesBreakdown")]
        public object? FeesBreakdown { get; set; }

        [JsonPropertyName("connect")]
        public object? Connect { get; set; }

        [JsonPropertyName("transactionDate")]
        public DateTime? TransactionDate { get; set; }

        [JsonPropertyName("planObject")]
        public Dictionary<string, object>? PlanObject { get; set; }

        [JsonPropertyName("subaccount")]
        public Dictionary<string, object>? Subaccount { get; set; }
    }

    public class LogDto
    {
        [JsonPropertyName("startTime")]
        public int? StartTime { get; set; }

        [JsonPropertyName("timeSpent")]
        public int? TimeSpent { get; set; }

        [JsonPropertyName("attempts")]
        public int? Attempts { get; set; }

        [JsonPropertyName("errors")]
        public int? Errors { get; set; }

        [JsonPropertyName("success")]
        public bool? Success { get; set; }

        [JsonPropertyName("mobile")]
        public bool? Mobile { get; set; }

        [JsonPropertyName("input")]
        public List<object>? Input { get; set; }

        [JsonPropertyName("history")]
        public List<HistoryItemDto>? History { get; set; }
    }

    public class HistoryItemDto
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("time")]
        public int? Time { get; set; }
    }

    public class AuthorizationDto
    {
        [JsonPropertyName("authorizationCode")]
        public string? AuthorizationCode { get; set; }

        [JsonPropertyName("bin")]
        public string? Bin { get; set; }

        [JsonPropertyName("last4")]
        public string? Last4 { get; set; }

        [JsonPropertyName("expMonth")]
        public string? ExpMonth { get; set; }

        [JsonPropertyName("expYear")]
        public string? ExpYear { get; set; }

        [JsonPropertyName("channel")]
        public string? Channel { get; set; }

        [JsonPropertyName("cardType")]
        public string? CardType { get; set; }

        [JsonPropertyName("bank")]
        public string? Bank { get; set; }

        [JsonPropertyName("countryCode")]
        public string? CountryCode { get; set; }

        [JsonPropertyName("brand")]
        public string? Brand { get; set; }

        [JsonPropertyName("reusable")]
        public bool? Reusable { get; set; }

        [JsonPropertyName("signature")]
        public string? Signature { get; set; }

        [JsonPropertyName("accountName")]
        public string? AccountName { get; set; }
    }

    public class CustomerDto
    {
        [JsonPropertyName("id")]
        public long? Id { get; set; }

        [JsonPropertyName("firstName")]
        public string? FirstName { get; set; }

        [JsonPropertyName("lastName")]
        public string? LastName { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("customerCode")]
        public string? CustomerCode { get; set; }

        [JsonPropertyName("phone")]
        public string? Phone { get; set; }

        [JsonPropertyName("metadata")]
        public object? Metadata { get; set; }

        [JsonPropertyName("riskAction")]
        public string? RiskAction { get; set; }

        [JsonPropertyName("internationalFormatPhone")]
        public object? InternationalFormatPhone { get; set; }
    }

    public class MetadataDto
    {
        [JsonPropertyName("referrer")]
        public string? Referrer { get; set; }
    }

    public class PaymentInitiationDto
    {
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "NGN";
        public string? Purpose { get; set; }
        public string? CallbackUrl { get; set; }
    }

    public class PaymentInitiationResponseDto
    {
        public string AuthorizationUrl { get; set; }
        public string AccessCode { get; set; }
        public string Reference { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string? OrderId { get; set; }
    }

    public class PaystackInitiationResponse
    {
        public bool Status { get; set; }
        public string Message { get; set; }
        public PaystackInitiationData Data { get; set; }
    }

    public class PaystackInitiationData
    {
        public string authorization_url { get; set; }
        public string access_code { get; set; }
        public string reference { get; set; }
    }
}