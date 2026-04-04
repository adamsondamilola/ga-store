using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Infrastructure.Repository.Interfaces;
using GaStore.Models.Database;

namespace GaStore.Infrastructure.Repository.UnitOfWork
{
	public class UnitOfWork : IUnitOfWork
	{
		private readonly DatabaseContext _context;

		// Repository instances
		public IOtpRepository OtpRepository { get; }
		public IUserRepository UserRepository { get; }
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

        public UnitOfWork(DatabaseContext context)
		{
			_context = context;

			// Initialize repositories
			OtpRepository = new OtpRepository(_context);
			UserRepository = new UserRepository(_context);
			RoleRepository = new RoleRepository(_context);
			WalletRepository = new WalletRepository(_context);
			UserProfileRepository = new UserProfileRepository(_context);
			DeliveryAddressRepository = new DeliveryAddressRepository(_context);
            DeliveryLocationRepository = new DeliveryLocationRepository(_context);
            PriceByWeightRepository = new PriceByWeightRepository(_context);
            TransactionRepository = new TransactionRepository(_context);
			BankAccountRepository = new BankAccountRepository(_context);
			ProductRepository = new ProductRepository(_context);
			ProductReviewRepository = new ProductReviewRepository(_context);
			ProductVariantRepository = new ProductVariantRepository(_context);
			PricingTierRepository = new PricingTierRepository(_context);
			ProductSpecificationRepository = new ProductSpecificationRepository(_context);
			OrderRepository = new OrderRepository(_context);
			OrderItemRepository = new OrderItemRepository(_context);
            ManualPaymentRepository = new ManualPaymentRepository(_context);
            ShippingRepository = new ShippingRepository(_context);
            ShippingProviderRepository = new ShippingProviderRepository(_context);
            ReferralRepository = new ReferralRepository(_context);
			ReferralPurchaseRepository = new ReferralPurchaseRepository(_context);
			ReferralCommissionRepository = new ReferralCommissionRepository(_context);
			BrandRepository = new BrandRepository(_context);
			CategoryRepository = new CategoryRepository(_context);
			SubCategoryRepository = new SubCategoryRepository(_context);
			ProductImageRepository = new ProductImageRepository(_context);
			FeaturedProductRepository = new FeaturedProductRepository(_context);
			LimitedOfferRepository = new LimitedOfferRepository(_context);
			LimitedOfferProductRepository = new LimitedOfferProductRepository(_context);
			SliderRepository = new SliderRepository(_context);
            VatRepository = new VatRepository(_context);
            ProductTypeRepository = new ProductTypeRepository(_context);
            ProductSubTypeRepository = new ProductSubTypeRepository(_context);
            TagRepository = new TagRepository(_context);
            TaggedProductRepository = new TaggedProductRepository(_context);
            CartRepository = new CartRepository(_context);
            CartItemRepository = new CartItemRepository(_context);
            PaymentMethodConfigurationRepository = new PaymentMethodConfigurationRepository(_context);
            WebsiteContentRepository = new WebsiteContentRepository(_context);
            VoucherRepository = new VoucherRepository(_context);
            VoucherRedemptionRepository = new VoucherRedemptionRepository(_context);
        }

        public async Task<int> CompletedAsync(Guid UserId)
		{
			//add audit here

			//return await _dbContext.SaveChangesAsync(userName);
			return await _context.SaveChangesAsync();
		}

		//private bool _disposed = false;
		private bool _disposed;

		protected virtual void Dispose(bool disposing)
		{
			if (!_disposed)
			{
				if (disposing)
				{
					_context.Dispose();
				}
			}
			_disposed = true;
		}

		public void Dispose()
		{
			Dispose(true);
			GC.SuppressFinalize(this);
		}

	}
}
