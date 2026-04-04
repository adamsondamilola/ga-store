using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.VouchersDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VoucherController : RootController
    {
        private readonly IVoucherService _voucherService;

        public VoucherController(IVoucherService voucherService)
        {
            _voucherService = voucherService;
        }

        [Authorize(Roles = $"{CustomRoles.User},{CustomRoles.Admin},{CustomRoles.SuperAdmin}")]
        [HttpGet("validate/{code}")]
        public async Task<ActionResult<ServiceResponse<VoucherValidationDto>>> ValidateVoucher(string code)
        {
            var response = await _voucherService.ValidateVoucherAsync(code);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = $"{CustomRoles.Admin},{CustomRoles.SuperAdmin}")]
        [HttpGet("admin")]
        public async Task<ActionResult<ServiceResponse<List<VoucherDto>>>> GetAll()
        {
            var response = await _voucherService.GetVouchersAsync(true);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = $"{CustomRoles.Admin},{CustomRoles.SuperAdmin}")]
        [HttpPost("admin")]
        public async Task<ActionResult<ServiceResponse<VoucherDto>>> Create([FromBody] VoucherDto dto)
        {
            var response = await _voucherService.CreateVoucherAsync(UserId, dto);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = $"{CustomRoles.Admin},{CustomRoles.SuperAdmin}")]
        [HttpPut("admin/{voucherId}")]
        public async Task<ActionResult<ServiceResponse<VoucherDto>>> Update(Guid voucherId, [FromBody] VoucherDto dto)
        {
            var response = await _voucherService.UpdateVoucherAsync(voucherId, UserId, dto);
            return StatusCode(response.StatusCode, response);
        }
    }
}
