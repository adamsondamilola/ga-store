using System;
using System.Text;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Models;
using GaStore.Data.Models.Messaging;

namespace GaStore.Core.Services.Implementations
{
    public class SmsTemplateFactory : ISmsTemplateFactory
    {
        private readonly AppSettings _appSettings;

        public SmsTemplateFactory(IOptions<AppSettings> appSettings)
        {
            _appSettings = appSettings.Value;
        }

        public SmsTemplate WelcomeSms(string userName, string activationLink = null)
        {
            var activationMessage = !string.IsNullOrEmpty(activationLink) ?
                $"Activate your account: {activationLink}" : "";

            return new SmsTemplate
            {
                Message = $"Welcome to {_appSettings.CompanyConfig.CompanyName}, {userName}! 🎉 " +
                         $"We're thrilled to have you. {activationMessage} " +
                         $"Need help? Contact {_appSettings.CompanyConfig.SupportPhone}"
            };
        }

        public SmsTemplate PasswordResetSms(string resetCode, int expirationMinutes = 15)
        {
            return new SmsTemplate
            {
                Message = $"{_appSettings.CompanyConfig.CompanyName} password reset code: {resetCode} " +
                         $"Expires in {expirationMinutes} minutes. " +
                         $"If you didn't request this, please ignore."
            };
        }

        public SmsTemplate LoginNotificationSms(string userName, DateTime loginTime, string deviceInfo)
        {
            return new SmsTemplate
            {
                Message = $"New login to your {_appSettings.CompanyConfig.CompanyName} account. " +
                         $"Time: {loginTime:MMM dd, hh:mm tt} " +
                         $"Device: {deviceInfo} " +
                         $"If this wasn't you, contact {_appSettings.CompanyConfig.SupportPhone} immediately."
            };
        }

        public SmsTemplate OrderConfirmationSms(string orderId, decimal amount, DateTime estimatedDelivery)
        {
            return new SmsTemplate
            {
                Message = $"Order #{orderId.ToUpper().Substring(0,8)} confirmed! " +
                         $"Amount: ₦{amount:0.00} " +
                         $"Est. delivery: {estimatedDelivery:MMM dd} " +
                         $"Thank you for shopping with {_appSettings.CompanyConfig.CompanyName}!"
            };
        }

        public SmsTemplate OrderShippedSms(string orderId, string trackingNumber, string carrier, DateTime estimatedDelivery)
        {
            return new SmsTemplate
            {
                Message = $"Your order #{orderId.ToUpper().Substring(0,8)} has shipped! " +
                         $"Tracking: {orderId.ToUpper().Substring(0, 8)} {carrier} " +
                         $"Est. delivery: {estimatedDelivery:MMM dd} " +
                         $"Track your package on our website."
            };
        }

        public SmsTemplate OrderDeliveredSms(string orderId, DateTime deliveredDate)
        {
            return new SmsTemplate
            {
                Message = $"Your order #{orderId.ToUpper().Substring(0,8)} was delivered on {deliveredDate:MMM dd, hh:mm tt}! 📦 " +
                         $"We hope you love your purchase. " +
                         $"Need help? Reply to this message."
            };
        }

        public SmsTemplate AccountVerificationSms(string verificationCode, int expirationMinutes = 10)
        {
            return new SmsTemplate
            {
                Message = $"Your {_appSettings.CompanyConfig.CompanyName} verification code: {verificationCode} " +
                         $"Expires in {expirationMinutes} minutes. " +
                         $"Do not share this code with anyone."
            };
        }

        public SmsTemplate PaymentReminderSms(string invoiceId, decimal amount, DateTime dueDate)
        {
            return new SmsTemplate
            {
                Message = $"Payment reminder: Invoice #{invoiceId} " +
                         $"Amount: ₦{amount:0.00} " +
                         $"Due: {dueDate:MMM dd} " +
                         $"Pay now: {_appSettings.FrontendUrl}/pay/{invoiceId}"
            };
        }

        public SmsTemplate AppointmentReminderSms(string appointmentType, DateTime appointmentTime, string location)
        {
            return new SmsTemplate
            {
                Message = $"Reminder: {appointmentType} appointment " +
                         $"Date: {appointmentTime:MMM dd, yyyy} " +
                         $"Time: {appointmentTime:hh:mm tt} " +
                         $"Location: {location} " +
                         $"Reply YES to confirm or NO to reschedule."
            };
        }

        public SmsTemplate TwoFactorAuthSms(string code, int expirationMinutes = 5)
        {
            return new SmsTemplate
            {
                Message = $"Your {_appSettings.CompanyConfig.CompanyName} 2FA code: {code} " +
                         $"Expires in {expirationMinutes} minutes. " +
                         $"Do not share this code."
            };
        }

        public SmsTemplate LowBalanceAlertSms(decimal currentBalance, decimal threshold)
        {
            return new SmsTemplate
            {
                Message = $"Alert: Your account balance is low. " +
                         $"Current: ₦{currentBalance:0.00} " +
                         $"Threshold: ₦{threshold:0.00} " +
                         $"Add funds: {_appSettings.CompanyConfig.CompanyWebsite}/add-funds"
            };
        }

        public SmsTemplate SecurityAlertSms(string alertType, DateTime alertTime)
        {
            return new SmsTemplate
            {
                Message = $"Security Alert: {alertType} detected " +
                         $"Time: {alertTime:MMM dd, hh:mm tt} " +
                         $"If this wasn't you, contact {_appSettings.CompanyConfig.SupportPhone} immediately."
            };
        }

        public SmsTemplate PromotionalSms(string message, string unsubscribeInfo)
        {
            return new SmsTemplate
            {
                Message = $"{message} " +
                         $"{unsubscribeInfo} " +
                         $"Msg & data rates may apply."
            };
        }

        public SmsTemplate CustomSms(string message, bool includeSignature = true)
        {
            var signature = includeSignature ?
                $" - {_appSettings.CompanyConfig.CompanyName}" : "";

            return new SmsTemplate
            {
                Message = $"{message}{signature}"
            };
        }

        // Helper method to ensure SMS messages don't exceed typical character limits
        public string TruncateMessage(string message, int maxLength = 160)
        {
            if (string.IsNullOrEmpty(message) || message.Length <= maxLength)
                return message;

            return message.Substring(0, maxLength - 3) + "...";
        }

        // Helper method to format currency consistently
        private string FormatCurrency(decimal amount)
        {
            return $"₦{amount:0.00}";
        }

        // Helper method to format dates for SMS (short format)
        private string FormatDateShort(DateTime date)
        {
            return date.ToString("MMM dd");
        }

        // Helper method to format datetime for SMS
        private string FormatDateTime(DateTime dateTime)
        {
            return dateTime.ToString("MMM dd, hh:mm tt");
        }
    }
}