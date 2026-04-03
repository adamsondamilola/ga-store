using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Models
{
	public class AppSettings
	{
		public Logging? Logging { get; set; }
		public Serilog? Serilog { get; set; }
		public MailSettings? MailSettings { get; set; }
		public ConnectionStrings? ConnectionStrings { get; set; }
        public Jwt? Jwt { get; set; }
        public Google? Google { get; set; }
        public KudiSmsOtp? KudiSmsOtp { get; set; }
		public KudiSms? KudiSms { get; set; }
		public VerifyMe? VerifyMe { get; set; }
        public Flutterwave? Flutterwave { get; set; }
        public Paystack? Paystack { get; set; }
        public LogisticsConfig? LogisticsConfig { get; set; }
        public string? ApiRoot { get; set; }
        public string? FrontendUrl { get; set; }
        public string? DefaultPaymentGateway { get; set; }
        public string? EncryptionKey { get; set; }
		public string? Environment { get; set; }
		public string? AllowedHosts { get; set; }
		public CompanyConfig? CompanyConfig { get; set; }
        public Termii? Termii { get; set; }
        public Cloudinary? Cloudinary { get; set; }
		public bool UseCloudinary { get; set; } = false;
    }

    public class Logging
	{
		public LogLevel? LogLevel { get; set; }
	}

	public class LogLevel
	{
		public string? Default { get; set; }
		public string? MicrosoftAspNetCore { get; set; }
	}

	public class Serilog
	{
		public string[]? Using { get; set; }
		public MinimumLevel? MinimumLevel { get; set; }
		public WriteTo[]? WriteTo { get; set; }
		public string[]? Enrich { get; set; }
		public Dictionary<string, string>? Properties { get; set; }
	}

	public class MinimumLevel
	{
		public string? Default { get; set; }
		public Dictionary<string, string>? Override { get; set; }
	}

	public class WriteTo
	{
		public string? Name { get; set; }
		public Args? Args { get; set; }
	}

	public class Args
	{
		public string? Path { get; set; }
		public string? RollingInterval { get; set; }
		public bool? RollOnFileSizeLimit { get; set; }
		public string? Formatter { get; set; }
	}

	

	public class ConnectionStrings
	{
		public string? DefaultConnection { get; set; }
	}

	public class Jwt
	{
		public string? Key { get; set; }
		public string? Issuer { get; set; }
		public string? Audience { get; set; }
		public string? Subject { get; set; }
	}

    public class Google
    {
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
        public string? CallbackUrl { get; set; }
        public string? GoogleMapApiUrl { get; set; }
        public string? GoogleMapApiKey { get; set; }
		public string? RecaptchaSecretKey { get; set; }
		public string? RecaptchaVerifyUrl { get; set; }
    }
    public class MailSettings
    {
        public string? Mail { get; set; }
        public string? DisplayName { get; set; }
        public string? Password { get; set; }
        public string? Host { get; set; }
        public int? Port { get; set; }
        public string? SecretKey { get; set; }
    }
    public class KudiSmsOtp
	{
		public string? EndPoint { get; set; }
		public string? Token { get; set; }
		public string? SenderId { get; set; }
		public string? Appnamecode { get; set; }
		public string? Templatecode { get; set; }
	}

	public class KudiSms
	{
		public string? EndPoint { get; set; }
		public string? Token { get; set; }
		public string? SenderId { get; set; }
	}

	public class Flutterwave
	{
		public string? EndPoint { get; set; }
		public string? SecretKey { get; set; }
		public string? WebhookSecretHash { get; set; }
		public string? PublicKey { get; set; }
		public string? EncryptionKey { get; set; }
		public string? Bvn { get; set; }
	}

    public class Paystack
    {
        public string? EndPoint { get; set; }
        public string? SecretKey { get; set; }
        public string? PublicKey { get; set; }
        public string? EncryptionKey { get; set; }
    }
    public class VerifyMe
    {
        public string? EndPoint { get; set; }
        public string? SecretKey { get; set; }
    }

    public class AppConfig
	{
		public string? EncryptionKey { get; set; }
	}

	public class LogisticsConfig
	{
        public string? GigEndpoint { get; set; }
        public string? CustomerCode { get; set; }
        public string? GigUsername { get; set; }
        public string? GigPassword { get; set; }
    }

    public class CompanyConfig
    {
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyWebsite { get; set; } = string.Empty;
        public string CompanyAddress { get; set; } = string.Empty;
        public string SupportEmail { get; set; } = string.Empty;
        public string SupportPhone { get; set; } = string.Empty;
		public string Longitude { get; set; } = string.Empty;
		public string Latitude { get; set; } = string.Empty;
    }

    public class Termii
    {
        public string? ApiKey { get; set; }
        public string? BaseUrl { get; set; }
        public string? SenderId { get; set; }
        public string? Channel { get; set; }
    }

    public class Cloudinary
    {
        public string? CloudName { get; set; }
        public string? ApiKey { get; set; }
        public string? ApiSecret { get; set; }
    }

}
