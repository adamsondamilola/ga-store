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
    public class TagController : RootController
    {
        private readonly ITagService _tagService;

        public TagController(ITagService tagService)
        {
            _tagService = tagService;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedServiceResponse<List<TagDto>>>> GetTags(
            [FromQuery] string? searchTerm = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var response = await _tagService.GetTagsAsync(searchTerm, pageNumber, pageSize);

            if (response.Status == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.Status, response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResponse<TagDto>>> GetTag(Guid id)
        {
            var response = await _tagService.GetTagByIdAsync(id);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("search")]
        public async Task<ActionResult<ServiceResponse<List<TagDto>>>> SearchTags([FromQuery] string searchTerm)
        {
            var response = await _tagService.SearchTagsAsync(searchTerm);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("product/{productId}")]
        public async Task<ActionResult<ServiceResponse<List<TagDto>>>> GetTagsByProduct(Guid productId)
        {
            var response = await _tagService.GetTagsByProductAsync(productId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("{tagId}/products")]
        public async Task<ActionResult<ServiceResponse<List<ProductDto>>>> GetProductsByTag(Guid tagId)
        {
            var response = await _tagService.GetProductsByTagAsync(tagId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost]
        public async Task<ActionResult<ServiceResponse<TagDto>>> CreateTag([FromBody] TagDto tagDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<TagDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _tagService.CreateTagAsync(tagDto, UserId);

            if (response.StatusCode == 201)
            {
                return CreatedAtAction(nameof(GetTag), new { id = response.Data?.Id }, response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut]
        public async Task<ActionResult<ServiceResponse<TagDto>>> UpdateTag([FromBody] TagDto tagDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<TagDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _tagService.UpdateTagAsync(tagDto, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpDelete("{id}")]
        public async Task<ActionResult<ServiceResponse<TagDto>>> DeleteTag(Guid id)
        {
            var response = await _tagService.DeleteTagAsync(id, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost("assign-to-product")]
        public async Task<ActionResult<ServiceResponse<TaggedProductDto>>> AddTagToProduct([FromBody] TaggedProductDto taggedProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<TaggedProductDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _tagService.AddTagToProductAsync(taggedProductDto, UserId);

            if (response.StatusCode == 201)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPost("bulk-assign-to-product")]
        public async Task<ActionResult<ServiceResponse<List<TaggedProductDto>>>> AddTagToProduct([FromBody] List<TaggedProductDto> taggedProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<List<TaggedProductDto>>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _tagService.AddBulkTagToProductAsync(taggedProductDto, UserId);

            if (response.StatusCode == 201)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.Admin)]
        [HttpDelete("remove-from-product")]
        public async Task<ActionResult<ServiceResponse<TaggedProductDto>>> RemoveTagFromProduct(
            [FromQuery] Guid productId,
            [FromQuery] Guid tagId)
        {
            var response = await _tagService.RemoveTagFromProductAsync(productId, tagId, UserId);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }
    }
}