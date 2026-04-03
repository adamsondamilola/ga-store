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
	public class ProductSpecificationController : RootController
	{
		private readonly IProductSpecificationService _productSpecificationService;
		private readonly ILogger<ProductSpecificationController> _logger;

		public ProductSpecificationController(
			IProductSpecificationService productSpecificationService,
			ILogger<ProductSpecificationController> logger)
		{
			_productSpecificationService = productSpecificationService;
			_logger = logger;
		}

		// GET: api/ProductSpecifications?productId=123e4567-e89b-12d3-a456-426614174000&pageNumber=1&pageSize=10
		[HttpGet]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedServiceResponse<List<ProductSpecificationDto>>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<PaginatedServiceResponse<List<ProductSpecificationDto>>>> GetProductSpecifications(
			[FromQuery] Guid productId,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			if (pageNumber < 1 || pageSize < 1)
			{
				return BadRequest(new PaginatedServiceResponse<List<ProductSpecificationDto>>
				{
					Status = 400,
					Message = "Page number and page size must be greater than 0."
				});
			}

			var response = await _productSpecificationService.GetProductSpecificationsAsync(productId, pageNumber, pageSize);
			return response.Status == 200 ? Ok(response) : StatusCode(response.Status, response);
		}

		// GET: api/ProductSpecifications/5
		[HttpGet("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductSpecificationDto>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductSpecificationDto>>> GetProductSpecification(Guid id)
		{
			var response = await _productSpecificationService.GetProductSpecificationByIdAsync(id);
			return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// POST: api/ProductSpecifications
		[HttpPost]
		[ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<ProductSpecificationDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductSpecificationDto>>> CreateProductSpecification(
			[FromBody] ProductSpecificationDto productSpecificationDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductSpecificationDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _productSpecificationService.CreateProductSpecificationAsync(productSpecificationDto, UserId);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetProductSpecification), new { id = response.Data?.ProductId }, response);
			}

			_logger.LogError("Error creating product specification: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// PUT: api/ProductSpecifications/5
		[HttpPut("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductSpecificationDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductSpecificationDto>>> UpdateProductSpecification(
		Guid id,
			[FromBody] ProductSpecificationDto productSpecificationDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductSpecificationDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _productSpecificationService.UpdateProductSpecificationAsync(id, productSpecificationDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error updating product specification: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// DELETE: api/ProductSpecifications/5
		[HttpDelete("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductSpecificationDto>))]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductSpecificationDto>>> DeleteProductSpecification(Guid id)
		{
			var response = await _productSpecificationService.DeleteProductSpecificationAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error deleting product specification: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}
	}
}