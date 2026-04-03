using AutoMapper;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Utilities;
using GaStore.Data.Dtos.AuthDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Users;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations
{
    public class AuthGoogleService : IAuthGoogleService
    {
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<AuthGoogleService> _logger;
        private readonly IAuthService _authService;
        private readonly AppSettings _appSettings;

        public AuthGoogleService(IMapper mapper, IUnitOfWork unitOfWork, ILogger<AuthGoogleService> logger, IAuthService authService, IOptions<AppSettings> appSettings)
        {
            _mapper = mapper;
            _unitOfWork = unitOfWork;
            _logger = logger;
            _authService = authService;
            _appSettings = appSettings.Value;
        }

        public async Task<ServiceResponse<string>> AuthenticateGoogleUserAsync(GoogleUserDto googleUser)
        {
            var response = new ServiceResponse<string> { StatusCode = 400 };

            try
            {
                var email = googleUser.Email;
                var user = await _unitOfWork.UserRepository.Get(x => x.Email == email);

                if (user == null)
                {
                    // Create new user
                    var newUser = new User
                    {
                        Id = Guid.NewGuid(),
                        FirstName = googleUser.FirstName,
                        LastName = googleUser.LastName,
                        Email = googleUser.Email,
                        Password = Encryption.Encrypt(Guid.NewGuid().ToString()), // Dummy password
                        IsEmailVerified = true,
                        IsActive = true
                    };

                    //await _unitOfWork.UserRepository.Add(newUser);
                    var mapUser = _mapper.Map<UserDto>(newUser);
                    mapUser.PasswordConfirmation = newUser.Password;
                    var regUser = await _authService.Register(mapUser);

                    var role = new Role
                    {
                        Id = Guid.NewGuid(),
                        UserId = newUser.Id,
                        Name = "Google User",
                        Description = "Google user"
                    };

                    await _unitOfWork.RoleRepository.Add(role);
                    await _unitOfWork.CompletedAsync(newUser.Id);

                    // Optionally create wallet
                }

                user ??= await _unitOfWork.UserRepository.Get(x => x.Email == email);

                if (user.IsBlocked)
                {
                    response.StatusCode = 403;
                    response.Message = "Account is blocked.";
                    return response;
                }

                // Get roles
                var roles = await _unitOfWork.RoleRepository.GetAll(r => r.UserId == user.Id);

                // Create JWT
                var jwt = new JwtSettingsDto()
                {
                    Key = _appSettings.Jwt.Key,
                    Audience = _appSettings.Jwt.Audience,
                    Issuer = _appSettings.Jwt.Issuer
                };
                var token = JwtTokenHelper.GenerateToken(user, roles.ToList(), jwt);

                response.StatusCode = 200;
                response.Data = token;
                response.Message = "Successful";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google authentication failed.");
                response.StatusCode = 500;
                response.Message = "Internal server error";
            }

            return response;
        }

    }
}
