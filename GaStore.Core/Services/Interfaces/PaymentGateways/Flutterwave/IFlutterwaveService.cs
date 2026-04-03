using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.PaymentGatewaysDto.FlutterwaveDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces.PaymentGateways.Flutterwave
{
    public interface IFlutterwaveService
    {
        Task<ServiceResponse<VerifyTransactionResponse>> VerifyTransactions(int Id);
    }
}
