using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using GaStore.Data.Enums;

namespace GaStore.Data.Dtos.MessagingDto
{
    public class MessageDto
    {
        public string Recipient { get; set; } // Phone number or email
        public string? RecipientName { get; set; }
        public string Content { get; set; }
        public MessagingChannels Channel { get; set; }
        public string? Subject { get; set; } // For emails
        public List<IFormFile>? Attachment { get; set; }
    }

    public class TermiiSendSmsRequestDto
    {
        [JsonPropertyName("to")]
        public string To { get; set; } = string.Empty;

        [JsonPropertyName("from")]
        public string From { get; set; } = string.Empty;

        [JsonPropertyName("sms")]
        public string Sms { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = "plain";

        [JsonPropertyName("channel")]
        public string Channel { get; set; } = "generic";

        [JsonPropertyName("api_key")]
        public string ApiKey { get; set; } = string.Empty;
    }
    public class TermiiSendSmsResponseDto
    {
        [JsonPropertyName("message_id")]
        public string MessageId { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("balance")]
        public decimal Balance { get; set; }

        [JsonPropertyName("user")]
        public string User { get; set; } = string.Empty;

        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;
    }

    public class TermiiErrorResponseDto
    {
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
    }
}
