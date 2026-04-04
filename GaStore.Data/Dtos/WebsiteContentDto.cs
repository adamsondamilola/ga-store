namespace GaStore.Data.Dtos
{
    public class WebsiteFaqItemDto
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
    }

    public class WebsiteContentDto
    {
        public Guid? Id { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public string SiteDescription { get; set; } = string.Empty;
        public string FooterDescription { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string WhatsAppNumber { get; set; } = string.Empty;
        public string InfoEmail { get; set; } = string.Empty;
        public string SupportEmail { get; set; } = string.Empty;
        public string OfficeAddress { get; set; } = string.Empty;
        public string BusinessHours { get; set; } = string.Empty;
        public List<WebsiteFaqItemDto> FaqItems { get; set; } = new();
        public string PrivacyPolicyContent { get; set; } = string.Empty;
        public string TermsOfServiceContent { get; set; } = string.Empty;
        public string ShippingPolicyContent { get; set; } = string.Empty;
        public string RefundPolicyContent { get; set; } = string.Empty;
    }

    public class UpdateWebsiteContentDto
    {
        public string SiteName { get; set; } = string.Empty;
        public string SiteDescription { get; set; } = string.Empty;
        public string FooterDescription { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string WhatsAppNumber { get; set; } = string.Empty;
        public string InfoEmail { get; set; } = string.Empty;
        public string SupportEmail { get; set; } = string.Empty;
        public string OfficeAddress { get; set; } = string.Empty;
        public string BusinessHours { get; set; } = string.Empty;
        public List<WebsiteFaqItemDto> FaqItems { get; set; } = new();
        public string PrivacyPolicyContent { get; set; } = string.Empty;
        public string TermsOfServiceContent { get; set; } = string.Empty;
        public string ShippingPolicyContent { get; set; } = string.Empty;
        public string RefundPolicyContent { get; set; } = string.Empty;
    }
}
