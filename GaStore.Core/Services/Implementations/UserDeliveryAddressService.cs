using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Utilities;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Users;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class UserDeliveryAddressService : IUserDeliveryAddressService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<UserDeliveryAddressService> _logger;
		private readonly IMapper _mapper;

		public UserDeliveryAddressService(
			IUnitOfWork unitOfWork,
			ILogger<UserDeliveryAddressService> logger,
			IMapper mapper)
		{
			_unitOfWork = unitOfWork;
			_logger = logger;
			_mapper = mapper;
		}

		// Get all delivery addresses for a user
		public async Task<ServiceResponse<List<DeliveryAddressDto>>> GetUserDeliveryAddressesAsync(Guid userId)
		{
			var response = new ServiceResponse<List<DeliveryAddressDto>>();

			try
			{
				// Validate input
				if (userId == Guid.Empty)
				{
					response.StatusCode = 400;
					response.Message = "Invalid user ID";
					return response;
				}

				// Get data
				var addresses = await _unitOfWork.DeliveryAddressRepository
					.GetAll(x => x.UserId == userId)
					.ConfigureAwait(false);

				// Map to DTO
				response.Data = _mapper.Map<List<DeliveryAddressDto>>(addresses);
				response.StatusCode = 200;
				response.Message = addresses.Any()
					? "Delivery addresses retrieved successfully"
					: "No delivery addresses found for this user";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving delivery addresses for user {UserId}", userId);
				response.StatusCode = 500;
				response.Message = $"An error occurred: {ex.Message}";
			}

			return response;
		}

		// Get a specific delivery address by ID
		public async Task<ServiceResponse<DeliveryAddressDto>> GetDeliveryAddressAsync(Guid addressId)
		{
			var response = new ServiceResponse<DeliveryAddressDto>();

			try
			{
				// Validate input
				if (addressId == Guid.Empty)
				{
					response.StatusCode = 400;
					response.Message = "Invalid address ID";
					return response;
				}

				// Get data
				var address = await _unitOfWork.DeliveryAddressRepository
					.Get(x => x.Id == addressId)
					.ConfigureAwait(false);

				// Handle null result
				if (address == null)
				{
					response.StatusCode = 404;
					response.Message = $"Delivery address not found for ID: {addressId}";
					return response;
				}

				// Map to DTO
				response.Data = _mapper.Map<DeliveryAddressDto>(address);
				response.StatusCode = 200;
				response.Message = "Delivery address retrieved successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving delivery address {AddressId}", addressId);
				response.StatusCode = 500;
				response.Message = $"An error occurred: {ex.Message}";
			}

			return response;
		}

        // Create or update a delivery address
        public async Task<ServiceResponse<DeliveryAddressDto>> CreateOrUpdateDeliveryAddressAsync(DeliveryAddressDto addressDto)
        {
            var response = new ServiceResponse<DeliveryAddressDto>();

            try
            {
                response.StatusCode = 400;

                // 1. Basic Input Validation
                if (addressDto.UserId == Guid.Empty)
                {
                    response.Message = "Invalid user ID";
                    return response;
                }

                if (string.IsNullOrWhiteSpace(addressDto.Address))
                {
                    response.Message = "Street Address is required.";
                    return response;
                }

                if (string.IsNullOrWhiteSpace(addressDto.City))
                {
                    response.Message = "City is required.";
                    return response;
                }

                if (string.IsNullOrWhiteSpace(addressDto.State))
                {
                    response.Message = "State is required.";
                    return response;
                }

                if (string.IsNullOrWhiteSpace(addressDto.PhoneNumber))
                {
                    response.Message = "Phone number is required.";
                    return response;
                }

                // 2. Phone Validation
                string ckPhone = CheckInput.PhoneNumber(addressDto.PhoneNumber);
                if (ckPhone != null)
                {
                    response.Message = ckPhone;
                    return response;
                }

                // ---------------------------------------------------------
                // 3. CHECK FOR DUPLICATES
                // ---------------------------------------------------------
                // We look for an address that matches the User, Address, City, and State.
                // We trim whitespace and ignore case to ensure accuracy.
                var duplicateAddress = await _unitOfWork.DeliveryAddressRepository.Get(x =>
                    x.UserId == addressDto.UserId &&
                    x.Address.ToLower().Trim() == addressDto.Address.ToLower().Trim() &&
                    x.City.ToLower().Trim() == addressDto.City.ToLower().Trim() &&
                    x.State.ToLower().Trim() == addressDto.State.ToLower().Trim()
                );

                if (duplicateAddress != null)
                {
                    // If we are creating a NEW address (Id is null or empty) and found a match -> Duplicate
                    if (addressDto.Id == null || addressDto.Id == Guid.Empty)
                    {
                        response.Message = "This delivery address already exists.";
                        return response;
                    }

                    // If we are UPDATING (Id has value), check if the found address is a DIFFERENT record
                    // If the IDs are different, it means we are changing this address to match another one that already exists.
                    if (duplicateAddress.Id != addressDto.Id)
                    {
                        response.Message = "Another address with these details already exists.";
                        return response;
                    }
                }
                // ---------------------------------------------------------

                if (addressDto.Id.HasValue && addressDto.Id != Guid.Empty)
                {
                    // UPDATE Logic
                    var existingAddress = await _unitOfWork.DeliveryAddressRepository
                        .Get(x => x.Id == addressDto.Id && x.UserId == addressDto.UserId);

                    if (existingAddress == null)
                    {
                        //response.StatusCode = 404;
                        //response.Message = "Delivery address not found or doesn't belong to this user";
                        //return response;

                        var newAddress = _mapper.Map<DeliveryAddress>(addressDto);
                        newAddress.Id = Guid.NewGuid();
                        await _unitOfWork.DeliveryAddressRepository.Add(newAddress);
                        await _unitOfWork.CompletedAsync(addressDto.UserId);
						return response;
                    }

                    _mapper.Map(addressDto, existingAddress);
					existingAddress.DeliveryLocationId = null;
                    await _unitOfWork.DeliveryAddressRepository.Upsert(existingAddress);
                    await _unitOfWork.CompletedAsync(addressDto.UserId);

                    response.StatusCode = 200;
                    response.Message = "Delivery address updated successfully";
                }
                else
                {
                    // CREATE Logic
                    var newAddress = _mapper.Map<DeliveryAddress>(addressDto);
                    newAddress.Id = Guid.NewGuid();
                    await _unitOfWork.DeliveryAddressRepository.Add(newAddress);
                    await _unitOfWork.CompletedAsync(addressDto.UserId);

                    response.StatusCode = 201;
                    response.Message = "Delivery address created successfully";
                }

                response.Data = addressDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating or updating delivery address");
                response.StatusCode = 500;
                response.Message = "An error occurred while creating or updating the delivery address";
            }

            return response;
        }

        public async Task<ServiceResponse<DeliveryAddressDto>> UpdateDeliveryLocationIdAsync(Guid id, Guid deliveryLocationId)
        {
            var response = new ServiceResponse<DeliveryAddressDto>();
            response.Data = new DeliveryAddressDto();

            try
            {
                response.StatusCode = 400;


                if (deliveryLocationId != Guid.Empty)
                {
                    // UPDATE Logic
                    var existingAddress = await _unitOfWork.DeliveryAddressRepository
                        .GetById(id);

                    if (existingAddress == null)
                    {
                        response.StatusCode = 404;
                        response.Message = "Delivery address not found or doesn't belong to this user";
                        return response;
                    }

                    existingAddress.DeliveryLocationId = deliveryLocationId;
                    await _unitOfWork.DeliveryAddressRepository.Upsert(existingAddress);
                    await _unitOfWork.CompletedAsync(existingAddress.UserId);
                    response.Data = _mapper.Map<DeliveryAddressDto>(existingAddress);
                    response.StatusCode = 200;
                    response.Message = "Delivery address updated successfully";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating or updating delivery address");
                response.StatusCode = 500;
                response.Message = "An error occurred while creating or updating the delivery address";
            }

            return response;
        }


        // Delete a delivery address
        public async Task<ServiceResponse<bool>> DeleteDeliveryAddressAsync(Guid addressId, Guid userId)
		{
			var response = new ServiceResponse<bool>();

			try
			{
				// Validate input
				if (addressId == Guid.Empty || userId == Guid.Empty)
				{
					response.StatusCode = 400;
					response.Message = "Invalid address ID or user ID";
					return response;
				}

				var address = await _unitOfWork.DeliveryAddressRepository
					.Get(x => x.Id == addressId && x.UserId == userId);

				if (address == null)
				{
					response.StatusCode = 404;
					response.Message = "Delivery address not found or doesn't belong to this user";
					return response;
				}


                //make another address primary if the deleted one was primary
				if (address.IsPrimary == true)
				{
					var userAddresses = await _unitOfWork.DeliveryAddressRepository
						.GetAll(x => x.UserId == userId);
					var firstAddress = userAddresses.FirstOrDefault();
					if (firstAddress != null)
					{
						firstAddress.IsPrimary = true;
						await _unitOfWork.DeliveryAddressRepository.Upsert(firstAddress);
					}
                }

                await _unitOfWork.DeliveryAddressRepository.Remove(address.Id);

                await _unitOfWork.CompletedAsync(userId);

				response.StatusCode = 200;
				response.Data = true;
				response.Message = "Delivery address deleted successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting delivery address {AddressId}", addressId);
				response.StatusCode = 500;
				response.Message = "An error occurred while deleting the delivery address";
			}

			return response;
		}

		// Set a delivery address as primary
		public async Task<ServiceResponse<bool>> SetPrimaryDeliveryAddressAsync(Guid addressId, Guid userId)
		{
			var response = new ServiceResponse<bool>();

			try
			{
				// Validate input
				if (addressId == Guid.Empty || userId == Guid.Empty)
				{
					response.StatusCode = 400;
					response.Message = "Invalid address ID or user ID";
					return response;
				}

				// Get the address to set as primary
				var addressToSet = await _unitOfWork.DeliveryAddressRepository
					.Get(x => x.Id == addressId && x.UserId == userId);

				if (addressToSet == null)
				{
					response.StatusCode = 404;
					response.Message = "Delivery address not found or doesn't belong to this user";
					return response;
				}

				// Get all user addresses
				var userAddresses = await _unitOfWork.DeliveryAddressRepository
					.GetAll(x => x.UserId == userId);

				// Update all addresses - set IsPrimary to false except the selected one
				foreach (var address in userAddresses)
				{
					address.IsPrimary = address.Id == addressId;
					await _unitOfWork.DeliveryAddressRepository.Upsert(address);
				}

				await _unitOfWork.CompletedAsync(userId);

				response.StatusCode = 200;
				response.Data = true;
				response.Message = "Primary delivery address updated successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error setting primary delivery address {AddressId}", addressId);
				response.StatusCode = 500;
				response.Message = "An error occurred while setting the primary delivery address";
			}

			return response;
		}
	}
}