using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos;
using GaStore.Data.Entities.System;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class PaymentMethodConfigurationService : IPaymentMethodConfigurationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<PaymentMethodConfigurationService> _logger;
        private readonly DatabaseContext _context;
        private readonly AppSettings _appSettings;
        private static readonly DateTime PaymentMethodSeedDate = new(2026, 3, 26, 0, 0, 0, DateTimeKind.Utc);

        public PaymentMethodConfigurationService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<PaymentMethodConfigurationService> logger,
            DatabaseContext context,
            IOptions<AppSettings> appSettings)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _context = context;
            _appSettings = appSettings.Value;
        }

        public async Task<ServiceResponse<List<PaymentMethodConfigurationDto>>> GetPaymentMethodsAsync(bool includeDisabled = false)
        {
            var response = new ServiceResponse<List<PaymentMethodConfigurationDto>> { StatusCode = 400 };

            try
            {
                await EnsureDefaultsAsync();

                var query = _context.PaymentMethodConfigurations.AsQueryable();
                if (!includeDisabled)
                {
                    query = query.Where(x => x.IsEnabled);
                }

                var methods = await query.OrderBy(x => x.SortOrder).ToListAsync();
                response.StatusCode = 200;
                response.Message = "Payment methods retrieved successfully.";
                response.Data = _mapper.Map<List<PaymentMethodConfigurationDto>>(methods);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving payment method settings");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<PaymentMethodConfigurationDto>>> UpdatePaymentMethodsAsync(Guid userId, List<UpdatePaymentMethodConfigurationDto> dtos)
        {
            var response = new ServiceResponse<List<PaymentMethodConfigurationDto>> { StatusCode = 400 };

            try
            {
                await EnsureDefaultsAsync();

                var methods = await _context.PaymentMethodConfigurations.ToListAsync();
                var gateways = methods.Where(x => x.IsGateway).ToList();
                var requestedDefault = dtos.FirstOrDefault(x => x.IsDefaultGateway)?.MethodKey;

                foreach (var dto in dtos)
                {
                    var existing = methods.FirstOrDefault(x => x.MethodKey == dto.MethodKey);
                    if (existing == null) continue;

                    existing.IsEnabled = dto.IsEnabled;
                    existing.IsDefaultGateway = false;
                }

                if (!string.IsNullOrWhiteSpace(requestedDefault))
                {
                    var defaultGateway = gateways.FirstOrDefault(x => x.MethodKey == requestedDefault);
                    if (defaultGateway == null)
                    {
                        response.Message = "Selected default gateway was not found.";
                        return response;
                    }

                    if (!defaultGateway.IsEnabled)
                    {
                        response.Message = "Default gateway must be enabled.";
                        return response;
                    }

                    defaultGateway.IsDefaultGateway = true;
                }
                else
                {
                    var enabledGateway = gateways.FirstOrDefault(x => x.IsEnabled);
                    if (enabledGateway != null)
                    {
                        enabledGateway.IsDefaultGateway = true;
                    }
                }

                foreach (var method in methods)
                {
                    await _unitOfWork.PaymentMethodConfigurationRepository.Upsert(method);
                }

                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Payment methods updated successfully.";
                response.Data = _mapper.Map<List<PaymentMethodConfigurationDto>>(methods.OrderBy(x => x.SortOrder).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating payment method settings");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<bool>> IsMethodEnabledAsync(string methodKey)
        {
            var response = new ServiceResponse<bool> { StatusCode = 400 };

            try
            {
                await EnsureDefaultsAsync();
                var method = await _context.PaymentMethodConfigurations.FirstOrDefaultAsync(x => x.MethodKey == methodKey);

                response.StatusCode = 200;
                response.Data = method?.IsEnabled ?? false;
                response.Message = "Successful";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking payment method {MethodKey}", methodKey);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<string>> GetDefaultGatewayAsync()
        {
            var response = new ServiceResponse<string> { StatusCode = 400 };

            try
            {
                await EnsureDefaultsAsync();
                var gateway = await _context.PaymentMethodConfigurations
                    .Where(x => x.IsGateway && x.IsEnabled)
                    .OrderByDescending(x => x.IsDefaultGateway)
                    .ThenBy(x => x.SortOrder)
                    .FirstOrDefaultAsync();

                response.StatusCode = 200;
                response.Data = gateway?.MethodKey ?? "Paystack";
                response.Message = "Successful";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving default gateway");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        private async Task EnsureDefaultsAsync()
        {
            var configuredDefault = NormalizeGatewayKey(_appSettings.DefaultPaymentGateway);
            var defaults = new List<PaymentMethodConfiguration>
            {
                new()
                {
                    Id = Guid.Parse("31f67e0c-765b-4fdf-ae16-2f8874c17f11"),
                    MethodKey = "Paystack",
                    DisplayName = "Paystack",
                    IsEnabled = true,
                    IsGateway = true,
                    SortOrder = 1,
                    IsDefaultGateway = configuredDefault == "Paystack",
                    DateCreated = PaymentMethodSeedDate,
                    DateUpdated = PaymentMethodSeedDate
                },
                new()
                {
                    Id = Guid.Parse("afdbd8dd-59aa-4eb8-a80b-9ebd7a26bd87"),
                    MethodKey = "Flutterwave",
                    DisplayName = "Flutterwave",
                    IsEnabled = true,
                    IsGateway = true,
                    SortOrder = 2,
                    IsDefaultGateway = configuredDefault == "Flutterwave",
                    DateCreated = PaymentMethodSeedDate,
                    DateUpdated = PaymentMethodSeedDate
                },
                new()
                {
                    Id = Guid.Parse("7b3d0c80-4f8d-4923-a019-c12730b4a2a7"),
                    MethodKey = "commission",
                    DisplayName = "Commission",
                    IsEnabled = true,
                    IsGateway = false,
                    SortOrder = 3,
                    DateCreated = PaymentMethodSeedDate,
                    DateUpdated = PaymentMethodSeedDate
                },
                new()
                {
                    Id = Guid.Parse("705320a5-3401-47e6-a61f-27d2d214f6f4"),
                    MethodKey = "manual",
                    DisplayName = "Manual Bank Transfer",
                    IsEnabled = true,
                    IsGateway = false,
                    SortOrder = 4,
                    DateCreated = PaymentMethodSeedDate,
                    DateUpdated = PaymentMethodSeedDate
                }
            };

            if (!defaults.Any(x => x.IsGateway && x.IsDefaultGateway))
            {
                defaults[0].IsDefaultGateway = true;
            }

            var existingMethods = await _context.PaymentMethodConfigurations.ToListAsync();
            var hasChanges = false;

            foreach (var defaultMethod in defaults)
            {
                var existing = existingMethods.FirstOrDefault(x =>
                    x.MethodKey.Equals(defaultMethod.MethodKey, StringComparison.OrdinalIgnoreCase));

                if (existing == null)
                {
                    await _unitOfWork.PaymentMethodConfigurationRepository.Add(defaultMethod);
                    hasChanges = true;
                    continue;
                }

                if (existing.DisplayName != defaultMethod.DisplayName ||
                    existing.IsGateway != defaultMethod.IsGateway ||
                    existing.SortOrder != defaultMethod.SortOrder)
                {
                    existing.DisplayName = defaultMethod.DisplayName;
                    existing.IsGateway = defaultMethod.IsGateway;
                    existing.SortOrder = defaultMethod.SortOrder;
                    existing.DateUpdated = DateTime.UtcNow;
                    await _unitOfWork.PaymentMethodConfigurationRepository.Upsert(existing);
                    hasChanges = true;
                }
            }

            if (!existingMethods.Any(x => x.IsGateway && x.IsDefaultGateway) &&
                existingMethods.Any(x => x.IsGateway && x.IsEnabled))
            {
                var defaultGateway = existingMethods
                    .Where(x => x.IsGateway && x.IsEnabled)
                    .OrderBy(x => x.SortOrder)
                    .First();

                defaultGateway.IsDefaultGateway = true;
                defaultGateway.DateUpdated = DateTime.UtcNow;
                await _unitOfWork.PaymentMethodConfigurationRepository.Upsert(defaultGateway);
                hasChanges = true;
            }

            if (hasChanges)
            {
                await _context.SaveChangesAsync();
            }
        }

        private static string NormalizeGatewayKey(string? gatewayKey)
        {
            if (string.Equals(gatewayKey, "Flutterwave", StringComparison.OrdinalIgnoreCase))
            {
                return "Flutterwave";
            }

            return "Paystack";
        }
    }
}
