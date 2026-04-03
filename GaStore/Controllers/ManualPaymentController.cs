using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ManualPaymentController : RootController
    {
        private readonly IManualPaymentService _manualPaymentService;

        public ManualPaymentController(IManualPaymentService manualPaymentService)
        {
            _manualPaymentService = manualPaymentService;
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpGet("accounts")]
        public async Task<ActionResult<ServiceResponse<List<BankAccountDto>>>> GetAccounts()
        {
            var response = await _manualPaymentService.GetManualPaymentAccountsAsync();
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpGet("order/{orderId}")]
        public async Task<ActionResult<ServiceResponse<ManualPaymentDto>>> GetByOrder(Guid orderId)
        {
            var response = await _manualPaymentService.GetByOrderIdAsync(orderId, UserId, false);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpPost("proof")]
        public async Task<ActionResult<ServiceResponse<ManualPaymentDto>>> SubmitProof([FromForm] SubmitManualPaymentProofDto dto)
        {
            var response = await _manualPaymentService.SubmitProofAsync(UserId, dto);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("admin/order/{orderId}")]
        public async Task<ActionResult<ServiceResponse<ManualPaymentDto>>> GetByOrderAdmin(Guid orderId)
        {
            var response = await _manualPaymentService.GetByOrderIdAsync(orderId, UserId, true);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost("admin/order/{orderId}/review")]
        public async Task<ActionResult<ServiceResponse<ManualPaymentDto>>> Review(Guid orderId, [FromBody] ReviewManualPaymentDto dto)
        {
            var response = await _manualPaymentService.ReviewAsync(orderId, UserId, dto);
            return StatusCode(response.StatusCode, response);
        }
    }
}
