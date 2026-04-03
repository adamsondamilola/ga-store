using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ReferralDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class ReferralCommissionController : RootController
	{
		private readonly IReferralCommissionService _referralCommissionService;

		public ReferralCommissionController(IReferralCommissionService referralCommissionService)
		{
			_referralCommissionService = referralCommissionService;
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<ReferralCommissionDto>>>> GetReferralCommissions(
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _referralCommissionService.GetPaginatedCommissionsAsync(pageNumber, pageSize);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpGet("{commissionId}")]
		public async Task<ActionResult<ServiceResponse<ReferralCommissionDto>>> GetReferralCommissionById(Guid commissionId)
		{
			var response = await _referralCommissionService.GetCommissionByIdAsync(commissionId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost]
		public async Task<ActionResult<ServiceResponse<ReferralCommissionDto>>> CreateReferralCommission([FromBody] ReferralCommissionDto commissionDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ReferralCommissionDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _referralCommissionService.CreateCommissionAsync(commissionDto, UserId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPut("{commissionId}")]
		public async Task<ActionResult<ServiceResponse<ReferralCommissionDto>>> UpdateReferralCommission(Guid commissionId, [FromBody] ReferralCommissionDto commissionDto)
		{
			var response = await _referralCommissionService.UpdateCommissionAsync(commissionId, commissionDto, UserId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{commissionId}")]
		public async Task<ActionResult<ServiceResponse<bool>>> DeleteReferralCommission(Guid commissionId)
		{
			var response = await _referralCommissionService.DeleteCommissionAsync(commissionId, UserId);
			return StatusCode(response.StatusCode, response);
		}
	}
}
