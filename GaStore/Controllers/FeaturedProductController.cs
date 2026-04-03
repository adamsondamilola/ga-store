using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System;
using System.Threading.Tasks;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
    [EnableRateLimiting("FixedPolicy")]
    public class FeaturedProductController : RootController
	{
		private readonly IFeaturedProductService _featuredProductService;
		private readonly ILogger<FeaturedProductController> _logger;

		public FeaturedProductController(
			IFeaturedProductService featuredProductService,
			ILogger<FeaturedProductController> logger)
		{
			_featuredProductService = featuredProductService;
			_logger = logger;
		}

		// GET: api/FeaturedProducts?pageNumber=1&pageSize=10
		[HttpGet]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedServiceResponse<List<FeaturedProduct>>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<PaginatedServiceResponse<List<FeaturedProduct>>>> GetFeaturedProducts(
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			if (pageNumber < 1 || pageSize < 1)
			{
				return BadRequest(new PaginatedServiceResponse<List<FeaturedProduct>>
				{
					Status = 400,
					Message = "Page number and page size must be greater than 0."
				});
			}

			var response = await _featuredProductService.GetFeaturedProductsAsync(pageNumber, pageSize);
			return response.Status == 200 ? Ok(response) : StatusCode(response.Status, response);
		}

		// GET: api/FeaturedProducts/5
		[HttpGet("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<FeaturedProduct>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<FeaturedProduct>>> GetFeaturedProduct(Guid id)
		{
			var response = await _featuredProductService.GetFeaturedProductByIdAsync(id);
			return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// POST: api/FeaturedProducts
		[HttpPost]
		[ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<FeaturedProductDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<FeaturedProductDto>>> CreateFeaturedProduct(
			[FromBody] FeaturedProductDto featuredProductDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<FeaturedProductDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _featuredProductService.CreateFeaturedProductAsync(featuredProductDto, UserId);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetFeaturedProduct), new { id = response.Data?.ProductId }, response);
			}

			_logger.LogError("Error creating featured product: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// PUT: api/FeaturedProducts/5
		[HttpPut("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<FeaturedProductDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<FeaturedProductDto>>> UpdateFeaturedProduct(
		Guid id,
			[FromBody] FeaturedProductDto featuredProductDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<FeaturedProductDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _featuredProductService.UpdateFeaturedProductAsync(id, featuredProductDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error updating featured product: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// DELETE: api/FeaturedProducts/5
		[HttpDelete("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<FeaturedProductDto>))]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<FeaturedProductDto>>> DeleteFeaturedProduct(Guid id)
		{
			var response = await _featuredProductService.DeleteFeaturedProductAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error deleting featured product: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}
	}
}