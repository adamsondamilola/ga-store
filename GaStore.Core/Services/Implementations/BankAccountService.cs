using Microsoft.EntityFrameworkCore;
using GaStore.Core.Services.Interfaces;
using GaStore.Data;
using GaStore.Shared;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Data.Entities.Wallets;
using AutoMapper;
using Microsoft.Extensions.Logging;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;

namespace GaStore.Core.Services.Implementations
{

	public class BankAccountService : IBankAccountService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<ShippingService> _logger;
		private readonly DatabaseContext _context;

		public BankAccountService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<ShippingService> logger, DatabaseContext context)
		{
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
			_context = context;
		}

		public async Task<PaginatedServiceResponse<List<BankAccountDto>>> GetPaginatedBankAccountsAsync(
			Guid? userId, string? bankName, string? accountNumber, string? currency,
			int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<BankAccountDto>>();

			try
			{
				var query = _context.BankAccounts.AsQueryable();

				if (userId.HasValue)
					query = query.Where(b => b.UserId == userId);

				if (!string.IsNullOrEmpty(bankName))
					query = query.Where(b => b.BankName.Contains(bankName));

				if (!string.IsNullOrEmpty(accountNumber))
					query = query.Where(b => b.AccountNumber.Contains(accountNumber));

				if (!string.IsNullOrEmpty(currency))
					query = query.Where(b => b.Currency == currency);

				int totalRecords = await query.CountAsync();

				var bankAccounts = await query
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.Select(b => new BankAccountDto
					{
                        Id = b.Id,
						UserId = b.UserId,
						BankName = b.BankName,
						AccountNumber = b.AccountNumber,
						AccountName = b.AccountName,
						SwiftCode = b.SwiftCode,
						RoutingNumber = b.RoutingNumber,
						BranchCode = b.BranchCode,
						Currency = b.Currency
					})
					.ToListAsync();

				response.Status = 200;
				response.Message = "Bank accounts retrieved successfully.";
				response.Data = bankAccounts;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
			}
			catch (Exception ex)
			{
				response.Status = 500;
				response.Message = "An error occurred while retrieving bank accounts.";
			}

			return response;
		}

		public async Task<ServiceResponse<BankAccountDto>> GetBankAccountByIdAsync(Guid bankAccountId)
		{
			var response = new ServiceResponse<BankAccountDto>();

			var bankAccount = await _context.BankAccounts.FindAsync(bankAccountId);
			if (bankAccount == null)
			{
				response.StatusCode = 404;
				response.Message = "Bank account not found.";
				return response;
			}

			response.StatusCode = 200;
			response.Message = "Bank account retrieved successfully.";
			response.Data = _mapper.Map<BankAccountDto>(bankAccount);

			return response;
		}

		public async Task<ServiceResponse<BankAccountDto>> CreateBankAccountAsync(BankAccountDto bankAccountDto, Guid userId)
		{
			var response = new ServiceResponse<BankAccountDto>();

			var newBankAccount = _mapper.Map<BankAccount>(bankAccountDto);
            newBankAccount.UserId = userId;

			await _unitOfWork.BankAccountRepository.Add(newBankAccount);
			await _unitOfWork.CompletedAsync(userId);

			response.StatusCode = 201;
			response.Message = "Bank account created successfully.";
			response.Data = _mapper.Map<BankAccountDto>(newBankAccount);

			return response;
		}

		public async Task<ServiceResponse<BankAccountDto>> UpdateBankAccountAsync(Guid bankAccountId, BankAccountDto bankAccountDto, Guid userId)
		{
			var response = new ServiceResponse<BankAccountDto>();

			var bankAccount = await _context.BankAccounts.FindAsync(bankAccountId);
			if (bankAccount == null)
			{
				response.StatusCode = 404;
				response.Message = "Bank account not found.";
				return response;
			}

			bankAccount.BankName = bankAccountDto.BankName;
			bankAccount.AccountNumber = bankAccountDto.AccountNumber;
			bankAccount.AccountName = bankAccountDto.AccountName;
			bankAccount.SwiftCode = bankAccountDto.SwiftCode;
			bankAccount.RoutingNumber = bankAccountDto.RoutingNumber;
			bankAccount.BranchCode = bankAccountDto.BranchCode;
			bankAccount.Currency = bankAccountDto.Currency;

			await _unitOfWork.BankAccountRepository.Upsert(bankAccount);
			await _unitOfWork.CompletedAsync(userId);

			response.StatusCode = 200;
			response.Message = "Bank account updated successfully.";
			response.Data = _mapper.Map<BankAccountDto>(bankAccount);

			return response;
		}

		public async Task<ServiceResponse<bool>> DeleteBankAccountAsync(Guid bankAccountId, Guid userId)
		{
			var response = new ServiceResponse<bool>();

			var bankAccount = await _unitOfWork.BankAccountRepository.GetById(bankAccountId);
			if (bankAccount == null)
			{
				response.StatusCode = 404;
				response.Message = "Bank account not found.";
				response.Data = false;
				return response;
			}

			await _unitOfWork.BankAccountRepository.Remove(bankAccount.Id);
			await _unitOfWork.CompletedAsync(userId);

			response.StatusCode = 200;
			response.Message = "Bank account deleted successfully.";
			response.Data = true;

			return response;
		}
	}

}
