using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/vendor-earnings")]
    public class VendorEarningController : RootController
    {
        private readonly IVendorEarningService _vendorEarningService;

        public VendorEarningController(IVendorEarningService vendorEarningService)
        {
            _vendorEarningService = vendorEarningService;
        }

        [Authorize(Roles = $"{CustomRoles.User},{CustomRoles.Vendor},{CustomRoles.Admin},{CustomRoles.SuperAdmin}")]
        [HttpGet("mine")]
        public async Task<ActionResult<PaginatedServiceResponse<List<VendorEarningDto>>>> GetMyEarnings(
            [FromQuery] string? status,
            [FromQuery] Guid? orderId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var response = await _vendorEarningService.GetVendorEarningsAsync(UserId, status, orderId, startDate, endDate, pageNumber, pageSize);
            return StatusCode(response.Status, response);
        }

        [Authorize(Roles = $"{CustomRoles.User},{CustomRoles.Vendor},{CustomRoles.Admin},{CustomRoles.SuperAdmin}")]
        [HttpGet("mine/overview")]
        public async Task<ActionResult<ServiceResponse<VendorEarningsOverviewDto>>> GetMyEarningsOverview(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var response = await _vendorEarningService.GetVendorOverviewAsync(UserId, startDate, endDate);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("admin/payouts/queue")]
        public async Task<ActionResult<ServiceResponse<List<VendorPayoutCandidateDto>>>> GetAdminPayoutQueue([FromQuery] Guid? vendorId)
        {
            var response = await _vendorEarningService.GetAdminPayoutQueueAsync(vendorId);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("admin/payouts/history")]
        public async Task<ActionResult<PaginatedServiceResponse<List<VendorPayoutDto>>>> GetAdminPayoutHistory(
            [FromQuery] Guid? vendorId,
            [FromQuery] string? status,
            [FromQuery] string? gateway,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var response = await _vendorEarningService.GetAdminPayoutHistoryAsync(vendorId, status, gateway, pageNumber, pageSize);
            return StatusCode(response.Status, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost("admin/payouts/process")]
        public async Task<ActionResult<ServiceResponse<List<VendorPayoutDto>>>> ProcessWeekendPayouts([FromBody] ProcessVendorPayoutRequestDto dto)
        {
            var response = await _vendorEarningService.ProcessWeekendPayoutsAsync(UserId, dto);
            return StatusCode(response.StatusCode, response);
        }
    }
}
