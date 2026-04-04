using System;

namespace GaStore.Data.Dtos.ProductsDto
{
	public class ReviewableProductDto
	{
		public Guid ProductId { get; set; }
		public Guid? OrderId { get; set; }
		public string? ProductName { get; set; }
		public string? ProductImageUrl { get; set; }
		public DateTime? CompletedOn { get; set; }
		public string? ShippingStatus { get; set; }
		public bool HasReview { get; set; }
		public ProductReviewDto? Review { get; set; }
	}
}
