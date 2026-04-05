using AutoMapper;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OfficeOpenXml;
using Serilog;
using SixLabors.ImageSharp;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using GaStore.Core.Services.Cloudinary;
using GaStore.Core.Services.Implementations;
using GaStore.Core.Services.Implementations.GigLogistics;
using GaStore.Core.Services.Implementations.Google;
using GaStore.Core.Services.Implementations.PaymentGateways.Flutterwave;
using GaStore.Core.Services.Implementations.PaymentGateways.Paystack;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Services.Interfaces.GigLogistics;
using GaStore.Core.Services.Interfaces.Google;
using GaStore.Core.Services.Interfaces.PaymentGateways.Flutterwave;
using GaStore.Core.Services.Interfaces.PaymentGateways.Paystack;
using GaStore.Core.Services.SMS;
using GaStore.Data;
using GaStore.Data.Dtos.ImageUploads;
using GaStore.Data.Models;
using GaStore.Infrastructure.Seeding;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Middleware;
using GaStore.Models.Database;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("Logs/log-development-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();
// Register AppSettings
builder.Services.Configure<AppSettings>(builder.Configuration);
builder.Services.Configure<Termii>(builder.Configuration.GetSection("Termii"));
IServiceCollection serviceCollection = builder.Services.AddDbContext<DatabaseContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register image optimization settings
builder.Services.Configure<ImageOptimizationSettings>(builder.Configuration.GetSection("ImageOptimization"));



// Register AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

builder.Services.AddControllers();
builder.Services.AddMemoryCache();
/*
builder.Services.AddControllers().AddJsonOptions(options =>
{
	options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
});
*/
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDataProtection();
builder.Services.AddSignalR();
builder.Services.AddHttpContextAccessor();
builder.Services.TryAddSingleton<IActionContextAccessor, ActionContextAccessor>();


builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IEmailTemplateFactory, EmailTemplateFactory>();
builder.Services.AddScoped<ISmsTemplateFactory, SmsTemplateFactory>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<IBrandService, BrandService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ISubCategoryService, SubCategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductReviewService, ProductReviewService>();
builder.Services.AddScoped<IProductVariantService, ProductVariantService>();
builder.Services.AddScoped<IFeaturedProductService, FeaturedProductService>();
builder.Services.AddScoped<ILimitedOfferService, LimitedOfferService>();
builder.Services.AddScoped<IProductSpecificationService, ProductSpecificationService>();
builder.Services.AddScoped<IPricingTierService, PricingTierService>();
builder.Services.AddScoped<IProductImageService, ProductImageService>();
builder.Services.AddScoped<IOrderItemService, OrderItemService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IShippingService, ShippingService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IBankAccountService, BankAccountService>();
builder.Services.AddScoped<IReferralService, ReferralService>();
builder.Services.AddScoped<IReferralPurchaseService, ReferralPurchaseService>();
builder.Services.AddScoped<IReferralCommissionService, ReferralCommissionService>();
builder.Services.AddScoped<ICheckoutService, CheckoutService>();
builder.Services.AddScoped<IFlutterwaveService, FlutterwaveService>();
builder.Services.AddScoped<IPaystackService, PaystackService>();
builder.Services.AddScoped<ICheckoutService, CheckoutService>();
builder.Services.AddScoped<IBannerService, BannerService>();
builder.Services.AddScoped<IUserDeliveryAddressService, UserDeliveryAddressService>();
builder.Services.AddScoped<IDeliveryLocationService, DeliveryLocationService>();
builder.Services.AddScoped<IVatService, VatService>();
builder.Services.AddScoped<ISubscriberService, SubscriberService>();
builder.Services.AddScoped<IAuthGoogleService, AuthGoogleService>();
builder.Services.AddScoped<ITermiiSmsService, TermiiSmsService>();
builder.Services.AddHttpClient<IGigDeliveryService, GigDeliveryService>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IProductTypeService, ProductTypeService>();
builder.Services.AddScoped<IProductSubTypeService, ProductSubTypeService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<IGoogleMapService, GoogleMapService>();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddHttpClient<IRecaptchaService, RecaptchaService>();
builder.Services.AddScoped<IImageUploadService, ImageUploadService>();
builder.Services.AddScoped<IManualPaymentService, ManualPaymentService>();
builder.Services.AddScoped<IPaymentMethodConfigurationService, PaymentMethodConfigurationService>();
builder.Services.AddScoped<IWebsiteContentService, WebsiteContentService>();
builder.Services.AddScoped<IVoucherService, VoucherService>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();


builder.Services.AddCors(options =>
{
	options.AddPolicy("policy", policy =>
	{
		policy.WithOrigins(
			
            "https://gang-001-site3.anytempurl.com/",
            "https://gang-001-site4.anytempurl.com/",
            "http://gang-001-site3.anytempurl.com/",
            "http://gang-001-site4.anytempurl.com/",
                        "http://codelord-001-site7.jtempurl.com",
"http://codelord-001-site6.jtempurl.com",
			"https://codelord-001-site6.jtempurl.com",
			"https://ga-admin-app.vercel.app",
            "https://ga-admin-app-dev.vercel.app",
            "https://ga-admin-app-six.vercel.app",
            "https://ga-store-frontend.vercel.app",
                        "https://ga-store-frontend-pied.vercel.app",
            "https://ga-store-frontend-dev.vercel.app",
"https://ga.com.ng",
"https://www.ga.com.ng",
"https://www.office.ga.com.ng",
"https://office.ga.com.ng",
"https://api.ga.com.ng",
"https://dev-api.ga.com.ng"
,"https://localhost:44378",
            "http://localhost:44378",
            "http://localhost:5036",
"https://localhost:5036",
			"http://localhost:3001",
			"http://localhost:3000",
			"http://127.0.0.1:3001",
			"http://127.0.0.1:3000"
		)
		.AllowAnyMethod()
		.AllowAnyHeader()
		.AllowCredentials();
	});
});

builder.Services.AddAuthentication(options =>
{
    // Set default scheme to JWT for API requests
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;

    // Set Google as the challenge scheme
    options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;

    // Set cookie scheme for temporary sign-in during OAuth flow
    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
})
.AddCookie(options =>
{
    options.ExpireTimeSpan = TimeSpan.FromMinutes(5);
    options.SlidingExpiration = true;
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
})
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Google:ClientId"];
    options.ClientSecret = builder.Configuration["Google:ClientSecret"];
    options.SaveTokens = true;

    // Important: Set the sign-in scheme to cookie
    options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;

    // Claim mappings
    options.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");
    options.ClaimActions.MapJsonKey(ClaimTypes.GivenName, "given_name");
    options.ClaimActions.MapJsonKey(ClaimTypes.Surname, "family_name");
    options.ClaimActions.MapJsonKey(ClaimTypes.NameIdentifier, "sub");
});


builder.Services.AddSwaggerGen(option =>
{
	option.SwaggerDoc("v1", new OpenApiInfo { Title = "Ga Store API", Version = "v1" });
	option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
	{
		In = ParameterLocation.Header,
		Description = "Please enter a valid token",
		Name = "Authorization",
		Type = SecuritySchemeType.Http,
		BearerFormat = "JWT",
		Scheme = "Bearer"
	});
	option.AddSecurityRequirement(new OpenApiSecurityRequirement
	{
		{
			new OpenApiSecurityScheme
			{
				Reference = new OpenApiReference
				{
					Type=ReferenceType.SecurityScheme,
					Id="Bearer"
				}
			},
			new string[]{}
		}
	});
    option.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
});

builder.Services.AddRateLimiter(options =>
{
    // Global options
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Fixed window policy for general API requests
    options.AddFixedWindowLimiter("FixedPolicy", fixedOptions =>
    {
        fixedOptions.PermitLimit = 100; // 100 requests
        fixedOptions.Window = TimeSpan.FromMinutes(1); // per minute
        fixedOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        fixedOptions.QueueLimit = 10; // queue up to 10 requests
    });

    // Sliding window policy for authenticated users
    options.AddSlidingWindowLimiter("SlidingPolicy", slidingOptions =>
    {
        slidingOptions.PermitLimit = 200;
        slidingOptions.Window = TimeSpan.FromMinutes(1);
        slidingOptions.SegmentsPerWindow = 2;
        slidingOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        slidingOptions.QueueLimit = 5;
    });

    // Token bucket policy for high-frequency endpoints
    options.AddTokenBucketLimiter("TokenPolicy", tokenOptions =>
    {
        tokenOptions.TokenLimit = 50;
        tokenOptions.TokensPerPeriod = 25;
        tokenOptions.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        tokenOptions.AutoReplenishment = true;
        tokenOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        tokenOptions.QueueLimit = 5;
    });

    // Concurrency limiter for resource-intensive operations
    options.AddConcurrencyLimiter("ConcurrencyPolicy", concurrencyOptions =>
    {
        concurrencyOptions.PermitLimit = 10;
        concurrencyOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        concurrencyOptions.QueueLimit = 5;
    });

    // Custom policy for authentication endpoints
    options.AddFixedWindowLimiter("AuthPolicy", authOptions =>
    {
        authOptions.PermitLimit = 5; // Only 5 login attempts
        authOptions.Window = TimeSpan.FromMinutes(1);
        authOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        authOptions.QueueLimit = 0; // No queuing for auth
    });

    // Custom policy for payment endpoints
    options.AddFixedWindowLimiter("PaymentPolicy", paymentOptions =>
    {
        paymentOptions.PermitLimit = 10; // 10 payment requests
        paymentOptions.Window = TimeSpan.FromMinutes(1);
        paymentOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        paymentOptions.QueueLimit = 2;
    });

    // On rejected requests
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers.RetryAfter = "60"; // Retry after 60 seconds

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            await context.HttpContext.Response.WriteAsync(
                $"Too many requests. Please try again in {retryAfter.TotalSeconds} seconds.",
                cancellationToken: token);
        }
        else
        {
            await context.HttpContext.Response.WriteAsync(
                "Too many requests. Please try again later.",
                cancellationToken: token);
        }
    };
});


var app = builder.Build();

await CategoryHierarchySeeder.SeedAsync(app.Services);

app.UseStaticFiles();
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	//app.UseSwagger();
	//app.UseSwaggerUI();
}

// Password protection for Swagger in Production
if (!app.Environment.IsDevelopment())
{
    // Basic authentication for Swagger
    app.Use(async (context, next) =>
    {
        var path = context.Request.Path;

        // Protect Swagger endpoints
        if (path.StartsWithSegments("/swagger") ||
            path.StartsWithSegments("/api-docs") ||
            path.Equals("/"))
        {
            // Check for Authorization header
            string authHeader = context.Request.Headers["Authorization"];

            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Basic "))
            {
                // Return 401 with WWW-Authenticate header
                context.Response.Headers["WWW-Authenticate"] = "Basic realm=\"Swagger\"";
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Unauthorized - Swagger access requires authentication");
                return;
            }

            // Extract and validate credentials
            try
            {
                var encodedUsernamePassword = authHeader.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries)[1]?.Trim();
                var decodedUsernamePassword = Encoding.UTF8.GetString(Convert.FromBase64String(encodedUsernamePassword));
                var username = decodedUsernamePassword.Split(':', 2)[0];
                var password = decodedUsernamePassword.Split(':', 2)[1];

                // Get credentials from configuration
                var swaggerUser = builder.Configuration["Swagger:Username"] ?? "ga";
                var swaggerPassword = builder.Configuration["Swagger:Password"] ?? "&passWORD123@!X";

                if (username != swaggerUser || password != swaggerPassword)
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Invalid username or password");
                    return;
                }
            }
            catch
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Invalid Authorization header");
                return;
            }
        }

        await next();
    });
}


app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("policy");

app.UseAuthentication();
app.UseAuthorization();

// Audit middleware
app.UseMiddleware<AuditLoggingMiddleware>();

app.MapControllers().RequireRateLimiting("FixedPolicy");

app.Run();
