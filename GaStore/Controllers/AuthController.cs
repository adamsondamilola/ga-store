using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using GaStore.Common;
using GaStore.Core.Filters;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.AuthDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Models;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class AuthController : RootController
	{
		private readonly IAuthService _authService;
		private readonly IAuthGoogleService _authGoogleService;
        private readonly AppSettings _appSettings;
        public AuthController(IAuthService authService, IAuthGoogleService authGoogleService, IOptions<AppSettings> appSettings)
        {
            _authService = authService;
            _authGoogleService = authGoogleService;
            _appSettings = appSettings.Value;
        }

        [HttpPost("register")]
        //[ValidateRecaptcha]
        [EnableRateLimiting("FixedPolicy")]
        public async Task<IActionResult> Register([FromBody] UserDto users)
		{
			var response = await _authService.Register(users);
			return StatusCode(response.StatusCode, response); // Return the status code and response
		}

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost("create-new-user")]
        [EnableRateLimiting("FixedPolicy")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto users)
        {
            var response = await _authService.CreateUser(users);
            return StatusCode(response.StatusCode, response); // Return the status code and response
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut("block-or-unblock-user/{userId}")]
        [EnableRateLimiting("FixedPolicy")]
        public async Task<IActionResult> BlockUnlockUser([FromRoute] Guid userId)
        {
            var response = await _authService.BlockUnlockUser(UserId, userId);
            return StatusCode(response.StatusCode, response); // Return the status code and response
        }

        [HttpPost("login")]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<IActionResult> Login([FromBody] LoginDto login)
		{
			var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
			var response = await _authService.Login(login, clientIp);
			return StatusCode(response.StatusCode, response); // Return the status code and response
		}

        [HttpGet("google-login")]
        [EnableRateLimiting("AuthPolicy")]
        public IActionResult GoogleLogin()
        {
            var properties = new AuthenticationProperties
            {
                RedirectUri = Url.Action("GoogleResponse")
            };
            return Challenge(properties, "Google");
        }
        /*
        [HttpGet("google-login")]
        public IActionResult GoogleLogin([FromQuery] string? returnUrl = null)
        {
            // Build the callback route inside THIS controller
            var callbackUrl = Url.Action(
                action: nameof(GoogleResponse),
                controller: "Auth",           
                values: null,
                protocol: Request.Scheme,
                host: Request.Host.ToString()
            );

            var properties = new AuthenticationProperties
            {
                RedirectUri = callbackUrl
            };

            // optional: store where you want to send the user after login
            if (!string.IsNullOrWhiteSpace(returnUrl))
                properties.Items["returnUrl"] = returnUrl;

            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }*/


        [HttpGet("google-response")]
        [EnableRateLimiting("FixedPolicy")]
        public async Task<IActionResult> GoogleResponse()
        {
            var authResult = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

            if (!authResult.Succeeded)
            {
                return BadRequest("Google authentication failed");
            }

            // Extract user claims
            var email = authResult.Principal.FindFirst(ClaimTypes.Email)?.Value;
            var givenName = authResult.Principal.FindFirst(ClaimTypes.GivenName)?.Value;
            var surname = authResult.Principal.FindFirst(ClaimTypes.Surname)?.Value;
            var nameIdentifier = authResult.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("Could not retrieve user information from Google");
            }

            // Create user DTO
            var googleUser = new GoogleUserDto()
            {
                Email = email,
                FirstName = givenName,
                LastName = surname,
                //GoogleId = nameIdentifier
            };

            // Authenticate user in your system
            var authResponse = await _authGoogleService.AuthenticateGoogleUserAsync(googleUser);

            // Sign out of the temporary cookie scheme
            await HttpContext.SignOutAsync();

            if (authResponse.StatusCode > 201)
            {
                return StatusCode(authResponse.StatusCode, authResponse);
            }

            // Return the JWT token to the client
            /*return Ok(new
            {
                token = authResponse.Data,
                user = new
                {
                    email = googleUser.Email,
                    firstName = googleUser.FirstName,
                    lastName = googleUser.LastName
                }
            });*/
            string url = $"{_appSettings.Google.CallbackUrl}{authResponse.Data}";
            return Redirect(url);
        }

        [HttpGet("google")]
        [EnableRateLimiting("FixedPolicy")]
        public IActionResult GoogleAuth()
        {
            var properties = new AuthenticationProperties { RedirectUri = "/api/auth/google-callback" };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("google-callback")]
        public async Task<IActionResult> GoogleCallback()
        {
            // Authenticate with the Google scheme
            var authResult = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

            if (!authResult.Succeeded)
            {
                return BadRequest("Google authentication failed");
            }

            // Extract user claims
            var email = authResult.Principal.FindFirst(ClaimTypes.Email)?.Value;
            var givenName = authResult.Principal.FindFirst(ClaimTypes.GivenName)?.Value;
            var surname = authResult.Principal.FindFirst(ClaimTypes.Surname)?.Value;
            var nameIdentifier = authResult.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("Could not retrieve user information from Google");
            }

            // Create user DTO
            var googleUser = new GoogleUserDto()
            {
                Email = email,
                FirstName = givenName,
                LastName = surname,
                //GoogleId = nameIdentifier
            };

            // Authenticate user in your system
            var authResponse = await _authGoogleService.AuthenticateGoogleUserAsync(googleUser);

            // Sign out of the temporary cookie scheme
            await HttpContext.SignOutAsync();

            if (authResponse.StatusCode > 201)
            {
                return StatusCode(authResponse.StatusCode, authResponse);
            }

            // Return the JWT token to the client
            return Ok(new
            {
                token = authResponse,
                user = new
                {
                    email = googleUser.Email,
                    firstName = googleUser.FirstName,
                    lastName = googleUser.LastName
                }
            });
        }


        [Authorize(Roles = CustomRoles.User)]
        [HttpGet("logged-in-user-details/")]
        [EnableRateLimiting("FixedPolicy")]
        public IActionResult UserDetails()
		{
			var response = _authService.UserDetails(UserId);
			return StatusCode(response.StatusCode, response); // Return the status code and response
		}

        [Authorize(Roles = CustomRoles.User)]
        [HttpGet("logged-in-user/")]
        [EnableRateLimiting("FixedPolicy")]
        public IActionResult LoggedInUser()
		{
			var response = _authService.LoggedInUser(UserId);
			return StatusCode(response.StatusCode, response); // Return the status code and response
		}

		[HttpPost("reset-password")]
        [EnableRateLimiting("FixedPolicy")]
        public IActionResult ResetPassword([FromBody] OtpRequestDto otp)
		{
			var response = _authService.ResetPassword(otp);
			return StatusCode(response.StatusCode, response); // Return the status code and response
		}

		[HttpPost("generate-otp")]
        [EnableRateLimiting("FixedPolicy")]
        public async Task<IActionResult> GenerateOtp([FromBody] OtpRequestDto otp)
		{
			var response = await _authService.GenerateOtp(otp);
			return StatusCode(response.StatusCode, response); // Return the status code and response
		}

		[HttpGet("check/{email}")]
        [EnableRateLimiting("FixedPolicy")]
        public IActionResult VerifyEmailOrPhone(string email)
		{
			var response = _authService.VerifyEmailOrPhone(email);
			return StatusCode(response.StatusCode, response); // Return the status code and response
		}

		[HttpPost("verify-otp")]
        [EnableRateLimiting("FixedPolicy")]
        public IActionResult VerifyOtp([FromBody] OtpRequestDto otp)
		{
			var response = _authService.VerifyOtp(otp);
			return StatusCode(response.StatusCode, response); // Return the status code and response
		}

		[HttpPost("check-otp")]
        [EnableRateLimiting("FixedPolicy")]
        public IActionResult CheckOtp([FromBody] OtpRequestDto otp)
		{
			var response = _authService.CheckOtp(otp);
			return StatusCode(response.StatusCode, response); // Return the status code and response
		}

	}
}
