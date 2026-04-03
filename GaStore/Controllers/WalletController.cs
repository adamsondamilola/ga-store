using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

[ApiController]
[Route("api/[controller]")]
public class WalletController : RootController
{
	private readonly IWalletService _walletService;

	public WalletController(IWalletService walletService)
	{
		_walletService = walletService;
	}

	[Authorize(Roles = CustomRoles.Admin)]
	[HttpGet]
	public async Task<ActionResult<PaginatedServiceResponse<List<WalletDto>>>> GetWallets(
		[FromQuery] Guid? userId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
	{
		var response = await _walletService.GetPaginatedWalletsAsync(userId, pageNumber, pageSize);
		return StatusCode(response.Status, response);
	}

	[Authorize(Roles = CustomRoles.User)]
	[HttpGet("{walletId}/user")]
	public async Task<ActionResult<ServiceResponse<WalletDto>>> GetUserWalletById(Guid walletId)
	{
		var response = await _walletService.GetWalletByIdAsync(walletId);
		return StatusCode(response.StatusCode, response);
	}

	[Authorize(Roles = CustomRoles.Admin)]
	[HttpGet("{walletId}")]
	public async Task<ActionResult<ServiceResponse<WalletDto>>> GetWalletById(Guid walletId)
	{
		var response = await _walletService.GetWalletByIdAsync(walletId);
		return StatusCode(response.StatusCode, response);
	}

	[Authorize(Roles = CustomRoles.Admin)]
	[HttpPost]
	public async Task<ActionResult<ServiceResponse<WalletDto>>> CreateWallet([FromBody] WalletDto walletDto)
	{
		var response = await _walletService.CreateWalletAsync(walletDto, UserId);
		return StatusCode(response.StatusCode, response);
	}

	[Authorize(Roles = CustomRoles.Admin)]
	[HttpPut("{walletId}")]
	public async Task<ActionResult<ServiceResponse<WalletDto>>> UpdateWallet(Guid walletId, [FromBody] WalletDto walletDto)
	{
		var response = await _walletService.UpdateWalletAsync(walletId, walletDto, UserId);
		return StatusCode(response.StatusCode, response);
	}

	[Authorize(Roles = CustomRoles.Admin)]
	[HttpDelete("{walletId}")]
	public async Task<ActionResult<ServiceResponse<bool>>> DeleteWallet(Guid walletId)
	{
		var response = await _walletService.DeleteWalletAsync(walletId, UserId);
		return StatusCode(response.StatusCode, response);
	}
}
