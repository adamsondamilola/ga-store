using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class LimitedOfferService : ILimitedOfferService
    {
        private readonly DatabaseContext _context;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<LimitedOfferService> _logger;

        public LimitedOfferService(DatabaseContext context, IUnitOfWork unitOfWork, ILogger<LimitedOfferService> logger)
        {
            _context = context;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<PaginatedServiceResponse<List<LimitedOfferListDto>>> GetLimitedOffersAsync(string? searchTerm, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<LimitedOfferListDto>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                var now = DateTime.UtcNow;
                var query = _context.LimitedOffers
                    .Include(x => x.Products)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var term = searchTerm.Trim().ToLower();
                    query = query.Where(x =>
                        x.Title.ToLower().Contains(term) ||
                        (x.Subtitle != null && x.Subtitle.ToLower().Contains(term)) ||
                        (x.BadgeText != null && x.BadgeText.ToLower().Contains(term)));
                }

                var totalRecords = await query.CountAsync();

                response.Data = await query
                    .OrderBy(x => x.DisplayOrder)
                    .ThenByDescending(x => x.StartDate)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => new LimitedOfferListDto
                    {
                        Id = x.Id,
                        Title = x.Title,
                        Subtitle = x.Subtitle,
                        BadgeText = x.BadgeText,
                        StartDate = x.StartDate,
                        EndDate = x.EndDate,
                        IsActive = x.IsActive,
                        ShowOnHomepage = x.ShowOnHomepage,
                        CtaText = x.CtaText,
                        CtaLink = x.CtaLink,
                        BackgroundImageUrl = x.BackgroundImageUrl,
                        DisplayOrder = x.DisplayOrder,
                        ProductCount = x.Products.Count,
                        IsLive = x.IsActive && x.StartDate <= now && x.EndDate >= now,
                        Status = x.EndDate < now ? "Expired" : x.StartDate > now ? "Scheduled" : x.IsActive ? "Live" : "Inactive",
                        DateCreated = x.DateCreated,
                        DateUpdated = x.DateUpdated
                    })
                    .ToListAsync();
                response.Status = 200;
                response.Message = "Limited offers retrieved successfully";
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving limited offers.");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<LimitedOfferDetailsDto>> GetLimitedOfferByIdAsync(Guid id)
        {
            try
            {
                var offer = await GetOfferQuery().FirstOrDefaultAsync(x => x.Id == id);
                if (offer == null)
                {
                    return ServiceResponse<LimitedOfferDetailsDto>.Fail("Limited offer not found.", 404);
                }

                return ServiceResponse<LimitedOfferDetailsDto>.Success(MapDetailsDto(offer), "Limited offer retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving limited offer {OfferId}.", id);
                return ServiceResponse<LimitedOfferDetailsDto>.Fail(ErrorMessages.InternalServerError, 500);
            }
        }

        public async Task<ServiceResponse<LimitedOfferDetailsDto>> CreateLimitedOfferAsync(LimitedOfferUpsertDto dto, Guid userId)
        {
            try
            {
                var validation = await ValidateAsync(dto);
                if (validation != null)
                {
                    return validation;
                }

                var offer = new LimitedOffer
                {
                    Title = dto.Title.Trim(),
                    Subtitle = dto.Subtitle?.Trim(),
                    BadgeText = dto.BadgeText?.Trim(),
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    IsActive = dto.IsActive,
                    ShowOnHomepage = dto.ShowOnHomepage,
                    CtaText = dto.CtaText?.Trim(),
                    CtaLink = dto.CtaLink?.Trim(),
                    BackgroundImageUrl = dto.BackgroundImageUrl?.Trim(),
                    DisplayOrder = dto.DisplayOrder
                };

                await _unitOfWork.LimitedOfferRepository.Add(offer);

                foreach (var assignment in dto.Products.OrderBy(x => x.DisplayOrder).ThenBy(x => x.ProductId).Select((x, index) => new { x, index }))
                {
                    await _unitOfWork.LimitedOfferProductRepository.Add(new LimitedOfferProduct
                    {
                        LimitedOfferId = offer.Id,
                        ProductId = assignment.x.ProductId,
                        DisplayOrder = assignment.x.DisplayOrder == 0 ? assignment.index : assignment.x.DisplayOrder
                    });
                }

                await _unitOfWork.CompletedAsync(userId);

                var saved = await GetOfferQuery().FirstAsync(x => x.Id == offer.Id);
                return new ServiceResponse<LimitedOfferDetailsDto>
                {
                    StatusCode = 201,
                    Message = "Limited offer created successfully",
                    Data = MapDetailsDto(saved)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating limited offer.");
                return ServiceResponse<LimitedOfferDetailsDto>.Fail(ErrorMessages.InternalServerError, 500);
            }
        }

        public async Task<ServiceResponse<LimitedOfferDetailsDto>> UpdateLimitedOfferAsync(Guid id, LimitedOfferUpsertDto dto, Guid userId)
        {
            try
            {
                var validation = await ValidateAsync(dto);
                if (validation != null)
                {
                    return validation;
                }

                var offer = await _context.LimitedOffers.Include(x => x.Products).FirstOrDefaultAsync(x => x.Id == id);
                if (offer == null)
                {
                    return ServiceResponse<LimitedOfferDetailsDto>.Fail("Limited offer not found.", 404);
                }

                offer.Title = dto.Title.Trim();
                offer.Subtitle = dto.Subtitle?.Trim();
                offer.BadgeText = dto.BadgeText?.Trim();
                offer.StartDate = dto.StartDate;
                offer.EndDate = dto.EndDate;
                offer.IsActive = dto.IsActive;
                offer.ShowOnHomepage = dto.ShowOnHomepage;
                offer.CtaText = dto.CtaText?.Trim();
                offer.CtaLink = dto.CtaLink?.Trim();
                offer.BackgroundImageUrl = dto.BackgroundImageUrl?.Trim();
                offer.DisplayOrder = dto.DisplayOrder;

                foreach (var existing in offer.Products.ToList())
                {
                    await _unitOfWork.LimitedOfferProductRepository.Remove(existing.Id);
                }

                foreach (var assignment in dto.Products.OrderBy(x => x.DisplayOrder).ThenBy(x => x.ProductId).Select((x, index) => new { x, index }))
                {
                    await _unitOfWork.LimitedOfferProductRepository.Add(new LimitedOfferProduct
                    {
                        LimitedOfferId = offer.Id,
                        ProductId = assignment.x.ProductId,
                        DisplayOrder = assignment.x.DisplayOrder == 0 ? assignment.index : assignment.x.DisplayOrder
                    });
                }

                await _unitOfWork.LimitedOfferRepository.Upsert(offer);
                await _unitOfWork.CompletedAsync(userId);

                var saved = await GetOfferQuery().FirstAsync(x => x.Id == offer.Id);
                return ServiceResponse<LimitedOfferDetailsDto>.Success(MapDetailsDto(saved), "Limited offer updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating limited offer {OfferId}.", id);
                return ServiceResponse<LimitedOfferDetailsDto>.Fail(ErrorMessages.InternalServerError, 500);
            }
        }

        public async Task<ServiceResponse<bool>> DeleteLimitedOfferAsync(Guid id, Guid userId)
        {
            try
            {
                var offer = await _unitOfWork.LimitedOfferRepository.GetById(id);
                if (offer == null)
                {
                    return ServiceResponse<bool>.Fail("Limited offer not found.", 404);
                }

                await _unitOfWork.LimitedOfferRepository.Remove(id);
                await _unitOfWork.CompletedAsync(userId);

                return ServiceResponse<bool>.Success(true, "Limited offer deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting limited offer {OfferId}.", id);
                return ServiceResponse<bool>.Fail(ErrorMessages.InternalServerError, 500);
            }
        }

        public async Task<ServiceResponse<bool>> ToggleActiveAsync(Guid id, Guid userId)
        {
            try
            {
                var offer = await _unitOfWork.LimitedOfferRepository.GetById(id);
                if (offer == null)
                {
                    return ServiceResponse<bool>.Fail("Limited offer not found.", 404);
                }

                offer.IsActive = !offer.IsActive;
                await _unitOfWork.LimitedOfferRepository.Upsert(offer);
                await _unitOfWork.CompletedAsync(userId);

                return ServiceResponse<bool>.Success(true, $"Limited offer {(offer.IsActive ? "activated" : "deactivated")} successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling limited offer {OfferId}.", id);
                return ServiceResponse<bool>.Fail(ErrorMessages.InternalServerError, 500);
            }
        }

        public async Task<ServiceResponse<LimitedOfferHomepageDto>> GetActiveHomepageOfferAsync()
        {
            try
            {
                var now = DateTime.UtcNow;
                var offer = await GetOfferQuery()
                    .Where(x => x.IsActive && x.ShowOnHomepage && x.StartDate <= now && x.EndDate >= now)
                    .OrderBy(x => x.DisplayOrder)
                    .ThenBy(x => x.StartDate)
                    .FirstOrDefaultAsync();

                if (offer == null)
                {
                    return ServiceResponse<LimitedOfferHomepageDto>.Fail("No active homepage limited offer found.", 404);
                }

                return ServiceResponse<LimitedOfferHomepageDto>.Success(new LimitedOfferHomepageDto
                {
                    Id = offer.Id,
                    Title = offer.Title,
                    Subtitle = offer.Subtitle,
                    BadgeText = offer.BadgeText,
                    StartDate = offer.StartDate,
                    EndDate = offer.EndDate,
                    IsActive = offer.IsActive,
                    ShowOnHomepage = offer.ShowOnHomepage,
                    CtaText = offer.CtaText,
                    CtaLink = offer.CtaLink,
                    BackgroundImageUrl = offer.BackgroundImageUrl,
                    DisplayOrder = offer.DisplayOrder,
                    Products = offer.Products
                        .OrderBy(x => x.DisplayOrder)
                        .Select(MapHomepageProduct)
                        .ToList()
                }, "Active homepage limited offer retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active homepage limited offer.");
                return ServiceResponse<LimitedOfferHomepageDto>.Fail(ErrorMessages.InternalServerError, 500);
            }
        }

        private IQueryable<LimitedOffer> GetOfferQuery()
        {
            return _context.LimitedOffers
                .Include(x => x.Products)
                    .ThenInclude(x => x.Product)
                        .ThenInclude(x => x.Images)
                .Include(x => x.Products)
                    .ThenInclude(x => x.Product)
                        .ThenInclude(x => x.Variants)
                            .ThenInclude(x => x.PricingTiers)
                .Include(x => x.Products)
                    .ThenInclude(x => x.Product)
                        .ThenInclude(x => x.Variants)
                            .ThenInclude(x => x.Images);
        }

        private async Task<ServiceResponse<LimitedOfferDetailsDto>?> ValidateAsync(LimitedOfferUpsertDto dto)
        {
            if (dto == null)
            {
                return ServiceResponse<LimitedOfferDetailsDto>.Fail("Limited offer data is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return ServiceResponse<LimitedOfferDetailsDto>.Fail("Title is required.");
            }

            if (dto.EndDate <= dto.StartDate)
            {
                return ServiceResponse<LimitedOfferDetailsDto>.Fail("End date must be after start date.");
            }

            var productIds = dto.Products
                .Where(x => x.ProductId != Guid.Empty)
                .Select(x => x.ProductId)
                .Distinct()
                .ToList();

            if (productIds.Count == 0)
            {
                return ServiceResponse<LimitedOfferDetailsDto>.Fail("At least one product must be assigned to the offer.");
            }

            var validProductIds = await _context.Products
                .Where(x => productIds.Contains(x.Id) && x.IsApproved && x.IsAvailable)
                .Select(x => x.Id)
                .ToListAsync();

            if (validProductIds.Count != productIds.Count)
            {
                return ServiceResponse<LimitedOfferDetailsDto>.Fail("All assigned products must exist, be approved, and be available.");
            }

            return null;
        }

        private LimitedOfferDetailsDto MapDetailsDto(LimitedOffer offer)
        {
                var now = DateTime.UtcNow;

            return new LimitedOfferDetailsDto
            {
                Id = offer.Id,
                Title = offer.Title,
                Subtitle = offer.Subtitle,
                BadgeText = offer.BadgeText,
                StartDate = offer.StartDate,
                EndDate = offer.EndDate,
                IsActive = offer.IsActive,
                ShowOnHomepage = offer.ShowOnHomepage,
                CtaText = offer.CtaText,
                CtaLink = offer.CtaLink,
                BackgroundImageUrl = offer.BackgroundImageUrl,
                DisplayOrder = offer.DisplayOrder,
                Products = offer.Products
                    .OrderBy(x => x.DisplayOrder)
                    .Select(x => new LimitedOfferProductAssignmentDto
                    {
                        Id = x.Id,
                        ProductId = x.ProductId,
                        DisplayOrder = x.DisplayOrder
                    }).ToList(),
                AssignedProducts = offer.Products
                    .OrderBy(x => x.DisplayOrder)
                    .Select(MapAssignedProduct)
                    .ToList(),
                IsLive = offer.IsActive && offer.StartDate <= now && offer.EndDate >= now,
                Status = offer.EndDate < now ? "Expired" : offer.StartDate > now ? "Scheduled" : offer.IsActive ? "Live" : "Inactive",
                DateCreated = offer.DateCreated,
                DateUpdated = offer.DateUpdated
            };
        }

        private LimitedOfferAssignedProductDto MapAssignedProduct(LimitedOfferProduct item)
        {
            var pricingTier = item.Product.Variants
                .SelectMany(v => v.PricingTiers)
                .OrderBy(pt => pt.PricePerUnit)
                .FirstOrDefault();

            var imageUrl = item.Product.Variants
                .SelectMany(v => v.Images)
                .OrderBy(img => img.DisplayOrder)
                .Select(img => img.ImageUrl)
                .FirstOrDefault()
                ?? item.Product.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault();

            return new LimitedOfferAssignedProductDto
            {
                Id = item.Id,
                ProductId = item.ProductId,
                DisplayOrder = item.DisplayOrder,
                Name = item.Product.Name,
                Description = item.Product.Description,
                IsAvailable = item.Product.IsAvailable,
                IsApproved = item.Product.IsApproved,
                ImageUrl = imageUrl,
                Price = pricingTier?.PricePerUnit,
                OriginalPrice = pricingTier?.PricePerUnitGlobal
            };
        }

        private LimitedOfferHomepageProductDto MapHomepageProduct(LimitedOfferProduct item)
        {
            return new LimitedOfferHomepageProductDto
            {
                Id = item.ProductId,
                Name = item.Product.Name,
                Description = item.Product.Description,
                IsAvailable = item.Product.IsAvailable,
                IsApproved = item.Product.IsApproved,
                Images = item.Product.Images
                    .OrderBy(img => img.DisplayOrder)
                    .ThenByDescending(img => img.DateCreated)
                    .Take(4)
                    .Select(img => new ProductImageDto
                    {
                        ImageUrl = img.ImageUrl,
                        AltText = img.AltText
                    }).ToList(),
                VariantsDto = item.Product.Variants
                    .OrderBy(v => v.Weight)
                    .Select(v => new ProductVariantDto
                    {
                        Id = v.Id,
                        ProductId = v.ProductId,
                        Name = v.Name,
                        Color = v.Color,
                        Size = v.Size,
                        Style = v.Style,
                        Weight = v.Weight,
                        StockQuantity = v.StockQuantity,
                        StockSold = v.StockSold,
                        PricingTiersDto = v.PricingTiers
                            .OrderBy(pt => pt.MinQuantity)
                            .Select(pt => new PricingTierDto
                            {
                                VariantId = pt.VariantId,
                                ProductId = pt.ProductId,
                                MinQuantity = pt.MinQuantity,
                                PricePerUnit = pt.PricePerUnit,
                                PricePerUnitGlobal = pt.PricePerUnitGlobal
                            }).ToList(),
                        Images = v.Images
                            .OrderBy(img => img.DisplayOrder)
                            .ThenByDescending(img => img.DateCreated)
                            .Take(4)
                            .Select(img => new ProductImageDto
                            {
                                ImageUrl = img.ImageUrl,
                                AltText = img.AltText
                            }).ToList()
                    }).ToList()
            };
        }
    }
}
