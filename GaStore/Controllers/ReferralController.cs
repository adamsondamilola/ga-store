using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ReferralDto;
using GaStore.Data.Entities.Referrals;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class ReferralController : RootController
	{
		private readonly IReferralService _referralService;
		private readonly IReferralPurchaseService _referralPurchaseService;

		public ReferralController(IReferralService referralService, IReferralPurchaseService referralPurchaseService)
		{
			_referralService = referralService;
			_referralPurchaseService = referralPurchaseService;
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<ReferralDto>>>> GetUserReferrals(
			[FromQuery] Guid? referrerId,
			[FromQuery] Guid? referralId,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _referralService.GetPaginatedReferralsAsync(referrerId, referralId, pageNumber, pageSize);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpGet("admin")]
		public async Task<ActionResult<PaginatedServiceResponse<List<ReferralDto>>>> GetReferrals(
			[FromQuery] Guid? referrerId,
			[FromQuery] Guid? referralId,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _referralService.GetPaginatedReferralsAsync(referrerId, referralId, pageNumber, pageSize);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet("{referralId}")]
		public async Task<ActionResult<ServiceResponse<ReferralDto>>> GetReferralById(Guid referralId)
		{
			var response = await _referralService.GetReferralByIdAsync(referralId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost]
		public async Task<ActionResult<ServiceResponse<ReferralDto>>> CreateReferral([FromBody] ReferralDto referralDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ReferralDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _referralService.CreateReferralAsync(referralDto);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPut("{referralId}")]
		public async Task<ActionResult<ServiceResponse<ReferralDto>>> UpdateReferral(Guid referralId, [FromBody] ReferralDto referralDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ReferralDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _referralService.UpdateReferralAsync(referralId, referralDto);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{referralId}")]
		public async Task<ActionResult<ServiceResponse<bool>>> DeleteReferral(Guid referralId)
		{
			var response = await _referralService.DeleteReferralAsync(referralId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet("purchases")]
		public async Task<ActionResult<PaginatedServiceResponse<List<ReferralPurchase>>>> GetReferralPurchases(
			[FromQuery] Guid? referralId,
			[FromQuery] Guid? orderId,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _referralPurchaseService.GetPaginatedReferralPurchasesAsync(referralId, orderId, pageNumber, pageSize);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet("purchases/{referralPurchaseId}")]
		public async Task<ActionResult<ServiceResponse<ReferralPurchase>>> GetReferralPurchaseById(Guid referralPurchaseId)
		{
			var response = await _referralPurchaseService.GetReferralPurchaseByIdAsync(referralPurchaseId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost("purchases")]
		public async Task<ActionResult<ServiceResponse<ReferralPurchaseDto>>> CreateReferralPurchase([FromBody] ReferralPurchaseDto referralPurchaseDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ReferralPurchaseDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _referralPurchaseService.CreateReferralPurchaseAsync(referralPurchaseDto);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("purchases/{referralPurchaseId}")]
		public async Task<ActionResult<ServiceResponse<bool>>> DeleteReferralPurchase(Guid referralPurchaseId)
		{
			var response = await _referralPurchaseService.DeleteReferralPurchaseAsync(referralPurchaseId);
			return StatusCode(response.StatusCode, response);
		}
	}
}
