using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IManualPaymentService
    {
        Task<ServiceResponse<ManualPaymentDto>> CreatePendingManualPaymentAsync(Guid orderId, Guid userId, decimal amountExpected);
        Task<ServiceResponse<ManualPaymentDto>> GetByOrderIdAsync(Guid orderId, Guid requesterId, bool isAdmin);
        Task<ServiceResponse<List<BankAccountDto>>> GetManualPaymentAccountsAsync();
        Task<ServiceResponse<ManualPaymentDto>> SubmitProofAsync(Guid userId, SubmitManualPaymentProofDto dto);
        Task<ServiceResponse<ManualPaymentDto>> ReviewAsync(Guid orderId, Guid adminUserId, ReviewManualPaymentDto dto);
    }
}
