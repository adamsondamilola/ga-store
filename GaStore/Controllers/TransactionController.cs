using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Core.Services.Interfaces;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;
using GaStore.Common;
using GaStore.Data.Dtos.WalletsDto;

[ApiController]
[Route("api/[controller]")]
public class TransactionController : RootController
{
	private readonly ITransactionService _transactionService;

	public TransactionController(ITransactionService transactionService)
	{
		_transactionService = transactionService;
	}

	[Authorize(Roles = CustomRoles.User)]
	[HttpGet]
	public async Task<ActionResult<PaginatedServiceResponse<List<TransactionDto>>>> GetUserTransactions(
		[FromQuery] Guid? userId, [FromQuery] Guid? walletId, [FromQuery] Guid? orderId,
		[FromQuery] string? transactionType, [FromQuery] string? status,
		[FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate,
		[FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
	{
		userId = UserId;
		var response = await _transactionService.GetPaginatedTransactionsAsync(
			userId, walletId, orderId, transactionType, status, startDate, endDate, pageNumber, pageSize);

		return StatusCode(response.Status, response);
	}

	[Authorize(Roles = CustomRoles.Admin)]
	[HttpGet("admin")]
	public async Task<ActionResult<PaginatedServiceResponse<List<TransactionDto>>>> GetTransactions(
	[FromQuery] Guid? userId, [FromQuery] Guid? walletId, [FromQuery] Guid? orderId,
	[FromQuery] string? transactionType, [FromQuery] string? status,
	[FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate,
	[FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
	{
		var response = await _transactionService.GetPaginatedTransactionsAsync(
			userId, walletId, orderId, transactionType, status, startDate, endDate, pageNumber, pageSize);

		return StatusCode(response.Status, response);
	}

	[Authorize(Roles = CustomRoles.User)]
	[HttpGet("{transactionId}")]
	public async Task<ActionResult<ServiceResponse<TransactionDto>>> GetTransactionById(Guid transactionId)
	{
		var response = await _transactionService.GetTransactionByIdAsync(transactionId);
		return StatusCode(response.StatusCode, response);
	}

	[Authorize(Roles = CustomRoles.Admin)]
	[HttpPost]
	public async Task<ActionResult<ServiceResponse<TransactionDto>>> CreateTransaction([FromBody] TransactionDto transactionDto)
	{
		var response = await _transactionService.CreateTransactionAsync(transactionDto);
		return StatusCode(response.StatusCode, response);
	}

	[Authorize(Roles = CustomRoles.User)]
	[HttpPost("pending")]
	public async Task<ActionResult<ServiceResponse<TransactionDto>>> CreatePendingTransaction([FromBody] TransactionDto transactionDto)
	{
		var response = await _transactionService.CreatePendingTransactionAsync(transactionDto);
		return StatusCode(response.StatusCode, response);
	}

	[Authorize(Roles = CustomRoles.Admin)]
	[HttpPut("{transactionId}")]
	public async Task<ActionResult<ServiceResponse<TransactionDto>>> UpdateTransaction(Guid transactionId, [FromBody] TransactionDto transactionDto)
	{
		var response = await _transactionService.UpdateTransactionAsync(transactionId, transactionDto);
		return StatusCode(response.StatusCode, response);
	}

	[Authorize(Roles = CustomRoles.Admin)]
	[HttpDelete("{transactionId}")]
	public async Task<ActionResult<ServiceResponse<bool>>> DeleteTransaction(Guid transactionId)
	{
		var response = await _transactionService.DeleteTransactionAsync(transactionId);
		return StatusCode(response.StatusCode, response);
	}
}
