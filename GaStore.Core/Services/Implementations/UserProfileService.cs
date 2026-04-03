using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Utilities;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Users;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class UserProfileService : IUserProfileService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IHostEnvironment _environment;
        private readonly IImageUploadService _imageUploadService;
        private readonly ILogger<UserProfileService> _logger;
		private readonly IMapper _mapper;
		private readonly AppSettings _appSettings;

		public UserProfileService(
			IUnitOfWork unitOfWork,
			IHostEnvironment environment,
            IImageUploadService imageUploadService,
            ILogger<UserProfileService> logger,
			IMapper mapper,
			IOptions<AppSettings> appSettings)
		{
			_unitOfWork = unitOfWork;
			_environment = environment;
            _imageUploadService = imageUploadService;
            _logger = logger;
			_mapper = mapper;
			_appSettings = appSettings.Value;
		}

		// Get user profile by user ID
		public async Task<ServiceResponse<UserProfileDto>> GetUserProfileAsync(Guid userId)
		{
			var response = new ServiceResponse<UserProfileDto>();

			try
			{

				if (_unitOfWork == null || _unitOfWork.UserProfileRepository == null)
				{
					response.StatusCode = 500;
					response.Message = "Service configuration error: UnitOfWork not initialized";
					return response;
				}

				if (_mapper == null)
				{
					response.StatusCode = 500;
					response.Message = "Service configuration error: Mapper not initialized";
					return response;
				}

				if (userId == Guid.Empty)
				{
					response.StatusCode = 400;
					response.Message = "Invalid user ID";
					return response;
				}

                var user = await _unitOfWork.UserRepository
					.GetById(userId)
					.ConfigureAwait(false);

                if (user == null)
				{
					response.StatusCode = 404;
					response.Message = $"User account not found";
					return response;
				}


                var userProfile = await _unitOfWork.UserProfileRepository
                    .Get(x => x.UserId == userId)
                    .ConfigureAwait(false);

                if (userProfile == null)
                {
					//create profile
					userProfile = new UserProfile
					{
						FirstName = user.FirstName,
						LastName = user.LastName,
						Email = user.Email,
                        UserId = userId,
                    };
					await _unitOfWork.UserProfileRepository.Add(userProfile);
					await _unitOfWork.CompletedAsync(userId);                    
                }

                response.Data = _mapper.Map<UserProfileDto>(userProfile);
				response.StatusCode = 200;
				response.Message = "User profile retrieved successfully";
			}
			catch (Exception ex)
			{
				_logger?.LogError(ex, "Error retrieving profile for user {UserId}", userId);
				response.StatusCode = 500;
				response.Message = $"An error occurred: {ex.Message}";
			}

			return response;
		}

		// Create or update user profile
		public async Task<ServiceResponse<UserProfileDto>> CreateOrUpdateUserProfileAsync(UserProfileDto userProfileDto)
		{
			var response = new ServiceResponse<UserProfileDto>();

			try
			{
				var existingProfile = await _unitOfWork.UserProfileRepository.Get(x => x.UserId == userProfileDto.UserId);

				if (existingProfile == null)
				{
					// Create new profile
					var newProfile = _mapper.Map<UserProfileDto, UserProfile>(userProfileDto);
					await _unitOfWork.UserProfileRepository.Add(newProfile);
					await _unitOfWork.CompletedAsync(userProfileDto.UserId);
					response.StatusCode = 201; // Created
					response.Message = "User profile created successfully.";
				}
				else
				{
					// Update existing profile
					_mapper.Map(userProfileDto, existingProfile);
					await _unitOfWork.UserProfileRepository.Upsert(existingProfile);
					await _unitOfWork.CompletedAsync(userProfileDto.UserId);
					response.StatusCode = 200; // OK
					response.Message = "User profile updated successfully.";
				}
                
				response.Data = userProfileDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating or updating user profile.");
				response.StatusCode = 500; // Internal Server Error
				response.Message = "An error occurred while creating or updating the user profile.";
			}

			return response;
		}

        public async Task<ServiceResponse<string>> UpdatePasswordAsync(PasswordUpdateDto password, Guid UserId)
        {
            ServiceResponse<string> res = new();
            res.StatusCode = 400;
            string p0 = password.CurrentPassword ?? "";
            string p1 = password.NewPassword ?? "";
            string p2 = password.ConfirmPassword ?? "";
            string ckPassword0 = CheckInput.Password(p0);
            string ckPassword1 = CheckInput.Password(p1);
            string ckPassword2 = CheckInput.Password(p2);
            if (ckPassword0 != null) res.Message = ckPassword0;
            else if (ckPassword1 != null) res.Message = ckPassword1;
            else if (ckPassword2 != null) res.Message = ckPassword2;
            else if (p1 != p2) res.Message = "Passwords do not match";
            else if (p0 == p2) res.Message = "New Password cannot be the same with current password";

            else
            {
                try
                {
                    //get password
                    var user = _unitOfWork.UserRepository.Get(x => x.Id == UserId).Result;
                    var dt = user;
                    if (dt != null)
                    {
                        bool verifyPassword = Encryption.DecryptPassword(p0, dt.Password);
                        if (verifyPassword && dt.IsActive)
                        {
                            //update password
                            user.Password = Encryption.Encrypt(p1);
                            user.DateUpdated = DateTime.Now;
                            await _unitOfWork.UserRepository.Upsert(user);
                            await _unitOfWork.CompletedAsync(dt.Id);

                            res.StatusCode = 200;
                            res.Message = "Password Updated";
                        }
                        else if (verifyPassword && !dt.IsActive)
                        {
                            res.Message = "Account is not active";
                        }
                        else
                        {
                            res.Message = "Current password is wrong";
                        }
                    }
                    else
                    {
                        res.Message = "1 or more wrong password details";
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex);
                    res.Message = ErrorMessages.InternalServerError;
                }
            }

            return res;
        }

        public async Task<ServiceResponse<string>> UpdateUserPasswordAsync(PasswordUserUpdateDto password, Guid UserId)
        {
            ServiceResponse<string> res = new();
            res.StatusCode = 400;
            string p1 = password.NewPassword ?? "";
            string p2 = password.ConfirmPassword ?? "";
            string ckPassword1 = CheckInput.Password(p1);
            string ckPassword2 = CheckInput.Password(p2);
            if (ckPassword1 != null) res.Message = ckPassword1;
            else if (ckPassword2 != null) res.Message = ckPassword2;
            else if (p1 != p2) res.Message = "Passwords do not match";

            else
            {
                try
                {
                    //get password
                    var user = _unitOfWork.UserRepository.Get(x => x.Id == UserId).Result;
                    var dt = user;
                    if (dt != null)
                    {
                        if (dt.IsActive)
                        {
                            //update password
                            user.Password = Encryption.Encrypt(p1);
                            user.DateUpdated = DateTime.Now;
                            await _unitOfWork.UserRepository.Upsert(user);
                            await _unitOfWork.CompletedAsync(dt.Id);

                            res.StatusCode = 200;
                            res.Message = "Password Updated";
                        }
                        else
                        {
                            res.Message = "Account is not active";
                        }
                    }
                    else
                    {
                        res.Message = "1 or more wrong password details";
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex);
                    res.Message = ErrorMessages.InternalServerError;
                }
            }

            return res;
        }

        public async Task<ServiceResponse<UserProfileDto>> UploadProfilePictureAsync(Guid userId, IFormFile file)
        {
            var response = new ServiceResponse<UserProfileDto>();

            try
            {
                // Validate the file
                if (file == null || file.Length == 0)
                {
                    response.StatusCode = 400;
                    response.Message = "No file uploaded.";
                    return response;
                }

                // Use image upload service for validation
                var isValidImage = await _imageUploadService.ValidateImageFileAsync(file);
                if (!isValidImage)
                {
                    response.StatusCode = 400;
                    response.Message = "Invalid image file. Please upload a valid JPG, JPEG, PNG, GIF, WebP, or BMP image.";
                    return response;
                }

                // Get existing user profile
                var userProfile = await _unitOfWork.UserProfileRepository.Get(up => up.UserId == userId);
                if (userProfile == null)
                {
                    response.StatusCode = 404;
                    response.Message = "User profile not found.";
                    return response;
                }

                // Delete old profile picture if exists
                if (!string.IsNullOrEmpty(userProfile.ProfilePictureUrl))
                {
                    try
                    {
                        await _imageUploadService.DeleteImageAsync(userProfile.ProfilePictureUrl);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete old profile picture for user {UserId}", userId);
                        // Continue with upload even if deletion fails
                    }
                }

                // Upload and optimize the image using the service
                var uploadResult = await _imageUploadService.UploadAndOptimizeImageAsync(
                    file,
                    Path.Combine("profile-pictures", userId.ToString()));

                if (!uploadResult.IsSuccess)
                {
                    response.StatusCode = 400;
                    response.Message = uploadResult.ErrorMessage ?? "Failed to upload profile picture.";
                    return response;
                }


                _logger.LogInformation(
                    "Profile picture uploaded for user {UserId}. Original: {OriginalSize} bytes, Optimized: {OptimizedSize} bytes, Dimensions: {Width}x{Height}, Format: {Format}",
                    userId,
                    uploadResult.OriginalSize,
                    uploadResult.OptimizedSize,
                    uploadResult.Width,
                    uploadResult.Height,
                    uploadResult.Format);

                // Update the user profile with the new profile picture URL
                userProfile.ProfilePictureUrl = uploadResult.ImageUrl;

                // Optionally store additional metadata
                userProfile.DateUpdated = DateTime.UtcNow;


                // Save changes to the database
                await _unitOfWork.UserProfileRepository.Upsert(userProfile);
                await _unitOfWork.CompletedAsync(userId);

                // Map to DTO
                var userProfileDto = new UserProfileDto
                {
                    UserId = userProfile.UserId,
                    FirstName = userProfile.FirstName,
                    LastName = userProfile.LastName,
                    MiddleName = userProfile.MiddleName,
                    Email = userProfile.Email,
                    PhoneNumber = userProfile.PhoneNumber,
                    Address = userProfile.Address,
                    City = userProfile.City,
                    State = userProfile.State,
                    Country = userProfile.Country,
                    DateOfBirth = userProfile.DateOfBirth,
                    Gender = userProfile.Gender,
                    ProfilePictureUrl = userProfile.ProfilePictureUrl
                };

                // Return success response with optimization info
                response.StatusCode = 200;
                response.Message = "Profile picture uploaded and optimized successfully.";
                response.Data = userProfileDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading profile picture for user {UserId}", userId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        // Delete user profile by user ID
        public async Task<ServiceResponse<bool>> DeleteUserProfileAsync(Guid userId)
		{
			var response = new ServiceResponse<bool>();

			try
			{
				var userProfile = await _unitOfWork.UserProfileRepository.Get(x => x.UserId == userId);
				if (userProfile == null)
				{
					response.StatusCode = 404; // Not Found
					response.Message = "User profile not found.";
					return response;
				}

				await _unitOfWork.UserProfileRepository.Remove(userProfile.Id);
				await _unitOfWork.CompletedAsync(userId);
				response.StatusCode = 200; // OK
				response.Data = true;
				response.Message = "User profile deleted successfully.";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting user profile.");
				response.StatusCode = 500; // Internal Server Error
				response.Message = "An error occurred while deleting the user profile.";
			}

			return response;
		}
	}
}
