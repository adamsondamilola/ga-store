using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.CheckOutDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface ICartService
    {
        Task<ServiceResponse<CartDto>> GetCartAsync(Guid userId);
        Task<ServiceResponse<CartDto>> AddToCartAsync(Guid userId, AddToCartDto dto);
        Task<ServiceResponse<CartDto>> UpdateCartItemAsync(Guid userId, UpdateCartItemDto dto);
        Task<ServiceResponse<CartDto>> SyncCartAsync(Guid userId, List<AddToCartDto> items);
        Task<ServiceResponse<bool>> RemoveFromCartAsync(Guid userId, Guid cartItemId);
        Task<ServiceResponse<bool>> ClearCartAsync(Guid userId);
    }
}
