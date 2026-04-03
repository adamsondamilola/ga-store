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
    [EnableRateLimiting("FixedPolicy")]
    public class BrandController : RootController
	{

		private readonly IBrandService _brandService;

		public BrandController(IBrandService brandService)
		{
			_brandService = brandService;
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<Brand>>>> GetBrands(
			[FromQuery] string? searchTerm = null,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _brandService.GetBrandsAsync(searchTerm, pageNumber, pageSize);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet("{id}")]
		public async Task<ActionResult<ServiceResponse<Brand>>> GetBrand(Guid id)
		{
			var response = await _brandService.GetBrandByIdAsync(id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPost]
		public async Task<ActionResult<ServiceResponse<Brand>>> CreateBrand([FromBody] BrandDto brandDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<Brand>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _brandService.CreateBrandAsync(brandDto);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetBrand), new { id = response.Data?.Id }, response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpPut("{id}")]
		public async Task<ActionResult<ServiceResponse<Brand>>> UpdateBrand(Guid id, [FromBody] BrandDto brandDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<Brand>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _brandService.UpdateBrandAsync(id, brandDto);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpDelete("{id}")]
		public async Task<ActionResult<ServiceResponse<Brand>>> DeleteBrand(Guid id)
		{
			var response = await _brandService.DeleteBrandAsync(id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}
}
}
