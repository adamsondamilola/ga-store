using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Data.Entities.Wallets;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations
{
	public class TransactionService : ITransactionService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<ShippingService> _logger;
		private readonly DatabaseContext _context;

		public TransactionService(
			IUnitOfWork unitOfWork,
			IMapper mapper,
			ILogger<ShippingService> logger, DatabaseContext context)
		{
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
			_context = context;
		}

		public async Task<PaginatedServiceResponse<List<Transaction>>> GetPaginatedTransactionsAsync(
			Guid? userId, Guid? walletId, Guid? orderId, string? transactionType, string? status,
			DateTime? startDate, DateTime? endDate, int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<Transaction>>();

			try
			{
				// Validate pagination inputs
				if (pageNumber < 1 || pageSize < 1)
				{
					response.Status = 400;
					response.Message = "Page number and page size must be greater than 0.";
					return response;
				}

				// Get the base query
				var query = _context.WalletTransactions
					.AsQueryable();

				// Apply filters
				if (userId.HasValue)
					query = query.Where(t => t.UserId == userId.Value);

				if (walletId.HasValue)
					query = query.Where(t => t.WalletId == walletId.Value);

				if (orderId.HasValue)
					query = query.Where(t => t.OrderId == orderId.Value);

				if (!string.IsNullOrEmpty(transactionType))
					query = query.Where(t => t.TransactionType == transactionType);

				if (!string.IsNullOrEmpty(status))
					query = query.Where(t => t.Status == status);

				// Date range filter - handle cases where only one date is provided
				if (startDate.HasValue || endDate.HasValue)
				{
					if (startDate.HasValue && endDate.HasValue)
					{
						query = query.Where(t => t.DateCreated >= startDate.Value && t.DateCreated <= endDate.Value);
					}
					else if (startDate.HasValue)
					{
						query = query.Where(t => t.DateCreated >= startDate.Value);
					}
					else if (endDate.HasValue)
					{
						query = query.Where(t => t.DateCreated <= endDate.Value);
					}
				}

				// Get total count before pagination
				var totalRecords = await query.CountAsync();

				// Apply pagination and projection
				var transactions = await query
					.OrderByDescending(t => t.DateCreated)
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.AsNoTracking()
					.Select(t => new Transaction
					{
						Id = t.Id, // Ensure this is included
						UserId = t.UserId,
						WalletId = t.WalletId,
						OrderId = t.OrderId,
						TransactionId = t.TransactionId,
						Amount = t.Amount,
						TransactionType = t.TransactionType,
						Status = t.Status,
						Description = t.Description,
						DateCreated = t.DateCreated // Ensure this is included
					})
					.ToListAsync();

				// Calculate total pages
				var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

				// Build response
				response.Status = 200;
				response.Message = "Transactions retrieved successfully";
				response.Data = transactions ?? new List<Transaction>(); // Ensure non-null list
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving transactions.");
				response.Status = 500;
				response.Message = $"An error occurred while retrieving transactions: {ex.Message}";
				response.Data = new List<Transaction>(); // Ensure non-null list
			}

			return response;
		}

		public async Task<ServiceResponse<TransactionDto>> GetTransactionByIdAsync(Guid transactionId)
		{
			var response = new ServiceResponse<TransactionDto>();

			try
			{
				var transaction = await _context.WalletTransactions.FindAsync(transactionId);

				if (transaction == null)
				{
					return new ServiceResponse<TransactionDto>
					{
						StatusCode = 404,
						Message = "Transaction not found."
					};
				}

				response = new ServiceResponse<TransactionDto>
				{
					StatusCode = 200,
					Message = "Transaction retrieved successfully",
					Data = new TransactionDto
					{
						UserId = transaction.UserId,
						WalletId = transaction.WalletId,
						OrderId = transaction.OrderId,
						Amount = transaction.Amount,
						TransactionType = transaction.TransactionType,
						Status = transaction.Status,
						Description = transaction.Description
					}
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving transaction.");
				response.StatusCode = 500;
				response.Message = "An error occurred while retrieving the transaction.";
			}

			return response;
		}

		public async Task<ServiceResponse<TransactionDto>> CreateTransactionAsync(TransactionDto transactionDto)
		{
			var response = new ServiceResponse<TransactionDto>();

			try
			{
				var transaction = new Transaction
				{
					UserId = transactionDto.UserId,
					WalletId = transactionDto.WalletId,
					OrderId = transactionDto.OrderId,
					Amount = transactionDto.Amount,
					TransactionType = transactionDto.TransactionType,
					Status = transactionDto.Status,
					Description = transactionDto.Description
				};

				_context.WalletTransactions.Add(transaction);
				await _context.SaveChangesAsync();

				response = new ServiceResponse<TransactionDto>
				{
					StatusCode = 201,
					Message = "Transaction created successfully",
					Data = transactionDto
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating transaction.");
				response.StatusCode = 500;
				response.Message = "An error occurred while creating the transaction.";
			}

			return response;
		}

		public async Task<ServiceResponse<TransactionDto>> CreatePendingTransactionAsync(TransactionDto transactionDto)
		{
			var response = new ServiceResponse<TransactionDto>();

			try
			{
				var wallet = await _unitOfWork.WalletRepository.Get(x => x.UserId == transactionDto.UserId);
				var transaction = new Transaction
				{
					UserId = transactionDto.UserId,
					WalletId = wallet.Id,
					OrderId = transactionDto.OrderId,
					TransactionId = transactionDto.TransactionId,
					Amount = transactionDto.Amount,
					TransactionType = transactionDto.TransactionType,
					Status = "Pending",
					Description = transactionDto.Description
				};

				_context.WalletTransactions.Add(transaction);
				await _context.SaveChangesAsync();

				response = new ServiceResponse<TransactionDto>
				{
					StatusCode = 201,
					Message = "Transaction created successfully",
					Data = transactionDto
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating transaction.");
				response.StatusCode = 500;
				response.Message = "An error occurred while creating the transaction.";
			}

			return response;
		}

		public async Task<ServiceResponse<TransactionDto>> UpdateTransactionAsync(Guid transactionId, TransactionDto transactionDto)
		{
			var response = new ServiceResponse<TransactionDto>();

			try
			{
				var transaction = await _context.WalletTransactions.FindAsync(transactionId);

				if (transaction == null)
				{
					return new ServiceResponse<TransactionDto>
					{
						StatusCode = 404,
						Message = "Transaction not found."
					};
				}

				transaction.Amount = transactionDto.Amount;
				transaction.TransactionType = transactionDto.TransactionType;
				transaction.Status = transactionDto.Status;
				transaction.Description = transactionDto.Description;

				_context.WalletTransactions.Update(transaction);
				await _context.SaveChangesAsync();

				response = new ServiceResponse<TransactionDto>
				{
					StatusCode = 200,
					Message = "Transaction updated successfully",
					Data = transactionDto
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating transaction.");
				response.StatusCode = 500;
				response.Message = "An error occurred while updating the transaction.";
			}

			return response;
		}

		public async Task<ServiceResponse<bool>> DeleteTransactionAsync(Guid transactionId)
		{
			var response = new ServiceResponse<bool>();

			try
			{
				var transaction = await _context.WalletTransactions.FindAsync(transactionId);

				if (transaction == null)
				{
					return new ServiceResponse<bool>
					{
						StatusCode = 404,
						Message = "Transaction not found."
					};
				}

				_context.WalletTransactions.Remove(transaction);
				await _context.SaveChangesAsync();

				response = new ServiceResponse<bool>
				{
					StatusCode = 200,
					Message = "Transaction deleted successfully",
					Data = true
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting transaction.");
				response.StatusCode = 500;
				response.Message = "An error occurred while deleting the transaction.";
			}

			return response;
		}
	}

}
