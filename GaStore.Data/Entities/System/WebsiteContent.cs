namespace GaStore.Data.Entities.System
{
    public class WebsiteContent : EntityBase
    {
        public string SiteKey { get; set; } = "default";
        public string SiteName { get; set; } = "GaStore";
        public string SiteDescription { get; set; } = string.Empty;
        public string FooterDescription { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string WhatsAppNumber { get; set; } = string.Empty;
        public string InfoEmail { get; set; } = string.Empty;
        public string SupportEmail { get; set; } = string.Empty;
        public string OfficeAddress { get; set; } = string.Empty;
        public string BusinessHours { get; set; } = string.Empty;
        public string FaqsJson { get; set; } = "[]";
        public string PrivacyPolicyContent { get; set; } = string.Empty;
        public string TermsOfServiceContent { get; set; } = string.Empty;
        public string ShippingPolicyContent { get; set; } = string.Empty;
        public string RefundPolicyContent { get; set; } = string.Empty;
    }
}
