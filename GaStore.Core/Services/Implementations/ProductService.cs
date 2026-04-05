using AutoMapper;
using DocumentFormat.OpenXml.Office2010.Excel;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Org.BouncyCastle.Asn1.X509;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;
using GaStore.Data.Enums;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class ProductService : IProductService
	{
		private readonly DatabaseContext _context;
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<UserService> _logger;
		private readonly IMapper _mapper;
		private readonly IProductImageService _productImageService;
		private readonly IProductVariantService _productVariantService;
		private readonly IPricingTierService _pricingTierService;
		private readonly IProductSpecificationService _productSpecificationService;
		private readonly ITagService _tagService;
		private readonly AppSettings _appSettings;

		public ProductService(DatabaseContext context, IUnitOfWork unitOfWork, ILogger<UserService> logger, IMapper mapper, IProductImageService productImageService, IProductVariantService productVariantService, 
			IPricingTierService pricingTierService, IProductSpecificationService productSpecificationService,
			IOptions<AppSettings> appSettings, ITagService tagService)
		{
			_context = context;
			_unitOfWork = unitOfWork;
			_logger = logger;
			_mapper = mapper;
			_pricingTierService = pricingTierService;
			_productImageService = productImageService;
			_productVariantService = productVariantService;
			_productSpecificationService = productSpecificationService;
			_appSettings = appSettings.Value;
			_tagService = tagService;
		}

        private async Task<string?> ValidateAndNormalizeProductHierarchyAsync(ProductDto productDto)
        {
            if (productDto.CategoryId == null || productDto.CategoryId == Guid.Empty)
            {
                return "Category is required.";
            }

            var categoryExists = await _unitOfWork.CategoryRepository.Get(x => x.Id == productDto.CategoryId);
            if (categoryExists == null)
            {
                return "Category is required.";
            }

            if (productDto.SubCategoryId == null || productDto.SubCategoryId == Guid.Empty)
            {
                return "Sub-Category is required.";
            }

            var subCategoryExists = await _unitOfWork.SubCategoryRepository.Get(x => x.Id == productDto.SubCategoryId);
            if (subCategoryExists == null || subCategoryExists.CategoryId != productDto.CategoryId)
            {
                return "Sub-Category is invalid for the selected category.";
            }

            if (!productDto.ProductTypeId.HasValue || productDto.ProductTypeId == Guid.Empty)
            {
                productDto.ProductTypeId = null;
                productDto.ProductSubTypeId = null;
                return null;
            }

            var productType = await _unitOfWork.ProductTypeRepository.Get(pt => pt.Id == productDto.ProductTypeId);
            if (productType == null)
            {
                return "Product type is invalid.";
            }

            if (productType.SubCategoryId != productDto.SubCategoryId)
            {
                return "Product type is invalid for the selected sub-category.";
            }

            if (!productDto.ProductSubTypeId.HasValue || productDto.ProductSubTypeId == Guid.Empty)
            {
                productDto.ProductSubTypeId = null;
                return null;
            }

            var productSubType = await _unitOfWork.ProductSubTypeRepository.Get(pst => pst.Id == productDto.ProductSubTypeId);
            if (productSubType == null)
            {
                return "Product sub-type is invalid.";
            }

            if (productSubType.ProductTypeId != productDto.ProductTypeId)
            {
                return "Product sub-type is invalid for the selected product type.";
            }

            return null;
        }

        public static string GetFirstStringBeforeDash(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            var parts = input.Split('-', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 0 ? parts[0] : string.Empty;
        }

        private static List<string> GetSearchTokens(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return new List<string>();

            var cleaned = new string(input
                .ToLowerInvariant()
                .Select(ch => char.IsLetterOrDigit(ch) ? ch : ' ')
                .ToArray());

            return cleaned
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Distinct()
                .ToList();
        }

        public async Task<PaginatedServiceResponse<List<ProductDto>>> GetProductsAsync(string? searchTerm, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<ProductDto>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                // Base query
                var query = _context.Products.Include(p => p.Category)
    .Include(p => p.SubCategory)
    .Include(p => p.ProductType)
    .Include(p => p.ProductSubType).AsQueryable();

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var normalizedSearchTerm = searchTerm.Trim().ToLower();
                    var firstPartBeforeDash = GetFirstStringBeforeDash(normalizedSearchTerm);
                    var searchTokens = GetSearchTokens(normalizedSearchTerm);

                    var tagIds = await _context.Tags
                        .Where(t =>
                            t.Name.ToLower() == normalizedSearchTerm ||
                            t.Name.ToLower() == firstPartBeforeDash)
                        .Select(t => t.Id)
                        .ToListAsync();

                    var taggedProductIds = await _context.TaggedProducts
                        .Where(tp => tagIds.Contains(tp.TagId))
                        .Select(tp => tp.ProductId)
                        .Distinct()
                        .ToListAsync();

                    query = query.Where(p =>
                        taggedProductIds.Contains(p.Id) ||
                        (p.Name.ToLower().Contains(normalizedSearchTerm)) ||
                        (p.Category != null && p.Category.Name.ToLower().Contains(normalizedSearchTerm)) ||
                        (p.SubCategory != null && p.SubCategory.Name.ToLower().Contains(normalizedSearchTerm)) ||
                        (p.ProductType != null && p.ProductType.Name.ToLower().Contains(normalizedSearchTerm)) ||
                        (p.ProductSubType != null && p.ProductSubType.Name.ToLower().Contains(normalizedSearchTerm)) ||
                        (p.Description != null && p.Description.ToLower().Contains(normalizedSearchTerm)) ||
                        (searchTokens.Count > 0 &&
                            (
                                searchTokens.All(token => p.Name.ToLower().Contains(token)) ||
                                (p.Category != null && searchTokens.All(token => p.Category.Name.ToLower().Contains(token))) ||
                                (p.SubCategory != null && searchTokens.All(token => p.SubCategory.Name.ToLower().Contains(token))) ||
                                (p.ProductType != null && searchTokens.All(token => p.ProductType.Name.ToLower().Contains(token))) ||
                                (p.ProductSubType != null && searchTokens.All(token => p.ProductSubType.Name.ToLower().Contains(token))) ||
                                (p.Description != null && searchTokens.All(token => p.Description.ToLower().Contains(token)))
                            ))
                    );
                }


                query = query.Where(p => p.IsAvailable && p.IsApproved && p.IsPublished && p.ReviewStatus == ProductReviewStatus.Approved);

                var totalRecords = await query.CountAsync();


                var products = await query
                    .OrderByDescending(p => p.DateCreated)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new ProductDto
                    {
                        DateCreated = p.DateCreated,
                        Id = p.Id,
                        UserId = p.UserId,
                        VendorId = p.VendorId,
//                        Name = p.Name,
                        Name = p.Name+ " - "+p.Brand.Name,
                        Description = p.Description,
                        Highlights = p.Highlights,
                        Weight = p.Weight,
                        PrimaryColor = p.PrimaryColor,
                        StockQuantity = p.StockQuantity,
                        IsAvailable = p.IsAvailable,
                        IsApproved = p.IsApproved,
                        IsPublished = p.IsPublished,
                        ReviewStatus = p.ReviewStatus,
                        ReviewRejectionReason = p.ReviewRejectionReason,
                        SubmittedForReviewAt = p.SubmittedForReviewAt,
                        ReviewedAt = p.ReviewedAt,
                        BrandId = p.BrandId,
                        CategoryId = p.CategoryId,
                        SubCategoryId = p.SubCategoryId,
                        ProductTypeId = p.ProductTypeId,
                        ProductSubTypeId = p.ProductSubTypeId,
                        ApprovedBy = p.ApprovedBy,
                        ReviewedByAdminId = p.ReviewedByAdminId,
                        VariantsDto = p.Variants
                            .Where(v => v.ProductId == p.Id).
							AsEnumerable()
                            .OrderBy(v => v.Weight)
                            .Select(v => new ProductVariantDto
                            {
                                Id = v.Id,
								Name = v.Name,
								Color = v.Color,
								Weight = v.Weight,
								Style = v.Style,
								Size = v.Size,
								ProductId = p.Id,
                                StockQuantity = v.StockQuantity,
								StockSold = v.StockSold,
                                PricingTiersDto = v.PricingTiers.Select(pt => new PricingTierDto
                                {
                                    VariantId = v.Id,
                                    ProductId = p.Id,
                                    PricePerUnit = pt.PricePerUnit,
                                    MinQuantity = pt.MinQuantity,
                                    PricePerUnitGlobal = pt.PricePerUnitGlobal
                                }).ToList(),
                                Images = v.Images
                            .OrderByDescending(img => img.DisplayOrder)
                            //.OrderByDescending(img => img.DateCreated)
                            .Select(img => new ProductImageDto
                            {
                                ImageUrl = img.ImageUrl,
                                AltText = $"{p.Name} product image"
                            })
                            .Take(4)
                            .ToList()
                            }).ToList(),
                        PricingTiers = p.PricingTiers
                            .OrderBy(pt => pt.MinQuantity)
                            .Select(pt => new PricingTierDto
                            {
                                PricePerUnit = pt.PricePerUnit,
                                MinQuantity = pt.MinQuantity
                            }).ToList(),
                        Images = p.Images
                            .OrderByDescending(img => img.DateCreated)
                            .Select(img => new ProductImageDto
                            {
                                ImageUrl = img.ImageUrl,
                                AltText = $"{p.Name} product image"
                            })
                            .Take(4)
                            .ToList()
                    })
                    .ToListAsync();

                response.Status = 200;
                response.Message = "Products retrieved successfully";
                response.Data = products;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products.");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<PaginatedServiceResponse<List<ProductDto>>> GetProductsAdminAsync(
    string? searchTerm,
    int pageNumber,
    int pageSize,
    bool? isAvailable = null,
    DateTime? startDate = null,
    DateTime? endDate = null,
    bool? isApproved = null)
        {
            var response = new PaginatedServiceResponse<List<ProductDto>>();

            try
            {
                // Validate page number and page size
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                // Validate date range if provided
                if (startDate.HasValue && endDate.HasValue && startDate > endDate)
                {
                    response.Status = 400;
                    response.Message = "Start date cannot be after end date.";
                    return response;
                }

                // Get the base query
                var query = _context.Products.AsQueryable();

                // Apply search filter
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(p =>
                        p.Name.ToLower().Contains(searchTerm.ToLower()) ||
                        p.Description.ToLower().Contains(searchTerm.ToLower()) ||
                        p.Id.ToString().ToLower().Contains(searchTerm) ||
                        p.CategoryId.ToString().Contains(searchTerm) ||
                        p.SubCategoryId.ToString().Contains(searchTerm) ||
                        p.Brand.Name.ToLower().Contains(searchTerm.ToLower())
                    );
                }

                // Apply availability filter
                if (isAvailable.HasValue)
                {
                    query = query.Where(p => p.IsAvailable == isAvailable.Value);
                }

                // Apply approval filter
                if (isApproved.HasValue)
                {
                    query = query.Where(p => p.IsApproved == isApproved.Value);
                }

                // Apply date range filter
                if (startDate.HasValue)
                {
                    query = query.Where(p => p.DateCreated >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    // Include the entire end date (up to 23:59:59)
                    var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(p => p.DateCreated <= endOfDay);
                }

                // Get total records count
                var totalRecords = await query.CountAsync();

                // Apply pagination
                var products = await query
                    .OrderByDescending(p => p.DateCreated)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new ProductDto
                    {
                        DateCreated = p.DateCreated,
                        Id = p.Id,
                        UserId = p.UserId,
                        VendorId = p.VendorId,
                        Name = p.Name + " - " + p.Brand.Name,
                        Description = p.Description,
                        Highlights = p.Highlights,
                        Weight = p.Weight,
                        PrimaryColor = p.PrimaryColor,
                        StockQuantity = p.StockQuantity,
                        IsAvailable = p.IsAvailable,
                        IsApproved = p.IsApproved,
                        IsPublished = p.IsPublished,
                        ReviewStatus = p.ReviewStatus,
                        ReviewRejectionReason = p.ReviewRejectionReason,
                        SubmittedForReviewAt = p.SubmittedForReviewAt,
                        ReviewedAt = p.ReviewedAt,
                        BrandId = p.BrandId,
                        CategoryId = p.CategoryId,
                        SubCategoryId = p.SubCategoryId,
                        ProductTypeId = p.ProductTypeId,
                        ProductSubTypeId = p.ProductSubTypeId,
                        ApprovedBy = p.ApprovedBy,
                        ReviewedByAdminId = p.ReviewedByAdminId,
                        VariantsDto = p.Variants
                            .Where(v => v.ProductId == p.Id)
                            .Select(v => new ProductVariantDto
                            {
                                Id = v.Id,
                                Name = v.Name,
                                Color = v.Color,
                                Weight = v.Weight,
                                Style = v.Style,
                                Size = v.Size,
                                ProductId = p.Id,
                                StockQuantity = v.StockQuantity,
                                StockSold = v.StockSold,
                                PricingTiersDto = v.PricingTiers.Select(pt => new PricingTierDto
                                {
                                    VariantId = v.Id,
                                    ProductId = p.Id,
                                    PricePerUnit = pt.PricePerUnit,
                                    MinQuantity = pt.MinQuantity,
                                    PricePerUnitGlobal = pt.PricePerUnitGlobal,
                                }).ToList()
                            }).OrderBy(v => v.Weight).ToList(),
                        PricingTiers = p.PricingTiers
                            .OrderBy(pt => pt.MinQuantity)
                            .Select(pt => new PricingTierDto
                            {
                                PricePerUnit = pt.PricePerUnit,
                                MinQuantity = pt.MinQuantity
                            })
                            .ToList(),
                        Images = p.Images
                            .OrderByDescending(img => img.DateCreated)
                            .Select(img => new ProductImageDto
                            {
                                ImageUrl = img.ImageUrl,
                                AltText = $"{p.Name} product image"
                            })
                            .Take(4)
                            .ToList()
                    })
                    .ToListAsync();

                // Create paginated response
                response.Status = 200;
                response.Message = "Products retrieved successfully";
                response.Data = products;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;

                // Optional: Add filter metadata to response
                response.Metadata = new Dictionary<string, object>
        {
            { "IsAvailableFilterApplied", isAvailable.HasValue },
            { "DateRangeFilterApplied", startDate.HasValue || endDate.HasValue },
            { "IsApprovedFilterApplied", isApproved.HasValue }
        };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products.");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<PaginatedServiceResponse<List<Product>>> GetProductsWithDetailsAsync(string? searchTerm, int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<Product>>();

			try
			{
				// Validate page number and page size
				if (pageNumber < 1 || pageSize < 1)
				{
					response.Status = 400;
					response.Message = "Page number and page size must be greater than 0.";
					return response;
				}

				// Get the base query
				var query = _context.Products
					.Include(p => p.Variants) // Include Product Variants
					.Include(p => p.PricingTiers) // Include Pricing Tiers
					.Include(p => p.Brand) // Include Brand
					.Include(p => p.Images) // Include Product Images
					.Include(p => p.FeaturedEntries) // Include Featured Entries
					.Include(p => p.Specifications) // Include Specifications
					.AsQueryable();

				// Apply search filter
				if (!string.IsNullOrEmpty(searchTerm))
				{
					query = query.Where(p => p.Name.ToLower().Contains(searchTerm.ToString().ToLower()) || p.Description.ToLower().Contains(searchTerm.ToString().ToLower()));
				}

				// Get total records count
				var totalRecords = await query.CountAsync();

				// Apply pagination
				var products = await query
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.ToListAsync();

				// Create paginated response
				response.Status = 200;
				response.Message = "Products retrieved successfully";
				response.Data = products;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving products.");
				response.Status = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductListDto>> GetProductByIdAsync(Guid id)
		{
			var response = new ServiceResponse<ProductListDto>();

			try
			{
				var product = await _context.Products
					.Include(p => p.Variants)
					.Include(p => p.PricingTiers)
					.Include(p => p.Brand)
					//.Include(p => p.Images)
					.Include(p => p.FeaturedEntries)
					.Include(p => p.Specifications)
					.FirstOrDefaultAsync(p => p.Id == id);

				if (product == null)
				{
					response.StatusCode = 404;
					response.Message = "Product not found.";
					return response;
				}

				var images = await _unitOfWork.ProductImageRepository.GetAll(x => x.ProductId == product.Id && x.VariantId == null);
				var variantImages = await _unitOfWork.ProductImageRepository.GetAll(x => x.ProductId == product.Id && x.VariantId != null);
                var variants = await _unitOfWork.ProductVariantRepository.GetAll(x => x.ProductId == product.Id);
                var tags = await _unitOfWork.TaggedProductRepository.GetAll(x => x.ProductId == product.Id);
                var pricing = await _unitOfWork.PricingTierRepository.GetAll(x => x.ProductId == product.Id);
				var brand = await _unitOfWork.BrandRepository.Get(x => x.Id == product.BrandId);
				var category = await _unitOfWork.CategoryRepository.Get(x => x.Id == product.CategoryId);
                var subCategory = await _unitOfWork.SubCategoryRepository.Get(x => x.Id == product.SubCategoryId);
                var productType = await _unitOfWork.ProductTypeRepository.Get(x => x.Id == product.ProductTypeId);
                var productSubType = await _unitOfWork.ProductSubTypeRepository.Get(x => x.Id == product.ProductSubTypeId);
                var user = await _unitOfWork.UserRepository.GetById(product.UserId);
				var approver = new User();
				try
				{
                    approver = await _unitOfWork.UserRepository.GetById((Guid)product.ApprovedBy);
                }
				catch (Exception ex)
				{
					//no approver yet
				}
                if (category == null)
				{
					category = new Category();
				}
                if (subCategory == null)
                {
                    subCategory = new SubCategory();
                }
                if (productType == null)
                {
                    productType = new ProductType();
                }
                if (productSubType == null)
                {
                    productSubType = new ProductSubType();
                }
                var spec = await _unitOfWork.ProductSpecificationRepository.Get(x => x.ProductId == product.Id);
				if (spec == null)
				{
					spec = new ProductSpecification();
				}
				var dto = new ProductListDto
				{
					Id = product.Id,
					Name = product.Name,
					UserId = product.UserId,
					Description = product.Description,
					Highlights = product.Highlights,
					Weight = product.Weight,
					PrimaryColor = product.PrimaryColor,
					StockQuantity = product.StockQuantity,
					IsAvailable = product.IsAvailable,
					IsApproved = product.IsApproved,
					BrandId = product.BrandId,
                    CategoryId = product.CategoryId,
                    SubCategoryId = product.SubCategoryId,
                    ProductTypeId = product.ProductTypeId,
                    ProductSubTypeId = product.ProductSubTypeId,
                    DateCreated = product.DateCreated,
					DateApproved = product.DateApproved,
					ApprovedBy = product.ApprovedBy,
					Brand = new ProductBrandDto
					{
						Id = brand.Id,
						Name = brand.Name,
					},
					Category = new ProductCategoryDto
					{
						Id = category.Id,
						Name = category.Name,
						ImageUrl = category.ImageUrl

					},
					SubCategory = new ProductSubCategoryDto
					{
						Id = subCategory.Id,
						Name = subCategory.Name,
						HasColors = subCategory.HasColors,
						HasSizes = subCategory.HasSizes,
						HasStyles = subCategory.HasStyles

					},
                    ProductType = new ProductTypeDto
                    {
                        Id = productType.Id,
                        Name = productType.Name
                    },
                    ProductSubType = new ProductSubTypeDto
                    {
                        Id = productSubType.Id,
                        Name = productSubType.Name
                    },
                    User = user ?? new User(),
					Approver = approver ?? new User(),
					Images = images == null || images?.Count < 1 ? new List<ProductImage>() : images.Select(img => new ProductImage
					{
						Id = img.Id,
						ImageUrl = img.ImageUrl,
						ProductId = img.ProductId,
						VariantId = img.VariantId
					}).ToList(),

				Variants = variants.Count < 1? new List<ProductVariant>() : variants.OrderBy(w => w.Weight).Select(vr => new ProductVariant{
					Id = vr.Id,
					Name = vr.Name,
					ProductId = vr.ProductId,
					SaleEndDate = vr.SaleEndDate,
					SaleStartDate = vr.SaleStartDate,
					Color = vr.Color,
					SellerSKU = vr.SellerSKU,
                    Size = vr.Size,
                    Weight = vr.Weight,
                    StockQuantity = vr.StockQuantity,
					StockSold = vr.StockSold,
                    Style = vr.Style,
					BarCode = vr.BarCode,
					PricingTiers = vr.PricingTiers,
					Images = variantImages.Where(img => img.VariantId == vr.Id)
								.Select(img => new ProductImage
								{
									Id = img.Id,
									ImageUrl = img.ImageUrl,
									ProductId = img.ProductId,
									VariantId = img.VariantId
								}).ToList(),

				}).ToList(),
					Specifications = spec
				};

				response.StatusCode = 200;
				response.Message = "Product retrieved successfully";
				response.Data = dto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving product.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}


		public async Task<ServiceResponse<Product>> CreateProductService(ProductDto productDto, Guid UserId)
		{
			var response = new ServiceResponse<Product>();
			try
			{

				response.StatusCode = 400;
				response.Data = null;

                // Validate the DTO
                if (productDto == null)
				{
					response.Message = "Product data is required.";
					return response;
				}
				if (string.IsNullOrEmpty(productDto.Name))
				{
					response.Message = "Product name is required.";
					return response;
				}
				if (string.IsNullOrEmpty(productDto.Description))
				{
					response.Message = "Product description is required.";
					return response;
				}
				if (string.IsNullOrEmpty(productDto.Highlights))
				{
					response.Message = "Product highlights is required.";
					return response;
				}
				if (productDto.Id == null && productDto.imageFiles == null && productDto.ImageUrls == null)
				{
					response.Message = "Add at least 1 image";
					return response;
				}
				/*
                if (!productDto.imageFiles.Any() && productDto.ImageUrls.Count == 0)
                {
                    response.Message = "Add at least 1 image";
                    return response;
                }*/
                if (productDto.imageFiles != null && productDto.imageFiles.Count > 10)
				{
					response.Message = "You cannot upload more than 10 images";
					return response;
				}

                if (productDto.Tags != null && productDto.Tags.Count > 0)
                {
                    foreach (var tags in productDto.Tags)
                    {
                        var tg = await _unitOfWork.TagRepository.Get(t => t.Name.ToLower().Trim() == tags.ToLower().Trim());
                        if (tg == null)
                        {
                            response.Message = "Invalid tag.";
                            return response;
                        }
                    }
                }

                if (productDto.VariantsDto == null)
                {
                    response.Message = "Variant is required";
                    return response;
                }

                if (productDto.VariantsDto.Any())
				{
					foreach(var variants in productDto.VariantsDto)
					{
                        if (variants.Name == null)
                        {
                            response.Message = "Variant name is required.";
                            return response;
                        }
                        if (variants.Name != null)
                        {
							//check if variant name occurrs more than once in variants
							int countName = 0;
							foreach (var item in productDto.VariantsDto)
							{
								if(item?.Name?.Trim() == variants.Name.Trim())
								{
									countName += 1;
								}
							}
							if(countName > 1)
							{
                                response.Message = "Variant name cannot be used more than once.";
                                return response;
                            }
                        }
                        if (variants.StockQuantity < 1)
                        {
                            response.Message = "Variant stock quantity is required.";
                            return response;
                        }
                        else if (variants.SellerSKU == null)
                        {
                            response.Message = "Variant SKU is required.";
                            return response;
                        }

						/*else if (string.IsNullOrEmpty(variants.Color) && string.IsNullOrEmpty(variants.Size) && string.IsNullOrEmpty(variants.Style))
						{
							response.Message = "At least one variant attribute (Color, Size, or Style) is required.";
							return response;
                        }*/

                        else if (!variants.PricingTiersDto.Any())
						{
							response.Message = "Variant pricing tier is required.";
							return response;
						}
						else if (variants.PricingTiersDto.Any())
						{
							foreach (var pricing in variants.PricingTiersDto)
							{
								if (pricing.MinQuantity < 1 || pricing.PricePerUnit < 1)
								{
									response.Message = "Variant pricing tier minimum quantity and price per unit are required.";
									return response;
								}
								else if (pricing.PricePerUnitGlobal < 1)
								{
									response.Message = "Variant pricing tier global price per unit is required.";
									return response;
								}
							}
						}
						else if (!variants.imageFiles.Any())
						{
							response.Message = "Upload at least one image for variant";
							return response;
						}
                        else if (variants.imageFiles.Count > 5)
                        {
                            response.Message = "Images cannot be more than 5 for a variant";
                            return response;
                        }
						var skuCheck = _unitOfWork.ProductVariantRepository.GetAll(p => p.SellerSKU == variants.SellerSKU).Result.Count;
                        if (skuCheck > 0 && productDto.Id == null)
                        {
                            response.Message = "SKU already exists";
                            return response;
                        }
                    }
                }
                if (productDto.VariantsDto.Count < 1)
                {
                    response.Message = "Product variant is required.";
                    return response;
                }
				if(productDto.SpecificationsDto == null)
				{
					response.Message = "Product specification is required.";
					return response;
                }
                if (!string.IsNullOrEmpty(productDto.SpecificationsDto.Fda))
                {
                    productDto.SpecificationsDto.FdaApproved = true;
                }
                if (string.IsNullOrEmpty(productDto.SpecificationsDto.MainMaterial))
				{
					response.Message = "Product specification material is required.";
					return response;
                }
                if (string.IsNullOrEmpty(productDto.SpecificationsDto.ProductionCountry))
                {
                    response.Message = "Product specification production country is required.";
                    return response;
                }


                else
                {
                    var hierarchyError = await ValidateAndNormalizeProductHierarchyAsync(productDto);
                    if (!string.IsNullOrEmpty(hierarchyError))
                    {
                        response.StatusCode = 400;
                        response.Message = hierarchyError;
                        return response;
                    }

                    if (productDto.Id.HasValue)
					{
						//if product exists
						var prod = await _unitOfWork.ProductRepository.GetById(productDto.Id.Value);
						if (prod != null)
						{
							prod.Name = productDto.Name;
							prod.Description = productDto.Description;
							prod.Highlights = productDto.Highlights;
							prod.Weight = productDto.Weight;
							prod.PrimaryColor = productDto.PrimaryColor;
							prod.StockQuantity = productDto.StockQuantity;
							prod.IsAvailable = productDto.IsAvailable;
							prod.IsApproved = productDto.IsApproved;
							prod.BrandId = productDto.BrandId;
                            prod.CategoryId = productDto.CategoryId;
                            prod.SubCategoryId = productDto.SubCategoryId;
                            prod.ProductTypeId = productDto.ProductTypeId;
                            prod.ProductSubTypeId = productDto.ProductSubTypeId;
                            //prod.SubCategoryId = categoryExists.Id;
							//prod.Variants = productDto.VariantsDto;
							//update

							//delete existing tags associated with product
							var tp = await _unitOfWork.TaggedProductRepository.GetAll(t => t.ProductId == prod.Id);
							if(tp != null && tp.Count > 0 && productDto?.Tags?.Count > 0)
							{
								foreach(var tpItem in tp)
								{
                                    await _unitOfWork.TaggedProductRepository.Remove(tpItem.Id);
                                }
							}

                            await _unitOfWork.ProductRepository.Upsert(prod);
							//await _unitOfWork.CompletedAsync(UserId);
							response.StatusCode = 200;
							response.Message = "Product updated successfully";
							response.Data = prod;
							return response;
						}
					}
					// Map DTO to entity
					var product = new Product
					{
						Id = Guid.NewGuid(),
						UserId = UserId,
                        VendorId = UserId,
						Name = productDto.Name,
						Description = productDto.Description,
						Highlights = productDto.Highlights,
						Weight = productDto.Weight,
						PrimaryColor = productDto.PrimaryColor,
						StockQuantity = productDto.StockQuantity,
						IsAvailable = productDto.IsAvailable,
						IsApproved = false,
                        IsPublished = false,
                        ReviewStatus = ProductReviewStatus.Draft,
                        ReviewRejectionReason = null,
						BrandId = productDto.BrandId,
						CategoryId = productDto.CategoryId,
                        SubCategoryId = productDto.SubCategoryId,
                        ProductTypeId = productDto.ProductTypeId,
                        ProductSubTypeId = productDto.ProductSubTypeId
					};
					// Add product to database
					//check if user is Admin or SuperAdmin
					var user = await _unitOfWork.UserRepository.GetById(UserId);
					/*if (user != null && user.IsSuperAdmin)
					{
						product.IsApproved = true;
					}
					else
					{
						product.IsApproved = false;
					}*/
					await _unitOfWork.ProductRepository.Add(product);
                    //await _unitOfWork.CompletedAsync(UserId);

					//add tags
                    if (productDto.Tags != null && productDto.Tags.Count > 0)
                    {
                        List<TaggedProductDto> taggedProductDtos = new();

                        foreach (var tags in productDto.Tags)
                        {
                            var tg = await _unitOfWork.TagRepository.Get(t => t.Name.ToLower().Trim() == tags.ToLower().Trim());
                            if (tg != null)
                            {
								TaggedProductDto tagged = new()
								{
									ProductId = product.Id,
									TagId = tg.Id,
									ProductName = product.Name,
									TagName = tg.Name
								};

								taggedProductDtos.Add(tagged);
                            }
                        }
						var taggedPro = _mapper.Map<List<TaggedProduct>>(taggedProductDtos);
						foreach(var tagged in taggedPro)
						{
                            await _unitOfWork.TaggedProductRepository.Add(tagged);
                        }
                            
                        //await _unitOfWork.CompletedAsync(UserId);
                        //await _tagService.AddBulkTagToProductAsync(taggedProductDtos, UserId);
                    }


					// Return success response
					response.StatusCode = 201;
					response.Message = "Product created successfully";
					response.Data = product;
				}
			}
			catch(Exception ex)
			{
				_logger.LogError(ex, "Error creating product.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}
			return response;
		}
		public async Task<ServiceResponse<ProductDto>> CreateProductAsync(ProductDto productDto, Guid UserId)
		{
			var response = new ServiceResponse<ProductDto>();

			try
			{
				// Validate the DTO
				if (productDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Product data is required.";
					return response;
				}

				//get brand name
				var brand = await _unitOfWork.BrandRepository.GetById((Guid)productDto.BrandId);
				string brandName = brand?.Name ?? "Ga";
				//create product
				var productDto_ = new ProductDto
				{
					UserId = UserId,
                    //Name = brandName + " - " + productDto.Name,
                    Name = productDto.Name,
                    Description = productDto.Description,
					Highlights = productDto.Highlights,
					Weight = productDto.Weight != null? productDto.Weight : "NILL",
					PrimaryColor = productDto.PrimaryColor,
					StockQuantity = productDto.StockQuantity,
					IsAvailable = productDto.IsAvailable,
					IsApproved = productDto.IsApproved,
					BrandId = productDto.BrandId,
                    CategoryId = productDto.CategoryId,
                    SubCategoryId = productDto.SubCategoryId,
                    ProductTypeId = productDto.ProductTypeId,
                    ProductSubTypeId = productDto.ProductSubTypeId,
                    Tags = productDto.Tags,
                    Images = productDto.Images,
					imageFiles = productDto.imageFiles,
					VariantsDto = productDto.VariantsDto,
                    SpecificationsDto = productDto.SpecificationsDto
					
                };

				var product_ = await CreateProductService(productDto_, UserId);
				var product = product_.Data;

				if(product == null)
				{
					response.StatusCode = 400;
					response.Message = product_.Message ?? "Product cannot be created, please try again.";
					return response;
				}

				// Handle product image upload
				if (productDto.imageFiles != null)
				{
						var savedProductImageDto = new ProductImageDto
						{
							ProductId = product.Id,
							imageFiles = productDto.imageFiles,
							ImageUrls = productDto.ImageUrls,
							Style = "",
							//VariantId = product.Id,
							AltText = "Product",
							DisplayOrder = 1
						};

						var saveImage = await _productImageService.CreateProductImageAsync(savedProductImageDto, UserId);
				}


				//Handle product specification
				var productDtoNew = _mapper.Map<Product, ProductDto>(product);
				productDto.SpecificationsDto.ProductDto = productDtoNew;
				productDto.SpecificationsDto.ProductId = product.Id;
				await _productSpecificationService.CreateProductSpecificationAsync(productDto.SpecificationsDto, UserId);


				//handle variants 
				if (productDto.VariantsDto != null)
				{
					foreach (var variant in productDto.VariantsDto)
					{
						//variant.ProductId = product.Id;
						//variant.ProductDto = productDtoNew;
						ProductVariantDto productVariant = new()
						{
							Id = Guid.NewGuid(),
                            //Name = brandName + " - " + variant.Name,
                            Name = variant.Name,
                            SaleEndDate = variant.SaleEndDate,
							SaleStartDate = variant.SaleStartDate,
							SellerSKU = variant.SellerSKU,
							Size = variant.Size,
                            Weight = variant.Weight,
                            StockQuantity = variant.StockQuantity,
							StockSold = variant.StockSold,
                            BarCode = variant.BarCode,
							Color = variant.Color,
							Style = variant.Style,
							ProductId = product.Id,
							ProductDto = productDtoNew
					};

						//save variant
						var vr = await _productVariantService.CreateProductVariantAsync(productVariant, UserId);

						//Handle variant pricing tier 
						if (variant.PricingTiersDto != null && vr.StatusCode <= 201)
						{
							foreach (var pricing in variant.PricingTiersDto)
							{
								PricingTierDto tierDto_ = new()
								{
									ProductId = product.Id,
									VariantId = vr.Data?.Id,
									MinQuantity = pricing.MinQuantity,
									PricePerUnit = pricing.PricePerUnit,
									PricePerUnitGlobal = pricing.PricePerUnitGlobal
								};
								var pTier = await _pricingTierService.CreatePricingTierAsync(tierDto_, UserId);
							}
						}

						//Handle variant images
						if (variant.imageFiles != null)
						{
							var savedProductImageDto = new ProductImageDto
							{
								ProductId = product.Id,
								imageFiles = variant.imageFiles,
								Style = "",
								VariantId = vr.Data?.Id,
								AltText = "Product",
								DisplayOrder = 2
							};

							var saveImage = await _productImageService.CreateProductImageAsync(savedProductImageDto, UserId);
						}
					}
				}

				await _unitOfWork.CompletedAsync(UserId);


                // Return success response
                response.StatusCode = 201;
				response.Message = "Product created successfully";
                response.Data = new ProductDto
                {
                    Id = product.Id,
                    UserId = product.UserId,
                    VendorId = product.VendorId,
                    Name = product.Name,
                    Description = product.Description,
                    Highlights = product.Highlights,
                    Weight = product.Weight,
                    PrimaryColor = product.PrimaryColor,
                    StockQuantity = product.StockQuantity,
                    IsAvailable = product.IsAvailable,
                    IsApproved = product.IsApproved,
                    IsPublished = product.IsPublished,
                    ReviewStatus = product.ReviewStatus,
                    ReviewRejectionReason = product.ReviewRejectionReason,
                    SubmittedForReviewAt = product.SubmittedForReviewAt,
                    ReviewedAt = product.ReviewedAt,
                    BrandId = product.BrandId,
                    CategoryId = product.CategoryId,
                    SubCategoryId = product.SubCategoryId,
                    ProductTypeId = product.ProductTypeId,
                    ProductSubTypeId = product.ProductSubTypeId
                };


			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating product.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<ProductDto>> UpdateProductAsync(Guid id, ProductDto productDto, Guid UserId)
		{
			var response = new ServiceResponse<ProductDto>();

			try
			{
				// Validate the DTO
				if (productDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Product data is required.";
					return response;
				}

				//create product
				var productDto_ = new ProductDto
				{
					Id = productDto.Id,
					Name = productDto.Name,
					Description = productDto.Description,
					Highlights = productDto.Highlights,
					Weight = productDto.Weight != null ? productDto.Weight : "NILL",
					PrimaryColor = productDto.PrimaryColor,
					StockQuantity = productDto.StockQuantity,
					IsAvailable = productDto.IsAvailable,
					IsApproved = productDto.IsApproved,
					BrandId = productDto.BrandId,
                    CategoryId = productDto.CategoryId,
                    SubCategoryId = productDto.SubCategoryId,
                    ProductTypeId = productDto.ProductTypeId,
                    ProductSubTypeId = productDto.ProductSubTypeId,
                    Tags = productDto.Tags,
                    Images = productDto.Images,
                    imageFiles = productDto.imageFiles,
					ImageUrls = productDto.ImageUrls,
                    VariantsDto = productDto.VariantsDto,
					SpecificationsDto = productDto.SpecificationsDto
                };

				var product_ = await CreateProductService(productDto_, UserId); //updates product
				var product = product_.Data;

				if (product == null)
				{
					response.StatusCode = 400;
					response.Message = product_.Message ?? "Product cannot be updated, please try again.";
					return response;
				}

				// Handle product image upload
				if (productDto.imageFiles != null)
				{
					var savedProductImageDto = new ProductImageDto
					{
						ProductId = product.Id,
						imageFiles = productDto.imageFiles,
						Style = "",
						//VariantId = product.Id,
						AltText = "Product",
						DisplayOrder = 1
					};

					var saveImage = await _productImageService.CreateProductImageAsync(savedProductImageDto, UserId);
				}


				//Handle product specification
				var productDtoNew = _mapper.Map<Product, ProductDto>(product);
				productDto.SpecificationsDto.ProductDto = productDtoNew;
				productDto.SpecificationsDto.ProductId = product.Id;
				await _productSpecificationService.CreateProductSpecificationAsync(productDto.SpecificationsDto, UserId);


				//handle variants 
				if (productDto.VariantsDto != null)
				{
					foreach (var variant in productDto.VariantsDto)
					{
						//variant.ProductId = product.Id;
						//variant.ProductDto = productDtoNew;
						ProductVariantDto productVariant = new()
						{
							Id = variant.Id,
							Name = variant.Name,
							SaleEndDate = variant.SaleEndDate,
							SaleStartDate = variant.SaleStartDate,
							SellerSKU = variant.SellerSKU,
                            Size = variant.Size,
                            Weight = variant.Weight,
                            StockQuantity = variant.StockQuantity,
							StockSold = variant.StockSold,
                            BarCode = variant.BarCode,
							Color = variant.Color,
							Style = variant.Style,
							ProductId = product.Id,
							ProductDto = productDtoNew
						};

						//save variant
						var vr = await _productVariantService.CreateProductVariantAsync(productVariant, UserId);

						//Handle variant pricing tier 
						if (variant.PricingTiersDto != null && vr.StatusCode <= 201)
						{
                            //remove existing tier
                            /*var pricingTie = await _unitOfWork.PricingTierRepository.GetAll(t => t.ProductId == product.Id);
                            if (pricingTie.Count > 0 && productDto.PricingTiers?.Count > 0)
                            {
                                foreach (var pt in pricingTie)
                                {
                                    await _unitOfWork.PricingTierRepository.Remove(pt.Id);
                                }
                            } */
                            
							foreach (var pricing in variant.PricingTiersDto)
							{
								PricingTierDto tierDto_ = new()
								{
									ProductId = product.Id,
									VariantId = vr.Data?.Id,
									MinQuantity = pricing.MinQuantity,
									PricePerUnit = pricing.PricePerUnit,
									PricePerUnitGlobal = pricing.PricePerUnitGlobal
								};
								var pTier = await _pricingTierService.CreatePricingTierAsync(tierDto_, UserId);
							}
						}

						//Handle variant images
						if (variant.imageFiles != null)
						{
							var savedProductImageDto = new ProductImageDto
							{
								ProductId = product.Id,
								imageFiles = variant.imageFiles,
								Style = "",
								VariantId = vr.Data?.Id,
								AltText = "Product",
								DisplayOrder = 2
							};

							var saveImage = await _productImageService.CreateProductImageAsync(savedProductImageDto, UserId);
						}
					}
				}


                //add tags
                if (productDto.Tags != null && productDto.Tags.Count > 0)
                {
                    List<TaggedProductDto> taggedProductDtos = new();

                    foreach (var tags in productDto.Tags)
                    {
                        var tg = await _unitOfWork.TagRepository.Get(t => t.Name.ToLower().Trim() == tags.ToLower().Trim());
                        if (tg != null)
                        {
                            TaggedProduct tagged = new()
                            {
                                ProductId = product.Id,
                                TagId = tg.Id
                            };

                            await _unitOfWork.TaggedProductRepository.Add(tagged);
                        }
                    }
                    //await _unitOfWork.CompletedAsync(UserId);
                }

                //save all changes
                await _unitOfWork.CompletedAsync(UserId);

                // Return success response
                response.StatusCode = 200;
				response.Message = "Product updated successfully";
                response.Data = new ProductDto
                {
                    Id = product.Id,
                    UserId = product.UserId,
                    VendorId = product.VendorId,
                    Name = product.Name,
                    Description = product.Description,
                    Highlights = product.Highlights,
                    Weight = product.Weight,
                    PrimaryColor = product.PrimaryColor,
                    StockQuantity = product.StockQuantity,
                    IsAvailable = product.IsAvailable,
                    IsApproved = product.IsApproved,
                    IsPublished = product.IsPublished,
                    ReviewStatus = product.ReviewStatus,
                    ReviewRejectionReason = product.ReviewRejectionReason,
                    SubmittedForReviewAt = product.SubmittedForReviewAt,
                    ReviewedAt = product.ReviewedAt,
                    BrandId = product.BrandId,
                    CategoryId = product.CategoryId,
                    SubCategoryId = product.SubCategoryId,
                    ProductTypeId = product.ProductTypeId,
                    ProductSubTypeId = product.ProductSubTypeId
                };


			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating product.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

        public async Task<ServiceResponse<bool>> ProductApprovalAsync(Guid productId, Guid UserId)
		{
            var response = new ServiceResponse<bool>();
			try
			{
                //check if user is SuperAdmin
				var user = await _unitOfWork.UserRepository.GetById(UserId);
                if (user == null)
                {
                    response.StatusCode = 404;
                    response.Message = "User not found.";
                    return response;
                }
                if (!user.IsAdmin && !user.IsSuperAdmin)
				{
					response.StatusCode = 403;
					response.Message = "You are not authorized to perform this action.";
					return response;
                }
                
				var product = await _unitOfWork.ProductRepository.GetById(productId);

                if (product == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product not found.";
                    return response;
                }
                else if (product.UserId == UserId && !product.IsApproved)
                {
                    response.StatusCode = 400;
                    response.Message = "You cannot approve the product you uploaded yourself.";
                    return response;
                }
                else
                {
					product.IsApproved = product.IsApproved? false : true;
					if (product.IsApproved)
					{
                        product.ApprovedBy = UserId;
                        product.ReviewedByAdminId = UserId;
                        product.DateApproved = DateTime.Now;
                        product.IsPublished = true;
                        product.ReviewStatus = ProductReviewStatus.Approved;
                        product.ReviewRejectionReason = null;
                        product.ReviewedAt = DateTime.UtcNow;
					}
					else
					{
                        product.IsPublished = false;
                        product.ReviewStatus = ProductReviewStatus.Rejected;
						product.DateUpdated = DateTime.Now;
                        product.ReviewedAt = DateTime.UtcNow;
                    }
						await _unitOfWork.ProductRepository.Upsert(product);
					await _unitOfWork.CompletedAsync(UserId);
					response.StatusCode = 200;
					response.Message = $"Product {(product.IsApproved? "approved" : "declined")} successfully";
                    response.Data = true;
					//check if it has featured post
					if(product.IsApproved == false)
					{
						var featured = await _unitOfWork.FeaturedProductRepository.Get(fe => fe.ProductId == product.Id);
						if(featured != null && featured.IsActive == true)
						{
							await _unitOfWork.FeaturedProductRepository.Upsert(featured);
							await _unitOfWork.CompletedAsync(UserId);
						}
					}
                }
            }
			catch (Exception ex)
			{
                _logger.LogError(ex, "Error updating product.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

			return response;
        }


        public async Task<ServiceResponse<ProductDto>> DeleteProductAsync(Guid id, Guid UserId)
		{
			var response = new ServiceResponse<ProductDto>();

			try
			{
				// Find the product by ID
				var product = await _unitOfWork.ProductRepository.GetById(id);

				if (product == null)
				{
					response.StatusCode = 404;
					response.Message = "Product not found.";
					return response;
				}

				if (await _unitOfWork.OrderItemRepository.Get(x => x.ProductId == id) != null)
				{
					response.StatusCode = 400;
					response.Message = "Cannot delete product because it is used in orders.";
					return response;
				}

				// Delete the product
				//_context.Products.Remove(product);
				//await _context.SaveChangesAsync();

				//delete images first
				var images = await _unitOfWork.ProductImageRepository.GetAll(x => x.ProductId == product.Id);
				if (images.Count > 0)
				{
					foreach (var image in images)
					{
						// Delete physical file
						var imagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", image.ImageUrl.Replace(_appSettings.ApiRoot, "").TrimStart('/'));
						if (File.Exists(imagePath))
						{
							File.Delete(imagePath);
						}

						// Delete from database
						await _unitOfWork.ProductImageRepository.Remove(image.Id);
						await _unitOfWork.CompletedAsync(UserId);
					}
				}


				await _unitOfWork.ProductRepository.Remove(product.Id);
				await _unitOfWork.CompletedAsync(UserId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Product deleted successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting product.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}
	}
}
