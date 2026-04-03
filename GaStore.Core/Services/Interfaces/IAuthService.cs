using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.AuthDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Users;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IAuthService
	{
		Task<ServiceResponse<string>> Register(UserDto users);
		Task<ServiceResponse<string>> CreateUser(CreateUserDto users);
		Task<ServiceResponse<string>> BlockUnlockUser(Guid AdminId, Guid UserId);
        Task<ServiceResponse<List<Role>>> Login(LoginDto login, string clientId);
		ServiceResponse<List<Role>> LoggedInUser(Guid userId);
		ServiceResponse<UserDto> UserDetails(Guid userId);
		ServiceResponse<string> ResetPassword(OtpRequestDto otp);
		Task<ServiceResponse<string>> GenerateOtp(OtpRequestDto otp);
		ServiceResponse<string> VerifyEmailOrPhone(string contact);
		ServiceResponse<string> VerifyOtp(OtpRequestDto otp);
		ServiceResponse<string> CheckOtp(OtpRequestDto otp);

	}
}
