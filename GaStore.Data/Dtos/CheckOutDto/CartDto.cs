using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.CheckOutDto
{
    public class CartDto
    {
        public Guid UserId { get; set; }
        public List<CartItemDto> Items { get; set; } = new();
        public decimal SubTotal { get; set; }
        public decimal TotalAfterDiscount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal Tax { get; set; }
        public double DeliveryDays { get; set; }
        public string? CouponCode { get; set; }
    }

    public class CartItemDto
    {
        public Guid CartItemId { get; set; }
        public Guid ProductId { get; set; }
        public Guid VariantId { get; set; }
        public int Quantity { get; set; }
        public decimal PricePerUnit { get; set; }
        public decimal LineTotal => Quantity * PricePerUnit;

        public string ProductName { get; set; }
        public string VariantName { get; set; }
        public string? ProductImageUrl { get; set; }
        public int StockQuantity { get; set; }
        public decimal? Weight { get; set; }
    }

    public class AddToCartDto
    {
        public Guid VariantId { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdateCartItemDto
    {
        public Guid CartItemId { get; set; }
        public int Quantity { get; set; }
    }

    public class SyncCartDto
    {
        public List<AddToCartDto> Items { get; set; } = new();
    }
}
