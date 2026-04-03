using Microsoft.Extensions.Logging;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.CheckOutDto;
using GaStore.Data.Entities.Orders;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations
{
    public class CartService : ICartService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<CartService> _logger;
        private readonly ICouponService _couponService;
        private readonly IShippingService _shippingService;

        public CartService(
            IUnitOfWork unitOfWork,
            ILogger<CartService> logger,
            ICouponService couponService,
            IShippingService shippingService)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _couponService = couponService;
            _shippingService = shippingService;
        }

        public async Task<ServiceResponse<CartDto>> GetCartAsync(Guid userId)
        {
            var response = new ServiceResponse<CartDto>();

            var cart = await GetOrCreateCartAsync(userId, false);
            if (cart == null)
            {
                response.StatusCode = 200;
                response.Message = "Cart retrieved successfully.";
                response.Data = new CartDto { UserId = userId };
                return response;
            }

            response.Data = await BuildCartDto(cart, userId);
            response.StatusCode = 200;
            response.Message = "Cart retrieved successfully.";
            return response;
        }

        public async Task<ServiceResponse<CartDto>> AddToCartAsync(Guid userId, AddToCartDto dto)
        {
            var response = new ServiceResponse<CartDto>();

            // Validate variant
            var variant = await _unitOfWork.ProductVariantRepository.GetById(dto.VariantId);
            if (variant == null || variant.StockQuantity < dto.Quantity)
            {
                response.StatusCode = 400;
                response.Message = "Invalid or unavailable variant.";
                return response;
            }

            // Get or create cart
            var cart = await GetOrCreateCartAsync(userId, true);
            var isNewCart = cart == null;
            cart ??= new Cart { UserId = userId, Items = new List<CartItem>() };

            // Check if item already exists
            var existingItem = cart.Items.FirstOrDefault(i => i.VariantId == dto.VariantId);
            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
            }
            else
            {
                cart.Items.Add(new CartItem
                {
                    VariantId = dto.VariantId,
                    Quantity = dto.Quantity
                });
            }

            try
            {
                await PersistCartAsync(cart, isNewCart);
                await _unitOfWork.CompletedAsync(userId);

                response.Data = await BuildCartDto(cart, userId);
                response.StatusCode = 200;
                response.Message = "Item added to cart.";
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding item to cart for User {UserId}", userId);
                response.StatusCode = 500;
                response.Message = "An error occurred while adding item to cart.";
                return response;
            }
        }

        public async Task<ServiceResponse<CartDto>> UpdateCartItemAsync(Guid userId, UpdateCartItemDto dto)
        {
            var response = new ServiceResponse<CartDto>();

            var cart = await GetOrCreateCartAsync(userId, true);
            if (cart == null)
            {
                response.StatusCode = 404;
                response.Message = "Cart not found.";
                return response;
            }

            var item = cart.Items.FirstOrDefault(c => c.Id == dto.CartItemId);
            if (item == null)
            {
                response.StatusCode = 400;
                response.Message = "Cart item not found.";
                return response;
            }

            // Validate stock
            var variant = await _unitOfWork.ProductVariantRepository.GetById(item.VariantId);
            if (variant == null || variant.StockQuantity < dto.Quantity)
            {
                response.StatusCode = 400;
                response.Message = "Insufficient stock.";
                return response;
            }

            item.Quantity = dto.Quantity;
            if (item.Quantity <= 0)
            {
                cart.Items.Remove(item);
            }

            await _unitOfWork.CompletedAsync(userId);

            response.Data = await BuildCartDto(cart, userId);
            response.StatusCode = 200;
            response.Message = "Cart updated.";
            return response;
        }

        public async Task<ServiceResponse<CartDto>> SyncCartAsync(Guid userId, List<AddToCartDto> items)
        {
            var response = new ServiceResponse<CartDto>();

            var cart = await GetOrCreateCartAsync(userId, true);
            var isNewCart = cart == null;
            cart ??= new Cart { UserId = userId, Items = new List<CartItem>() };

            foreach (var dto in items.Where(x => x.Quantity > 0))
            {
                var variant = await _unitOfWork.ProductVariantRepository.GetById(dto.VariantId);
                if (variant == null || variant.StockQuantity <= 0)
                {
                    continue;
                }

                var finalQuantity = Math.Min(dto.Quantity, variant.StockQuantity);
                var existingItem = cart.Items.FirstOrDefault(i => i.VariantId == dto.VariantId);

                if (existingItem != null)
                {
                    existingItem.Quantity = Math.Max(existingItem.Quantity, finalQuantity);
                }
                else
                {
                    cart.Items.Add(new CartItem
                    {
                        VariantId = dto.VariantId,
                        Quantity = finalQuantity
                    });
                }
            }

            await PersistCartAsync(cart, isNewCart);
            await _unitOfWork.CompletedAsync(userId);

            response.Data = await BuildCartDto(cart, userId);
            response.StatusCode = 200;
            response.Message = "Cart synchronized successfully.";
            return response;
        }

        public async Task<ServiceResponse<bool>> RemoveFromCartAsync(Guid userId, Guid cartItemId)
        {
            var response = new ServiceResponse<bool>();

            var cart = await GetOrCreateCartAsync(userId, true);
            if (cart == null)
            {
                response.StatusCode = 404;
                response.Message = "Cart not found.";
                return response;
            }

            var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId || i.VariantId == cartItemId);
            if (item == null)
            {
                response.StatusCode = 400;
                response.Message = "Item not found.";
                return response;
            }

            cart.Items.Remove(item);

            await _unitOfWork.CompletedAsync(userId);

            response.StatusCode = 200;
            response.Data = true;
            response.Message = "Item removed.";
            return response;
        }

        public async Task<ServiceResponse<bool>> ClearCartAsync(Guid userId)
        {
            var cart = await GetOrCreateCartAsync(userId, true);

            if (cart != null)
            {
                cart.Items.Clear();
                await _unitOfWork.CompletedAsync(userId);
            }

            return new()
            {
                StatusCode = 200,
                Data = true,
                Message = "Cart cleared."
            };
        }

        private async Task<Cart?> GetOrCreateCartAsync(Guid userId, bool trackChanges)
        {
            return await _unitOfWork.CartRepository.Get(
                x => x.UserId == userId,
                includeProperties: "Items",
                trackChanges: trackChanges);
        }

        private async Task PersistCartAsync(Cart cart, bool isNewCart)
        {
            if (isNewCart)
            {
                await _unitOfWork.CartRepository.Add(cart);
            }
        }

        private async Task<CartDto> BuildCartDto(Cart cart, Guid userId)
        {
            decimal subtotal = 0;

            var dto = new CartDto
            {
                UserId = userId
            };

            foreach (var item in cart.Items)
            {
                // Pricing tiers
                var tiers = await _unitOfWork.PricingTierRepository.GetAllAsync(
                    p => p.VariantId == item.VariantId,
                    q => q.OrderByDescending(t => t.MinQuantity)
                );

                var tier = tiers.FirstOrDefault(t => item.Quantity >= t.MinQuantity)
                           ?? tiers.Last();

                var productVariant = await _unitOfWork.ProductVariantRepository
                    .GetByIdIncluding(item.VariantId, "Product.Images,Images");

                dto.Items.Add(new CartItemDto
                {
                    CartItemId = item.Id,
                    VariantId = item.VariantId,
                    ProductId = tier.ProductId,
                    Quantity = item.Quantity,
                    PricePerUnit = tier.PricePerUnit,
                    ProductName = productVariant?.Product?.Name,
                    VariantName = productVariant?.Name,
                    ProductImageUrl = productVariant?.Images?.FirstOrDefault()?.ImageUrl
                        ?? productVariant?.Product?.Images?.FirstOrDefault()?.ImageUrl,
                    StockQuantity = productVariant?.StockQuantity ?? 0,
                    Weight = productVariant?.Weight
                });

                subtotal += item.Quantity * tier.PricePerUnit;
            }

            dto.SubTotal = subtotal;

            // Shipping estimation
            /*
            dto.DeliveryFee = await _shippingService.EstimateDeliveryFeeAsync(userId, cart.Items);
            dto.DeliveryDays = await _shippingService.GetDeliveryDaysAsync();*/

            return dto;
        }
    }
}
