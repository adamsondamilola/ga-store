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
	public class ProductVariantController : RootController
	{
		private readonly IProductVariantService _productVariantService;
		private readonly ILogger<ProductVariantController> _logger;

		public ProductVariantController(
			IProductVariantService productVariantService,
			ILogger<ProductVariantController> logger)
		{
			_productVariantService = productVariantService;
			_logger = logger;
		}

		// GET: api/ProductVariants?productId=123e4567-e89b-12d3-a456-426614174000&pageNumber=1&pageSize=10
		[HttpGet]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedServiceResponse<List<ProductVariantDto>>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<PaginatedServiceResponse<List<ProductVariantDto>>>> GetProductVariants(
			[FromQuery] Guid productId,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			if (pageNumber < 1 || pageSize < 1)
			{
				return BadRequest(new PaginatedServiceResponse<List<ProductVariantDto>>
				{
					Status = 400,
					Message = "Page number and page size must be greater than 0."
				});
			}

			var response = await _productVariantService.GetProductVariantsAsync(productId, pageNumber, pageSize);
			return response.Status == 200 ? Ok(response) : StatusCode(response.Status, response);
		}

		// GET: api/ProductVariants/5
		[HttpGet("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductVariantDto>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductVariantDto>>> GetProductVariant(Guid id)
		{
			var response = await _productVariantService.GetProductVariantByIdAsync(id);
			return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
		}

		// GET: api/ProductVariants/by-product/123e4567-e89b-12d3-a456-426614174000
		[HttpGet("by-product/{productId}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<List<ProductVariantDto>>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<List<ProductVariantDto>>>> GetProductVariantByProductId(Guid productId)
		{
			var response = await _productVariantService.GetProductVariantByProductIdAsync(productId);
			return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// POST: api/ProductVariants
		[HttpPost]
		[ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<ProductVariantDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductVariantDto>>> CreateProductVariant(
			[FromBody] ProductVariantDto productVariantDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductVariantDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _productVariantService.CreateProductVariantAsync(productVariantDto, UserId);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetProductVariant), new { productId = response.Data?.ProductId }, response);
			}

			_logger.LogError("Error creating product variant: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// PUT: api/ProductVariants/5
		[HttpPut("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductVariantDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductVariantDto>>> UpdateProductVariant(
		Guid id,
			[FromBody] ProductVariantDto productVariantDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductVariantDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _productVariantService.UpdateProductVariantAsync(id, productVariantDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error updating product variant: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// DELETE: api/ProductVariants/5
		[HttpDelete("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductVariantDto>))]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductVariantDto>>> DeleteProductVariant(Guid id)
		{
			var response = await _productVariantService.DeleteProductVariantAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error deleting product variant: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}
	}
}