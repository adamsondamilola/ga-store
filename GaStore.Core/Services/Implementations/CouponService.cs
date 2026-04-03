
    using AutoMapper;
    using global::GaStore.Core.Services.Interfaces;
    using global::GaStore.Data.Dtos.CouponsDto;
    using global::GaStore.Data.Entities.Coupons;
    using global::GaStore.Infrastructure.Repository.UnitOfWork;
    using global::GaStore.Models.Database;
    using global::GaStore.Shared;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.Logging;

    namespace GaStore.Core.Services.Implementations
    {
        public class CouponService : ICouponService
        {
            private readonly IUnitOfWork _unitOfWork;
            private readonly DatabaseContext _context;
            private readonly IMapper _mapper;
            private readonly ILogger<CouponService> _logger;

            public CouponService(IUnitOfWork unitOfWork, DatabaseContext context, IMapper mapper, ILogger<CouponService> logger)
            {
                _unitOfWork = unitOfWork;
                _context = context;
                _mapper = mapper;
                _logger = logger;
            }

        public async Task<PaginatedServiceResponse<List<CouponDto>>> GetPaginatedCouponsAsync(
int pageNumber,
int pageSize,
string? searchTerm = null,
bool? isActive = null
)
        {
            var response = new PaginatedServiceResponse<List<CouponDto>>();

            try
            {
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10;

                var query = _context.Coupons
                    .Include(c => c.Tiers)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(c =>
                        c.Code.Contains(searchTerm) ||
                        c.Description.Contains(searchTerm));
                }

                if (isActive.HasValue)
                {
                    query = query.Where(c => c.IsActive == isActive.Value);
                }

                int totalRecords = await query.CountAsync();

                var coupons = await query
                    .OrderByDescending(c => c.DateCreated)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                response.Data = _mapper.Map<List<CouponDto>>(coupons);
                response.Status = 200;
                response.Message = "Coupons retrieved successfully.";
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching coupons");
                response.Status = 500;
                response.Message = "An error occurred while retrieving coupons.";
            }

            return response;
        }


        public async Task<ServiceResponse<CouponDto>> GetCouponByIdAsync(Guid id)
            {
                var response = new ServiceResponse<CouponDto>();

                var coupon = await _context.Coupons
                    .Include(c => c.Tiers)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (coupon == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Coupon not found.";
                    return response;
                }

                response.StatusCode = 200;
                response.Message = "Coupon retrieved successfully.";
                response.Data = _mapper.Map<CouponDto>(coupon);
                return response;
            }
            
            public async Task<ServiceResponse<CouponDto>> CreateCouponAsync(CouponDto dto, Guid userId)
            {
                var response = new ServiceResponse<CouponDto>();

                try
                {
                    if (dto == null)
                    {
                        response.StatusCode = 400;
                        response.Message = "Invalid coupon data.";
                        return response;
                    }

                    bool codeExists = await _context.Coupons.AnyAsync(c => c.Code == dto.Code);
                    if (codeExists)
                    {
                        response.StatusCode = 400;
                        response.Message = "Coupon code already exists.";
                        return response;
                    }

                    var entity = _mapper.Map<Coupon>(dto);
                    entity.CreatedBy = userId;
                    entity.DateCreated = DateTime.UtcNow;

                    await _context.Coupons.AddAsync(entity);
                    await _unitOfWork.CompletedAsync(userId);

                    response.StatusCode = 201;
                    response.Message = "Coupon created successfully.";
                    response.Data = _mapper.Map<CouponDto>(entity);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating coupon.");
                    response.StatusCode = 500;
                    response.Message = "An error occurred while creating the coupon.";
                }

                return response;
            }

            public async Task<ServiceResponse<CouponDto>> UpdateCouponAsync(Guid id, CouponDto dto, Guid userId)
            {
                var response = new ServiceResponse<CouponDto>();

                var coupon = await _context.Coupons.Include(c => c.Tiers).FirstOrDefaultAsync(c => c.Id == id);
                if (coupon == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Coupon not found.";
                    return response;
                }

                coupon.Code = dto.Code;
                coupon.Description = dto.Description;
                coupon.GlobalUsageLimit = dto.GlobalUsageLimit;
                coupon.UsagePerUserLimit = dto.UsagePerUserLimit;
                coupon.ValidFrom = dto.ValidFrom;
                coupon.ValidTo = dto.ValidTo;
                coupon.IsActive = dto.IsActive;
                coupon.IsGlobal = dto.IsGlobal;

                // Update tiers
                _context.CouponTiers.RemoveRange(coupon.Tiers);
                coupon.Tiers = _mapper.Map<List<CouponTier>>(dto.Tiers);

                _context.Coupons.Update(coupon);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Coupon updated successfully.";
                response.Data = _mapper.Map<CouponDto>(coupon);
                return response;
            }

            public async Task<ServiceResponse<bool>> DeleteCouponAsync(Guid id, Guid userId)
            {
                var response = new ServiceResponse<bool>();

                var coupon = await _context.Coupons.FindAsync(id);
                if (coupon == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Coupon not found.";
                    return response;
                }

                _context.Coupons.Remove(coupon);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Coupon deleted successfully.";
                response.Data = true;
                return response;
            }

        public async Task<ServiceResponse<ApplyCouponResultDto>> CalculateCouponDiscountAsync(Guid userId, string code, decimal orderTotal)
        {
            var response = new ServiceResponse<ApplyCouponResultDto>();

            try
            {
                var coupon = await _context.Coupons
                    .Include(c => c.Tiers)
                    .Include(c => c.Usages)
                    .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);

                var now = DateTime.UtcNow;

                if (coupon == null || now < coupon.ValidFrom || now > coupon.ValidTo)
                {
                    response.StatusCode = 400;
                    response.Message = "Invalid or expired coupon.";
                    return response;
                }

                // Check global usage limit
                int totalUsed = await _context.CouponUsages
                        .Where(u => u.CouponId == coupon.Id)
                        .SumAsync(u => u.UsageCount);

                if (coupon.GlobalUsageLimit > 0 && totalUsed >= coupon.GlobalUsageLimit)
                {
                    response.StatusCode = 400;
                    response.Message = "Global coupon usage limit reached.";
                    return response;
                }

                // Get user usage
                var userUsage = await _context.CouponUsages
                    .FirstOrDefaultAsync(u => u.CouponId == coupon.Id && u.UserId == userId);

                int nextUse = (userUsage?.UsageCount ?? 0) + 1;
                if (nextUse > coupon.UsagePerUserLimit)
                {
                    response.StatusCode = 400;
                    response.Message = "You have reached your usage limit for this coupon.";
                    return response;
                }

                var tier = coupon.Tiers.OrderBy(d => d.DiscountPercentage).FirstOrDefault(t => t.UsageNumber == nextUse)
                    ?? coupon.Tiers.OrderBy(d => d.DiscountPercentage).FirstOrDefault();

                if (tier == null)
                {
                    response.StatusCode = 400;
                    response.Message = "No discount tier found for this usage.";
                    return response;
                }

                decimal discount = tier.FixedDiscountAmount ?? (orderTotal * ((decimal)tier.DiscountPercentage / 100));
                decimal newTotal = orderTotal - discount;

                
                response.StatusCode = 200;
                response.Message = $"Coupon applied successfully. You received {tier.DiscountPercentage}% off.";
                response.Data = new ApplyCouponResultDto
                {
                    Discount = discount,
                    NewTotal = newTotal,
                    UsageNumber = nextUse,
                    DiscountPercentage = tier.DiscountPercentage
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying coupon.");
                response.StatusCode = 500;
                response.Message = "An error occurred while confirming the coupon.";
            }

            return response;
        }

        public async Task<ServiceResponse<ApplyCouponResultDto>> ApplyCouponAsync(Guid userId, string code, decimal orderTotal)
        {
            var response = new ServiceResponse<ApplyCouponResultDto>();

            try
            {
                var coupon = await _context.Coupons
                    .Include(c => c.Tiers)
                    .Include(c => c.Usages)
                    .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);

                var now = DateTime.UtcNow;

                if (coupon == null || now < coupon.ValidFrom || now > coupon.ValidTo)
                {
                    response.StatusCode = 400;
                    response.Message = "Invalid or expired coupon.";
                    return response;
                }

                // Check global usage limit
                int totalUsed = await _context.CouponUsages
                        .Where(u => u.CouponId == coupon.Id)
                        .SumAsync(u => u.UsageCount);

                if (coupon.GlobalUsageLimit > 0 && totalUsed >= coupon.GlobalUsageLimit)
                {
                    response.StatusCode = 400;
                    response.Message = "Global coupon usage limit reached.";
                    return response;
                }

                // Get user usage
                var userUsage = await _context.CouponUsages
                    .FirstOrDefaultAsync(u => u.CouponId == coupon.Id && u.UserId == userId);

                int nextUse = (userUsage?.UsageCount ?? 0) + 1;
                if (nextUse > coupon.UsagePerUserLimit)
                {
                    response.StatusCode = 400;
                    response.Message = "You have reached your usage limit for this coupon.";
                    return response;
                }

                var tier = coupon.Tiers.OrderBy(d => d.DiscountPercentage).FirstOrDefault(t => t.UsageNumber == nextUse)
                    ?? coupon.Tiers.OrderBy(d => d.DiscountPercentage).FirstOrDefault();

                if (tier == null)
                {
                    response.StatusCode = 400;
                    response.Message = "No discount tier found for this usage.";
                    return response;
                }

                decimal discount = tier.FixedDiscountAmount ?? (orderTotal * (tier.DiscountPercentage / 100));
                decimal newTotal = orderTotal - discount;

                if (userUsage == null)
                {
                    userUsage = new CouponUsage
                    {
                        CouponId = coupon.Id,
                        UserId = userId,
                        UsageCount = 1
                    };
                    await _context.CouponUsages.AddAsync(userUsage);
                }
                else
                {
                    userUsage.UsageCount += 1;
                    _context.CouponUsages.Update(userUsage);
                }

                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = $"Coupon applied successfully. You received {tier.DiscountPercentage}% off.";
                response.Data = new ApplyCouponResultDto
                {
                    Discount = discount,
                    NewTotal = newTotal,
                    UsageNumber = nextUse,
                    DiscountPercentage = tier.DiscountPercentage
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying coupon.");
                response.StatusCode = 500;
                response.Message = "An error occurred while applying the coupon.";
            }

            return response;
        }

        public async Task<ServiceResponse<ApplyCouponResultDto>> GetCouponByCodeAsync(Guid userId, string code, decimal orderTotal)
        {
            var response = new ServiceResponse<ApplyCouponResultDto>();

            try
            {
                var coupon = await _context.Coupons
                    .Include(c => c.Tiers)
                    .Include(c => c.Usages)
                    .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);

                if (coupon == null || coupon.ValidTo < DateTime.UtcNow)
                {
                    response.StatusCode = 400;
                    response.Message = "Invalid or expired coupon.";
                    return response;
                }

                // Check global usage limit
                int totalUsed = await _context.CouponUsages
                    .Where(u => u.CouponId == coupon.Id)
                    .SumAsync(u => u.UsageCount);

                if (coupon.GlobalUsageLimit > 0 && totalUsed >= coupon.GlobalUsageLimit)
                {
                    response.StatusCode = 400;
                    response.Message = "Global coupon usage limit reached.";
                    return response;
                }

                // Get user usage
                var userUsage = await _context.CouponUsages
                    .FirstOrDefaultAsync(u => u.CouponId == coupon.Id && u.UserId == userId);

                int nextUse = 0;
                if (userUsage != null)
                {
                    nextUse = (userUsage?.UsageCount ?? 0) + 1;
                }
                /*if (nextUse > coupon.UsagePerUserLimit)
                {
                    response.StatusCode = 400;
                    response.Message = "You have reached your usage limit for this coupon.";
                    return response;
                }*/

                var tier = coupon.Tiers.OrderByDescending(t => t.CouponId == userUsage?.CouponId && t.UsageNumber == userUsage.UsageCount).FirstOrDefault();

                if (tier == null)
                {
                    response.StatusCode = 400;
                    response.Message = "No discount tier found for this usage.";
                    return response;
                }

                decimal discount = tier.FixedDiscountAmount ?? (orderTotal * ((decimal)tier.DiscountPercentage / 100));
                decimal newTotal = orderTotal - discount;

                response.StatusCode = 200;
                response.Message = $"Coupon retrieved successfully. You will receive {tier.DiscountPercentage}% off.";
                response.Data = new ApplyCouponResultDto
                {
                    Discount = discount,
                    NewTotal = newTotal,
                    UsageNumber = nextUse,
                    DiscountPercentage = tier.DiscountPercentage
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying coupon.");
                response.StatusCode = 500;
                response.Message = "An error occurred while trying to process the applied coupon.";
            }

            return response;
        }


        public async Task<ServiceResponse<List<CouponUserDto>>> GetCouponUsersAsync(Guid couponId)
    {
        var response = new ServiceResponse<List<CouponUserDto>>();

        try
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == couponId);
            if (coupon == null)
            {
                response.StatusCode = 404;
                response.Message = "Coupon not found.";
                return response;
            }

            // Get all orders that used this coupon
            var orders = await _context.Orders
                .Include(o => o.User)
                .Where(o => o.CouponCode != null && o.CouponCode.ToLower() == coupon.Code.ToLower())
                .ToListAsync();

            if (!orders.Any())
            {
                response.StatusCode = 200;
                response.Message = "No users have used this coupon yet.";
                response.Data = new List<CouponUserDto>();
                return response;
            }

            // Group by user
            var users = orders
                .GroupBy(o => o.UserId)
                .Select(g => new CouponUserDto
                {
                    UserId = (Guid)g.Key,
                    FullName = g.First().User != null ?
                        $"{g.First().User.FirstName} {g.First().User.LastName}" : "Unknown User",
                    Email = g.First().User != null ? g.First().User.Email : "—",
                    UsageCount = g.Count(),
                    LastUsedDate = g.Max(o => o.DateCreated),
                    TotalDiscountReceived = g.Sum(o => o.SubTotal - o.SubTotalAfterDiscount ?? 0)
                })
                .OrderByDescending(u => u.LastUsedDate)
                .ToList();

            response.StatusCode = 200;
            response.Message = "Coupon user list retrieved successfully.";
            response.Data = users;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching coupon users");
            response.StatusCode = 500;
            response.Message = "An error occurred while retrieving coupon users.";
        }

        return response;
    }


}
    }

