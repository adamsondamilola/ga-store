using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.CouponsDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("FixedPolicy")]
    public class CouponController : RootController
    {
        private readonly ICouponService _couponService;

        public CouponController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        // ---------------------------
        // ADMIN ENDPOINTS
        // ---------------------------

        /// <summary>
        /// Get all coupons with pagination.
        /// </summary>
        [Authorize(Roles = CustomRoles.AdminOrSuperAdmin)]
        [HttpGet]
        public async Task<IActionResult> GetCoupons([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? searchTerm = null, [FromQuery] bool? isActive = null)
        {
            var result = await _couponService.GetPaginatedCouponsAsync(pageNumber, pageSize, searchTerm, isActive);
            return StatusCode(result.Status, result);
        }


        /// <summary>
        /// Get coupon by ID.
        /// </summary>
        [Authorize(Roles = CustomRoles.AdminOrSuperAdmin)]
        [HttpGet("{couponId}")]
        public async Task<ActionResult<ServiceResponse<CouponDto>>> GetCouponById(Guid couponId)
        {
            var response = await _couponService.GetCouponByIdAsync(couponId);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Create a new coupon.
        /// </summary>
        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpPost]
        public async Task<ActionResult<ServiceResponse<CouponDto>>> CreateCoupon([FromBody] CouponDto couponDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<CouponDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _couponService.CreateCouponAsync(couponDto, UserId);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Update an existing coupon.
        /// </summary>
        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpPut("{couponId}")]
        public async Task<ActionResult<ServiceResponse<CouponDto>>> UpdateCoupon(Guid couponId, [FromBody] CouponDto couponDto)
        {
            var response = await _couponService.UpdateCouponAsync(couponId, couponDto, UserId);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Delete a coupon.
        /// </summary>
        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpDelete("{couponId}")]
        public async Task<ActionResult<ServiceResponse<bool>>> DeleteCoupon(Guid couponId)
        {
            var response = await _couponService.DeleteCouponAsync(couponId, UserId);
            return StatusCode(response.StatusCode, response);
        }

        // ---------------------------
        // USER ENDPOINTS
        // ---------------------------

        /// <summary>
        /// Apply coupon at checkout.
        /// </summary>
        [Authorize]
        [HttpPost("apply")]
        public async Task<ActionResult<ServiceResponse<ApplyCouponResultDto>>> ApplyCoupon([FromBody] ApplyCouponRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new ServiceResponse<ApplyCouponResultDto>
                {
                    StatusCode = 400,
                    Message = "Coupon code is required."
                });
            }

            var response = await _couponService.ApplyCouponAsync(UserId, request.Code, request.OrderTotal);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize]
        [HttpPost("calculate-discount")]
        public async Task<ActionResult<ServiceResponse<ApplyCouponResultDto>>> CalculateCouponDiscount([FromBody] ApplyCouponRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new ServiceResponse<ApplyCouponResultDto>
                {
                    StatusCode = 400,
                    Message = "Coupon code is required."
                });
            }

            var response = await _couponService.CalculateCouponDiscountAsync(UserId, request.Code, request.OrderTotal);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpGet("{couponId}/users")]
        public async Task<ActionResult<ServiceResponse<List<CouponUserDto>>>> GetCouponUsers(Guid couponId)
        {
            var response = await _couponService.GetCouponUsersAsync(couponId);
            return StatusCode(response.StatusCode, response);
        }

    }
}
