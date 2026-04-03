using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.PaymentGatewaysDto.FlutterwaveDto
{
    public class FWVerifyTransactionDto
    {
    }
    public class VerifyTransactionResponse
    {
        public string? status { get; set; }
        public string? message { get; set; }
        public TransactionData? data { get; set; }
    }

    public class TransactionData
    {
        public int id { get; set; }
        public string? tx_ref { get; set; }
        public string? flw_ref { get; set; }
        public string? device_fingerprint { get; set; }
        public decimal amount { get; set; }
        public string? currency { get; set; }
        public decimal charged_amount { get; set; }
        public decimal app_fee { get; set; }
        public decimal merchant_fee { get; set; }
        public string? processor_response { get; set; }
        public string? auth_model { get; set; }
        public string? ip { get; set; }
        public string? narration { get; set; }
        public string? status { get; set; }
        public string? payment_type { get; set; }
        public string? created_at { get; set; }
        public string? account_id { get; set; }
        public Card? card { get; set; }
        public Meta? meta { get; set; }
        public decimal amount_settled { get; set; }
        public Customer? customer { get; set; }
    }

    public class Card
    {
        public string? first_6digits { get; set; }
        public string? last_4digits { get; set; }
        public string? issuer { get; set; }
        public string? country { get; set; }
        public string? type { get; set; }
        public string? token { get; set; }
        public string? expiry { get; set; }
    }

    public class Meta
    {
        public string? __CheckoutInitAddress { get; set; }
    }

    public class Customer
    {
        public int id { get; set; }
        public string? name { get; set; }
        public string? phone_number { get; set; }
        public string? email { get; set; }
        public string? created_at { get; set; }
    }
}
