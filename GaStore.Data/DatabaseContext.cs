using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using GaStore.Data;
using GaStore.Data.Entities.Ads;
using GaStore.Data.Entities.Coupons;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Referrals;
using GaStore.Data.Entities.Shippings;
using GaStore.Data.Entities.Subscribers;
using GaStore.Data.Entities.System;
using GaStore.Data.Entities.Users;
using GaStore.Data.Entities.Wallets;
using GaStore.Data.Models;

namespace GaStore.Models.Database
{
    public partial class DatabaseContext : DbContext
    {
        private readonly AppSettings _appSettings;

        public DatabaseContext(DbContextOptions<DatabaseContext> options, IOptions<AppSettings> appSettings)
            : base(options)
        {
            _appSettings = appSettings.Value;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                var config = _appSettings?.ConnectionStrings?.DefaultConnection;
                if (string.IsNullOrEmpty(config))
                {
                    throw new InvalidOperationException("Connection string is not configured.");
                }
                optionsBuilder.UseNpgsql(config);
            }
        }

        // ----------------------------
        // DBSets
        // ----------------------------
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<DeliveryAddress> DeliveryAddresses { get; set; }
        public DbSet<DeliveryLocation> DeliveryLocations { get; set; }
        public DbSet<PriceByWeight> PriceByWeights { get; set; }
        public DbSet<ShippingProvider> ShippingProviders { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<Transaction> WalletTransactions { get; set; }
        public DbSet<BankAccount> BankAccounts { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }

        // Product-related
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<Vat> Vats { get; set; }
        public DbSet<PricingTier> PricingTiers { get; set; }
        public DbSet<ProductSpecification> ProductSpecifications { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<FeaturedProduct> FeaturedProducts { get; set; }
        public DbSet<LimitedOffer> LimitedOffers { get; set; }
        public DbSet<LimitedOfferProduct> LimitedOfferProducts { get; set; }
        public DbSet<ProductReview> ProductReviews { get; set; }

        // Category hierarchy
        public DbSet<Brand> Brands { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<SubCategory> SubCategories { get; set; }
        public DbSet<ProductType> ProductTypes { get; set; }          
        public DbSet<ProductSubType> ProductSubTypes { get; set; }

        public DbSet<Tag> Tags { get; set; }
        public DbSet<TaggedProduct> TaggedProducts { get; set; }

        // Order-related
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Shipping> Shippings { get; set; }
        public DbSet<ManualPayment> ManualPayments { get; set; }

        // Referrals & Wallet
        public DbSet<ReferralCommission> ReferralCommissions { get; set; }
        public DbSet<Referral> Referrals { get; set; }
        public DbSet<ReferralPurchase> ReferralPurchases { get; set; }

        // Other entities
        public DbSet<Otp> Otps { get; set; }
        public DbSet<Banner> Sliders { get; set; }
        public DbSet<Subscriber> Subscribers { get; set; }

        // Coupons
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<CouponTier> CouponTiers { get; set; }
        public DbSet<CouponUsage> CouponUsages { get; set; }

        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<PaymentMethodConfiguration> PaymentMethodConfigurations { get; set; }
        public DbSet<WebsiteContent> WebsiteContents { get; set; }
        public DbSet<Voucher> Vouchers { get; set; }
        public DbSet<VoucherRedemption> VoucherRedemptions { get; set; }

        // ----------------------------
        // RELATIONSHIPS & CONFIGURATIONS
        // ----------------------------
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            // TAGGED PRODUCTS 
            modelBuilder.Entity<TaggedProduct>()
    .HasIndex(tp => new { tp.ProductId, tp.TagId })
    .IsUnique();

            modelBuilder.Entity<TaggedProduct>()
                .HasOne(tp => tp.Tag)
                .WithMany(t => t.TaggedProducts)
                .HasForeignKey(tp => tp.TagId)
                .OnDelete(DeleteBehavior.Cascade);

            // USER -> ROLES (Many-to-Many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.Roles)
                .WithMany(r => r.Users)
                .UsingEntity(j => j.ToTable("UserRoles"));

            // ----------------------------
            // REFERRALS & RELATED
            // ----------------------------
            modelBuilder.Entity<Referral>()
                .HasOne(r => r.Referrer)
                .WithMany(u => u.Referrals)
                .HasForeignKey(r => r.ReferrerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Referral>()
                .HasOne(r => r.Referra)
                .WithMany()
                .HasForeignKey(r => r.ReferralId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReferralPurchase>()
                .HasOne(rp => rp.Referral)
                .WithMany(r => r.Purchases)
                .HasForeignKey(rp => rp.ReferralId);

            modelBuilder.Entity<ReferralPurchase>()
                .HasOne(rp => rp.Order)
                .WithMany()
                .HasForeignKey(rp => rp.OrderId);

            // ----------------------------
            // WALLET RELATIONSHIPS
            // ----------------------------
            modelBuilder.Entity<Wallet>()
                .HasMany(w => w.Transactions)
                .WithOne(t => t.Wallet)
                .HasForeignKey(t => t.WalletId);

            modelBuilder.Entity<BankAccount>()
                .HasOne(ba => ba.User)
                .WithMany(u => u.BankAccounts)
                .HasForeignKey(ba => ba.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ----------------------------
            // ORDER RELATIONSHIPS
            // ----------------------------
            modelBuilder.Entity<Order>()
                .HasMany(o => o.Items)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Product)
                .WithMany()
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Variant)
                .WithMany()
                .HasForeignKey(oi => oi.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Shipping>()
                .HasOne(sd => sd.Order)
                .WithOne(o => o.Shipping)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ManualPayment>()
                .HasOne(mp => mp.Order)
                .WithOne(o => o.ManualPayment)
                .HasForeignKey<ManualPayment>(mp => mp.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ManualPayment>()
                .HasOne(mp => mp.User)
                .WithMany()
                .HasForeignKey(mp => mp.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ManualPayment>()
                .HasOne(mp => mp.BankAccount)
                .WithMany()
                .HasForeignKey(mp => mp.BankAccountId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ManualPayment>()
                .HasOne(mp => mp.ReviewedByUser)
                .WithMany()
                .HasForeignKey(mp => mp.ReviewedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PaymentMethodConfiguration>()
                .HasIndex(x => x.MethodKey)
                .IsUnique();

            modelBuilder.Entity<WebsiteContent>()
                .HasIndex(x => x.SiteKey)
                .IsUnique();

            modelBuilder.Entity<Voucher>()
                .HasIndex(x => x.Code)
                .IsUnique();

            modelBuilder.Entity<Voucher>()
                .HasOne(v => v.CreatedByUser)
                .WithMany()
                .HasForeignKey(v => v.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<VoucherRedemption>()
                .HasOne(vr => vr.Voucher)
                .WithMany(v => v.Redemptions)
                .HasForeignKey(vr => vr.VoucherId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<VoucherRedemption>()
                .HasOne(vr => vr.Order)
                .WithMany()
                .HasForeignKey(vr => vr.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<VoucherRedemption>()
                .HasOne(vr => vr.User)
                .WithMany()
                .HasForeignKey(vr => vr.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PaymentMethodConfiguration>()
                .HasData(
                    new PaymentMethodConfiguration
                    {
                        Id = Guid.Parse("31f67e0c-765b-4fdf-ae16-2f8874c17f11"),
                        MethodKey = "Paystack",
                        DisplayName = "Paystack",
                        IsEnabled = true,
                        IsGateway = true,
                        IsDefaultGateway = true,
                        SortOrder = 1,
                        DateCreated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc),
                        DateUpdated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new PaymentMethodConfiguration
                    {
                        Id = Guid.Parse("afdbd8dd-59aa-4eb8-a80b-9ebd7a26bd87"),
                        MethodKey = "Flutterwave",
                        DisplayName = "Flutterwave",
                        IsEnabled = true,
                        IsGateway = true,
                        IsDefaultGateway = false,
                        SortOrder = 2,
                        DateCreated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc),
                        DateUpdated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new PaymentMethodConfiguration
                    {
                        Id = Guid.Parse("7b3d0c80-4f8d-4923-a019-c12730b4a2a7"),
                        MethodKey = "commission",
                        DisplayName = "Commission",
                        IsEnabled = true,
                        IsGateway = false,
                        IsDefaultGateway = false,
                        SortOrder = 3,
                        DateCreated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc),
                        DateUpdated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new PaymentMethodConfiguration
                    {
                        Id = Guid.Parse("705320a5-3401-47e6-a61f-27d2d214f6f4"),
                        MethodKey = "manual",
                        DisplayName = "Manual Bank Transfer",
                        IsEnabled = true,
                        IsGateway = false,
                        IsDefaultGateway = false,
                        SortOrder = 4,
                        DateCreated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc),
                        DateUpdated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new PaymentMethodConfiguration
                    {
                        Id = Guid.Parse("5ba4be93-1546-4c6e-b4af-6279fbf85fec"),
                        MethodKey = "voucher",
                        DisplayName = "Voucher",
                        IsEnabled = true,
                        IsGateway = false,
                        IsDefaultGateway = false,
                        SortOrder = 5,
                        DateCreated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc),
                        DateUpdated = new DateTime(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc)
                    });

            modelBuilder.Entity<Shipping>()
                .HasOne(sd => sd.User)
                .WithMany()
                .HasForeignKey(sd => sd.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DeliveryLocation>()
                .HasMany(d => d.PriceByWeights)
                .WithOne(p => p.DeliveryLocation)
                .HasForeignKey(p => p.DeliveryLocationId)
                .OnDelete(DeleteBehavior.Cascade); 

            modelBuilder.Entity<PriceByWeight>()
                .HasOne(p => p.DeliveryLocation)
                .WithMany(d => d.PriceByWeights)
                .HasForeignKey(p => p.DeliveryLocationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cart>(builder =>
            {
                builder.ToTable("Carts");

                builder.HasKey(c => c.Id);

                builder.Property(c => c.UserId)
                    .IsRequired();

                builder.Property(c => c.DateCreated)
                    .HasDefaultValueSql("NOW()");

                builder.Property(c => c.DateUpdated)
                    .HasDefaultValueSql("NOW()");

                // Relationship: Cart → CartItems (1-to-many)
                builder.HasMany(c => c.Items)
                    .WithOne(ci => ci.Cart)
                    .HasForeignKey(ci => ci.CartId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CartItem>(builder =>
            {
                builder.ToTable("CartItems");

                builder.HasKey(ci => ci.Id);

                builder.Property(ci => ci.VariantId)
                    .IsRequired();

                builder.Property(ci => ci.Quantity)
                    .IsRequired()
                    .HasDefaultValue(1);
            });





            // ----------------------------
            // PRODUCT RELATIONSHIPS
            // ----------------------------

            modelBuilder.Entity<Product>()
        .HasOne(p => p.Category)
        .WithMany(c => c.Products)
        .HasForeignKey(p => p.CategoryId)
        .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.SubCategory)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.SubCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.ProductType)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.ProductTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.ProductSubType)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.ProductSubTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProductImage>()
                .HasOne(pi => pi.Product)
                .WithMany(p => p.Images)
                .HasForeignKey(pi => pi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProductImage>()
                .HasOne(pi => pi.Variant)
                .WithMany(v => v.Images)
                .HasForeignKey(pi => pi.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProductVariant>()
                .HasMany(v => v.PricingTiers)
                .WithOne(pt => pt.Variant)
                .HasForeignKey(pt => pt.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasMany(p => p.PricingTiers)
                .WithOne(pt => pt.Product)
                .HasForeignKey(pt => pt.ProductId);

            modelBuilder.Entity<FeaturedProduct>()
                .HasOne(fp => fp.Product)
                .WithMany(p => p.FeaturedEntries)
                .HasForeignKey(fp => fp.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LimitedOffer>()
                .ToTable("LimitedOffers");

            modelBuilder.Entity<LimitedOffer>()
                .Property(lo => lo.DisplayOrder)
                .HasDefaultValue(0);

            modelBuilder.Entity<LimitedOfferProduct>()
                .ToTable("LimitedOfferProducts");

            modelBuilder.Entity<LimitedOfferProduct>()
                .HasIndex(lop => new { lop.LimitedOfferId, lop.ProductId })
                .IsUnique();

            modelBuilder.Entity<LimitedOfferProduct>()
                .HasOne(lop => lop.LimitedOffer)
                .WithMany(lo => lo.Products)
                .HasForeignKey(lop => lop.LimitedOfferId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LimitedOfferProduct>()
                .HasOne(lop => lop.Product)
                .WithMany(p => p.LimitedOfferEntries)
                .HasForeignKey(lop => lop.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProductSpecification>()
                .HasOne(ps => ps.Product)
                .WithOne(p => p.Specifications)
                .HasForeignKey<ProductSpecification>(ps => ps.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductReview>()
                .HasOne(pr => pr.Product)
                .WithMany(p => p.Reviews)
                .HasForeignKey(pr => pr.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductReview>()
                .HasOne(pr => pr.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(pr => pr.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProductReview>()
                .HasIndex(pr => new { pr.ProductId, pr.UserId });

            // ----------------------------
            // CATEGORY HIERARCHY
            // ----------------------------
            modelBuilder.Entity<SubCategory>()
                .HasOne(sc => sc.Category)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(sc => sc.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductType>()
                .HasOne(pt => pt.SubCategory)
                .WithMany(sc => sc.ProductTypes)
                .HasForeignKey(pt => pt.SubCategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductSubType>()
                .HasOne(pst => pst.ProductType)
                .WithMany(pt => pt.ProductSubTypes)
                .HasForeignKey(pst => pst.ProductTypeId)
                .OnDelete(DeleteBehavior.Cascade);

            // ----------------------------
            // COUPON RELATIONSHIPS
            // ----------------------------
            modelBuilder.Entity<Coupon>()
                .HasIndex(c => c.Code)
                .IsUnique();

            modelBuilder.Entity<Coupon>()
                .HasMany(c => c.Tiers)
                .WithOne(t => t.Coupon)
                .HasForeignKey(t => t.CouponId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Coupon>()
                .HasMany(c => c.Usages)
                .WithOne(u => u.Coupon)
                .HasForeignKey(u => u.CouponId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CouponUsage>()
                .HasIndex(u => new { u.CouponId, u.UserId })
                .IsUnique();

            base.OnModelCreating(modelBuilder);
        }

        // ----------------------------
        // AUDIT TRACKING
        // ----------------------------
        public override int SaveChanges()
        {
            NormalizeDateTimes();

            foreach (var entry in ChangeTracker.Entries<EntityBase>())
            {
                if (entry.State == EntityState.Modified)
                    entry.Entity.DateUpdated = DateTime.UtcNow;
            }
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            NormalizeDateTimes();

            foreach (var entry in ChangeTracker.Entries<EntityBase>())
            {
                if (entry.State == EntityState.Modified)
                    entry.Entity.DateUpdated = DateTime.UtcNow;
            }

            return base.SaveChangesAsync(cancellationToken);
        }

        private void NormalizeDateTimes()
        {
            foreach (var entry in ChangeTracker.Entries())
            {
                foreach (var property in entry.Properties)
                {
                    if (property.Metadata.ClrType == typeof(DateTime) || property.Metadata.ClrType == typeof(DateTime?))
                    {
                        var value = property.CurrentValue as DateTime?;
                        if (value.HasValue)
                        {
                            property.CurrentValue = NormalizeDateTime(value.Value);
                        }
                    }
                }
            }
        }

        private static DateTime NormalizeDateTime(DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
                _ => value
            };
        }
    }
}
