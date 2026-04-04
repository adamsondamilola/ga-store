using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos;
using GaStore.Data.Dtos.CheckOutDto;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.PaymentGatewaysDto.PaystackDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class CheckoutController : RootController
	{
		private readonly ICheckoutService _checkoutService;

		public CheckoutController(ICheckoutService checkoutService)
		{
			_checkoutService = checkoutService;
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpPost("wallet")]
		public async Task<ActionResult<ServiceResponse<bool>>> Checkout([FromBody] OrderSummaryDto summaryDto, [FromQuery] Guid orderId)
		{

			var response = await _checkoutService.ProcessCheckoutWithWalletAsync(UserId, orderId, summaryDto);
			return StatusCode(response.StatusCode, response);
		}

        [Authorize(Roles = CustomRoles.User)]
        [HttpPost("voucher")]
        public async Task<ActionResult<ServiceResponse<bool>>> CheckoutWithVoucher([FromBody] OrderSummaryDto summaryDto, [FromQuery] Guid orderId)
        {
            var response = await _checkoutService.ProcessCheckoutWithVoucherAsync(UserId, orderId, summaryDto);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpPost("register-purchase")]
        [EnableRateLimiting("payment-gateway")]
        public async Task<ActionResult<ServiceResponse<PaymentInitiationResponseDto>>> RegisterPurchase([FromBody] OrderSummaryDto summaryDto)
        {

            var response = await _checkoutService.RegisterPurchaseAsync(UserId, summaryDto);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpPost("payment-transaction/{transactionId}")]
        [EnableRateLimiting("PaymentPolicy")]
        public async Task<ActionResult<ServiceResponse<bool>>> VerifyTransactionAsync([FromBody] OrderSummaryDto summaryDto, [FromQuery] Guid orderId, string transactionId)
        {

            var response = await _checkoutService.VerifyTransaction(summaryDto, transactionId, UserId, orderId);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpGet("payment-gateway")]
        public ActionResult<ServiceResponse<string>> GetPaymentGateway()
        {
            var response = _checkoutService.DefaultPaymentGateway();
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpGet("payment-methods")]
        public async Task<ActionResult<ServiceResponse<List<PaymentMethodConfigurationDto>>>> GetPaymentMethods()
        {
            var response = await _checkoutService.GetPaymentMethodsAsync();
            return StatusCode(response.StatusCode, response);
        }
    }
}
