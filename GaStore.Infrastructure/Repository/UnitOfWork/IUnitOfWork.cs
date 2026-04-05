using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Infrastructure.Repository.Interfaces;

namespace GaStore.Infrastructure.Repository.UnitOfWork
{
	public interface IUnitOfWork : IDisposable
	{
		public IOtpRepository OtpRepository { get; }
		public IUserRepository UserRepository { get; }
        public IVendorKycRepository VendorKycRepository { get; }
		public IRoleRepository RoleRepository { get; }
		public IUserProfileRepository UserProfileRepository { get; }
		public IDeliveryAddressRepository DeliveryAddressRepository { get; }
        public IDeliveryLocationRepository DeliveryLocationRepository { get; }
        public IPriceByWeightRepository PriceByWeightRepository { get; }
        public IWalletRepository WalletRepository { get; }
		public ITransactionRepository TransactionRepository { get; }
		public IBankAccountRepository BankAccountRepository { get; }
		public IProductRepository ProductRepository { get; }
		public IProductReviewRepository ProductReviewRepository { get; }
		public IProductVariantRepository ProductVariantRepository { get; }
		public IPricingTierRepository PricingTierRepository { get; }
		public IProductSpecificationRepository ProductSpecificationRepository { get; }
		public IOrderRepository OrderRepository { get; }
		public IOrderItemRepository OrderItemRepository { get; }
        public IManualPaymentRepository ManualPaymentRepository { get; }
        public IShippingRepository ShippingRepository { get; }
        public IShippingProviderRepository ShippingProviderRepository { get; }
        public IReferralRepository ReferralRepository { get; }
		public IReferralPurchaseRepository ReferralPurchaseRepository { get; }
		public IReferralCommissionRepository ReferralCommissionRepository { get; }
		public IBrandRepository BrandRepository { get; }
		public ICategoryRepository CategoryRepository { get; }
		public ISubCategoryRepository SubCategoryRepository { get; }
		public IProductImageRepository ProductImageRepository { get; }
		public IFeaturedProductRepository FeaturedProductRepository { get; }
		public ILimitedOfferRepository LimitedOfferRepository { get; }
		public ILimitedOfferProductRepository LimitedOfferProductRepository { get; }
		public ISliderRepository SliderRepository { get; }
        public IVatRepository VatRepository { get; }
        public IProductTypeRepository ProductTypeRepository { get; }
        public IProductSubTypeRepository ProductSubTypeRepository { get; }
        public ITagRepository TagRepository { get; }
        public ITaggedProductRepository TaggedProductRepository { get; }
        public ICartRepository CartRepository { get; }
        public ICartItemRepository CartItemRepository { get; }
        public IPaymentMethodConfigurationRepository PaymentMethodConfigurationRepository { get; }
        public IWebsiteContentRepository WebsiteContentRepository { get; }
        public IVoucherRepository VoucherRepository { get; }
        public IVoucherRedemptionRepository VoucherRedemptionRepository { get; }

        // Save changes to the database
        Task<int> CompletedAsync(Guid UserId);
	}
}
