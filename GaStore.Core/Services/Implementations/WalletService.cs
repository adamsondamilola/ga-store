using AutoMapper;
using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Wallets;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations
{
	public class WalletService : IWalletService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<WalletService> _logger;
		private readonly DatabaseContext _context;

		public WalletService(
			IUnitOfWork unitOfWork,
			IMapper mapper,
			ILogger<WalletService> logger, DatabaseContext context)
		{
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
			_context = context;
		}

		public async Task<PaginatedServiceResponse<List<WalletDto>>> GetPaginatedWalletsAsync(Guid? userId, int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<WalletDto>>();

			try
			{
				if (pageNumber < 1 || pageSize < 1)
				{
					return new PaginatedServiceResponse<List<WalletDto>>
					{
						Status = 400,
						Message = "Page number and page size must be greater than 0."
					};
				}

				var query = _unitOfWork.WalletRepository;
				var query_ = new List<Wallet>();

				// Filter by UserId if provided
				if (userId.HasValue)
				{
					query_ = await query.GetOffsetAndLimitAsync(w => w.UserId == userId.Value, pageNumber, pageSize);
				}


				query_ = await query.GetOffsetAndLimitAsync(w => w.UserId != null, pageNumber, pageSize);

				var wallets = _mapper.Map<List<WalletDto>>(query_);

				var totalRecords = query_.Count();

				response = new PaginatedServiceResponse<List<WalletDto>>
				{
					Status = 200,
					Message = "Wallets retrieved successfully",
					Data = wallets,
					PageNumber = pageNumber,
					PageSize = pageSize,
					TotalRecords = totalRecords
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving wallets.");
				response.Status = 500;
				response.Message = "An error occurred while retrieving wallets.";
			}

			return response;
		}

		public async Task<ServiceResponse<WalletDto>> GetWalletByIdAsync(Guid walletId)
		{
			var response = new ServiceResponse<WalletDto>();

			try
			{
				var wallet = await _unitOfWork.WalletRepository.Get(w => w.Id == walletId || w.UserId == walletId);

				if (wallet == null)
				{
					return new ServiceResponse<WalletDto>
					{
						StatusCode = 404,
						Message = "Wallet not found."
					};
				}

				response = new ServiceResponse<WalletDto>
				{
					StatusCode = 200,
					Message = "Wallet retrieved successfully",
					Data = new WalletDto
					{
						UserId = wallet.UserId,
						Balance = wallet.Balance,
						Commission = wallet.Commission,
						Withdrawn = wallet.Withdrawn,
						PendingWithdrawal = wallet.PendingWithdrawal
					}
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving wallet.");
				response.StatusCode = 500;
				response.Message = "An error occurred while retrieving the wallet.";
			}

			return response;
		}

		public async Task<ServiceResponse<WalletDto>> CreateWalletAsync(WalletDto walletDto, Guid userId)
		{
			var response = new ServiceResponse<WalletDto>();

			try
			{
				var wallet = new Wallet
				{
					UserId = walletDto.UserId,
					Balance = walletDto.Balance,
					Commission = walletDto.Commission,
					Withdrawn = walletDto.Withdrawn,
					PendingWithdrawal = walletDto.PendingWithdrawal
				};

				await _unitOfWork.WalletRepository.Add(wallet);
				await _unitOfWork.CompletedAsync(userId);

				response = new ServiceResponse<WalletDto>
				{
					StatusCode = 201,
					Message = "Wallet created successfully",
					Data = walletDto
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating wallet.");
				response.StatusCode = 500;
				response.Message = "An error occurred while creating the wallet.";
			}

			return response;
		}

		public async Task<ServiceResponse<WalletDto>> UpdateWalletAsync(Guid walletId, WalletDto walletDto, Guid userId)
		{
			var response = new ServiceResponse<WalletDto>();

			try
			{
				var wallet = await _context.Wallets.FindAsync(walletId);

				if (wallet == null)
				{
					return new ServiceResponse<WalletDto>
					{
						StatusCode = 404,
						Message = "Wallet not found."
					};
				}

				wallet.Balance = walletDto.Balance;
				wallet.Commission = walletDto.Commission;
				wallet.Withdrawn = walletDto.Withdrawn;
				wallet.PendingWithdrawal = walletDto.PendingWithdrawal;

				await _unitOfWork.WalletRepository.Upsert(wallet);
				await _unitOfWork.CompletedAsync(userId);

				response = new ServiceResponse<WalletDto>
				{
					StatusCode = 200,
					Message = "Wallet updated successfully",
					Data = walletDto
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating wallet.");
				response.StatusCode = 500;
				response.Message = "An error occurred while updating the wallet.";
			}

			return response;
		}

		public async Task<ServiceResponse<bool>> DeleteWalletAsync(Guid walletId, Guid userId)
		{
			var response = new ServiceResponse<bool>();

			try
			{
				var wallet = await _context.Wallets.FindAsync(walletId);

				if (wallet == null)
				{
					return new ServiceResponse<bool>
					{
						StatusCode = 404,
						Message = "Wallet not found."
					};
				}

				await _unitOfWork.WalletRepository.Remove(wallet.Id);
				await _unitOfWork.CompletedAsync(userId);

				response = new ServiceResponse<bool>
				{
					StatusCode = 200,
					Message = "Wallet deleted successfully",
					Data = true
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting wallet.");
				response.StatusCode = 500;
				response.Message = "An error occurred while deleting the wallet.";
			}

			return response;
		}
	}
}
