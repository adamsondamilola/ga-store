using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Entities.Products;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations
{
	public class ProductReviewService : IProductReviewService
	{
		private readonly ILogger<ProductReviewService> _logger;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly DatabaseContext _context;

		public ProductReviewService(DatabaseContext context, ILogger<ProductReviewService> logger, IUnitOfWork unitOfWork, IMapper mapper)
		{
			_context = context;
			_logger = logger;
			_unitOfWork = unitOfWork;
			_mapper = mapper;
		}

		public async Task<ServiceResponse<ProductReviewDto>> GetByIdAsync(Guid id)
		{
			var response = new ServiceResponse<ProductReviewDto>();

			try
			{
				var review = await _context.ProductReviews
					.Include(r => r.Product)
					.Include(r => r.User)
					.FirstOrDefaultAsync(r => r.Id == id);

				if (review == null)
				{
					response.StatusCode = 404;
					response.Message = "Review not found.";
					return response;
				}

				response.Data = MapToDto(review);
				response.StatusCode = 200;
				response.Message = "Review retrieved successfully.";
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error fetching review by ID: {ex.Message}");
				response.StatusCode = 500;
				response.Message = "An error occurred while retrieving the review.";
			}

			return response;
		}

		public async Task<List<ProductReviewDto>> GetAllAsync()
		{
			return await _context.ProductReviews
				.Include(r => r.Product)
				.Include(r => r.User)
				.Select(r => MapToDto(r))
				.ToListAsync();
		}

		public async Task<PaginatedServiceResponse<List<ProductReviewDto>>> GetPaginatedReviewsAsync(Guid? productId, Guid? userId, int pageNumber, int pageSize)
		{
			var response = new PaginatedServiceResponse<List<ProductReviewDto>>();

			try
			{
				var query = _context.ProductReviews.AsQueryable();

				if (productId.HasValue)
					query = query.Where(r => r.ProductId == productId);

				if (userId.HasValue)
					query = query.Where(r => r.UserId == userId);

				// Calculate total records and average rating in a single query
				var statsQuery = query.Select(r => r.Rating);
				var totalRecords = await statsQuery.CountAsync();
				var averageRating = await statsQuery.AverageAsync(r => (double?)r) ?? 0;

				var reviews = await query
					.OrderByDescending(r => r.DateCreated)
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.Select(r => new ProductReviewDto
					{
						Id = r.Id,
						Rating = r.Rating,
						Title = r.Title,
						Comment = r.Comment,
						User = r.User,
						DateCreated = r.DateCreated,
						Product = new Product
						{
							Name = r.Product.Name,
							Id = r.Product.Id
						}
						// ... include all other properties you need
					})
					.ToListAsync();

				response.Status = 200;
				response.Message = "Reviews retrieved successfully.";
				response.Data = reviews;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
				response.Metadata = new Dictionary<string, object>
		{
			{ "AverageRating", Math.Round(averageRating, 2) }
		};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error fetching paginated reviews");
				response.Status = 500;
				response.Message = "An error occurred while retrieving reviews.";
			}

			return response;
		}

		public async Task<ServiceResponse<ProductReviewDto>> CreateAsync(Guid userId, ProductReviewDto dto)
		{
			var response = new ServiceResponse<ProductReviewDto>();

			try
			{
				var review = new ProductReview
				{
					Id = Guid.NewGuid(),
					ProductId = dto.ProductId,
					UserId = userId,
					Rating = dto.Rating,
					Title = dto.Title,
					Comment = dto.Comment,
					DateCreated = DateTime.UtcNow
				};

				//check if user has purchased goods
				var order = await _unitOfWork.OrderItemRepository.Get(x => x.ProductId == dto.ProductId && x.UserId == userId); 
				if(order == null)
				{
					response.StatusCode = 400;
					response.Message = "Sorry, you can't review product that you have not purchased.";
					return response;
				}

				await _unitOfWork.ProductReviewRepository.Add(review);
				await _unitOfWork.CompletedAsync(userId);

				response.StatusCode = 201;
				response.Message = "Review created successfully.";
				response.Data = MapToDto(review);
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error creating review: {ex.Message}");
				response.StatusCode = 500;
				response.Message = "An error occurred while creating the review.";
			}

			return response;
		}

		public async Task<ServiceResponse<ProductReviewDto>> UpdateAsync(Guid id, ProductReviewDto dto)
		{
			var response = new ServiceResponse<ProductReviewDto>();

			try
			{
				var review = await _context.ProductReviews.FindAsync(id);

				if (review == null)
				{
					response.StatusCode = 404;
					response.Message = "Review not found.";
					return response;
				}

				review.Rating = dto.Rating;
				review.Comment = dto.Comment;
				review.DateUpdated = DateTime.UtcNow;

				await _context.SaveChangesAsync();

				response.StatusCode = 200;
				response.Message = "Review updated successfully.";
				response.Data = MapToDto(review);
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error updating review: {ex.Message}");
				response.StatusCode = 500;
				response.Message = "An error occurred while updating the review.";
			}

			return response;
		}

		public async Task<ServiceResponse<ProductReviewDto>> DeleteAsync(Guid id)
		{
			var response = new ServiceResponse<ProductReviewDto>();

			try
			{
				var review = await _context.ProductReviews.FindAsync(id);

				if (review == null)
				{
					response.StatusCode = 404;
					response.Message = "Review not found.";
					return response;
				}

				_context.ProductReviews.Remove(review);
				await _context.SaveChangesAsync();

				response.StatusCode = 200;
				response.Message = "Review deleted successfully.";
				response.Data = MapToDto(review);
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error deleting review: {ex.Message}");
				response.StatusCode = 500;
				response.Message = "An error occurred while deleting the review.";
			}

			return response;
		}

		private ProductReviewDto MapToDto(ProductReview review)
		{
			return new ProductReviewDto
			{
				Id = review.Id,
				ProductId = review.ProductId,
				UserId = review.UserId,
				Rating = review.Rating,
				Comment = review.Comment
			};
		}
	}
}
