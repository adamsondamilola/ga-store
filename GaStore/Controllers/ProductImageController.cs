using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class ProductImageController : RootController
	{
		private readonly IProductImageService _productImageService;
		private readonly ILogger<ProductImageController> _logger;

		public ProductImageController(
			IProductImageService productImageService,
			ILogger<ProductImageController> logger)
		{
			_productImageService = productImageService;
			_logger = logger;
		}

		[HttpGet]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedServiceResponse<List<ProductImageDto>>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<PaginatedServiceResponse<List<ProductImageDto>>>> GetProductImages(
			[FromQuery] Guid variantId,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			if (pageNumber < 1 || pageSize < 1)
			{
				return BadRequest(new PaginatedServiceResponse<List<ProductImageDto>>
				{
					Status = 400,
					Message = "Page number and page size must be greater than 0."
				});
			}

			var response = await _productImageService.GetProductImagesAsync(variantId, pageNumber, pageSize);
			return response.Status == 200 ? Ok(response) : StatusCode(response.Status, response);
		}


		[HttpGet("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductImageDto>))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductImageDto>>> GetProductImage(Guid id)
		{
			var response = await _productImageService.GetProductImageByIdAsync(id);
			return response.StatusCode == 200 ? Ok(response) : StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost]
		[ProducesResponseType(StatusCodes.Status201Created, Type = typeof(ServiceResponse<ProductImageDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductImageDto>>> CreateProductImage([FromForm] ProductImageDto productImageDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductImageDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _productImageService.CreateProductImageAsync(productImageDto, UserId);

			if (response.StatusCode == 201)
			{
				return Ok(response);
			}

			_logger.LogError("Error creating product image: {ErrorMessage}", response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPut("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductImageDto>))]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductImageDto>>> UpdateProductImage(
			Guid id,
			[FromBody] ProductImageDto productImageDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductImageDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _productImageService.UpdateProductImageAsync(id, productImageDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error updating product image with Id: {Id} by UserId: {UserId}. Error: {ErrorMessage}", id, UserId, response.Message);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{id}")]
		[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductImageDto>))]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<ServiceResponse<ProductImageDto>>> DeleteProductImage(Guid id)
		{
			var response = await _productImageService.DeleteProductImageAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			_logger.LogError("Error deleting product image with Id: {Id} by UserId: {UserId}. Error: {ErrorMessage}", id, UserId, response.Message);
			return StatusCode(response.StatusCode, response);
		}

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpDelete("delete-by-url")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<ProductImageDto>))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<ProductImageDto>>> DeleteProductImageByUrl([FromQuery] string imageUrl)
        {
            var response = await _productImageService.DeleteProductImageByUrlAsync(imageUrl, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            _logger.LogError("Error deleting product image with Url: {ImageUrl} by UserId: {UserId}. Error: {ErrorMessage}", imageUrl, UserId, response.Message);
            return StatusCode(response.StatusCode, response);
        }
    }
}