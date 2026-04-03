using AutoMapper.Internal;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos;
using GaStore.Data.Dtos.MessagingDto;
using GaStore.Data.Models.Messaging;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IEmailService
	{
        Task<ServiceResponse<string>> SendMailAsync(MessageDto request);

        Task<ServiceResponse<string>> SendWelcomeEmailAsync(string email, string userName, string activationLink = null);
        Task<ServiceResponse<string>> SendPasswordResetEmailAsync(string email, string resetLink, int expirationHours = 24);
        Task<ServiceResponse<string>> SendLoginNotificationEmailAsync(string email, string userName, DateTime loginTime, string ipAddress, string deviceInfo, string location);
        Task<ServiceResponse<string>> SendOrderConfirmationEmailAsync(string email, string userName, string orderId, decimal amount, string[] items, DateTime estimatedDelivery, string trackingUrl = null);
        Task<ServiceResponse<string>> SendNewsletterEmailAsync(string email, string title, string content, string unsubscribeLink, string featuredImageUrl = null, string readOnlineLink = null);
        Task<ServiceResponse<string>> SendNotificationEmailAsync(string email, string userName, string message, string actionUrl = null, string actionText = "View Details");
        Task<ServiceResponse<string>> SendAccountVerificationEmailAsync(string email, string userName, string verificationCode, int expirationMinutes = 30);
        Task<ServiceResponse<string>> SendTemplatedEmailWithAttachmentsAsync(string email, EmailTemplate template, List<IFormFile> attachments = null);
        Task<ServiceResponse<string>> SendOrderShippedEmailAsync(string email, string userName, string orderId, string trackingNumber, string carrier, DateTime shippedDate, DateTime estimatedDelivery, string trackingUrl = null);
        Task<ServiceResponse<string>> SendOrderDeliveredEmailAsync(string email, string userName, string orderId, DateTime deliveredDate);
    }
}
