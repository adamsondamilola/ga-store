using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IUserProfileService
	{
		Task<ServiceResponse<UserProfileDto>> GetUserProfileAsync(Guid userId);
		Task<ServiceResponse<UserProfileDto>> CreateOrUpdateUserProfileAsync(UserProfileDto userProfileDto);
		Task<ServiceResponse<UserProfileDto>> UploadProfilePictureAsync(Guid userId, IFormFile file);
		Task<ServiceResponse<string>> UpdatePasswordAsync(PasswordUpdateDto password, Guid UserId);
		Task<ServiceResponse<string>> UpdateUserPasswordAsync(PasswordUserUpdateDto password, Guid UserId);

        Task<ServiceResponse<bool>> DeleteUserProfileAsync(Guid userId);
	}
}
