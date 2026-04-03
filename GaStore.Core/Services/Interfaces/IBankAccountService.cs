using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IBankAccountService
	{
		Task<PaginatedServiceResponse<List<BankAccountDto>>> GetPaginatedBankAccountsAsync(
			Guid? userId, string? bankName, string? accountNumber, string? currency,
			int pageNumber, int pageSize);
		Task<ServiceResponse<BankAccountDto>> GetBankAccountByIdAsync(Guid bankAccountId);
		Task<ServiceResponse<BankAccountDto>> CreateBankAccountAsync(BankAccountDto bankAccountDto, Guid userId);
		Task<ServiceResponse<BankAccountDto>> UpdateBankAccountAsync(Guid bankAccountId, BankAccountDto bankAccountDto, Guid userId);
		Task<ServiceResponse<bool>> DeleteBankAccountAsync(Guid bankAccountId, Guid userId);
	}
}
