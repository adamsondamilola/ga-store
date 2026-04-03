using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.CheckOutDto;
using GaStore.Shared;
using GaStore.Shared.Constants;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : RootController
    {
        private readonly ICartService _cartService;
        private readonly ILogger<CartController> _logger;

        public CartController(
            ICartService cartService,
            ILogger<CartController> logger)
        {
            _cartService = cartService;
            _logger = logger;
        }

        [Authorize]
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<CartDto>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ServiceResponse<CartDto>>> GetCart()
        {
            var response = await _cartService.GetCartAsync(UserId);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize]
        [HttpPost("add")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<CartDto>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ServiceResponse<CartDto>>> AddToCart([FromBody] AddToCartDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<CartDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _cartService.AddToCartAsync(UserId, dto);

            if (response.StatusCode != 200)
            {
                _logger.LogError("Failed to add item to cart for User {UserId}. Error: {Message}", UserId, response.Message);
            }

            return StatusCode(response.StatusCode, response);
        }


        [Authorize]
        [HttpPut("update")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<CartDto>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ServiceResponse<CartDto>>> UpdateCartItem([FromBody] UpdateCartItemDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<CartDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _cartService.UpdateCartItemAsync(UserId, dto);

            if (response.StatusCode != 200)
            {
                _logger.LogError("Failed to update cart item for User {UserId}. Error: {Message}", UserId, response.Message);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize]
        [HttpPost("sync")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<CartDto>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ServiceResponse<CartDto>>> SyncCart([FromBody] SyncCartDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<CartDto>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _cartService.SyncCartAsync(UserId, dto.Items ?? []);
            return StatusCode(response.StatusCode, response);
        }


        [Authorize]
        [HttpDelete("remove/{cartItemId}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<bool>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ServiceResponse<bool>>> RemoveCartItem(Guid cartItemId)
        {
            var response = await _cartService.RemoveFromCartAsync(UserId, cartItemId);

            if (response.StatusCode != 200)
            {
                _logger.LogError("Failed to remove CartItem {CartItemId} for User {UserId}. Error: {Message}",
                    cartItemId, UserId, response.Message);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize]
        [HttpDelete("clear")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ServiceResponse<bool>))]
        public async Task<ActionResult<ServiceResponse<bool>>> ClearCart()
        {
            var response = await _cartService.ClearCartAsync(UserId);

            if (response.StatusCode != 200)
            {
                _logger.LogError("Failed to clear cart for User {UserId}. Error: {Message}",
                    UserId, response.Message);
            }

            return StatusCode(response.StatusCode, response);
        }
    }
}
