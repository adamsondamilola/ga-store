using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.PaymentGatewaysDto.FlutterwaveDto;
using GaStore.Data.Dtos.PaymentGatewaysDto.PaystackDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces.PaymentGateways.Paystack
{
    public interface IPaystackService
    {
        Task<ServiceResponse<PaymentVerificationResponseDto>> VerifyTransactions(string Id);
        Task<ServiceResponse<PaymentInitiationResponseDto>> InitializePayment(OrderSummaryDto summaryDto, Guid userId);
        Task<ServiceResponse<PaymentInitiationResponseDto>> InitializePayment(decimal amount, Guid userId);
    }
}
