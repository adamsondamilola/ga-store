using Microsoft.AspNetCore.Mvc;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Common;
using Microsoft.AspNetCore.Authorization;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;
using GaStore.Shared;

namespace GaStore.Controllers
{
		[ApiController]
		[Route("api/[controller]")]
		public class UserProfileController : RootController
		{
			private readonly IUserProfileService _userProfileService;

			public UserProfileController(IUserProfileService userProfileService)
			{
				_userProfileService = userProfileService;
			}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet("{userId}")]
			public async Task<IActionResult> GetUserProfile(Guid userId)
			{
				var response = await _userProfileService.GetUserProfileAsync(userId);
				return StatusCode(response.StatusCode, response);
			}

		[Authorize(Roles = CustomRoles.User)]
		[HttpPost]
			public async Task<IActionResult> CreateOrUpdateUserProfile([FromBody] UserProfileDto userProfileDto)
			{
			userProfileDto.UserId = UserId;
				var response = await _userProfileService.CreateOrUpdateUserProfileAsync(userProfileDto);
				return StatusCode(response.StatusCode, response);
			}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost("{userId}")]
		public async Task<IActionResult> CreateOrUpdateUserProfileAdmin(Guid userId, [FromBody] UserProfileDto userProfileDto)
		{
			userProfileDto.UserId = userId;
			var response = await _userProfileService.CreateOrUpdateUserProfileAsync(userProfileDto);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpPost("upload-profile-picture")]
		public async Task<ActionResult<ServiceResponse<UserProfileDto>>> UploadProfilePicture([FromForm] IFormFile file)
		{
			if (file == null || file.Length == 0)
			{
				return BadRequest(new ServiceResponse<UserProfileDto>
				{
					StatusCode = 400,
					Message = "No file uploaded."
				});
			}

			var response = await _userProfileService.UploadProfilePictureAsync(UserId, file);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost("{userId}/upload-profile-picture")]
		public async Task<ActionResult<ServiceResponse<UserProfileDto>>> UploadProfilePictureAdmin([FromForm] IFormFile file, Guid userId)
		{
			if (file == null || file.Length == 0)
			{
				return BadRequest(new ServiceResponse<UserProfileDto>
				{
					StatusCode = 400,
					Message = "No file uploaded."
				});
			}

			var response = await _userProfileService.UploadProfilePictureAsync(userId, file);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpPut("update-password")]
		public async Task<IActionResult> UpdatePassword([FromBody] PasswordUpdateDto request)
		{
			var response = await _userProfileService.UpdatePasswordAsync(request, UserId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPut("{userId}/update-password")]
		public async Task<IActionResult> UpdatePassword([FromBody] PasswordUserUpdateDto request, Guid userId)
		{
			var response = await _userProfileService.UpdateUserPasswordAsync(request, userId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{userId}")]
			public async Task<IActionResult> DeleteUserProfile(Guid userId)
			{
				var response = await _userProfileService.DeleteUserProfileAsync(userId);
				return StatusCode(response.StatusCode, response);
			}
		}
}
