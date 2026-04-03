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
    public class ProductSubTypeController : RootController
    {
        private readonly IProductSubTypeService _productSubTypeService;

        public ProductSubTypeController(IProductSubTypeService productSubTypeService)
        {
            _productSubTypeService = productSubTypeService;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedServiceResponse<List<ProductSubTypeDto>>>> GetProductSubTypes(
            [FromQuery] string? searchTerm = null,
            [FromQuery] Guid? productTypeId = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var response = await _productSubTypeService.GetProductSubTypesAsync(searchTerm, productTypeId, pageNumber, pageSize);

            if (response.Status == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.Status, response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResponse<ProductSubTypeDto>>> GetProductSubType(Guid id)
        {
            var response = await _productSubTypeService.GetProductSubTypeByIdAsync(id);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("by-producttype/{productTypeId}")]
        public async Task<ActionResult<ServiceResponse<List<ProductSubTypeDto>>>> GetProductSubTypesByProductType(Guid productTypeId)
        {
            var response = await _productSubTypeService.GetProductSubTypesByProductTypeAsync(productTypeId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost]
        public async Task<ActionResult<ServiceResponse<ProductSubTypeDto>>> CreateProductSubType([FromBody] CreateProductSubTypeDto productSubTypeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<ProductSubTypeDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _productSubTypeService.CreateProductSubTypeAsync(productSubTypeDto, UserId);

            if (response.StatusCode == 201)
            {
                return CreatedAtAction(nameof(GetProductSubType), new { id = response.Data?.Id }, response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut]
        public async Task<ActionResult<ServiceResponse<ProductSubTypeDto>>> UpdateProductSubType([FromBody] CreateProductSubTypeDto productSubTypeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<ProductSubTypeDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _productSubTypeService.UpdateProductSubTypeAsync(productSubTypeDto, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpDelete("{id}")]
        public async Task<ActionResult<ServiceResponse<ProductSubTypeDto>>> DeleteProductSubType(Guid id)
        {
            var response = await _productSubTypeService.DeleteProductSubTypeAsync(id, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }
    }
}