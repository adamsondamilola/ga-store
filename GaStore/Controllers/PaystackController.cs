using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Services.Interfaces.PaymentGateways.Paystack;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.PaymentGatewaysDto.PaystackDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaystackController : RootController
    {
        private readonly  IPaystackService _paystackService;
        private readonly ILogger<PaystackController> _logger;

        public PaystackController(
            IPaystackService paystackService,
            ILogger<PaystackController> logger)
        {
            _paystackService = paystackService;
            _logger = logger;
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpPost("{amount}/initialize")]
        [EnableRateLimiting("payment-gateway")]
        public async Task<ActionResult<ServiceResponse<PaymentInitiationResponseDto>>> RegisterPurchase([FromRoute] decimal amount)
        {
            var response = await _paystackService.InitializePayment(amount, UserId);
            return StatusCode(response.StatusCode, response);
        }
    }
}
