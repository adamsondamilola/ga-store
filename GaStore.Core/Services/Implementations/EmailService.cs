using System;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;
using System.Net.Mail;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Utilities;
using GaStore.Data.Dtos;
using GaStore.Data.Models;
using GaStore.Shared;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Http;
using GaStore.Data.Models.Messaging;
using GaStore.Data.Dtos.MessagingDto;

namespace GaStore.Core.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly AppSettings _appSettings;
        private readonly IEmailTemplateFactory _emailTemplateFactory;

        public EmailService(
            ILogger<EmailService> logger,
            IOptions<AppSettings> appSettings,
            IEmailTemplateFactory emailTemplateFactory)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _emailTemplateFactory = emailTemplateFactory;
        }

        public async Task<ServiceResponse<string>> SendMailAsync(MessageDto request)
        {
            ServiceResponse<string> response = new();
            response.StatusCode = 400;
            try
            {
                if (CheckInput.Email(request.Recipient) != null)
                {
                    response.Message = CheckInput.Email(request.Recipient);
                }
                else if (request.Subject.Trim() == "")
                {
                    response.Message = "Subject can not be empty!";
                }
                else if (request.Subject.Length > 100)
                {
                    response.Message = "Mail subject should not be more than 100 characters!";
                }
                else if (request.Subject.Length < 3)
                {
                    response.Message = "Mail subject too short!";
                }
                else if (request.Content.Length < 5)
                {
                    response.Message = "Mail message body too short!";
                }
                else if (request.Content.Length > 5000)
                {
                    response.Message = "Mail subject should not be more than 5000 characters!";
                }
                else
                {
                    string? Mail = _appSettings?.MailSettings?.Mail;
                    int Port = (int)(_appSettings?.MailSettings?.Port);
                    string? Password = _appSettings?.MailSettings?.Password;
                    string? DisplayName = _appSettings?.MailSettings?.DisplayName;
                    string? SecretKey = _appSettings?.MailSettings?.SecretKey;
                    string? Host = _appSettings?.MailSettings?.Host;

                    var mail = new MimeMessage();
                    mail.Sender = MailboxAddress.Parse(Mail);
                    mail.To.Add(MailboxAddress.Parse(request.Recipient));
                    mail.Subject = request.Subject;
                    var builder = new BodyBuilder();

                    if (request.Attachment != null)
                    {
                        byte[] fileBytes;
                        foreach (var item in request.Attachment)
                        {
                            if (item.Length > 0)
                            {
                                using (var ms = new MemoryStream())
                                {
                                    item.CopyTo(ms);
                                    fileBytes = ms.ToArray();
                                }
                                builder.Attachments.Add(item.FileName, fileBytes);
                            }
                        }
                    }

                    builder.HtmlBody = request.Content;
                    mail.Body = builder.ToMessageBody();

                    using (MailKit.Net.Smtp.SmtpClient smtpClient = new MailKit.Net.Smtp.SmtpClient())
                    {
                        smtpClient.Connect(Host, Port, SecureSocketOptions.SslOnConnect);
                        await smtpClient.AuthenticateAsync(Mail, Password);
                        await smtpClient.SendAsync(mail);
                        await smtpClient.DisconnectAsync(true);

                        response.StatusCode = 200;
                        response.Message = "Message Sent!";
                        _logger.LogInformation("Mail sent to " + request.Recipient);
                    };
                }
            }
            catch (SmtpCommandException ex)
            {
                response.StatusCode = 400;
                response.Message = $"Server Error";
                _logger.LogError(ex, "SMTP Command Error");
            }
            catch (SmtpProtocolException ex)
            {
                response.StatusCode = 400;
                response.Message = $"Server Error";
                _logger.LogError(ex, "SMTP Protocol Error");
            }
            catch (Exception ex)
            {
                response.StatusCode = 500;
                response.Message = $"An error occurred";
                _logger.LogError(ex, "General Error");
            }

            return response;
        }

        // New methods for sending templated emails
        public async Task<ServiceResponse<string>> SendWelcomeEmailAsync(string email, string userName, string activationLink = null)
        {
            var template = _emailTemplateFactory.WelcomeEmail(userName, activationLink);
            return await SendTemplatedEmailAsync(email, template);
        }

        public async Task<ServiceResponse<string>> SendPasswordResetEmailAsync(string email, string resetLink, int expirationHours = 24)
        {
            var template = _emailTemplateFactory.PasswordReset(resetLink, expirationHours);
            return await SendTemplatedEmailAsync(email, template);
        }

        public async Task<ServiceResponse<string>> SendLoginNotificationEmailAsync(string email, string userName, DateTime loginTime, string ipAddress, string deviceInfo, string location)
        {
            var template = _emailTemplateFactory.LoginNotification(userName, loginTime, ipAddress, deviceInfo, location);
            return await SendTemplatedEmailAsync(email, template);
        }

        public async Task<ServiceResponse<string>> SendOrderConfirmationEmailAsync(string email, string userName, string orderId, decimal amount, string[] items, DateTime estimatedDelivery, string trackingUrl = null)
        {
            var template = _emailTemplateFactory.OrderConfirmation(userName, orderId, amount, items, estimatedDelivery, trackingUrl);
            return await SendTemplatedEmailAsync(email, template);
        }

        public async Task<ServiceResponse<string>> SendNewsletterEmailAsync(string email, string title, string content, string unsubscribeLink, string featuredImageUrl = null, string readOnlineLink = null)
        {
            var template = _emailTemplateFactory.Newsletter(title, content, unsubscribeLink, featuredImageUrl, readOnlineLink);
            return await SendTemplatedEmailAsync(email, template);
        }

        public async Task<ServiceResponse<string>> SendNotificationEmailAsync(string email, string userName, string message, string actionUrl = null, string actionText = "View Details")
        {
            var template = _emailTemplateFactory.Notification(userName, message, actionUrl, actionText);
            return await SendTemplatedEmailAsync(email, template);
        }

        public async Task<ServiceResponse<string>> SendAccountVerificationEmailAsync(string email, string userName, string verificationCode, int expirationMinutes = 15)
        {
            var template = _emailTemplateFactory.AccountVerification(userName, verificationCode, expirationMinutes);
            return await SendTemplatedEmailAsync(email, template);
        }

        public async Task<ServiceResponse<string>> SendOrderShippedEmailAsync(string email, string userName, string orderId, string trackingNumber, string carrier, DateTime shippedDate, DateTime estimatedDelivery, string trackingUrl = null)
        {
            var template = _emailTemplateFactory.OrderShipped(userName, orderId, trackingNumber, carrier, shippedDate, estimatedDelivery, trackingUrl);
            return await SendTemplatedEmailAsync(email, template);
        }

        public async Task<ServiceResponse<string>> SendOrderDeliveredEmailAsync(string email, string userName, string orderId, DateTime deliveredDate)
        {
            var template = _emailTemplateFactory.OrderDelivered(userName, orderId, deliveredDate);
            return await SendTemplatedEmailAsync(email, template);
        }

        private async Task<ServiceResponse<string>> SendTemplatedEmailAsync(string email, EmailTemplate template)
        {
            var sendMailDto = new MessageDto
            {
                Recipient = email,
                Subject = template.Subject,
                Content = template.Body
            };

            return await SendMailAsync(sendMailDto);
        }

        public async Task<ServiceResponse<string>> SendTemplatedEmailWithAttachmentsAsync(string email, EmailTemplate template, List<IFormFile> attachments = null)
        {
            var sendMailDto = new MessageDto
            {
                Recipient = email,
                Subject = template.Subject,
                Content = template.Body,
                Attachment = attachments
            };

            return await SendMailAsync(sendMailDto);
        }
    }
}