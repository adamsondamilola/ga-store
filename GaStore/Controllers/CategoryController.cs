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
	public class CategoryController : RootController
	{
		private readonly ICategoryService _categoryService;

		public CategoryController(ICategoryService categoryService)
		{
			_categoryService = categoryService;
		}

		//[Authorize(Roles = CustomRoles.User)]
		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<Brand>>>> GetCategories(
			[FromQuery] string? searchTerm = null,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _categoryService.GetCategoriesAsync(searchTerm, pageNumber, pageSize);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.Status, response);
		}

		//[Authorize(Roles = CustomRoles.User)]
		// GET: api/Categories/5
		[HttpGet("{id}")]
		public async Task<ActionResult<ServiceResponse<CategoryDto>>> GetCategory(Guid id)
		{
			var response = await _categoryService.GetCategoryByIdAsync(id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// POST: api/Categories
		[HttpPost]
		public async Task<ActionResult<ServiceResponse<CategoryDto>>> CreateCategory(
			[FromForm] CategoryDto categoryDto) // UserId is passed via header
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<CategoryDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _categoryService.CreateCategoryAsync(categoryDto, UserId);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetCategory), new { id = response.Data?.Name }, response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// PUT: api/Categories/5
		[HttpPut()]
		public async Task<ActionResult<ServiceResponse<CategoryDto>>> UpdateCategory([FromForm] CategoryDto categoryDto) 
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<CategoryDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _categoryService.UpdateCategoryAsync(categoryDto, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// DELETE: api/Categories/5
		[HttpDelete("{id}")]
		public async Task<ActionResult<ServiceResponse<CategoryDto>>> DeleteCategory(
			Guid id) // UserId is passed via header
		{
			var response = await _categoryService.DeleteCategoryAsync(id, UserId);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.StatusCode, response);
		}

        [HttpGet("full-hierarchy")]
        public async Task<ActionResult<ServiceResponse<List<CategoryWithHierarchyDto>>>> GetCategoriesWithFullHierarchy()
        {
            var response = await _categoryService.GetCategoriesWithFullHierarchyAsync();

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

    }
}
