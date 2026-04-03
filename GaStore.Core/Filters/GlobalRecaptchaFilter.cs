using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using GaStore.Core.Services.Interfaces.Google;

namespace GaStore.Core.Filters
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class ValidateRecaptchaAttribute : ActionFilterAttribute
    {
        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Get the DTO (first action parameter)
            var dto = context.ActionArguments.FirstOrDefault().Value;

            if (dto == null)
            {
                context.Result = new BadRequestObjectResult(new
                {
                    StatusCode = 400,
                    Message = "Invalid request body."
                });
                return;
            }

            // Find property RecaptchaToken or CaptchaToken
            var prop = dto.GetType().GetProperty("CaptchaToken")
                       ?? dto.GetType().GetProperty("RecaptchaToken");

            if (prop == null)
            {
                context.Result = new BadRequestObjectResult(new
                {
                    StatusCode = 400,
                    Message = "CaptchaToken field is missing in request model."
                });
                return;
            }

            // Get token value
            var tokenValue = prop.GetValue(dto)?.ToString();

            if (string.IsNullOrWhiteSpace(tokenValue))
            {
                context.Result = new BadRequestObjectResult(new
                {
                    StatusCode = 400,
                    Message = "CaptchaToken is required."
                });
                return;
            }

            // Call reCAPTCHA service
            var recaptchaService =
                context.HttpContext.RequestServices.GetRequiredService<IRecaptchaService>();

            var verification = await recaptchaService.VerifyAsync(tokenValue);

            if (verification.StatusCode != 200)
            {
                context.Result = new BadRequestObjectResult(new
                {
                    StatusCode = 400,
                    Message = "reCAPTCHA validation failed."
                });
                return;
            }

            await next();
        }
    }
}
