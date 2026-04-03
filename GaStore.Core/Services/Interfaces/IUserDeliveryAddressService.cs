using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
	public interface IUserDeliveryAddressService
	{
		Task<ServiceResponse<List<DeliveryAddressDto>>> GetUserDeliveryAddressesAsync(Guid userId);
		Task<ServiceResponse<DeliveryAddressDto>> GetDeliveryAddressAsync(Guid addressId);
		Task<ServiceResponse<DeliveryAddressDto>> CreateOrUpdateDeliveryAddressAsync(DeliveryAddressDto addressDto);
		Task<ServiceResponse<DeliveryAddressDto>> UpdateDeliveryLocationIdAsync(Guid id, Guid deliveryLocationId);

        Task<ServiceResponse<bool>> DeleteDeliveryAddressAsync(Guid addressId, Guid userId);
		Task<ServiceResponse<bool>> SetPrimaryDeliveryAddressAsync(Guid addressId, Guid userId);
	}
}