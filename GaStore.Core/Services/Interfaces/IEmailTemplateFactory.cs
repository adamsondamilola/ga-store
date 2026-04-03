using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Models.Messaging;

namespace GaStore.Core.Services.Interfaces
{
    public interface IEmailTemplateFactory
    {
        EmailTemplate WelcomeEmail(string userName, string activationLink = null);
        EmailTemplate PasswordReset(string resetLink, int expirationHours = 24);
        EmailTemplate LoginNotification(string userName, DateTime loginTime, string ipAddress, string deviceInfo, string location);
        EmailTemplate OrderConfirmation(string userName, string orderId, decimal amount, string[] items, DateTime estimatedDelivery, string trackingUrl = null);
        EmailTemplate Newsletter(string title, string content, string unsubscribeLink, string featuredImageUrl = null, string readOnlineLink = null);
        EmailTemplate Notification(string userName, string message, string actionUrl = null, string actionText = "View Details");
        EmailTemplate AccountVerification(string userName, string verificationCode, int expirationMinutes = 30);
        EmailTemplate OrderShipped(string userName, string orderId, string trackingNumber, string carrier, DateTime shippedDate, DateTime estimatedDelivery, string trackingUrl = null);
        EmailTemplate OrderDelivered(string userName, string orderId, DateTime deliveredDate);
    }
}
