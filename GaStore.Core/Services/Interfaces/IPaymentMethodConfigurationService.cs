using GaStore.Data.Dtos;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IPaymentMethodConfigurationService
    {
        Task<ServiceResponse<List<PaymentMethodConfigurationDto>>> GetPaymentMethodsAsync(bool includeDisabled = false);
        Task<ServiceResponse<List<PaymentMethodConfigurationDto>>> UpdatePaymentMethodsAsync(
            Guid userId,
            List<UpdatePaymentMethodConfigurationDto> dtos);
        Task<ServiceResponse<bool>> IsMethodEnabledAsync(string methodKey);
        Task<ServiceResponse<string>> GetDefaultGatewayAsync();
    }
}
