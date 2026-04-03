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
    public class ProductTypeController : RootController
    {
        private readonly IProductTypeService _productTypeService;

        public ProductTypeController(IProductTypeService productTypeService)
        {
            _productTypeService = productTypeService;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedServiceResponse<List<ProductTypeDto>>>> GetProductTypes(
            [FromQuery] string? searchTerm = null,
            [FromQuery] Guid? subCategoryId = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var response = await _productTypeService.GetProductTypesAsync(searchTerm, subCategoryId, pageNumber, pageSize);

            if (response.Status == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.Status, response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResponse<ProductTypeDto>>> GetProductType(Guid id)
        {
            var response = await _productTypeService.GetProductTypeByIdAsync(id);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("by-subcategory/{subCategoryId}")]
        public async Task<ActionResult<ServiceResponse<List<ProductTypeDto>>>> GetProductTypesBySubCategory(Guid subCategoryId)
        {
            var response = await _productTypeService.GetProductTypesBySubCategoryAsync(subCategoryId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost]
        public async Task<ActionResult<ServiceResponse<ProductTypeDto>>> CreateProductType([FromBody] CreateProductTypeDto productTypeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<ProductTypeDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _productTypeService.CreateProductTypeAsync(productTypeDto, UserId);

            if (response.StatusCode == 201)
            {
                return CreatedAtAction(nameof(GetProductType), new { id = response.Data?.Id }, response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut]
        public async Task<ActionResult<ServiceResponse<ProductTypeDto>>> UpdateProductType([FromBody] CreateProductTypeDto productTypeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<ProductTypeDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _productTypeService.UpdateProductTypeAsync(productTypeDto, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpDelete("{id}")]
        public async Task<ActionResult<ServiceResponse<ProductTypeDto>>> DeleteProductType(Guid id)
        {
            var response = await _productTypeService.DeleteProductTypeAsync(id, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }
    }
}