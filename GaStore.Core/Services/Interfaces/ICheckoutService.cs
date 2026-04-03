using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos;
using GaStore.Data.Dtos.CheckOutDto;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.PaymentGatewaysDto.PaystackDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface ICheckoutService
	{
		Task<ServiceResponse<PaymentInitiationResponseDto>> RegisterPurchaseAsync(Guid userId, OrderSummaryDto summaryDto);
        Task<ServiceResponse<bool>> ProcessCheckoutWithWalletAsync(Guid userId, Guid orderId, OrderSummaryDto summaryDto);
		Task<ServiceResponse<bool>> VerifyTransaction(OrderSummaryDto summaryDto, string transactionId, Guid userId, Guid orderId);
		Task<ServiceResponse<bool>> ProcessGatewayWebhookAsync(string paymentGateway, string transactionId, string? paymentReference = null, Guid? orderId = null, Guid? userId = null);
		ServiceResponse<string> DefaultPaymentGateway();
        Task<ServiceResponse<List<PaymentMethodConfigurationDto>>> GetPaymentMethodsAsync();

    }
}
