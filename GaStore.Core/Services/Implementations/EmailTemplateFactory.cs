using System;
using System.Text;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Models;
using GaStore.Data.Models.Messaging;

namespace GaStore.Core.Services.Implementations
{
    public class EmailTemplateFactory : IEmailTemplateFactory
    {
        private readonly AppSettings _appSettings;

        public EmailTemplateFactory(IOptions<AppSettings> appSettings)
        {
            _appSettings = appSettings.Value;
        }

        public EmailTemplate WelcomeEmail(string userName, string activationLink = null)
        {
            var activationButton = !string.IsNullOrEmpty(activationLink) ?
                $@"<tr>
                    <td align='center' style='padding: 20px 0;'>
                        <a href='{activationLink}' style='background-color: #4361ee; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Activate Your Account</a>
                    </td>
                </tr>" : "";

            return new EmailTemplate
            {
                Subject = $"Welcome to {_appSettings.CompanyConfig.CompanyName}, {userName}! 🎉",
                Body = BuildEmailTemplate($@"
                    <h1 style='color: #4361ee; margin: 0 0 20px 0;'>Welcome to {_appSettings.CompanyConfig.CompanyName}!</h1>
                    <p style='margin: 0 0 20px 0;'>Hi <strong>{userName}</strong>,</p>
                    <p style='margin: 0 0 20px 0;'>Thank you for joining {_appSettings.CompanyConfig.CompanyName}. We're thrilled to have you as part of our community!</p>
                    <p style='margin: 0 0 20px 0;'>With your new account, you can now access exclusive features, manage your preferences, and connect with other members.</p>
                    {activationButton}
                    <p style='margin: 20px 0;'>If you have any questions, feel free to reach out to our support team at <a href='mailto:{_appSettings.CompanyConfig.SupportEmail}'>{_appSettings.CompanyConfig.SupportEmail}</a>.</p>
                    <p style='margin: 20px 0 0 0;'>Best regards,<br>The {_appSettings.CompanyConfig.CompanyName} Team</p>
                ")
            };
        }

        public EmailTemplate PasswordReset(string resetLink, int expirationHours = 24)
        {
            return new EmailTemplate
            {
                Subject = $"Password Reset Request for Your {_appSettings.CompanyConfig.CompanyName} Account",
                Body = BuildEmailTemplate($@"
                    <h1 style='color: #4361ee; margin: 0 0 20px 0;'>Password Reset</h1>
                    <p style='margin: 0 0 20px 0;'>We received a request to reset your password. If this wasn't you, please ignore this email.</p>
                    <p style='margin: 0 0 20px 0;'><strong>This link will expire in {expirationHours} hours for security reasons.</strong></p>
                    <table role='presentation' cellspacing='0' cellpadding='0' border='0' align='center' style='margin: 30px auto;'>
                        <tr>
                            <td align='center' style='border-radius: 5px; background: #4361ee;'>
                                <a href='{resetLink}' target='_blank' style='background: #4361ee; border: solid 1px #4361ee; border-radius: 5px; color: #ffffff; display: inline-block; font-family: sans-serif; font-size: 16px; font-weight: bold; line-height: 40px; text-align: center; text-decoration: none; width: 200px;'>Reset Password</a>
                            </td>
                        </tr>
                    </table>
                    <p style='margin: 20px 0; color: #6c757d; font-size: 14px;'>Alternatively, copy and paste this link into your browser:<br>{resetLink}</p>
                    <p style='margin: 20px 0 0 0;'>If you didn't request this password reset, please <a href='mailto:{_appSettings.CompanyConfig.SupportEmail}'>contact our support team</a> immediately.</p>
                ")
            };
        }

        public EmailTemplate LoginNotification(string userName, DateTime loginTime, string ipAddress, string deviceInfo, string location)
        {
            return new EmailTemplate
            {
                Subject = $"New Login to Your {_appSettings.CompanyConfig.CompanyName} Account",
                Body = BuildEmailTemplate($@"
                    <h1 style='color: #4361ee; margin: 0 0 20px 0;'>New Login Detected</h1>
                    <p style='margin: 0 0 20px 0;'>Hello <strong>{userName}</strong>,</p>
                    <p style='margin: 0 0 20px 0;'>We noticed a recent login to your account. Here are the details:</p>
                    <table role='presentation' cellspacing='0' cellpadding='0' border='0' style='margin: 0 0 20px 0; width: 100%;'>
                        <tr>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'><strong>Time</strong></td>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'>{loginTime:MMMM dd, yyyy 'at' hh:mm tt} UTC</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'><strong>IP Address</strong></td>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'>{ipAddress}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'><strong>Approximate Location</strong></td>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'>{location}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'><strong>Device</strong></td>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'>{deviceInfo}</td>
                        </tr>
                    </table>
                    <p style='margin: 0 0 20px 0;'>If this was you, no action is needed. If you don't recognize this activity, please <a href='mailto:{_appSettings.CompanyConfig.SupportEmail}'>contact us immediately</a> and change your password.</p>
                    <p style='margin: 20px 0 0 0;'>Stay secure,<br>The {_appSettings.CompanyConfig.CompanyName} Team</p>
                ")
            };
        }

        public EmailTemplate OrderConfirmation(string userName, string orderId, decimal amount,
            string[] items, DateTime estimatedDelivery, string trackingUrl = null)
        {
            var itemsHtml = new StringBuilder();
            foreach (var item in items)
            {
                itemsHtml.AppendLine($@"<tr>
                    <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'>{item}</td>
                </tr>");
            }

            var trackingSection = !string.IsNullOrEmpty(trackingUrl) ?
                $@"<p style='margin: 20px 0;'>You can track your order here: <a href='{trackingUrl}'>Track Order #{orderId.ToUpper().Substring(0,8)}</a></p>" :
                "";

            return new EmailTemplate
            {
                Subject = $"Order Confirmation #{orderId.ToUpper().Substring(0,8)}",
                Body = BuildEmailTemplate($@"
                    <h1 style='color: #4361ee; margin: 0 0 20px 0;'>Thank You for Your Order!</h1>
                    <p style='margin: 0 0 20px 0;'>Hi <strong>{userName}</strong>,</p>
                    <p style='margin: 0 0 20px 0;'>We're preparing your order and will notify you when it ships.</p>
                    
                    <h2 style='color: #4361ee; margin: 30px 0 15px 0;'>Order Summary</h2>
                    <table role='presentation' cellspacing='0' cellpadding='0' border='0' style='margin: 0 0 20px 0; width: 100%;'>
                        <tr>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'><strong>Order Number</strong></td>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'>{orderId.ToUpper().Substring(0, 8)}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'><strong>Order Date</strong></td>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'>{DateTime.Now:MMMM dd, yyyy}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'><strong>Estimated Delivery</strong></td>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'>{estimatedDelivery:MMMM dd, yyyy}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'><strong>Total Amount</strong></td>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'><strong>₦{amount:0.00}</strong></td>
                        </tr>
                    </table>
                    
                    <h3 style='color: #4361ee; margin: 20px 0 15px 0;'>Items Ordered</h3>
                    <table role='presentation' cellspacing='0' cellpadding='0' border='0' style='margin: 0 0 20px 0; width: 100%;'>
                        {itemsHtml}
                    </table>
                    
                    {trackingSection}
                    
                    <p style='margin: 20px 0;'>If you have any questions about your order, please reply to this email or contact our support team at <a href='mailto:{_appSettings.CompanyConfig.SupportEmail}'>{_appSettings.CompanyConfig.SupportEmail}</a>.</p>
                    <p style='margin: 20px 0 0 0;'>Thank you for shopping with us!<br>The {_appSettings.CompanyConfig.CompanyName} Team</p>
                ")
            };
        }

        public EmailTemplate Newsletter(string title, string content, string unsubscribeLink,
            string featuredImageUrl = null, string readOnlineLink = null)
        {
            var imageSection = !string.IsNullOrEmpty(featuredImageUrl) ?
                $@"<img src='{featuredImageUrl}' alt='{title}' style='max-width: 100%; height: auto; margin: 0 0 20px 0; border-radius: 8px;' />" :
                "";

            var readOnlineSection = !string.IsNullOrEmpty(readOnlineLink) ?
                $@"<p style='margin: 20px 0; color: #6c757d; font-size: 14px;'>Having trouble viewing this email? <a href='{readOnlineLink}'>Read it online</a>.</p>" :
                "";

            return new EmailTemplate
            {
                Subject = title,
                Body = BuildEmailTemplate($@"
                    {imageSection}
                    <h1 style='color: #4361ee; margin: 0 0 20px 0;'>{title}</h1>
                    <div style='margin: 0 0 20px 0; line-height: 1.6;'>{content}</div>
                    {readOnlineSection}
                    <hr style='border: none; border-top: 1px solid #dee2e6; margin: 30px 0;' />
                    <p style='margin: 20px 0; color: #6c757d; font-size: 14px;'>
                        You're receiving this email because you subscribed to updates from {_appSettings.CompanyConfig.CompanyName}. 
                        <a href='{unsubscribeLink}' style='color: #6c757d;'>Unsubscribe</a> or 
                        <a href='{_appSettings.CompanyConfig.CompanyWebsite}/preferences' style='color: #6c757d;'>manage your preferences</a>.
                    </p>
                ")
            };
        }

        public EmailTemplate Notification(string userName, string message, string actionUrl = null,
            string actionText = "View Details")
        {
            var actionButton = !string.IsNullOrEmpty(actionUrl) ?
                $@"<table role='presentation' cellspacing='0' cellpadding='0' border='0' align='center' style='margin: 30px auto;'>
                    <tr>
                        <td align='center' style='border-radius: 5px; background: #4361ee;'>
                            <a href='{actionUrl}' target='_blank' style='background: #4361ee; border: solid 1px #4361ee; border-radius: 5px; color: #ffffff; display: inline-block; font-family: sans-serif; font-size: 16px; font-weight: bold; line-height: 40px; text-align: center; text-decoration: none; width: 200px;'>{actionText}</a>
                        </td>
                    </tr>
                </table>" : "";

            return new EmailTemplate
            {
                Subject = $"New Notification from {_appSettings.CompanyConfig.CompanyName}",
                Body = BuildEmailTemplate($@"
                    <h1 style='color: #4361ee; margin: 0 0 20px 0;'>Hello {userName},</h1>
                    <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 0 0 20px 0; border-left: 4px solid #4361ee;'>
                        {message}
                    </div>
                    {actionButton}
                    <p style='margin: 20px 0 0 0;'>If you have any questions, please contact our support team at <a href='mailto:{_appSettings.CompanyConfig.SupportEmail}'>{_appSettings.CompanyConfig.SupportEmail}</a>.</p>
                ")
            };
        }

        public EmailTemplate AccountVerification(string userName, string verificationCode, int expirationMinutes = 30)
        {
            return new EmailTemplate
            {
                Subject = $"Your Verification Code for {_appSettings.CompanyConfig.CompanyName}",
                Body = BuildEmailTemplate($@"
                    <h1 style='color: #4361ee; margin: 0 0 20px 0;'>Verify Your Account</h1>
                    <p style='margin: 0 0 20px 0;'>Dear {userName},</p>
                    <p style='margin: 0 0 20px 0;'>Use the verification code below to complete your account verification. This code will expire in {expirationMinutes} minutes.</p>
                    
                    <table role='presentation' cellspacing='0' cellpadding='0' border='0' align='center' style='margin: 30px auto; background: #f8f9fa; border-radius: 8px; padding: 20px;'>
                        <tr>
                            <td align='center' style='font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #4361ee;'>{verificationCode}</td>
                        </tr>
                    </table>
                    
                    <p style='margin: 20px 0; color: #6c757d; font-size: 14px;'>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
                    <p style='margin: 20px 0 0 0;'>Best regards,<br>The {_appSettings.CompanyConfig.CompanyName} Team</p>
                ")
            };
        }

        public EmailTemplate OrderShipped(string userName, string orderId, string trackingNumber,
            string carrier, DateTime shippedDate, DateTime estimatedDelivery, string trackingUrl = null)
        {
            var trackingSection = !string.IsNullOrEmpty(trackingUrl) ?
                $@"<p style='margin: 20px 0;'>You can track your order here: <a href='{trackingUrl}'>Track Your Package</a></p>" :
                $@"<p style='margin: 20px 0;'>Tracking Number: {trackingNumber} (Carrier: {carrier})</p>";

            return new EmailTemplate
            {
                Subject = $"Your Order #{orderId.ToUpper().Substring(0,8)} Has Shipped!",
                Body = BuildEmailTemplate($@"
                    <h1 style='color: #4361ee; margin: 0 0 20px 0;'>Your Order is on the Way! 🚚</h1>
                    <p style='margin: 0 0 20px 0;'>Hi <strong>{userName}</strong>,</p>
                    <p style='margin: 0 0 20px 0;'>Great news! Your order #{orderId.ToUpper().Substring(0,8)} has been shipped and is on its way to you.</p>
                    
                    <h2 style='color: #4361ee; margin: 30px 0 15px 0;'>Shipping Details</h2>
                    <table role='presentation' cellspacing='0' cellpadding='0' border='0' style='margin: 0 0 20px 0; width: 100%;'>
                        <tr>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'><strong>Order ID</strong></td>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'>{orderId.ToUpper().Substring(0,8)}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'><strong>Shipped Date</strong></td>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'>{shippedDate:MMMM dd, yyyy}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'><strong>Estimated Delivery</strong></td>
                            <td style='padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;'>{estimatedDelivery:MMMM dd, yyyy}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'><strong>Carrier</strong></td>
                            <td style='padding: 10px; border-bottom: 1px solid #dee2e6;'>{carrier}</td>
                        </tr>
                    </table>
                    
                    {trackingSection}
                    
                    <p style='margin: 20px 0;'>If you have any questions about your shipment, please reply to this email or contact our support team at <a href='mailto:{_appSettings.CompanyConfig.SupportEmail}'>{_appSettings.CompanyConfig.SupportEmail}</a>.</p>
                    <p style='margin: 20px 0 0 0;'>Happy shopping!<br>The {_appSettings.CompanyConfig.CompanyName} Team</p>
                ")
            };
        }

        public EmailTemplate OrderDelivered(string userName, string orderId, DateTime deliveredDate)
        {
            return new EmailTemplate
            {
                Subject = $"Your Order #{orderId.ToUpper().Substring(0,8)} Has Been Delivered!",
                Body = BuildEmailTemplate($@"
                    <h1 style='color: #4361ee; margin: 0 0 20px 0;'>Your Order Has Arrived! 📦</h1>
                    <p style='margin: 0 0 20px 0;'>Hi <strong>{userName}</strong>,</p>
                    <p style='margin: 0 0 20px 0;'>We're excited to let you know that your order #{orderId.ToUpper().Substring(0,8)} was delivered on {deliveredDate:MMMM dd, yyyy 'at' hh:mm tt}.</p>
                    
                    <p style='margin: 20px 0;'>We hope you love your purchase! If you have any questions or need assistance, don't hesitate to reach out to us.</p>
                    
                    <p style='margin: 20px 0;'>Would you like to share your experience? <a href='{_appSettings.FrontendUrl}/product/reviews/{orderId}'>Leave a review</a> to help other shoppers.</p>
                    
                    <p style='margin: 20px 0;'>If you have any issues with your order, please reply to this email or contact our support team at <a href='mailto:{_appSettings.CompanyConfig.SupportEmail}'>{_appSettings.CompanyConfig.SupportEmail}</a>.</p>
                    
                    <p style='margin: 20px 0 0 0;'>Thank you for shopping with us!<br>The {_appSettings.CompanyConfig.CompanyName} Team</p>
                ")
            };
        }

        private string BuildEmailTemplate(string content)
        {
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Ga Email</title>
</head>
<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fb; color: #333333;'>
    <table role='presentation' cellspacing='0' cellpadding='0' border='0' align='center' width='100%' style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>
        <tr>
            <td style='padding: 40px 30px 30px 30px; background: linear-gradient(120deg, #4361ee, #3a0ca3); color: #ffffff; text-align: center;'>
                <h1 style='margin: 0; font-size: 28px; font-weight: bold;'>{_appSettings.CompanyConfig.CompanyName}</h1>
            </td>
        </tr>
        <tr>
            <td style='padding: 40px 30px;'>
                {content}
            </td>
        </tr>
        <tr>
            <td style='padding: 30px; background-color: #f8f9fa; color: #6c757d; font-size: 14px; text-align: center;'>
                <p style='margin: 0 0 10px 0;'>&copy; {DateTime.Now.Year} {_appSettings.CompanyConfig.CompanyName}. All rights reserved.</p>
                <p style='margin: 0 0 10px 0;'>{_appSettings.CompanyConfig.CompanyAddress}</p>
                <p style='margin: 0;'>
                    <a href='{_appSettings.CompanyConfig.CompanyWebsite}' style='color: #4361ee; text-decoration: none; margin: 0 10px;'>Website</a> • 
                    <a href='mailto:{_appSettings.CompanyConfig.SupportEmail}' style='color: #4361ee; text-decoration: none; margin: 0 10px;'>Support</a> • 
                    <a href='{_appSettings.CompanyConfig.CompanyWebsite}/privacy' style='color: #4361ee; text-decoration: none; margin: 0 10px;'>Privacy Policy</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
    }
}