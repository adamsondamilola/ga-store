using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.VouchersDto;
using GaStore.Data.Entities.System;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class VoucherService : IVoucherService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<VoucherService> _logger;
        private readonly DatabaseContext _context;

        public VoucherService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<VoucherService> logger, DatabaseContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _context = context;
        }

        public async Task<ServiceResponse<List<VoucherDto>>> GetVouchersAsync(bool includeInactive = true)
        {
            var response = new ServiceResponse<List<VoucherDto>> { StatusCode = 400 };

            try
            {
                var query = _context.Vouchers.AsQueryable();
                if (!includeInactive)
                {
                    query = query.Where(v => v.IsActive);
                }

                var vouchers = await query.OrderByDescending(v => v.DateCreated).ToListAsync();
                response.StatusCode = 200;
                response.Message = "Vouchers retrieved successfully.";
                response.Data = _mapper.Map<List<VoucherDto>>(vouchers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vouchers");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<VoucherDto>> CreateVoucherAsync(Guid userId, VoucherDto dto)
        {
            var response = new ServiceResponse<VoucherDto> { StatusCode = 400 };

            try
            {
                var normalizedCode = NormalizeCode(dto.Code);
                if (string.IsNullOrWhiteSpace(normalizedCode))
                {
                    response.Message = "Voucher code is required.";
                    return response;
                }

                var existing = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == normalizedCode);
                if (existing != null)
                {
                    response.Message = "Voucher code already exists.";
                    return response;
                }

                var voucher = _mapper.Map<Voucher>(dto);
                voucher.Code = normalizedCode;
                voucher.InitialValue = Math.Round(dto.InitialValue, 2);
                voucher.RemainingValue = Math.Round(dto.RemainingValue > 0 ? dto.RemainingValue : dto.InitialValue, 2);
                voucher.PurchaserType = NormalizePurchaserType(dto.PurchaserType);
                voucher.Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "NGN" : dto.Currency.Trim().ToUpperInvariant();
                voucher.CreatedByUserId = userId;

                await _unitOfWork.VoucherRepository.Add(voucher);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 201;
                response.Message = "Voucher created successfully.";
                response.Data = _mapper.Map<VoucherDto>(voucher);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating voucher");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<VoucherDto>> UpdateVoucherAsync(Guid voucherId, Guid userId, VoucherDto dto)
        {
            var response = new ServiceResponse<VoucherDto> { StatusCode = 400 };

            try
            {
                var voucher = await _unitOfWork.VoucherRepository.GetById(voucherId);
                if (voucher == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Voucher not found.";
                    return response;
                }

                var normalizedCode = NormalizeCode(dto.Code);
                var duplicate = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == normalizedCode && v.Id != voucherId);
                if (duplicate != null)
                {
                    response.Message = "Voucher code already exists.";
                    return response;
                }

                var amountUsed = Math.Max(voucher.InitialValue - voucher.RemainingValue, 0);
                voucher.Code = normalizedCode;
                voucher.PurchaserType = NormalizePurchaserType(dto.PurchaserType);
                voucher.PurchaserName = dto.PurchaserName?.Trim();
                voucher.ContactEmail = dto.ContactEmail?.Trim();
                voucher.InitialValue = Math.Round(dto.InitialValue, 2);
                voucher.RemainingValue = Math.Round(Math.Max(dto.InitialValue - amountUsed, 0), 2);
                voucher.Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "NGN" : dto.Currency.Trim().ToUpperInvariant();
                voucher.IsActive = dto.IsActive;
                voucher.ExpiresAt = dto.ExpiresAt;
                voucher.Note = dto.Note?.Trim();

                await _unitOfWork.VoucherRepository.Upsert(voucher);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Voucher updated successfully.";
                response.Data = _mapper.Map<VoucherDto>(voucher);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating voucher {VoucherId}", voucherId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<VoucherValidationDto>> ValidateVoucherAsync(string code)
        {
            var response = new ServiceResponse<VoucherValidationDto> { StatusCode = 400 };

            try
            {
                var normalizedCode = NormalizeCode(code);
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == normalizedCode);
                if (voucher == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Voucher not found.";
                    response.Data = new VoucherValidationDto { Code = normalizedCode, IsValid = false, Message = "Voucher not found." };
                    return response;
                }

                var validationMessage = GetVoucherValidationError(voucher);
                response.StatusCode = validationMessage == null ? 200 : 400;
                response.Message = validationMessage ?? "Voucher is valid.";
                response.Data = new VoucherValidationDto
                {
                    Code = voucher.Code,
                    IsValid = validationMessage == null,
                    PurchaserType = voucher.PurchaserType,
                    PurchaserName = voucher.PurchaserName,
                    RemainingValue = voucher.RemainingValue,
                    Currency = voucher.Currency,
                    ExpiresAt = voucher.ExpiresAt,
                    Message = validationMessage ?? "Voucher is valid."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating voucher");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<Voucher>> RedeemVoucherAsync(Guid userId, Guid orderId, string code, decimal amount)
        {
            var response = new ServiceResponse<Voucher> { StatusCode = 400 };

            try
            {
                var normalizedCode = NormalizeCode(code);
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == normalizedCode);
                if (voucher == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Voucher not found.";
                    return response;
                }

                var validationMessage = GetVoucherValidationError(voucher);
                if (validationMessage != null)
                {
                    response.Message = validationMessage;
                    return response;
                }

                amount = Math.Round(amount, 2);
                if (amount <= 0)
                {
                    response.Message = "Voucher payment amount must be greater than zero.";
                    return response;
                }

                if (voucher.RemainingValue < amount)
                {
                    response.Message = "Voucher balance is not enough for this purchase.";
                    return response;
                }

                var existingRedemption = await _context.VoucherRedemptions.FirstOrDefaultAsync(vr => vr.OrderId == orderId);
                if (existingRedemption != null)
                {
                    response.Message = "This order has already used a voucher.";
                    return response;
                }

                var balanceBefore = voucher.RemainingValue;
                voucher.RemainingValue = Math.Round(voucher.RemainingValue - amount, 2);
                await _unitOfWork.VoucherRepository.Upsert(voucher);

                await _unitOfWork.VoucherRedemptionRepository.Add(new VoucherRedemption
                {
                    VoucherId = voucher.Id,
                    OrderId = orderId,
                    UserId = userId,
                    AmountRedeemed = amount,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = voucher.RemainingValue
                });

                response.StatusCode = 200;
                response.Message = "Voucher redeemed successfully.";
                response.Data = voucher;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error redeeming voucher {Code} for order {OrderId}", code, orderId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        private static string NormalizeCode(string? code) => code?.Trim().ToUpperInvariant() ?? string.Empty;

        private static string NormalizePurchaserType(string? purchaserType)
        {
            return string.Equals(purchaserType, "Company", StringComparison.OrdinalIgnoreCase)
                ? "Company"
                : "Individual";
        }

        private static string? GetVoucherValidationError(Voucher voucher)
        {
            if (!voucher.IsActive)
            {
                return "Voucher is inactive.";
            }

            if (voucher.ExpiresAt.HasValue && voucher.ExpiresAt.Value < DateTime.UtcNow)
            {
                return "Voucher has expired.";
            }

            if (voucher.RemainingValue <= 0)
            {
                return "Voucher has no remaining balance.";
            }

            return null;
        }
    }
}
