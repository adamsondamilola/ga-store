using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Ads;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Referrals;
using GaStore.Data.Entities.Shippings;
using GaStore.Data.Entities.System;
using GaStore.Data.Entities.Users;
using GaStore.Data.Entities.Wallets;
using GaStore.Infrastructure.Repository.GenericRepository;
using GaStore.Models.Database;

namespace GaStore.Infrastructure.Repository.Interfaces
{
	public class UserRepository : GenericRepository<User>, IUserRepository
	{
		public UserRepository(DatabaseContext context) : base(context) { }
	}

    public class VendorKycRepository : GenericRepository<VendorKyc>, IVendorKycRepository
    {
        public VendorKycRepository(DatabaseContext context) : base(context) { }
    }

	public class RoleRepository : GenericRepository<Role>, IRoleRepository
	{
		public RoleRepository(DatabaseContext context) : base(context) { }
	}

	public class UserProfileRepository : GenericRepository<UserProfile>, IUserProfileRepository
	{
		public UserProfileRepository(DatabaseContext context) : base(context) { }
	}

	public class DeliveryAddressRepository : GenericRepository<DeliveryAddress>, IDeliveryAddressRepository
	{
		public DeliveryAddressRepository(DatabaseContext context) : base(context) { }
	}

    public class DeliveryLocationRepository : GenericRepository<DeliveryLocation>, IDeliveryLocationRepository
    {
        public DeliveryLocationRepository(DatabaseContext context) : base(context) { }
    }

    public class PriceByWeightRepository : GenericRepository<PriceByWeight>, IPriceByWeightRepository
    {
        public PriceByWeightRepository(DatabaseContext context) : base(context) { }
    }

    public class WalletRepository : GenericRepository<Wallet>, IWalletRepository
	{
		public WalletRepository(DatabaseContext context) : base(context) { }
	}

	public class TransactionRepository : GenericRepository<Transaction>, ITransactionRepository
	{
		public TransactionRepository(DatabaseContext context) : base(context) { }
	}

	public class BankAccountRepository : GenericRepository<BankAccount>, IBankAccountRepository
	{
		public BankAccountRepository(DatabaseContext context) : base(context) { }
	}

	public class ProductRepository : GenericRepository<Product>, IProductRepository
	{
		public ProductRepository(DatabaseContext context) : base(context) { }
	}

	public class ProductReviewRepository : GenericRepository<ProductReview>, IProductReviewRepository
	{
		public ProductReviewRepository(DatabaseContext context) : base(context) { }
	}

	public class PricingTierRepository : GenericRepository<PricingTier>, IPricingTierRepository
	{
		public PricingTierRepository(DatabaseContext context) : base(context) { }
	}

	public class ProductVariantRepository : GenericRepository<ProductVariant>, IProductVariantRepository
	{
		public ProductVariantRepository(DatabaseContext context) : base(context) { }
	}

	public class ProductSpecificationRepository : GenericRepository<ProductSpecification>, IProductSpecificationRepository
	{
		public ProductSpecificationRepository(DatabaseContext context) : base(context) { }
	}

	public class OrderRepository : GenericRepository<Order>, IOrderRepository
	{
		public OrderRepository(DatabaseContext context) : base(context) { }
	}

	public class OrderItemRepository : GenericRepository<OrderItem>, IOrderItemRepository
	{
		public OrderItemRepository(DatabaseContext context) : base(context) { }
	}

    public class ManualPaymentRepository : GenericRepository<ManualPayment>, IManualPaymentRepository
    {
        public ManualPaymentRepository(DatabaseContext context) : base(context) { }
    }

    public class ShippingRepository : GenericRepository<Shipping>, IShippingRepository
    {
        public ShippingRepository(DatabaseContext context) : base(context) { }
    }

    public class ShippingProviderRepository : GenericRepository<ShippingProvider>, IShippingProviderRepository
    {
        public ShippingProviderRepository(DatabaseContext context) : base(context) { }
    }

    public class ReferralRepository : GenericRepository<Referral>, IReferralRepository
	{
		public ReferralRepository(DatabaseContext context) : base(context) { }
	}

	public class ReferralPurchaseRepository : GenericRepository<ReferralPurchase>, IReferralPurchaseRepository
	{
		public ReferralPurchaseRepository(DatabaseContext context) : base(context) { }
	}

	public class ReferralCommissionRepository : GenericRepository<ReferralCommission>, IReferralCommissionRepository
	{
		public ReferralCommissionRepository(DatabaseContext context) : base(context) { }
	}

	public class BrandRepository : GenericRepository<Brand>, IBrandRepository
	{
		public BrandRepository(DatabaseContext context) : base(context) { }
	}

	public class CategoryRepository : GenericRepository<Category>, ICategoryRepository
	{
		public CategoryRepository(DatabaseContext context) : base(context) { }
	}
	public class SubCategoryRepository : GenericRepository<SubCategory>, ISubCategoryRepository
	{
		public SubCategoryRepository(DatabaseContext context) : base(context) { }
	}

	public class ProductImageRepository : GenericRepository<ProductImage>, IProductImageRepository
	{
		public ProductImageRepository(DatabaseContext context) : base(context) { }
	}

	public class FeaturedProductRepository : GenericRepository<FeaturedProduct>, IFeaturedProductRepository
	{
		public FeaturedProductRepository(DatabaseContext context) : base(context) { }
	}

    public class LimitedOfferRepository : GenericRepository<LimitedOffer>, ILimitedOfferRepository
    {
        public LimitedOfferRepository(DatabaseContext context) : base(context) { }
    }

    public class LimitedOfferProductRepository : GenericRepository<LimitedOfferProduct>, ILimitedOfferProductRepository
    {
        public LimitedOfferProductRepository(DatabaseContext context) : base(context) { }
    }

	public class OtpRepository : GenericRepository<Otp>, IOtpRepository
	{
		public OtpRepository(DatabaseContext context) : base(context) { }
	}

	public class SliderRepository : GenericRepository<Banner>, ISliderRepository
	{
		public SliderRepository(DatabaseContext context) : base(context) { }
	}

    public class VatRepository : GenericRepository<Vat>, IVatRepository
    {
        public VatRepository(DatabaseContext context) : base(context) { }
    }

    public class ProductTypeRepository : GenericRepository<ProductType>, IProductTypeRepository
    {
        public ProductTypeRepository(DatabaseContext context) : base(context) { }
    }

    public class ProductSubTypeRepository : GenericRepository<ProductSubType>, IProductSubTypeRepository
    {
        public ProductSubTypeRepository(DatabaseContext context) : base(context) { }
    }

    public class TagRepository : GenericRepository<Tag>, ITagRepository
    {
        public TagRepository(DatabaseContext context) : base(context) { }
    }

    public class TaggedProductRepository : GenericRepository<TaggedProduct>, ITaggedProductRepository
    {
        public TaggedProductRepository(DatabaseContext context) : base(context) { }
    }

    public class CartRepository : GenericRepository<Cart>, ICartRepository
    {
        public CartRepository(DatabaseContext context) : base(context) { }
    }

    public class CartItemRepository : GenericRepository<CartItem>, ICartItemRepository
    {
        public CartItemRepository(DatabaseContext context) : base(context) { }
    }

    public class PaymentMethodConfigurationRepository : GenericRepository<PaymentMethodConfiguration>, IPaymentMethodConfigurationRepository
    {
        public PaymentMethodConfigurationRepository(DatabaseContext context) : base(context) { }
    }

    public class WebsiteContentRepository : GenericRepository<WebsiteContent>, IWebsiteContentRepository
    {
        public WebsiteContentRepository(DatabaseContext context) : base(context) { }
    }

    public class VoucherRepository : GenericRepository<Voucher>, IVoucherRepository
    {
        public VoucherRepository(DatabaseContext context) : base(context) { }
    }

    public class VoucherRedemptionRepository : GenericRepository<VoucherRedemption>, IVoucherRedemptionRepository
    {
        public VoucherRedemptionRepository(DatabaseContext context) : base(context) { }
    }

}
