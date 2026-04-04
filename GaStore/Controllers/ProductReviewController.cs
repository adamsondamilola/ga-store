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
	public class ProductReviewController : RootController
	{
		private readonly IProductReviewService _reviewService;

		public ProductReviewController(IProductReviewService reviewService)
		{
			_reviewService = reviewService;
		}

		//[Authorize(Roles = CustomRoles.User)]
		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<ProductReviewDto>>>> GetUserProductReviews(
			[FromQuery] Guid? productId,
			[FromQuery] Guid? userId,
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _reviewService.GetPaginatedReviewsAsync(productId, userId, pageNumber, pageSize);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpGet("mine/reviewables")]
		public async Task<ActionResult<PaginatedServiceResponse<List<ReviewableProductDto>>>> GetReviewableProducts(
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10)
		{
			var response = await _reviewService.GetReviewableProductsAsync(UserId, pageNumber, pageSize);
			return StatusCode(response.Status, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		[HttpGet("admin")]
		public async Task<ActionResult<List<ProductReviewDto>>> GetAllReviews()
		{
			var response = await _reviewService.GetAllAsync();
			return Ok(response);
		}

		//[Authorize(Roles = CustomRoles.User)]
		[HttpGet("{reviewId}")]
		public async Task<ActionResult<ServiceResponse<ProductReviewDto>>> GetReviewById(Guid reviewId)
		{
			var response = await _reviewService.GetByIdAsync(reviewId);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpPost]
		public async Task<ActionResult<ServiceResponse<ProductReviewDto>>> CreateReview([FromBody] ProductReviewDto reviewDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductReviewDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _reviewService.CreateAsync(UserId, reviewDto);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpPut("{reviewId}")]
		public async Task<ActionResult<ServiceResponse<ProductReviewDto>>> UpdateReview(Guid reviewId, [FromBody] ProductReviewDto reviewDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<ProductReviewDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _reviewService.UpdateAsync(reviewId, reviewDto);
			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.User)]
		[HttpDelete("{reviewId}")]
		public async Task<ActionResult<ServiceResponse<ProductReviewDto>>> DeleteReview(Guid reviewId)
		{
			var response = await _reviewService.DeleteAsync(reviewId);
			return StatusCode(response.StatusCode, response);
		}
	}
}
