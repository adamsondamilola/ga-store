using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Implementations;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Users;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class UserController : RootController
	{
		private readonly IUserService _userService;

		public UserController(IUserService userService)
		{
			_userService = userService;
		}

		[HttpGet()]
		public async Task<IActionResult> GetAllUsersPaginated(
	[FromQuery] int pageNumber = 1,
	[FromQuery] int pageSize = 10,
	[FromQuery] string? searchEmail = null,
	[FromQuery] string? searchName = null)
		{
			var response = await _userService.GetAllUsersAsync(pageNumber, pageSize, searchEmail, searchName);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpGet("profiles")]
		public async Task<IActionResult> GetAllProfilesPaginated(
[FromQuery] int pageNumber = 1,
[FromQuery] int pageSize = 10,
[FromQuery] string? searchEmail = null,
[FromQuery] string? searchName = null)
		{
			var response = await _userService.GetAllProfilesAsync(pageNumber, pageSize, searchEmail, searchName);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPut("")]
		public async Task<IActionResult> UpdateUser(UserDto user)
		{
			var response = await _userService.UpdateAsync(user);
			return StatusCode(response.StatusCode, response);
		}

        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpPut("make-admin")]
        public async Task<IActionResult> MakeAdmin(MakeAdminDto makeAdmin)
        {
            var response = await _userService.MakeAdminAsync(makeAdmin);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.User)]
		[HttpGet("{userId}")]
		public async Task<IActionResult> GetById(Guid userId)
		{
			var response = await _userService.GetByIdAsync(userId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{userId}")]
		public async Task<IActionResult> DeleteUserProfile(Guid userId)
		{
			var response = await _userService.DeleteAsync(userId);
			return StatusCode(response.StatusCode, response);
		}
	}
}
