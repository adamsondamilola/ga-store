using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.CouponsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface ICouponService
    {
        Task<PaginatedServiceResponse<List<CouponDto>>> GetPaginatedCouponsAsync(
int pageNumber,
int pageSize,
string? searchTerm = null,
bool? isActive = null
);
        Task<ServiceResponse<CouponDto>> GetCouponByIdAsync(Guid id);
        Task<ServiceResponse<CouponDto>> CreateCouponAsync(CouponDto dto, Guid userId);
        Task<ServiceResponse<CouponDto>> UpdateCouponAsync(Guid id, CouponDto dto, Guid userId);
        Task<ServiceResponse<bool>> DeleteCouponAsync(Guid id, Guid userId);
        Task<ServiceResponse<ApplyCouponResultDto>> CalculateCouponDiscountAsync(Guid userId, string code, decimal orderTotal);
        Task<ServiceResponse<ApplyCouponResultDto>> ApplyCouponAsync(Guid userId, string code, decimal orderTotal);
        Task<ServiceResponse<ApplyCouponResultDto>> GetCouponByCodeAsync(Guid userId, string code, decimal orderTotal);
            
            Task<ServiceResponse<List<CouponUserDto>>> GetCouponUsersAsync(Guid couponId);



    }

}
