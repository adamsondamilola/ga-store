using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{

	[ApiController]
	[Route("api/[controller]")]
	public class ProductsController : RootController
	{
		private readonly IProductService _productService;

		public ProductsController(IProductService productService)
		{
			_productService = productService;
		}

		// GET: api/Products (Searchable and Paginated)
		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<ProductDto>>>> GetProducts(
			[FromQuery] string? searchTerm = null,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _productService.GetProductsAsync(searchTerm, pageNumber, pageSize);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.Status, response);
		}

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("admin")]
		public async Task<ActionResult<PaginatedServiceResponse<List<ProductDto>>>> GetProductsAdminAsync(
			[FromQuery] string? searchTerm = null,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10,
    [FromQuery] bool? isAvailable = null,
    [FromQuery] DateTime? startDate = null,
    [FromQuery] DateTime? endDate = null,
    [FromQuery] bool? isApproved = null)
		{
			var response = await _productService.GetProductsAdminAsync(searchTerm, pageNumber, pageSize, isAvailable, startDate, endDate, isApproved);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.Status, response);
		}

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("approval")]
        public async Task<ActionResult<ServiceResponse<bool>>> ProductApproval(Guid productId)
        {
            var response = await _productService.ProductApprovalAsync(productId, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        // GET: api/Products/WithDetails (Searchable and Paginated with Details)
        [HttpGet("with-details")]
		public async Task<ActionResult<PaginatedServiceResponse<List<Product>>>> GetProductsWithDetails(
			[FromQuery] string? searchTerm = null,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _productService.GetProductsWithDetailsAsync(searchTerm, pageNumber, pageSize);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.Status, response);
		}

		// GET: api/Products/5
		[HttpGet("{id}")]
        [EnableRateLimiting("FixedPolicy")]
        public async Task<ActionResult<ServiceResponse<ProductListDto>>> GetProduct(Guid id)
		{
			var response = await _productService.GetProductByIdAsync(id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// POST: api/Products
		[HttpPost()]
		public async Task<ActionResult<ServiceResponse<ProductDto>>> CreateProduct(
			[FromForm] ProductDto productDto) // UserId is passed via header
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _productService.CreateProductAsync(productDto, UserId);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetProduct), new { id = response.Data?.Name }, response);
			}
			else if (response.StatusCode == 200)
			{
				return StatusCode(response.StatusCode, response);
			}


			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// PUT: api/Products/5
		[HttpPut("{id}")]
		public async Task<ActionResult<ServiceResponse<ProductDto>>> UpdateProduct(
			Guid id,
			[FromForm] ProductDto productDto) // UserId is passed via header
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _productService.UpdateProductAsync(id, productDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// DELETE: api/Products/5
		[HttpDelete("{id}")]
		public async Task<ActionResult<ServiceResponse<ProductDto>>> DeleteProduct(
			Guid id) // UserId is passed via header
		{
			var response = await _productService.DeleteProductAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}
	}
}
