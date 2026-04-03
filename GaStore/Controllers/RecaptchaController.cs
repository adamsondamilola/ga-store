using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces.Google;
using GaStore.Data.Dtos.Google;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecaptchaController : RootController
    {
        private readonly IRecaptchaService _recaptchaService;

        public RecaptchaController(IRecaptchaService recaptchaService)
        {
            _recaptchaService = recaptchaService;
        }

        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] ReCaptchaRequest request)
        {
            var response = await _recaptchaService.VerifyAsync(request.Token);
            return StatusCode(response.StatusCode, response);
        }
    }

}
