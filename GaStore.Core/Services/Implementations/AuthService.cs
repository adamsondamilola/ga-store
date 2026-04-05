using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Utilities;
using GaStore.Data.Dtos;
using GaStore.Data.Dtos.AuthDto;
using GaStore.Data.Dtos.MessagingDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Data.Entities.Referrals;
using GaStore.Data.Entities.Users;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class AuthService : IAuthService
	{
		private readonly IMapper _mapper;
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<AuthService> _logger;
		private readonly IEmailService _emailService;
		private readonly ISmsService _smsService;
		private readonly AppSettings _appSettings;
		private readonly IWalletService _walletService;

		public AuthService(IMapper mapper, IUnitOfWork unitOfWork, ILogger<AuthService> logger, IEmailService emailService, ISmsService smsService, IOptions<AppSettings> appSettings, IWalletService walletService)
		{
			_mapper = mapper;
			_unitOfWork = unitOfWork;
			_logger = logger;
			_emailService = emailService;
			_smsService = smsService;
			_appSettings = appSettings.Value;
			_walletService = walletService;
		}

		// Register a new user
		public async Task<ServiceResponse<string>> Register(UserDto users)
		{
			ServiceResponse<string> res = new();
			res.StatusCode = 400;
			Guid Id = Guid.NewGuid();
			string Username = Truncate.String(Id.ToString().ToUpper().Replace("-", ""), 10);
			try
			{
				// Validate inputs
				string ckPassword = CheckInput.Password(users.Password);
				string ckEmail = CheckInput.Email(users.Email);

				if (users.Password != users.PasswordConfirmation)
					res.Message = "Passwords do not match";
				else if (ckEmail != null)
					res.Message = ckEmail;
				else if (ckPassword != null)
					res.Message = ckPassword;
				else
				{
					if (!string.IsNullOrEmpty(users.Referrer))
					{
						var getRef = await _unitOfWork.UserRepository.Get(x => x.Username == users.Referrer);
						if (getRef != null)
						{
						var reff = new Referral()
						{
							TotalCommissionEarned = 0,
							ReferralId = Id,
							ReferrerId = getRef.Id,
                        };
							await _unitOfWork.ReferralRepository.Add(reff);
                        }
						else
						{
                            res.Message = "Referrer not found.";
							return res;
                        }
                    }
                    // Encrypt password
                    users.Password = Encryption.Encrypt(users.Password);
					users.Id = Id;
					users.Username = Username;

					// Map DTO to entity
					var model = _mapper.Map<UserDto, User>(users);
					model.IsActive = true;

					var query = _unitOfWork.UserRepository;

					// Check if user already exists
					var existingUser = await query.Get(x => x.Email == users.Email);
                    if (existingUser == null)
                    {
                        // Add user to database
                        await _unitOfWork.UserRepository.Add(model);

                        // Create a default role for the user
                        var roleDtos = new List<RoleDto>
                        {
                            new()
                            {
                                UserId = model.Id,
                                Name = "User",
                                Description = "Default role for new users",
                                UsersDto = new List<UserDto> { users }
                            }
                        };

                        if (users.IsVendor)
                        {
                            model.IsVendor = true;
                            roleDtos.Add(new RoleDto
                            {
                                UserId = model.Id,
                                Name = "Vendor",
                                Description = "Marketplace vendor",
                                UsersDto = new List<UserDto> { users }
                            });
                        }

                        foreach (var roleDto in roleDtos)
                        {
                            var roleModel = _mapper.Map<RoleDto, Role>(roleDto);
                            await _unitOfWork.RoleRepository.Add(roleModel);
                        }
                        await _unitOfWork.CompletedAsync(model.Id);

						//add wallet
						WalletDto walletDto = new()
						{
							Balance = 0,
							Commission = 0,
							PendingWithdrawal = 0,
							Withdrawn = 0,
							UserId = model.Id
						};
						await _walletService.CreateWalletAsync(walletDto, model.Id);

						res.StatusCode = 200;
						res.Message = "Account created!";
					}
					else
					{
						res.Message = "Email already registered.";
					}
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error during user registration.");
				res.StatusCode = 500;
				res.Message = ErrorMessages.InternalServerError;
			}

			return res;
		}

        public async Task<ServiceResponse<string>> CreateUser(CreateUserDto users)
        {
            ServiceResponse<string> res = new();
            res.StatusCode = 400;
            Guid Id = Guid.NewGuid();
            string Username = Truncate.String(Id.ToString().ToUpper().Replace("-", ""), 10);
            try
            {
                // Validate inputs
                string ckEmail = CheckInput.Email(users.Email);

                if (ckEmail != null)
                    res.Message = ckEmail;
                else
                {
                   /* if (!users.Referrer.IsNullOrEmpty())
                    {
                        var getRef = await _unitOfWork.UserRepository.Get(x => x.Username == users.Referrer);
                        if (getRef != null)
                        {
                            var reff = new Referral()
                            {
                                TotalCommissionEarned = 0,
                                ReferralId = Id,
                                ReferrerId = getRef.Id,
                            };
                            await _unitOfWork.ReferralRepository.Add(reff);
                        }
                        else
                        {
                            res.Message = "Referrer not found.";
                            return res;
                        }
                    }*/
                    // Encrypt password
                    users.Id = Id;
                    users.Username = Username;

                    // Map DTO to entity
                    var model = _mapper.Map<CreateUserDto, User>(users);
                    model.IsActive = true;

                    var query = _unitOfWork.UserRepository;

                    // Check if user already exists
                    var existingUser = await query.Get(x => x.Email == users.Email);
                    if (existingUser == null)
                    {
                        if (users.IsAdmin)
						{
							model.IsAdmin = true;
						}
                        if (users.IsVendor)
                        {
                            model.IsVendor = true;
                        }
                            // Add user to database
                            string pass = Randoms.Strings(10);
                        model.Password = Encryption.Encrypt(pass); 
                        await _unitOfWork.UserRepository.Add(model);

                        // Create a default role for the user
						List<RoleDto> roleDtos = new List<RoleDto>();
                        RoleDto roleDtoUser = new()
                        {
                            UserId = model.Id,
                            Name = "User", // Default role name
                            Description = "Default role for new users",
                            UsersDto = new List<UserDto> { _mapper.Map<CreateUserDto, UserDto>(users) } // Add the current user to the role
                        };
                        if (users.IsAdmin)
                        {
                            RoleDto roleDtoAdmin = new()
                            {
                                UserId = model.Id,
                                Name = "Admin", // Default role name
                                Description = "Default role for admin",
                                UsersDto = new List<UserDto> { _mapper.Map<CreateUserDto, UserDto>(users) } // Add the current user to the role
                            };
                            roleDtos.Add(roleDtoAdmin);
                        }

                        if (users.IsSuperAdmin)
                        {
                            RoleDto roleDtoAdmin = new()
                            {
                                UserId = model.Id,
                                Name = "Super Admin", // Default role name
                                Description = "Default role for super admin",
                                UsersDto = new List<UserDto> { _mapper.Map<CreateUserDto, UserDto>(users) } // Add the current user to the role
                            };
                            roleDtos.Add(roleDtoAdmin);
                        }
                        if (users.IsVendor)
                        {
                            RoleDto roleDtoVendor = new()
                            {
                                UserId = model.Id,
                                Name = "Vendor",
                                Description = "Marketplace vendor",
                                UsersDto = new List<UserDto> { _mapper.Map<CreateUserDto, UserDto>(users) }
                            };
                            roleDtos.Add(roleDtoVendor);
                        }
                        roleDtos.Add(roleDtoUser);

						// Map RoleDto to Role entity
						foreach (var roleDto in roleDtos)
						{
                            var roleModel = _mapper.Map<RoleDto, Role>(roleDto);
                            // Add the role to the database
                            await _unitOfWork.RoleRepository.Add(roleModel);
                        }
                        await _unitOfWork.CompletedAsync(model.Id);

                        //add wallet
                        WalletDto walletDto = new()
                        {
                            Balance = 0,
                            Commission = 0,
                            PendingWithdrawal = 0,
                            Withdrawn = 0,
                            UserId = model.Id
                        };
                        await _walletService.CreateWalletAsync(walletDto, model.Id);

                        res.StatusCode = 200;
                        res.Message = "Account created!";

                        //send user login details
                        MessageDto sendMail = new MessageDto()
						{
							Recipient = model.Email,
							RecipientName = model.FirstName,
							Subject = "Account Creation",
							Content = $"New account created. Login details can be found below.<br/><br/> Email: {model.Email} <br/> Password: {pass} <br/><br/>Kindly reset or update password after logging in. <br/><br/>Regards"
						};
						await _emailService.SendMailAsync(sendMail);
                    }
                    else
                    {
                        res.Message = "Email already registered.";
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user registration.");
                res.StatusCode = 500;
                res.Message = ErrorMessages.InternalServerError;
            }

            return res;
        }

		public async Task<ServiceResponse<string>> BlockUnlockUser(Guid AdminId, Guid UserId)
		{
            ServiceResponse<string> res = new();
            res.StatusCode = 400;
            res.Message = "Action failed";
            try
            {
                var user = await _unitOfWork.UserRepository.GetById(UserId);
                if (user == null)
                {
                    res.Message = "User not found.";
                }
                else if (user.Id == AdminId)
                {
                    res.Message = "You cannot block yourself.";
                    res.Data = res.Message;
                    return res;
                }
                else if (user.IsBlocked)
                {
                    user.IsBlocked = false;
                    res.StatusCode = 200;
                    res.Message = "User successfully unblocked.";
                    await _unitOfWork.UserRepository.Upsert(user);
                    await _unitOfWork.CompletedAsync(AdminId);
                }
                else if (!user.IsBlocked)
                {
                    user.IsBlocked = true;
					res.StatusCode = 200;
                    res.Message = "User successfully blocked.";
                    await _unitOfWork.UserRepository.Upsert(user);
                    await _unitOfWork.CompletedAsync(AdminId);
                }
            }
			catch (Exception ex)
			{
                _logger.LogError(ex, "Error user blocking or unblocking.");
                res.StatusCode = 500;
                res.Message = ErrorMessages.InternalServerError;
            }
            res.Data = res.Message;
            return res;
        }

        // Login an existing user
        public async Task<ServiceResponse<List<Role>>> Login(LoginDto login, string clientId)
		{
			ServiceResponse<List<Role>> res = new();
			res.StatusCode = 400;;
			var roles = new List<Role>();
			res.Data = roles;

			try
			{
				// Validate inputs
				string emailOrPhone = "Phone";
				string ckEmail = CheckInput.Email(login.Email);
				//string ckPassword = CheckInput.Password(login.Password);

				if (!long.TryParse(login.Email, out long n)) emailOrPhone = "Email";

                if (login == null) res.Message = "No field should be left empty";
                else if (string.IsNullOrEmpty(login.Password)) res.Message = "Enter password";
                else if (emailOrPhone == "Email" && ckEmail != null) res.Message = ckEmail;
				//else if (ckPassword != null) res.Message = ckPassword;
				else
				{
					// Find user by email or phone
					var user = _unitOfWork.UserRepository.Get(x => x.Email == login.Email).Result;
					if (user != null)
					{
                        if (user.IsBlocked)
                        {
                            res.StatusCode = 403;
                            res.Message = "Account is blocked.";
                            return res;
                        }
                        // Verify password
                        bool verifyPassword = Encryption.DecryptPassword(login.Password, user.Password);
						if (verifyPassword && user.IsActive)
						{
							//get roles
							List<Role> Roles =  _unitOfWork.RoleRepository.GetAll(x => x.UserId == user.Id).Result;
							//List<Role> Roles = role.;
							// Generate JWT token
							var tokenHandler = new JwtSecurityTokenHandler();
							var tokenKey = Encoding.UTF8.GetBytes(_appSettings.Jwt.Key);
							UserClaimsDto userClaims = new()
							{
								UserId = user.Id,
								Email = user.Email,
								ClientIp = clientId,
								Roles = Roles,
								LastLoginDate = DateTime.UtcNow
							};

							var claims = await CreateClaims(userClaims);
							var tokenDescriptor = new SecurityTokenDescriptor
							{
								Subject = new ClaimsIdentity(claims),
								Issuer = _appSettings.Jwt.Issuer,
								Audience = _appSettings.Jwt.Audience,
								Expires = DateTime.UtcNow.AddDays(10),
								SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(tokenKey), SecurityAlgorithms.HmacSha256Signature)
							};
							var token = tokenHandler.CreateToken(tokenDescriptor);

							res.StatusCode = 200;
							res.Message = tokenHandler.WriteToken(token);
							res.Data = userClaims.Roles;
						}
						else if (verifyPassword && !user.IsActive)
						{
							res.Message = "Account is not active";
						}
						else
						{
							res.Message = "Wrong login details";
						}
					}
					else
					{
						res.Message = "Wrong login details";
					}
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error during user login.");
				res.StatusCode = 500;
				res.Message = ErrorMessages.InternalServerError;
			}

			return res;
		}

		public async Task<ClaimsIdentity> CreateClaims(UserClaimsDto claimsDto)
		{
			if (claimsDto == null)
			{
				throw new ArgumentNullException(nameof(claimsDto), "User claims DTO cannot be null.");
			}

			// Initialize a list to hold role claims
			var roleClaims = new List<Claim>();

			// Fetch roles associated with the user
			var userRoles = await _unitOfWork.RoleRepository.GetAll(x => x.UserId == claimsDto.UserId);
			//var userRoles = await _unitOfWork.RoleRepository.GetAll(x => x.Users.Any(u => u.Id == claimsDto.UserId));
			if (userRoles != null && userRoles.Any())
			{
				foreach (var role in userRoles)
				{
					roleClaims.Add(new Claim(ClaimTypes.Role, role.Name));
				}
			}

			// Create the base claims identity
			ClaimsIdentity claimsIdentity = new ClaimsIdentity(new[]
			{
		new Claim("UserId", claimsDto.UserId.ToString()),
		new Claim("Email", claimsDto.Email),
		new Claim("SessionActivated", claimsDto.LastLoginDate?.ToString() ?? DateTime.UtcNow.ToString()),
		new Claim("ClientIp", claimsDto.ClientIp?.ToString() ?? string.Empty),
	});

			// Add role claims to the identity
			claimsIdentity.AddClaims(roleClaims);

			return claimsIdentity;
		}

		// Reset user password
		public ServiceResponse<string> ResetPassword(OtpRequestDto otp)
		{
			ServiceResponse<string> res = new();
			res.StatusCode = 400;;

			try
			{
				string ckPassword = CheckInput.Password(otp.Password1);
				ServiceResponse<string> verify = VerifyOtp(otp);

				if (verify.StatusCode == 200)
				{
					var user = _unitOfWork.UserRepository.Get(x => x.Email == otp.Email).Result;

					if (ckPassword != null) res.Message = ckPassword;
					else if (otp.Password1 != otp.Password2) res.Message = "Passwords do not match";
					else if (user != null)
					{
						// Save new password
						user.Password = Encryption.Encrypt(otp.Password1);
						_unitOfWork.CompletedAsync(user.Id).Wait();

						res.StatusCode = 200;
						res.Message = "Password reset successful";
					}
					else
					{
						res.Message = "Operation failed";
					}
				}
				else
				{
					res.Message = "Unable to verify OTP";
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error during password reset.");
				res.StatusCode = 500;
				res.Message = ErrorMessages.InternalServerError;
			}

			return res;
		}

		// Generate OTP
		public async Task<ServiceResponse<string>> GenerateOtp(OtpRequestDto otp)
		{
			ServiceResponse<string> res = new();
			res.StatusCode = 400;

			try
			{
				string genOtp = Randoms.Numbers(6);
				otp.Otp = genOtp;

				Otp ot = new Otp()
				{
					Phone = otp.Phone,
					Email = otp.Email,
					Status = 0,
					Description = otp.Description,
					Code = otp.Otp,
					Expires = DateTime.UtcNow.AddMinutes(15)
				};

				await _unitOfWork.OtpRepository.Add(ot);
				_unitOfWork.CompletedAsync(Guid.NewGuid()).Wait();

				string subject = "Your OTP";
				string message = $"Your one-time password is {genOtp}. Kindly note that this OTP will be invalid after 15 minutes.";

				if (otp.PreferredMethod == "email")
				{
                    MessageDto mail = new MessageDto()
					{
						Attachment = null,
						Content = message,
						Subject = subject,
						Recipient = otp.Email
					};
                    //ServiceResponse<string> mailResponse = await _emailService.SendMailAsync(mail);
                    ServiceResponse<string> mailResponse = await _emailService.SendAccountVerificationEmailAsync(mail.Recipient, "Customer", genOtp, 15);
                    if (mailResponse.StatusCode == 400) res.Message = mailResponse.Message;
					else
					{
						res.StatusCode = 200;
						res.Message = mailResponse.Message;
					}
				}
				else if (otp.PreferredMethod == "sms")
				{
					SmsOtpRequestDto otpR = new SmsOtpRequestDto()
					{
						Otp = genOtp,
						Recipient = otp.Phone
					};
					ServiceResponse<string> smsResponse = await _smsService.SendOtp(otpR);
					if (smsResponse.StatusCode == 400) res.Message = smsResponse.Message;
					else
					{
						res.StatusCode = 200;
						res.Message = smsResponse.Message;
					}
				}
				else
				{
					res.Message = "OTP failed";
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error during OTP generation.");
				res.StatusCode = 500;
				res.Message = ErrorMessages.InternalServerError;
			}

			return res;
		}

		// Verify OTP
		public ServiceResponse<string> VerifyOtp(OtpRequestDto otp)
		{
			ServiceResponse<string> res = new();
			res.StatusCode = 400;

			try
			{
				Otp? ot = otp.PreferredMethod == "email"
					? _unitOfWork.OtpRepository.Get(x => x.Expires >= DateTime.UtcNow && (x.Status == 0 || x.Status == 1) && x.Email == otp.Email && x.Code == otp.Otp).Result
					: _unitOfWork.OtpRepository.Get(x => x.Expires >= DateTime.UtcNow && (x.Status == 0 || x.Status == 1) && x.Phone == otp.Phone && x.Code == otp.Otp).Result;

				if (ot != null)
				{
					ot.Status = 1;
					_unitOfWork.CompletedAsync(Guid.NewGuid()).Wait();
					res.StatusCode = 200;
					res.Message = "Successful";
				}
				else
				{
					res.Message = "Invalid code";
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error during OTP verification.");
				res.StatusCode = 500;
				res.Message = ErrorMessages.InternalServerError;
			}

			return res;
		}

		public ServiceResponse<string> VerifyEmailOrPhone(string contact)
		{
			ServiceResponse<string> res = new();
			res.StatusCode = 400;

			try
			{
				var user = _unitOfWork.UserRepository.Get(x => x.Email == contact).Result;
				if (user == null)
				{
					res.Message = "Account not found.";
				}
				else
				{
					res.StatusCode = 200;
					res.Message = "Verification successful";
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				_logger.LogError(message: ex.Message, ex);
				res.StatusCode = 500;
				res.Message = ErrorMessages.InternalServerError;
			}
			return res;
		}

		// Get logged-in user details
		public ServiceResponse<List<Role>> LoggedInUser(Guid userId)
		{
			ServiceResponse<List<Role>> res = new();
			res.StatusCode = 400;

			try
			{
				var user = _unitOfWork.UserRepository.Get(x => x.Id == userId && !x.IsBlocked && x.IsActive).Result;
				if (user != null)
				{
					//get roles
					List<Role> Roles = _unitOfWork.RoleRepository.GetAll(x => x.UserId == user.Id).Result;
					//var userDto = _mapper.Map<User, UserDto>(user);
					res.Data = Roles;
					res.StatusCode = 200;
					res.Message = "Authorized";
				}
				else
				{
					res.Message = "Unauthorized";
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error fetching logged-in user details.");
				res.StatusCode = 500;
				res.Message = ErrorMessages.InternalServerError;
			}

			return res;
		}

		public ServiceResponse<UserDto> UserDetails(Guid userId)
		{
			ServiceResponse<UserDto> res = new();
			res.StatusCode = 400;

			try
			{
				var user = _unitOfWork.UserRepository.Get(x => x.Id == userId).Result;
				if (user != null)
				{
					var userDto = _mapper.Map<User, UserDto>(user);
					res.Data = userDto;
					res.StatusCode = 200;
					res.Message = "Authorized";
				}
				else
				{
					res.Message = "Unauthorized";
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error fetching user details.");
				res.StatusCode = 500;
				res.Message = ErrorMessages.InternalServerError;
			}

			return res;
		}

		public ServiceResponse<string> CheckOtp(OtpRequestDto otp)
		{
			ServiceResponse<string> res = new();
			res.StatusCode = 400;
			try
			{
				var otpData = _unitOfWork.OtpRepository.Get(x => x.Code == otp.Otp).Result;
				if (otpData.Expires <= DateTime.UtcNow)
				{
					res.Message = "Verification code has expired.";
					return res;
				}
				if (otpData.Status != 0)
				{
					res.Message = "Verification code already used.";
					return res;
				}
				if (otp.PreferredMethod == "email" && otpData.Email == otp.Email)
				{
					res.StatusCode = 200;
					res.Message = "Email verification successful";
				}
				else if (otp.PreferredMethod == "phone" && otpData.Phone == otp.Phone)
				{
					res.StatusCode = 200;
					res.Message = "Phone verification successful";
				}
				else
				{
					res.Message = "Invalid code";
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				_logger.LogError(message: ex.Message, ex);
				res.StatusCode = 500;
				res.Message = ErrorMessages.InternalServerError;
			}

			return res;
		}


	}
}
