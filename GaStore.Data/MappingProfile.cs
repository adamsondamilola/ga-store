using GaStore.Data.Dtos.AdsDto;
using GaStore.Data.Dtos.CouponsDto;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Dtos.ReferralDto;
using GaStore.Data.Dtos.SubscribersDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Dtos.WalletsDto;
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

using GaStore.Data.Dtos;

namespace GaStore.Data
{
	public class MappingProfile : AutoMapper.Profile
	{
		public MappingProfile()
		{
			// User mappings
			CreateMap<User, UserDto>();
			CreateMap<UserDto, User>();
            CreateMap<CreateUserDto, User>().ReverseMap();
            CreateMap<CreateUserDto, UserDto>().ReverseMap();

            CreateMap<UserProfile, UserProfileDto>();
			CreateMap<UserProfileDto, UserProfile>();

			CreateMap<DeliveryAddress, DeliveryAddressDto>();
			CreateMap<DeliveryAddressDto, DeliveryAddress>();

			CreateMap<DeliveryLocation, DeliveryLocationDto>();
            CreateMap<DeliveryLocationDto, DeliveryLocation>();
            CreateMap<PriceByWeightDto, PriceByWeight>().ReverseMap();

            CreateMap<ProductReview, ProductReviewDto>();
			CreateMap<ProductReviewDto, ProductReview>();

			// Role mappings
			CreateMap<Role, RoleDto>();
			CreateMap<RoleDto, Role>();

			// Wallet mappings
			CreateMap<Wallet, WalletDto>();
			CreateMap<WalletDto, Wallet>();

			// Transaction mappings
			CreateMap<Transaction, TransactionDto>();
			CreateMap<TransactionDto, Transaction>();

			// BankAccount mappings
			CreateMap<BankAccount, BankAccountDto>();
			CreateMap<BankAccountDto, BankAccount>();

			// Product mappings
			CreateMap<Product, ProductDto>();
			CreateMap<ProductDto, Product>();

			// ProductVariant mappings
			CreateMap<ProductVariant, ProductVariantDto>();
			CreateMap<ProductVariantDto, ProductVariant>();

			// ProductSpecification mappings
			CreateMap<ProductSpecification, ProductSpecificationDto>();
			CreateMap<ProductSpecificationDto, ProductSpecification>();

			// Order mappings
			CreateMap<Order, OrderDto>();
			CreateMap<OrderDto, Order>();
            CreateMap<ManualPayment, ManualPaymentDto>()
                .ForMember(dest => dest.ReviewedByName,
                    opt => opt.MapFrom(src => src.ReviewedByUser != null
                        ? $"{src.ReviewedByUser.FirstName} {src.ReviewedByUser.LastName}".Trim()
                        : null));
            CreateMap<ManualPaymentDto, ManualPayment>();

			// OrderItem mappings
			CreateMap<OrderItem, OrderItemDto>();
			CreateMap<OrderItemDto, OrderItem>();

			// Shipping mappings
			CreateMap<Shipping, ShippingDto>();
            CreateMap<ShippingDto, Shipping>();
            CreateMap<ShippingProviderDto, ShippingProvider>().ReverseMap();
            CreateMap<ShippingProviderListDto, ShippingProvider>().ReverseMap();

            // Referral mappings
            CreateMap<Referral, ReferralDto>();
			CreateMap<ReferralDto, Referral>();

			// ReferralPurchase mappings
			CreateMap<ReferralPurchase, ReferralPurchaseDto>();
			CreateMap<ReferralPurchaseDto, ReferralPurchase>();

			// ReferralCommission mappings
			CreateMap<ReferralCommission, ReferralCommissionDto>();
			CreateMap<ReferralCommissionDto, ReferralCommission>();

			// Brand mappings
			CreateMap<Brand, BrandDto>();
			CreateMap<BrandDto, Brand>();

            // Category mappings
            CreateMap<Category, CategoryDto>().ReverseMap();
            CreateMap<Category, CategoryWithHierarchyDto>().ReverseMap();
            CreateMap<CategoryDto, CategoryWithHierarchyDto>().ReverseMap();
            CreateMap<SubCategory, SubCategoryDto>().ReverseMap();
            CreateMap<SubCategory, SubCategoryHierarchyDto>().ReverseMap();
            CreateMap<SubCategoryDto, SubCategoryHierarchyDto>().ReverseMap();
            CreateMap<ProductType, ProductTypeDto>().ReverseMap();
            CreateMap<ProductType, CreateProductTypeDto>().ReverseMap();
            CreateMap<ProductType, ProductTypeHierarchyDto>().ReverseMap();
            CreateMap<ProductTypeDto, ProductTypeHierarchyDto>().ReverseMap();
            CreateMap<ProductTypeDto, CreateProductTypeDto>().ReverseMap();
            CreateMap<ProductSubType, ProductSubTypeDto>().ReverseMap();
            CreateMap<ProductSubType, CreateProductSubTypeDto>().ReverseMap();
            CreateMap<ProductSubTypeDto, CreateProductSubTypeDto>().ReverseMap();

            CreateMap<Tag, TagDto>().ReverseMap();
            CreateMap<TaggedProduct, TaggedProductDto>().ReverseMap();
            CreateMap<TaggedProductDto, TaggedProduct>().ReverseMap();

            // ProductImage mappings
            CreateMap<ProductImage, ProductImageDto>();
			CreateMap<ProductImageDto, ProductImage>();

			// PricingTier mappings
			CreateMap<PricingTier, PricingTierDto>();
			CreateMap<PricingTierDto, PricingTier>();

			// Slider mappings
			CreateMap<Banner, BannerDto>().ReverseMap();

			// FeaturedProduct mappings
			CreateMap<FeaturedProduct, FeaturedProductDto>();
			CreateMap<FeaturedProductDto, FeaturedProduct>();
            CreateMap<LimitedOffer, LimitedOfferUpsertDto>().ReverseMap();
            CreateMap<LimitedOfferProduct, LimitedOfferProductAssignmentDto>().ReverseMap();

            CreateMap<Vat, VatDto>().ReverseMap();
            CreateMap<Subscriber, SubscriberDto>().ReverseMap();
            CreateMap<Subscriber, CreateSubscriberDto>().ReverseMap();
            CreateMap<PaymentMethodConfiguration, PaymentMethodConfigurationDto>().ReverseMap();

            // Coupon
            CreateMap<Coupon, CouponDto>().ReverseMap();
            CreateMap<CouponTier, CouponTierDto>().ReverseMap();
            CreateMap<Coupon, ApplyCouponRequestDto>();

        }
    }
}
