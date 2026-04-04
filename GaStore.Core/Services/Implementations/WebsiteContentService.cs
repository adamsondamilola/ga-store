using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos;
using GaStore.Data.Entities.System;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class WebsiteContentService : IWebsiteContentService
    {
        private const string DefaultSiteKey = "default";
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly IUnitOfWork _unitOfWork;
        private readonly DatabaseContext _context;
        private readonly ILogger<WebsiteContentService> _logger;

        public WebsiteContentService(
            IUnitOfWork unitOfWork,
            DatabaseContext context,
            ILogger<WebsiteContentService> logger)
        {
            _unitOfWork = unitOfWork;
            _context = context;
            _logger = logger;
        }

        public async Task<ServiceResponse<WebsiteContentDto>> GetWebsiteContentAsync()
        {
            var response = new ServiceResponse<WebsiteContentDto> { StatusCode = 400 };

            try
            {
                var content = await EnsureDefaultContentAsync();
                response.StatusCode = 200;
                response.Message = "Website content retrieved successfully.";
                response.Data = MapToDto(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving website content");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<WebsiteContentDto>> UpdateWebsiteContentAsync(Guid userId, UpdateWebsiteContentDto dto)
        {
            var response = new ServiceResponse<WebsiteContentDto> { StatusCode = 400 };

            try
            {
                var content = await EnsureDefaultContentAsync();
                ApplyUpdates(content, dto);

                await _unitOfWork.WebsiteContentRepository.Upsert(content);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Website content updated successfully.";
                response.Data = MapToDto(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating website content");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        private async Task<WebsiteContent> EnsureDefaultContentAsync()
        {
            var existing = await _context.WebsiteContents.FirstOrDefaultAsync(x => x.SiteKey == DefaultSiteKey);
            if (existing != null)
            {
                return existing;
            }

            var defaults = CreateDefaultContent();
            await _unitOfWork.WebsiteContentRepository.Add(defaults);
            await _context.SaveChangesAsync();
            return defaults;
        }

        private static WebsiteContentDto MapToDto(WebsiteContent content)
        {
            return new WebsiteContentDto
            {
                Id = content.Id,
                SiteName = content.SiteName,
                SiteDescription = content.SiteDescription,
                FooterDescription = content.FooterDescription,
                LogoUrl = content.LogoUrl,
                PhoneNumber = content.PhoneNumber,
                WhatsAppNumber = content.WhatsAppNumber,
                InfoEmail = content.InfoEmail,
                SupportEmail = content.SupportEmail,
                OfficeAddress = content.OfficeAddress,
                BusinessHours = content.BusinessHours,
                FaqItems = DeserializeFaqs(content.FaqsJson),
                PrivacyPolicyContent = content.PrivacyPolicyContent,
                TermsOfServiceContent = content.TermsOfServiceContent,
                ShippingPolicyContent = content.ShippingPolicyContent,
                RefundPolicyContent = content.RefundPolicyContent
            };
        }

        private static void ApplyUpdates(WebsiteContent content, UpdateWebsiteContentDto dto)
        {
            content.SiteName = dto.SiteName.Trim();
            content.SiteDescription = dto.SiteDescription.Trim();
            content.FooterDescription = dto.FooterDescription.Trim();
            content.LogoUrl = dto.LogoUrl.Trim();
            content.PhoneNumber = dto.PhoneNumber.Trim();
            content.WhatsAppNumber = dto.WhatsAppNumber.Trim();
            content.InfoEmail = dto.InfoEmail.Trim();
            content.SupportEmail = dto.SupportEmail.Trim();
            content.OfficeAddress = dto.OfficeAddress.Trim();
            content.BusinessHours = dto.BusinessHours.Trim();
            content.FaqsJson = JsonSerializer.Serialize(
                dto.FaqItems
                    .Where(x => !string.IsNullOrWhiteSpace(x.Question) || !string.IsNullOrWhiteSpace(x.Answer))
                    .Select(x => new WebsiteFaqItemDto
                    {
                        Question = x.Question.Trim(),
                        Answer = x.Answer.Trim()
                    })
                    .ToList(),
                JsonOptions);
            content.PrivacyPolicyContent = dto.PrivacyPolicyContent.Trim();
            content.TermsOfServiceContent = dto.TermsOfServiceContent.Trim();
            content.ShippingPolicyContent = dto.ShippingPolicyContent.Trim();
            content.RefundPolicyContent = dto.RefundPolicyContent.Trim();
            content.DateUpdated = DateTime.UtcNow;
        }

        private static List<WebsiteFaqItemDto> DeserializeFaqs(string faqsJson)
        {
            if (string.IsNullOrWhiteSpace(faqsJson))
            {
                return new List<WebsiteFaqItemDto>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<WebsiteFaqItemDto>>(faqsJson, JsonOptions) ?? new List<WebsiteFaqItemDto>();
            }
            catch
            {
                return new List<WebsiteFaqItemDto>();
            }
        }

        private static WebsiteContent CreateDefaultContent()
        {
            var now = DateTime.UtcNow;

            return new WebsiteContent
            {
                Id = Guid.Parse("2f6d6fe7-636a-4fdd-a7a0-fb2cf1cfd8ac"),
                SiteKey = DefaultSiteKey,
                SiteName = "GaStore",
                SiteDescription = "Shop different types of products at GaStore, your online store for everyday essentials, lifestyle items, and more in Nigeria.",
                FooterDescription = "GaStore brings together different types of products in one reliable online store, making it easy to shop for everyday needs, lifestyle items, and more.",
                LogoUrl = string.Empty,
                PhoneNumber = "09028432241",
                WhatsAppNumber = "2347052457688",
                InfoEmail = "info@towg.com.ng",
                SupportEmail = "support@towg.com.ng",
                OfficeAddress = "Harmony estate plot 14 block 16 Alhaji Rasak bishi street by TOB plaza off ayodele ipaye street, Magodo isheri",
                BusinessHours = "Monday to Friday, 9:00 AM to 6:00 PM",
                FaqsJson = JsonSerializer.Serialize(new List<WebsiteFaqItemDto>
                {
                    new() { Question = "What products can I buy on GaStore?", Answer = "GaStore offers different types of products, including everyday essentials, lifestyle items, and other products available on our storefront." },
                    new() { Question = "How can I place an order on GaStore?", Answer = "You can place an order directly on our website. Add products to your cart, proceed to checkout, and complete payment using the available payment options." },
                    new() { Question = "How do I contact customer support?", Answer = "You can reach us by email, phone, or WhatsApp using the contact details provided on the website." },
                    new() { Question = "What is your shipping policy?", Answer = "Shipping timelines and delivery options depend on your location and the products ordered. Please review our shipping policy page for full details." },
                    new() { Question = "What is your refund policy?", Answer = "Refund eligibility depends on the product and the condition of the item returned. Please review our refund policy page for full details." }
                }, JsonOptions),
                PrivacyPolicyContent =
@"## Introduction
GaStore respects your privacy and is committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data when you use our website.

## Information We Collect
We may collect information such as your name, email address, phone number, delivery address, payment details, and order history when you shop with us or contact our support team.

## How We Use Your Information
We use your information to process orders, provide customer support, improve our services, communicate important updates, and share relevant promotional offers where permitted.

## Data Protection
We apply reasonable technical and organizational measures to protect your personal information against unauthorized access, misuse, or disclosure.

## Your Rights
You may request access to, correction of, or deletion of your personal information by contacting our support team.",
                TermsOfServiceContent =
@"## Acceptance of Terms
By accessing or using GaStore, you agree to be bound by these terms and any additional policies referenced on the website.

## Products and Pricing
We aim to keep product descriptions, prices, and availability accurate, but we may update them at any time without prior notice.

## Orders and Fulfillment
When you place an order, we will process and fulfill it subject to product availability, payment confirmation, and delivery coverage.

## Payments
Payments made on GaStore must use valid and authorized payment methods. We may cancel or refuse any order where fraud or misuse is suspected.

## Returns and Refunds
Returns and refunds are subject to our refund policy. Please review that policy before placing an order.

## Limitation of Liability
GaStore will not be liable for indirect, incidental, or consequential damages arising from the use of our website or services.

## Governing Law
These terms are governed by the laws of Nigeria.",
                ShippingPolicyContent =
@"## Delivery Coverage
GaStore delivers to supported locations using trusted logistics partners and may use different carriers depending on the destination and order type.

## Delivery Timelines
Delivery timelines depend on your location, the products ordered, order confirmation time, and operational conditions. Estimated delivery windows may change when necessary.

## Order Tracking
Where tracking is available, customers will receive updates after an order has been processed or dispatched.

## Delivery Issues
If your order is delayed, missing, or arrives damaged, please contact our support team as soon as possible so we can assist.",
                RefundPolicyContent =
@"## Refund Eligibility
Refunds and returns are considered based on the condition of the item, the type of product, and the reason for the request.

## Return Requests
To request a return or refund, contact our support team with your order details and the reason for the request.

## Review Process
Once your request is received and the item is inspected where necessary, we will confirm whether the refund or replacement has been approved.

## Support
If you need help with a refund or return, please contact our support team using the phone, WhatsApp, or email details listed on the website.",
                DateCreated = now,
                DateUpdated = now
            };
        }
    }
}
