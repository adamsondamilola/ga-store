using GaStore.Data.Dtos.VouchersDto;
using GaStore.Data.Entities.System;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IVoucherService
    {
        Task<ServiceResponse<List<VoucherDto>>> GetVouchersAsync(bool includeInactive = true);
        Task<ServiceResponse<VoucherDto>> CreateVoucherAsync(Guid userId, VoucherDto dto);
        Task<ServiceResponse<VoucherDto>> UpdateVoucherAsync(Guid voucherId, Guid userId, VoucherDto dto);
        Task<ServiceResponse<VoucherValidationDto>> ValidateVoucherAsync(string code);
        Task<ServiceResponse<Voucher>> RedeemVoucherAsync(Guid userId, Guid orderId, string code, decimal amount);
    }
}
