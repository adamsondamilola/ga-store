using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;
using GaStore.Data.Enums;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class ProductDto
	{
		public Guid? Id { get; set; }
		public Guid? UserId { get; set; }
        public Guid? VendorId { get; set; }
		[Required]
		[MaxLength(255)]
		public string Name { get; set; }
		public string? Description { get; set; }
		public string? Highlights { get; set; }
		public string? Weight { get; set; }

		public string? PrimaryColor { get; set; }

		public int StockQuantity { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsApproved { get; set; } = false;
        public bool IsPublished { get; set; } = false;
        public ProductReviewStatus ReviewStatus { get; set; } = ProductReviewStatus.Draft;
        public string? ReviewRejectionReason { get; set; }
        public DateTime? SubmittedForReviewAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public DateTime? DateCreated { get; set; }

        public Guid? BrandId { get; set; }
        public string? BrandName { get; set; }
		public Guid? CategoryId { get; set; }
        public Guid? SubCategoryId { get; set; }
        public Guid? ProductTypeId { get; set; }
        public Guid? ProductSubTypeId { get; set; }
        public Guid? ApprovedBy { get; set; }
        public Guid? ReviewedByAdminId { get; set; }
        public DateTime? DateApproved { get; set; } = DateTime.Now;
        public List<IFormFile>? imageFiles { get; set; }
        public string[]? ImageUrls { get; set; }
        public List<string>? Tags { get; set; }
        public virtual ICollection<ProductVariantDto>? VariantsDto { get; set; } 
		//public virtual ICollection<PricingTierDto> PricingTiersDto { get; set; }

		//public virtual BrandDto? BrandDto { get; set; }
		//public virtual ICollection<ProductImageDto> ImagesDto { get; set; } // List of product images
																			//public virtual ICollection<FeaturedProductDto> FeaturedEntriesDto { get; set; } = new List<FeaturedProductDto>();
		public virtual ProductSpecificationDto SpecificationsDto { get; set; }
		//public virtual ICollection<ProductSpecificationDto> SpecificationsDto { get; set; } = new List<ProductSpecificationDto>();

		//not to be used in form
		public virtual ICollection<PricingTierDto>? PricingTiers { get; set; }
		public virtual ICollection<ProductImageDto>? Images { get; set; } // List of product images

	}

	public class ProductListDto
	{
		public Guid Id { get; set; }
		public string Name { get; set; }
		public Guid? UserId { get; set; }
        public Guid? VendorId { get; set; }
		public string? Description { get; set; }
		public string? Highlights { get; set; }
		public string? Weight { get; set; }

		public string? PrimaryColor { get; set; }

		public int StockQuantity { get; set; }
		public bool IsAvailable { get; set; }
        public bool IsApproved { get; set; } = false;
        public bool IsPublished { get; set; } = false;
        public ProductReviewStatus ReviewStatus { get; set; } = ProductReviewStatus.Draft;
        public string? ReviewRejectionReason { get; set; }
        public Guid? BrandId { get; set; }
        public Guid? CategoryId { get; set; }
        public Guid? SubCategoryId { get; set; }
        public Guid? ProductTypeId { get; set; }
        public Guid? ProductSubTypeId { get; set; }

        public DateTime? DateCreated { get; set; }
        public Guid? ApprovedBy { get; set; }
        public Guid? ReviewedByAdminId { get; set; }
        public DateTime? DateApproved { get; set; } = DateTime.Now;
        public List<IFormFile>? imageFiles { get; set; }
		public ProductBrandDto Brand { get; set; }
		public ProductCategoryDto? Category { get; set; }
        public ProductSubCategoryDto? SubCategory { get; set; }
        public ProductTypeDto? ProductType { get; set; }
        public ProductSubTypeDto? ProductSubType { get; set; }
        public List<ProductImageDto> Images { get; set; } = new();
		public List<ProductVariantDto> Variants { get; set; } = new();
		public ProductSpecificationDto Specifications { get; set; } = new();
        public ProductUserSummaryDto? User { get; set; }
        public ProductUserSummaryDto? Approver { get; set; }
		public string[]? Tags { get; set; }
    }

    public class ProductUserSummaryDto
    {
        public Guid Id { get; set; }
        public string? Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public bool IsAdmin { get; set; }
        public bool IsSuperAdmin { get; set; }
        public bool IsVendor { get; set; }
    }

    public class ProductBrandDto
	{
		public Guid Id { get; set; }
		public string Name { get; set; }
		// Avoid including Brand.Products to prevent cycles
	}
	public class ProductCategoryDto
	{
		public Guid Id { get; set; }
		public string Name { get; set; }
		public string? ImageUrl { get; set; }
	}

	public class ProductSubCategoryDto
	{
		public Guid Id { get; set; }
		public Guid CategoryId { get; set; }
		public string Name { get; set; }
		public bool HasColors { get; set; }
		public bool HasSizes { get; set; }
		public bool HasStyles { get; set; }
		// Avoid including Brand.Products to prevent cycles
	}

}
