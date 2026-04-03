using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IWalletService
	{
		Task<PaginatedServiceResponse<List<WalletDto>>> GetPaginatedWalletsAsync(Guid? userId, int pageNumber, int pageSize);
		Task<ServiceResponse<WalletDto>> GetWalletByIdAsync(Guid walletId);
		Task<ServiceResponse<WalletDto>> CreateWalletAsync(WalletDto walletDto, Guid userId);
		Task<ServiceResponse<WalletDto>> UpdateWalletAsync(Guid walletId, WalletDto walletDto, Guid userId);
		Task<ServiceResponse<bool>> DeleteWalletAsync(Guid walletId, Guid userId);
	}
}
