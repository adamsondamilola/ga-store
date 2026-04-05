using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Referrals;
using GaStore.Data.Entities.Users;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{

	public class UserService : IUserService
	{
		private readonly DatabaseContext _context;
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<UserService> _logger;
		private readonly IMapper _mapper;

		public UserService(DatabaseContext context, IUnitOfWork unitOfWork, ILogger<UserService> logger, IMapper mapper)
		{
			_context = context;
			_unitOfWork = unitOfWork;
			_logger = logger;
			_mapper = mapper;
		}

		public async Task<ServiceResponse<User>> GetByIdAsync(Guid userId)
		{
			var response = new ServiceResponse<User>();
			response.StatusCode = 400;
			response.Data = null;
			try
			{
				var user = await _context.Users
				.Include(u => u.Profile)
				.Include(u => u.Referrals)
				.Include(u => u.BankAccounts)
				.Include(u => u.Roles)
				.FirstOrDefaultAsync(u => u.Id == userId);

				response.StatusCode = 200;
				response.Message = "User details";
				response.Data = user;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving users.");
				response.StatusCode = 500; // Internal Server Error
				response.Message = ErrorMessages.InternalServerError;
			}
			return response;
		}

        public async Task<User?> GetEntityByIdAsync(Guid userId)
        {
            return await _context.Users
                .Include(u => u.Roles)
                .Include(u => u.VendorKyc)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<ServiceResponse<User>> UpdateEntityAsync(User user)
        {
            var response = new ServiceResponse<User>();

            try
            {
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                response.StatusCode = 200;
                response.Message = "User updated successfully.";
                response.Data = user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user entity.");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

		public async Task<ServiceResponse<User>> UpdateAsync(UserDto user)
		{
			var response = new ServiceResponse<User>();
			response.StatusCode = 400;
			try
			{
				var user_ = _mapper.Map<UserDto, User>(user);
				response.StatusCode = 400;
				response.Data = null;
				_context.Users?.Update(user_);
				await _context.SaveChangesAsync();

				response.StatusCode = 200;
				response.Message = "User details updated";
				response.Data = user_;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving users.");
				response.StatusCode = 500; // Internal Server Error
				response.Message = ErrorMessages.InternalServerError;
			};
			return response;
		}

		public async Task<ServiceResponse<User>> MakeAdminAsync(MakeAdminDto newUser)
		{
			var response = new ServiceResponse<User>();
			response.StatusCode = 400;
			try
			{
				var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == newUser.Id);
				if (user == null)
				{
					response.StatusCode = 404;
					response.Message = "User not found.";
                }
				else
				{
                    //prevent removing only super admin remaining
					if (user.IsSuperAdmin && !newUser.IsSuperAdmin)
					{
						var superAdminCount = await _context.Users.CountAsync(u => u.IsSuperAdmin);
						if (superAdminCount <= 1)
						{
							response.StatusCode = 400;
							response.Message = "Cannot remove super admin rights from the only remaining super admin.";
							return response;
						}
                    }

                    user.IsAdmin = newUser.IsAdmin;
					user.IsSuperAdmin = newUser.IsSuperAdmin;
                    user.IsVendor = newUser.IsVendor;
					_context.Users?.Update(user);

                    // Update roles
					var userRoles = await _context.Roles.Where(ur => ur.UserId == user.Id && ur.Name != "User").ToListAsync();
					_context.Roles.RemoveRange(userRoles);
					var rolesToAdd = new List<Role>();
					if (newUser.IsSuperAdmin)
                    {
						rolesToAdd.Add(new Role { UserId = user.Id, Name = "Super Admin", Description = "Super Admin" });
                    }
					if (newUser.IsAdmin)
					{
						rolesToAdd.Add(new Role { UserId = user.Id, Name = "Admin", Description = "Admin" });
                    }
                    if (newUser.IsVendor)
                    {
                        rolesToAdd.Add(new Role { UserId = user.Id, Name = "Vendor", Description = "Marketplace vendor" });
                    }
					_context.Roles.AddRange(rolesToAdd);

                    await _context.SaveChangesAsync();
					response.StatusCode = 200;
					response.Message = "User account type updated successfully.";
                }
            }
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving users.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
            }
			return response;
        }

        public async Task<PaginatedServiceResponse<List<User>>> GetAllUsersAsync(
    int pageNumber,
    int pageSize,
    string? searchEmail = null,
    string? searchName = null)
        {
            var response = new PaginatedServiceResponse<List<User>>();

            try
            {
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10;

                var query = _context.Users
                    .Include(u => u.Roles)
                    .Include(u => u.Profile)
                    .Include(u => u.Referrals)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(searchEmail))
                {
                    string emailPattern = $"%{searchEmail}%";
                    query = query.Where(u =>
                        EF.Functions.Like(u.Email.ToLower(), emailPattern.ToLower()));
                }


                if (!string.IsNullOrEmpty(searchName))
                {
                    string namePattern = $"%{searchName}%";

                    query = query.Where(u =>
                        (u.Email != null && EF.Functions.Like(u.Email.ToLower(), namePattern.ToLower())) ||
                        (u.FirstName != null && EF.Functions.Like(u.FirstName.ToLower(), namePattern.ToLower())) ||
                        (u.LastName != null && EF.Functions.Like(u.LastName.ToLower(), namePattern.ToLower())) ||
                        (u.Profile != null && (
                            (u.Profile.FirstName != null && EF.Functions.Like(u.Profile.FirstName.ToLower(), namePattern.ToLower())) ||
                            (u.Profile.LastName != null && EF.Functions.Like(u.Profile.LastName.ToLower(), namePattern.ToLower()))
                        )));
                }

                // Count filtered records
                response.TotalRecords = await query.CountAsync();

                // Pagination + projection
                var users = await query
                    .OrderByDescending(u => u.DateCreated)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new User
                    {
                        Id = u.Id,
                        Username = u.Username,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        Email = u.Email,
                        IsAdmin = u.IsAdmin,
						IsSuperAdmin = u.IsSuperAdmin,
                        IsVendor = u.IsVendor,
                        KycStatus = u.KycStatus,
                        CanPost = u.CanPost,
                        IsBlocked = u.IsBlocked,
                        Referrer = u.Referrer,
                        Profile = u.Profile != null ? new UserProfile
                        {
                            UserId = u.Id,
                            Email = u.Profile.Email,
                            FirstName = u.Profile.FirstName,
                            LastName = u.Profile.LastName,
                            PhoneNumber = u.Profile.PhoneNumber,
                            State = u.Profile.State,
                            City = u.Profile.City,
                            DateOfBirth = u.Profile.DateOfBirth,
                            Gender = u.Profile.Gender,
                            Address = u.Profile.Address
                        } : null,
                        Referrals = u.Referrals != null ? u.Referrals.Select(r => new Referral
                        {
                            Id = r.Id,
                            ReferrerId = r.ReferrerId,
                            ReferralId = r.ReferralId,
                            TotalCommissionEarned = r.TotalCommissionEarned,
                            DateCreated = r.DateCreated
                        }).ToList() : null
                    })
                    .ToListAsync();

                response.Status = 200;
                response.Message = "Users retrieved successfully.";
                response.Data = users;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users.");
                response.Status = 500;
                response.Message = "An error occurred while retrieving users.";
            }

            return response;
        }

        public async Task<PaginatedServiceResponse<List<UserProfileDto>>> GetAllProfilesAsync(
		int pageNumber,
		int pageSize,
		string? searchEmail = null,
		string? searchName = null)
		{
			var response = new PaginatedServiceResponse<List<UserProfileDto>>();

			try
			{
				// Validate page number and page size
				if (pageNumber < 1) pageNumber = 1;
				if (pageSize < 1) pageSize = 10;

				// Build the base query
				var query = _context.UserProfiles.AsQueryable();

				// Apply search filters
				/*if (!string.IsNullOrEmpty(searchEmail))
				{
					query = query.Where(u => u.Email.Contains(searchEmail, StringComparison.OrdinalIgnoreCase));
				}*/

				if (!string.IsNullOrEmpty(searchName))
				{
					query = query.Where(u =>
						(u != null &&
						 (u.FirstName.Contains(searchName, StringComparison.OrdinalIgnoreCase) ||
						  u.LastName.Contains(searchName, StringComparison.OrdinalIgnoreCase) ||
						  u.Email.Contains(searchName, StringComparison.OrdinalIgnoreCase) ||
						  u.Country.Contains(searchName, StringComparison.OrdinalIgnoreCase) ||
						  u.State.Contains(searchName, StringComparison.OrdinalIgnoreCase) ||
						  u.City.Contains(searchName, StringComparison.OrdinalIgnoreCase) ||
						  u.Gender.Contains(searchName, StringComparison.OrdinalIgnoreCase))));
				}

				// Get total number of records (after applying filters)
				response.TotalRecords = await query.CountAsync();

				// Apply pagination
				var users = await query
					.OrderByDescending(u => u.Id)
					.Skip((pageNumber - 1) * pageSize) 
					.Take(pageSize)
					.ToListAsync();

				// Map users to DTOs
				var userDtos = _mapper.Map<List<UserProfile>, List<UserProfileDto>>(users);

				// Set paginated response
				response.Status = 200; // OK
				response.Message = "Users retrieved successfully.";
				response.Data = userDtos;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving users.");
				response.Status = 500; // Internal Server Error
				response.Message = "An error occurred while retrieving users.";
			}

			return response;
		}

		public async Task<ServiceResponse<string>> DeleteAsync(Guid UserId)
		{
			var response = new ServiceResponse<string>();
			try
			{
				var user = _context.Users.FirstOrDefault(u => u.Id == UserId);
				if (user == null)
				{
					response.StatusCode = 404; // not found
					response.Message = "User not found.";
					response.Data = null;
				}
				else
				{
					_context.Users?.Remove(user);
					await _context.SaveChangesAsync();
					response.StatusCode = 200; // OK
					response.Message = "Users delete successfully.";
					response.Data = null;
				}
			}
			catch (Exception ex)
			{

				_logger.LogError(ex, "Error deleting user.");
				response.StatusCode = 500; // Internal Server Error
				response.Message = "An error occurred while deleting user.";
			}

			return response;
		}
	}
}
