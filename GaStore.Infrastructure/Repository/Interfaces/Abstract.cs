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

namespace GaStore.Infrastructure.Repository.Interfaces
{
	public interface IUserRepository : IGenericRepository<User> { }
	public interface IRoleRepository : IGenericRepository<Role> { }
	public interface IUserProfileRepository : IGenericRepository<UserProfile> { }
	public interface IDeliveryAddressRepository : IGenericRepository<DeliveryAddress> { }
    public interface IDeliveryLocationRepository : IGenericRepository<DeliveryLocation> { }
    public interface IPriceByWeightRepository : IGenericRepository<PriceByWeight> { }
    public interface IWalletRepository : IGenericRepository<Wallet> { }
	public interface ITransactionRepository : IGenericRepository<Transaction> { }
	public interface IBankAccountRepository : IGenericRepository<BankAccount> { }
	public interface IProductRepository : IGenericRepository<Product> { }
	public interface IProductReviewRepository : IGenericRepository<ProductReview> { }
	public interface IProductVariantRepository : IGenericRepository<ProductVariant> { }
	public interface IPricingTierRepository : IGenericRepository<PricingTier> { }
	public interface IProductSpecificationRepository : IGenericRepository<ProductSpecification> { }
	public interface IOrderRepository : IGenericRepository<Order> { }
	public interface IOrderItemRepository : IGenericRepository<OrderItem> { }
    public interface IManualPaymentRepository : IGenericRepository<ManualPayment> { }
    public interface IShippingRepository : IGenericRepository<Shipping> { }
    public interface IShippingProviderRepository : IGenericRepository<ShippingProvider> { }
    public interface IReferralRepository : IGenericRepository<Referral> { }
	public interface IReferralPurchaseRepository : IGenericRepository<ReferralPurchase> { }
	public interface IReferralCommissionRepository : IGenericRepository<ReferralCommission> { }
	public interface IBrandRepository : IGenericRepository<Brand> { }
	public interface ICategoryRepository : IGenericRepository<Category> { }
	public interface ISubCategoryRepository : IGenericRepository<SubCategory> { }
	public interface IProductImageRepository : IGenericRepository<ProductImage> { }
	public interface IFeaturedProductRepository : IGenericRepository<FeaturedProduct> { }
	public interface ILimitedOfferRepository : IGenericRepository<LimitedOffer> { }
	public interface ILimitedOfferProductRepository : IGenericRepository<LimitedOfferProduct> { }
	public interface IOtpRepository : IGenericRepository<Otp> { }
	public interface ISliderRepository : IGenericRepository<Banner> { }
    public interface IVatRepository : IGenericRepository<Vat> { }
    public interface IProductTypeRepository : IGenericRepository<ProductType> { }
    public interface IProductSubTypeRepository : IGenericRepository<ProductSubType> { }
    public interface ITagRepository : IGenericRepository<Tag> { }
    public interface ITaggedProductRepository : IGenericRepository<TaggedProduct> { }
    public interface ICartRepository : IGenericRepository<Cart> { }
    public interface ICartItemRepository : IGenericRepository<CartItem> { }
    public interface IPaymentMethodConfigurationRepository : IGenericRepository<PaymentMethodConfiguration> { }
    public interface IVoucherRepository : IGenericRepository<Voucher> { }
    public interface IVoucherRedemptionRepository : IGenericRepository<VoucherRedemption> { }
}
