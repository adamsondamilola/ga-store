using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentMethodConfigurationController : RootController
    {
        private readonly IPaymentMethodConfigurationService _paymentMethodConfigurationService;

        public PaymentMethodConfigurationController(IPaymentMethodConfigurationService paymentMethodConfigurationService)
        {
            _paymentMethodConfigurationService = paymentMethodConfigurationService;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResponse<List<PaymentMethodConfigurationDto>>>> GetPaymentMethods()
        {
            var response = await _paymentMethodConfigurationService.GetPaymentMethodsAsync();
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpGet("admin")]
        public async Task<ActionResult<ServiceResponse<List<PaymentMethodConfigurationDto>>>> GetPaymentMethodsAdmin()
        {
            var response = await _paymentMethodConfigurationService.GetPaymentMethodsAsync(true);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpPut("admin")]
        public async Task<ActionResult<ServiceResponse<List<PaymentMethodConfigurationDto>>>> UpdatePaymentMethods(
            [FromBody] List<UpdatePaymentMethodConfigurationDto> dtos)
        {
            var response = await _paymentMethodConfigurationService.UpdatePaymentMethodsAsync(UserId, dtos);
            return StatusCode(response.StatusCode, response);
        }
    }
}
