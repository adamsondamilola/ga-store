using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;
using GaStore.Data.Enums;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class VendorProductService : IVendorProductService
    {
        private readonly DatabaseContext _context;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IProductService _productService;
        private readonly ILogger<VendorProductService> _logger;

        public VendorProductService(
            DatabaseContext context,
            IUnitOfWork unitOfWork,
            IProductService productService,
            ILogger<VendorProductService> logger)
        {
            _context = context;
            _unitOfWork = unitOfWork;
            _productService = productService;
            _logger = logger;
        }

        public async Task<ServiceResponse<ProductDto>> CreateVendorProductAsync(ProductDto productDto, Guid userId)
        {
            var response = new ServiceResponse<ProductDto>();

            try
            {
                var user = await EnsureVendorCanPostAsync(userId);
                if (user == null)
                {
                    response.StatusCode = 403;
                    response.Message = "KYC approval required to post products.";
                    return response;
                }

                productDto.UserId = userId;
                productDto.VendorId = userId;
                productDto.IsApproved = false;
                productDto.IsPublished = false;
                productDto.ReviewStatus = ProductReviewStatus.Draft;
                productDto.ReviewRejectionReason = null;
                productDto.SubmittedForReviewAt = null;
                productDto.ReviewedAt = null;
                productDto.ReviewedByAdminId = null;
                productDto.ApprovedBy = null;
                productDto.DateApproved = null;

                var createResult = await _productService.CreateProductAsync(productDto, userId);
                if (createResult.StatusCode >= 300 || createResult.Data?.Id == null)
                {
                    return createResult;
                }

                var product = await _context.Products.FirstOrDefaultAsync(x => x.Id == createResult.Data.Id.Value);
                if (product == null)
                {
                    response.StatusCode = 500;
                    response.Message = "Product was created but could not be loaded for vendor workflow.";
                    return response;
                }

                product.UserId = userId;
                product.VendorId = userId;
                product.IsApproved = false;
                product.IsPublished = false;
                product.ReviewStatus = ProductReviewStatus.Draft;
                product.ReviewRejectionReason = null;
                product.SubmittedForReviewAt = null;
                product.ReviewedAt = null;
                product.ReviewedByAdminId = null;
                product.ApprovedBy = null;
                product.DateApproved = null;

                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 201;
                response.Message = "Vendor product created successfully.";
                response.Data = MapProduct(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating vendor product for user {UserId}", userId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductDto>> UpdateVendorProductAsync(Guid productId, ProductDto productDto, Guid userId)
        {
            var response = new ServiceResponse<ProductDto>();

            try
            {
                var user = await EnsureVendorCanPostAsync(userId);
                if (user == null)
                {
                    response.StatusCode = 403;
                    response.Message = "KYC approval required to post products.";
                    return response;
                }

                var existingProduct = await _context.Products.FirstOrDefaultAsync(x => x.Id == productId && x.VendorId == userId);
                if (existingProduct == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product not found.";
                    return response;
                }

                productDto.Id = productId;
                productDto.UserId = userId;
                productDto.VendorId = userId;
                productDto.IsApproved = false;
                productDto.IsPublished = false;
                productDto.ReviewStatus = ProductReviewStatus.Draft;
                productDto.ReviewRejectionReason = null;

                var updateResult = await _productService.UpdateProductAsync(productId, productDto, userId);
                if (updateResult.StatusCode >= 300)
                {
                    return updateResult;
                }

                existingProduct = await _context.Products.FirstOrDefaultAsync(x => x.Id == productId);
                if (existingProduct == null)
                {
                    response.StatusCode = 500;
                    response.Message = "Product was updated but could not be reloaded.";
                    return response;
                }

                existingProduct.UserId = userId;
                existingProduct.VendorId = userId;
                existingProduct.IsApproved = false;
                existingProduct.IsPublished = false;
                existingProduct.ReviewStatus = ProductReviewStatus.Draft;
                existingProduct.ReviewRejectionReason = null;
                existingProduct.SubmittedForReviewAt = null;
                existingProduct.ReviewedAt = null;
                existingProduct.ReviewedByAdminId = null;
                existingProduct.ApprovedBy = null;
                existingProduct.DateApproved = null;

                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Vendor product updated successfully.";
                response.Data = MapProduct(existingProduct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vendor product {ProductId} for user {UserId}", productId, userId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ProductDto>> SubmitForReviewAsync(Guid productId, Guid userId)
        {
            var response = new ServiceResponse<ProductDto>();

            try
            {
                var user = await EnsureVendorCanPostAsync(userId);
                if (user == null)
                {
                    response.StatusCode = 403;
                    response.Message = "KYC approval required to post products.";
                    return response;
                }

                var product = await _context.Products.FirstOrDefaultAsync(x => x.Id == productId && x.VendorId == userId);
                if (product == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product not found.";
                    return response;
                }

                product.IsApproved = false;
                product.IsPublished = false;
                product.ReviewStatus = ProductReviewStatus.PendingReview;
                product.ReviewRejectionReason = null;
                product.SubmittedForReviewAt = DateTime.UtcNow;
                product.ReviewedAt = null;
                product.ReviewedByAdminId = null;
                product.ApprovedBy = null;
                product.DateApproved = null;

                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Product submitted for admin review successfully.";
                response.Data = MapProduct(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting vendor product {ProductId} for review", productId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<PaginatedServiceResponse<List<ProductDto>>> GetVendorProductsAsync(Guid userId, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<ProductDto>>();

            try
            {
                pageNumber = Math.Max(pageNumber, 1);
                pageSize = Math.Max(pageSize, 1);

                var query = _context.Products
                    .Where(x => x.VendorId == userId)
                    .OrderByDescending(x => x.DateCreated);

                response.TotalRecords = await query.CountAsync();
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.Status = 200;
                response.Message = "Vendor products retrieved successfully.";
                var items = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
                response.Data = items.Select(MapProduct).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vendor products for user {UserId}", userId);
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<PaginatedServiceResponse<List<ProductDto>>> GetPendingProductsAsync(int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<ProductDto>>();

            try
            {
                pageNumber = Math.Max(pageNumber, 1);
                pageSize = Math.Max(pageSize, 1);

                var query = _context.Products
                    .Where(x => x.ReviewStatus == ProductReviewStatus.PendingReview)
                    .OrderBy(x => x.SubmittedForReviewAt ?? x.DateCreated);

                response.TotalRecords = await query.CountAsync();
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.Status = 200;
                response.Message = "Pending products retrieved successfully.";
                var items = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
                response.Data = items.Select(MapProduct).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending vendor products");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public Task<ServiceResponse<ProductDto>> ApproveProductAsync(Guid productId, Guid adminId)
        {
            return ModerateProductAsync(productId, adminId, true, null);
        }

        public Task<ServiceResponse<ProductDto>> RejectProductAsync(Guid productId, Guid adminId, string? reason)
        {
            return ModerateProductAsync(productId, adminId, false, reason);
        }

        private async Task<ServiceResponse<ProductDto>> ModerateProductAsync(Guid productId, Guid adminId, bool approve, string? reason)
        {
            var response = new ServiceResponse<ProductDto>();

            try
            {
                var admin = await _context.Users.FirstOrDefaultAsync(x => x.Id == adminId);
                if (admin == null || (!admin.IsAdmin && !admin.IsSuperAdmin))
                {
                    response.StatusCode = 403;
                    response.Message = "You are not authorized to review products.";
                    return response;
                }

                var product = await _context.Products.FirstOrDefaultAsync(x => x.Id == productId);
                if (product == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Product not found.";
                    return response;
                }

                if (product.ReviewStatus != ProductReviewStatus.PendingReview)
                {
                    response.StatusCode = 400;
                    response.Message = "Only products pending review can be moderated.";
                    return response;
                }

                product.ReviewedByAdminId = adminId;
                product.ApprovedBy = approve ? adminId : null;
                product.ReviewedAt = DateTime.UtcNow;
                product.DateApproved = approve ? DateTime.UtcNow : null;
                product.IsApproved = approve;
                product.IsPublished = approve;
                product.ReviewStatus = approve ? ProductReviewStatus.Approved : ProductReviewStatus.Rejected;
                product.ReviewRejectionReason = approve ? null : string.IsNullOrWhiteSpace(reason) ? "Product was rejected during review." : reason.Trim();

                await _unitOfWork.CompletedAsync(adminId);

                response.StatusCode = 200;
                response.Message = approve ? "Product approved successfully." : "Product rejected successfully.";
                response.Data = MapProduct(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error moderating vendor product {ProductId}", productId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        private async Task<User?> EnsureVendorCanPostAsync(Guid userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null || !user.IsVendor || user.KycStatus != KycStatus.Approved || !user.CanPost)
            {
                return null;
            }

            return user;
        }

        private static ProductDto MapProduct(Product product)
        {
            return new ProductDto
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
                ProductSubTypeId = product.ProductSubTypeId,
                ApprovedBy = product.ApprovedBy,
                ReviewedByAdminId = product.ReviewedByAdminId,
                DateApproved = product.DateApproved,
                DateCreated = product.DateCreated
            };
        }
    }
}
