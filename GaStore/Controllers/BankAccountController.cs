using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{

	[ApiController]
	[Route("api/[controller]")]
    [EnableRateLimiting("FixedPolicy")]
    public class BankAccountController : RootController
	{
		private readonly IBankAccountService _bankAccountService;

		public BankAccountController(IBankAccountService bankAccountService)
		{
			_bankAccountService = bankAccountService;
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<BankAccountDto>>>> GetUserBankAccounts(
			[FromQuery] Guid? userId,
			[FromQuery] string? bankName,
			[FromQuery] string? accountNumber,
			[FromQuery] string? currency,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _bankAccountService.GetPaginatedBankAccountsAsync(UserId, bankName, accountNumber, currency, pageNumber, pageSize);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpGet("admin")]
		public async Task<ActionResult<PaginatedServiceResponse<List<BankAccountDto>>>> GetBankAccounts(
			[FromQuery] Guid? userId,
			[FromQuery] string? bankName,
			[FromQuery] string? accountNumber,
			[FromQuery] string? currency,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _bankAccountService.GetPaginatedBankAccountsAsync(userId, bankName, accountNumber, currency, pageNumber, pageSize);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet("{bankAccountId}")]
		public async Task<ActionResult<ServiceResponse<BankAccountDto>>> GetBankAccountById(Guid bankAccountId)
		{
			var response = await _bankAccountService.GetBankAccountByIdAsync(bankAccountId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpPost]
		public async Task<ActionResult<ServiceResponse<BankAccountDto>>> CreateBankAccount([FromBody] BankAccountDto bankAccountDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<BankAccountDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _bankAccountService.CreateBankAccountAsync(bankAccountDto, GetUserId());
			return StatusCode(response.StatusCode, response);
		}

        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpPost("admin")]
        public async Task<ActionResult<ServiceResponse<BankAccountDto>>> CreateBankAccountAdmin([FromBody] BankAccountDto bankAccountDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<BankAccountDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _bankAccountService.CreateBankAccountAsync(bankAccountDto, GetUserId());
            return StatusCode(response.StatusCode, response);
        }

		[Authorize(Roles = CustomRoles.User)]
		[HttpPut("{bankAccountId}")]
		public async Task<ActionResult<ServiceResponse<BankAccountDto>>> UpdateBankAccount(Guid bankAccountId, [FromBody] BankAccountDto bankAccountDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<BankAccountDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _bankAccountService.UpdateBankAccountAsync(bankAccountId, bankAccountDto, GetUserId());
			return StatusCode(response.StatusCode, response);
		}

        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpPut("admin/{bankAccountId}")]
        public async Task<ActionResult<ServiceResponse<BankAccountDto>>> UpdateBankAccountAdmin(Guid bankAccountId, [FromBody] BankAccountDto bankAccountDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<BankAccountDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _bankAccountService.UpdateBankAccountAsync(bankAccountId, bankAccountDto, GetUserId());
            return StatusCode(response.StatusCode, response);
        }

		[Authorize(Roles = CustomRoles.User)]
		[HttpDelete("{bankAccountId}")]
		public async Task<ActionResult<ServiceResponse<bool>>> DeleteBankAccount(Guid bankAccountId)
		{
			var response = await _bankAccountService.DeleteBankAccountAsync(bankAccountId, GetUserId());
			return StatusCode(response.StatusCode, response);
		}

        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpDelete("admin/{bankAccountId}")]
        public async Task<ActionResult<ServiceResponse<bool>>> DeleteBankAccountAdmin(Guid bankAccountId)
        {
            var response = await _bankAccountService.DeleteBankAccountAsync(bankAccountId, GetUserId());
            return StatusCode(response.StatusCode, response);
        }

		private Guid GetUserId()
		{
			return UserId;
		}
	}

}
