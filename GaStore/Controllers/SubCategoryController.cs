using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Implementations;
using GaStore.Core.Services.Interfaces;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;
using GaStore.Data.Entities.Products;
using GaStore.Shared;
using GaStore.Data.Dtos.ProductsDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class SubCategoryController : RootController
	{
		private readonly ISubCategoryService _categoryService;

		public SubCategoryController(ISubCategoryService categoryService)
		{
			_categoryService = categoryService;
		}

		//[Authorize(Roles = CustomRoles.User)]
		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<Brand>>>> GetSubCategories(
			[FromQuery] string? searchTerm = null,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _categoryService.GetSubCategoriesAsync(searchTerm, pageNumber, pageSize);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.Status, response);
		}

		//[Authorize(Roles = CustomRoles.User)]
		// GET: api/SubCategories/5
		[HttpGet("{id}")]
		public async Task<ActionResult<ServiceResponse<SubCategoryDto>>> GetSubCategory(Guid id)
		{
			var response = await _categoryService.GetSubCategoryByIdAsync(id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// POST: api/SubCategories
		[HttpPost]
		public async Task<ActionResult<ServiceResponse<SubCategoryDto>>> CreateSubCategory(
			[FromForm] SubCategoryDto categoryDto) // UserId is passed via header
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<SubCategoryDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _categoryService.CreateSubCategoryAsync(categoryDto, UserId);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetSubCategory), new { id = response.Data?.Name }, response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// PUT: api/SubCategories/5
		[HttpPut()]
		public async Task<ActionResult<ServiceResponse<SubCategoryDto>>> UpdateSubCategory([FromForm] SubCategoryDto categoryDto) // UserId is passed via header
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<SubCategoryDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _categoryService.UpdateSubCategoryAsync(categoryDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// DELETE: api/SubCategories/5
		[HttpDelete("{id}")]
		public async Task<ActionResult<ServiceResponse<SubCategoryDto>>> DeleteSubCategory(
			Guid id) // UserId is passed via header
		{
			var response = await _categoryService.DeleteSubCategoryAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}


	}
}
