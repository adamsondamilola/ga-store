using GaStore.Data.Models.Messaging;

namespace GaStore.Core.Services.Interfaces
{
    public interface ISmsTemplateFactory
    {
        SmsTemplate WelcomeSms(string userName, string activationLink = null);
        SmsTemplate PasswordResetSms(string resetCode, int expirationMinutes = 15);
        SmsTemplate LoginNotificationSms(string userName, DateTime loginTime, string deviceInfo);
        SmsTemplate OrderConfirmationSms(string orderId, decimal amount, DateTime estimatedDelivery);
        SmsTemplate OrderShippedSms(string orderId, string trackingNumber, string carrier, DateTime estimatedDelivery);
        SmsTemplate OrderDeliveredSms(string orderId, DateTime deliveredDate);
        SmsTemplate AccountVerificationSms(string verificationCode, int expirationMinutes = 10);
        SmsTemplate PaymentReminderSms(string invoiceId, decimal amount, DateTime dueDate);
        SmsTemplate AppointmentReminderSms(string appointmentType, DateTime appointmentTime, string location);
        SmsTemplate TwoFactorAuthSms(string code, int expirationMinutes = 5);
        SmsTemplate LowBalanceAlertSms(decimal currentBalance, decimal threshold);
        SmsTemplate SecurityAlertSms(string alertType, DateTime alertTime);
        SmsTemplate PromotionalSms(string message, string unsubscribeInfo);
        SmsTemplate CustomSms(string message, bool includeSignature = true);
        string TruncateMessage(string message, int maxLength = 160);
    }
}