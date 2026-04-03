using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Users;
using GaStore.Shared;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class PricingTierController : RootController
	{
		private readonly IPricingTierService _pricingTierService;
		private readonly ILogger<PricingTierController> _logger;

		public PricingTierController(
			IPricingTierService pricingTierService,
			ILogger<PricingTierController> logger)
		{
			_pricingTierService = pricingTierService;
			_logger = logger;
		}

		// GET: api/PricingTiers?productId=123e4567-e89b-12d3-a456-426614174000&pageNumber=1&pageSize=10
		[HttpGet]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedServiceResponse<List<PricingTierDto>>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<PaginatedServiceResponse<List<PricingTierDto>>>> GetPricingTiers(
			[FromQuery] Guid productId,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			if (pageNumber < 1 || pageSize < 1)
			{
				return BadRequest(new PaginatedServiceResponse<List<PricingTierDto>>
				{
					Status = 400,
					Message = "Page number and page size must be greater than 0."
				});
			}

			var response = await _pricingTierService.GetPricingTiersAsync(productId, pageNumber, pageSize);
			return response.Status == 200 ? Ok(response) : StatusCode(response.Status, response);
		}

		// GET: api/PricingTiers/5
		[HttpGet("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<PricingTierDto>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<PricingTierDto>>> GetPricingTier(Guid id)
		{
			var response = await _pricingTierService.GetPricingTierByIdAsync(id);
			return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
		}

		// GET: api/PricingTiers/variant/variantId
		[HttpGet("variant/{variantId}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<PricingTierDto>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<PricingTierDto>>> GetPricingTierByProduct(Guid variantId)
		{
			var response = await _pricingTierService.GetPricingTierByVariantIdAsync(variantId);
			return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// POST: api/PricingTiers
		[HttpPost]
		[ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<PricingTierDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<PricingTierDto>>> CreatePricingTier(
			[FromBody] PricingTierDto pricingTierDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<PricingTierDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _pricingTierService.CreatePricingTierAsync(pricingTierDto, UserId);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetPricingTier), new { id = response.Data?.ProductId }, response);
			}

			_logger.LogError("Error creating pricing tier: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// PUT: api/PricingTiers/5
		[HttpPut("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<PricingTierDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<PricingTierDto>>> UpdatePricingTier(
		Guid id,
			[FromBody] PricingTierDto pricingTierDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<PricingTierDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _pricingTierService.UpdatePricingTierAsync(id, pricingTierDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error updating pricing tier: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// DELETE: api/PricingTiers/5
		[HttpDelete("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<PricingTierDto>))]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<PricingTierDto>>> DeletePricingTier(Guid id)
		{
			var response = await _pricingTierService.DeletePricingTierAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error deleting pricing tier: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}
	}
}