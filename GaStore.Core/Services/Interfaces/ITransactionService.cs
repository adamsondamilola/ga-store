using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Data.Entities.Wallets;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface ITransactionService
	{
		Task<PaginatedServiceResponse<List<Transaction>>> GetPaginatedTransactionsAsync(
			Guid? userId, Guid? walletId, Guid? orderId, string? transactionType, string? status,
			DateTime? startDate, DateTime? endDate, int pageNumber, int pageSize);

		Task<ServiceResponse<TransactionDto>> GetTransactionByIdAsync(Guid transactionId);
		Task<ServiceResponse<TransactionDto>> CreateTransactionAsync(TransactionDto transactionDto);
		Task<ServiceResponse<TransactionDto>> CreatePendingTransactionAsync(TransactionDto transactionDto);
		Task<ServiceResponse<TransactionDto>> UpdateTransactionAsync(Guid transactionId, TransactionDto transactionDto);
		Task<ServiceResponse<bool>> DeleteTransactionAsync(Guid transactionId);
	}

}
