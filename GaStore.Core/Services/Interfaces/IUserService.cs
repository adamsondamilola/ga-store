using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Users;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IUserService
	{
		Task<ServiceResponse<User>> GetByIdAsync(Guid userId);
		Task<PaginatedServiceResponse<List<User>>> GetAllUsersAsync(
	int pageNumber,
	int pageSize,
	string? searchEmail = null,
	string? searchName = null);
		Task<PaginatedServiceResponse<List<UserProfileDto>>> GetAllProfilesAsync(
	int pageNumber,
	int pageSize,
	string? searchEmail = null,
	string? searchName = null);
		Task<ServiceResponse<User>> UpdateAsync(UserDto user);
		Task<ServiceResponse<User>> MakeAdminAsync(MakeAdminDto newUser);

        Task<ServiceResponse<string>> DeleteAsync(Guid UserId);
	}
}
