using AutoMapper;
using ClosedXML.Excel;
using CsvHelper;
using DocumentFormat.OpenXml.Bibliography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Formats.Asn1;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Utilities;
using GaStore.Data;
using GaStore.Data.Dtos.DeliveryDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Entities.Shippings;
using GaStore.Data.Entities.Users;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class DeliveryLocationService : IDeliveryLocationService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<DeliveryLocationService> _logger;
		private readonly IMapper _mapper;

		public DeliveryLocationService(
			IUnitOfWork unitOfWork,
			ILogger<DeliveryLocationService> logger,
			IMapper mapper)
		{
			_unitOfWork = unitOfWork;
			_logger = logger;
			_mapper = mapper;
		}

        public async Task<PaginatedServiceResponse<List<DeliveryLocationDto>>> GetAllAsync(
     string? searchTerm, string? state, string? city, string? provider, bool? isHomeDelivery,
     int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<DeliveryLocationDto>>();

            try
            {
                // Input validation
                if (pageNumber < 1 || pageSize < 1)
                {
                    return new PaginatedServiceResponse<List<DeliveryLocationDto>>
                    {
                        Status = 400,
                        Message = "Page number and page size must be greater than 0."
                    };
                }

                // Build query efficiently
                var query = await BuildFilteredQuery(searchTerm, state, city, provider, isHomeDelivery);

                var totalRecords = await query.CountAsync();

                if (totalRecords == 0)
                {
                    return new PaginatedServiceResponse<List<DeliveryLocationDto>>
                    {
                        Status = 200,
                        Message = "No delivery locations found",
                        Data = new List<DeliveryLocationDto>(),
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                        TotalRecords = 0
                    };
                }

                var pagedLocations = await query
                    .OrderByDescending(x => x.DateCreated)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Load related data more efficiently
                await LoadPriceWeights(pagedLocations);

                response.Data = _mapper.Map<List<DeliveryLocationDto>>(pagedLocations);
                response.Status = 200;
                response.Message = "Delivery locations retrieved successfully";
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving delivery locations");
                response.Status = 500;
                response.Message = "An error occurred while retrieving delivery locations";
            }

            return response;
        }

        private async Task<IQueryable<DeliveryLocation>> BuildFilteredQuery(
            string? searchTerm, string? state, string city, string? provider, bool? isHomeDelivery)
        {
            var locations = await _unitOfWork.DeliveryLocationRepository.GetAll();
            var query = locations.AsQueryable();

            // Apply individual filters first (more efficient than OR conditions)
            if (!string.IsNullOrWhiteSpace(state))
                query = query.Where(dl => dl.State != null && dl.State.ToLower().Contains(state.ToLower()));

            if (!string.IsNullOrWhiteSpace(city))
                query = query.Where(dl => dl.City != null && dl.City.ToLower().Contains(city.ToLower()));

            if (!string.IsNullOrWhiteSpace(provider))
                query = query.Where(dl => dl.ShippingProvider != null &&
                                         dl.ShippingProvider.ToLower().Contains(provider.ToLower()));

            if(isHomeDelivery.HasValue)
                query = query.Where(dl => dl.IsHomeDelivery == isHomeDelivery.Value);

            // Apply search term across multiple fields
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();
                query = query.Where(dl =>
                    (dl.State != null && dl.State.ToLower().Contains(lowerSearchTerm)) ||
                    (dl.City != null && dl.City.ToLower().Contains(lowerSearchTerm)) ||
                    (dl.ShippingProvider != null && dl.ShippingProvider.ToLower().Contains(lowerSearchTerm)) ||
                    (dl.PhoneNumber != null && dl.PhoneNumber.Contains(lowerSearchTerm)) || // Phone numbers usually case-sensitive
                    (dl.PickupAddress != null && dl.PickupAddress.ToLower().Contains(lowerSearchTerm)) ||
                    (dl.Code != null && dl.Code.ToLower().Contains(lowerSearchTerm)));
            }

            return query;
        }

        private async Task LoadPriceWeights(List<DeliveryLocation> locations)
        {
            if (!locations.Any()) return;

            var locationIds = locations.Select(x => x.Id).ToList();
            var allPriceWeights = await _unitOfWork.PriceByWeightRepository
                .GetAll(x => locationIds.Contains(x.DeliveryLocationId));

            // Group by location and remove duplicates
            var priceWeightsByLocation = allPriceWeights
                .GroupBy(x => x.DeliveryLocationId)
                .ToDictionary(
                    g => g.Key,
                    g => g.GroupBy(p => new { p.MinWeight, p.MaxWeight, p.Price })
                          .Select(group => group.First())
                          .ToList()
                );

            // Assign to locations
            foreach (var location in locations)
            {
                if (priceWeightsByLocation.TryGetValue(location.Id, out var priceWeights))
                {
                    location.PriceByWeights = priceWeights;
                }
                else
                {
                    location.PriceByWeights = new List<PriceByWeight>();
                }
            }
        }

        public async Task<ServiceResponse<DeliveryLocationDto>> GetByIdAsync(Guid id)
        {
            var response = new ServiceResponse<DeliveryLocationDto>();
            try
            {
                if (id == Guid.Empty)
                {
                    response.StatusCode = 400;
                    response.Message = "Invalid location ID";
                    return response;
                }

                var location = await _unitOfWork.DeliveryLocationRepository.Get(x => x.Id == id, includeProperties: "PriceByWeights");
                if (location == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Delivery location not found";
                    return response;
                }

                // Manually load related data if needed
                // location.PriceByWeights = await _unitOfWork.PriceByWeightRepository.GetAll(x => x.DeliveryLocationId == location.Id);

                response.Data = _mapper.Map<DeliveryLocationDto>(location);
                response.StatusCode = 200;
                response.Message = "Delivery location retrieved successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving delivery location {LocationId}", id);
                response.StatusCode = 500;
                response.Message = "An error occurred: " + ex.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<DeliveryLocationDto>> GetByStateCityAsync(string State, string City)
        {
            var response = new ServiceResponse<DeliveryLocationDto>();
            try
            {

                var location = await _unitOfWork.DeliveryLocationRepository.Get(x => x.State.ToLower() == State.ToLower() && x.HubName.ToLower().Replace("-", "").Replace(" ", "").Contains(City.ToLower().Replace("-", "").Replace(" ", "")), includeProperties: "PriceByWeights");
                if (location == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Delivery location not found";
                    return response;
                }

                response.Data = _mapper.Map<DeliveryLocationDto>(location);
                response.StatusCode = 200;
                response.Message = "Delivery location retrieved successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving delivery location {LocationCity}", City);
                response.StatusCode = 500;
                response.Message = "An error occurred: " + ex.Message;
            }
            return response;
        }


        public async Task<ServiceResponse<DeliveryLocationDto>> CreateOrUpdateAsync(Guid userId, DeliveryLocationDto dto)
        {
            var response = new ServiceResponse<DeliveryLocationDto>();

            try
            {
                // Basic validation
                dto.City = dto.HubName;
                var validationResult = await ValidateDeliveryLocation(dto);
                if (!validationResult.IsValid)
                {
                    response.StatusCode = 400;
                    response.Message = validationResult.ErrorMessage;
                    return response;
                }

                // Phone validation
                /*string ckPhone = CheckInput.PhoneNumber(dto.PhoneNumber);
                if (ckPhone != null)
                {
                    response.StatusCode = 400;
                    response.Message = ckPhone;
                    return response;
                }*/

                // Validate PriceByWeights ranges and conflicts
                if (dto.PriceByWeights != null && dto.PriceByWeights.Any())
                {
                    var weightValidation = ValidatePriceByWeights(dto.PriceByWeights);
                    if (!weightValidation.IsValid)
                    {
                        response.StatusCode = 400;
                        response.Message = weightValidation.ErrorMessage;
                        return response;
                    }
                }

                DeliveryLocation entity;

                // Update case
                if (dto.Id.HasValue && dto.Id != Guid.Empty)
                {
                    entity = await _unitOfWork.DeliveryLocationRepository.Get(x => x.Id == dto.Id);

                    if (entity == null)
                    {
                        response.StatusCode = 404;
                        response.Message = "Delivery location not found";
                        return response;
                    }

                    var duplicateLocationCity = await _unitOfWork.DeliveryLocationRepository
                        .Get(x => (x.State == dto.State || x.Code == dto.State) &&
                                 (x.City == dto.City || x.HubName == dto.City) &&
                                 x.IsHomeDelivery == dto.IsHomeDelivery
                                 && x.Id != dto.Id
                                 );


                    if (duplicateLocationCity != null)
                    {
                        response.StatusCode = 400;
                        response.Message = $"Another delivery location with the state {dto.State} and hub name {dto.City} already exists.";
                        return response;
                    }


                    /*var duplicateLocation = await _unitOfWork.DeliveryLocationRepository
                        .Get(x => x.State == dto.State &&
                                 x.City == dto.City &&
                                 x.IsHomeDelivery == dto.IsHomeDelivery
                                 && x.Id != dto.Id
                                 );*/
                    /*if (duplicateLocation != null)
                    {
                        response.StatusCode = 400;
                        response.Message = "Another delivery location with the same state, city, and pickup cost already exists.";
                        return response;
                    }*/

                    // Update the main entity properties
                    _mapper.Map(dto, entity);

                    // Get existing PriceByWeights separately
                    var existingPrices = await _unitOfWork.PriceByWeightRepository.GetAll(x => x.DeliveryLocationId == entity.Id);

                    // Remove existing prices
                    foreach (var price in existingPrices)
                    {
                        await _unitOfWork.PriceByWeightRepository.Remove(price.Id);
                    }

                    // Add new prices
                    if (dto.PriceByWeights != null && dto.PriceByWeights.Any())
                    {
                        foreach (var priceDto in dto.PriceByWeights)
                        {
                            var newPrice = new PriceByWeight
                            {
                                Id = Guid.NewGuid(),
                                MinWeight = priceDto.MinWeight,
                                MaxWeight = priceDto.MaxWeight,
                                Price = priceDto.Price,
                                DeliveryLocationId = entity.Id,
                                DateCreated = DateTime.UtcNow,
                                DateUpdated = DateTime.UtcNow
                            };
                            await _unitOfWork.PriceByWeightRepository.Add(newPrice);
                        }
                    }

                    entity.DateUpdated = DateTime.UtcNow;
                    entity.HubName = dto.City;
                    await _unitOfWork.DeliveryLocationRepository.Upsert(entity);
                    await _unitOfWork.CompletedAsync(userId);

                    response.Message = "Delivery location updated successfully";
                    response.StatusCode = 200;

                    // Return updated entity data with prices
                    var updatedEntity = await _unitOfWork.DeliveryLocationRepository.Get(x => x.Id == entity.Id);
                    if (updatedEntity != null)
                    {
                        updatedEntity.PriceByWeights = await _unitOfWork.PriceByWeightRepository.GetAll(x => x.DeliveryLocationId == entity.Id);
                    }
                    response.Data = _mapper.Map<DeliveryLocationDto>(updatedEntity);
                }
                else // Create case
                {
                   /* var existingLocationCity = await _unitOfWork.DeliveryLocationRepository
                        .Get(x => x.State == dto.State && x.City == dto.City);

                    var existingLocation = await _unitOfWork.DeliveryLocationRepository
                        .Get(x => x.State == dto.State && x.City == dto.City && x.PickupDeliveryAmount == dto.PickupDeliveryAmount);
                    */

                    var existingLocationCity = await _unitOfWork.DeliveryLocationRepository
                        .Get(x => (x.State == dto.State || x.Code == dto.State) &&
                                 (x.City == dto.City || x.HubName == dto.City) &&
                                 x.IsHomeDelivery == dto.IsHomeDelivery
                                 && x.Id != dto.Id
                                 );


                   

                    if (existingLocationCity != null)
                    {
                        response.StatusCode = 400;
                        response.Message = $"Another delivery location with the state {dto.State} and hub name {dto.City} already exists.";
                        return response;
                    }


                    entity = _mapper.Map<DeliveryLocation>(dto);
                    entity.Id = Guid.NewGuid();
                    entity.HubName = dto.City;
                    entity.DateCreated = DateTime.UtcNow;
                    entity.DateUpdated = DateTime.UtcNow;

                    // Add PriceByWeights if provided
                    if (dto.PriceByWeights != null && dto.PriceByWeights.Any())
                    {
                        foreach (var priceDto in dto.PriceByWeights)
                        {
                            var newPrice = new PriceByWeight
                            {
                                Id = Guid.NewGuid(),
                                MinWeight = priceDto.MinWeight,
                                MaxWeight = priceDto.MaxWeight,
                                Price = priceDto.Price,
                                DeliveryLocationId = entity.Id,
                                DateCreated = DateTime.UtcNow,
                                DateUpdated = DateTime.UtcNow
                            };
                            entity.PriceByWeights.Add(newPrice);
                        }
                    }

                    await _unitOfWork.DeliveryLocationRepository.Add(entity);
                    await _unitOfWork.CompletedAsync(userId);

                    response.Message = "Delivery location created successfully";
                    response.StatusCode = 201;

                    // Return created entity with prices
                    var createdEntity = await _unitOfWork.DeliveryLocationRepository.Get(x => x.Id == entity.Id);
                    if (createdEntity != null)
                    {
                        createdEntity.PriceByWeights = await _unitOfWork.PriceByWeightRepository.GetAll(x => x.DeliveryLocationId == entity.Id);
                    }
                    response.Data = _mapper.Map<DeliveryLocationDto>(createdEntity);
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating delivery location {LocationId}", dto.Id);
                response.StatusCode = 409;
                response.Message = "The delivery location was modified by another user. Please refresh and try again.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating or updating delivery location");
                response.StatusCode = 500;
                response.Message = "An error occurred while processing delivery location.";
            }

            return response;
        }

        // Validation helper methods
        private async Task<ValidationResult> ValidateDeliveryLocation(DeliveryLocationDto dto)
        {
            // Required field validation
            if (string.IsNullOrWhiteSpace(dto.City))
                return ValidationResult.Failure("Hub name is required.");

            if (string.IsNullOrWhiteSpace(dto.State))
                return ValidationResult.Failure("State is required.");

            if (string.IsNullOrWhiteSpace(dto.Country))
                return ValidationResult.Failure("Country is required.");

            /* if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
                return ValidationResult.Failure("Phone number is required."); */

            // Field length validation
            if (dto.City.Length > 100)
                return ValidationResult.Failure("Hub name must not exceed 100 characters.");

            if (dto.State.Length > 100)
                return ValidationResult.Failure("State must not exceed 100 characters.");

            if (dto.Country.Length > 100)
                return ValidationResult.Failure("Country must not exceed 100 characters.");

            if (dto.PostalCode?.Length > 20)
                return ValidationResult.Failure("Postal code must not exceed 20 characters.");

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber) && dto.PhoneNumber.Length > 20)
                return ValidationResult.Failure("Phone number must not exceed 20 characters.");

            // Email validation
            if (!string.IsNullOrWhiteSpace(dto.Email) && !IsValidEmail(dto.Email))
                return ValidationResult.Failure("Invalid email format.");

            // Numeric range validation
            if (dto.PickupDeliveryAmount < 0)
                return ValidationResult.Failure("Pickup delivery amount cannot be negative.");

            if (dto.DoorDeliveryAmount < 0)
                return ValidationResult.Failure("Door delivery amount cannot be negative.");

            if (dto.EstimatedDeliveryDays < 0)
                return ValidationResult.Failure("Estimated delivery days cannot be negative.");

            if (dto.EstimatedDeliveryDays > 365)
                return ValidationResult.Failure("Estimated delivery days cannot exceed 365 days.");

            // Amount validation
            if (dto.PickupDeliveryAmount > 1000000) // 1 million
                return ValidationResult.Failure("Pickup delivery amount is too high.");

            if (dto.DoorDeliveryAmount > 1000000) // 1 million
                return ValidationResult.Failure("Door delivery amount is too high.");

            //check shipping provider
            var shippingProvider = await _unitOfWork.ShippingProviderRepository.Get(s => s.Name == dto.ShippingProvider || s.Code == dto.ShippingProvider);
            //var shippingProvider = await _unitOfWork.ShippingProviderRepository.Get(s => s.Code == dto.ShippingProvider);
            if (shippingProvider == null)
            {
                return ValidationResult.Failure($"Shipping provider {dto.ShippingProvider} not found");
            }

            //check state and city
            var states = NigeriaStates.States;
            var cities = NigeriaStates.States.First(s => s.Name.ToLower().Contains(dto.State.ToLower()) || s.Code.ToLower() == dto.State.ToLower()).Subdivisions;
            var stateCode = NigeriaStates.States.First(s => s.Code.ToLower() == dto.State.ToLower() || s.Name.ToLower().Contains(dto.State.ToLower())).Subdivisions;
            if (cities.Count < 1 && dto.State.Length > 2)
            {
                return ValidationResult.Failure($"State {dto.State} not found");
            }
            if (stateCode.Count < 1 && dto.State.Length < 3)
            {
                return ValidationResult.Failure($"State code {dto.State} not found");
            }
            /*if (!LgaExists(dto.City))
            {
                return ValidationResult.Failure($"City {dto.City} not found");
            }*/

            return ValidationResult.Success();
        }

        public static bool LgaExists(string lgaName, bool caseInsensitive = true)
        {
            if (string.IsNullOrWhiteSpace(lgaName))
                return false;

            var comparison = caseInsensitive ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;

            return NigeriaStates.States
                .Any(state => state.Subdivisions
                    .Any(sub => sub.Equals(lgaName.Trim(), comparison)));
        }

        private ValidationResult ValidatePriceByWeights(List<PriceByWeightDto> priceWeights)
        {
            if (priceWeights == null || !priceWeights.Any())
                return ValidationResult.Success();

            // Check for individual weight validations
            foreach (var weight in priceWeights)
            {
                if (weight.MinWeight < 0)
                    return ValidationResult.Failure("Minimum weight cannot be negative.");

                if (weight.MaxWeight < 0)
                    return ValidationResult.Failure("Maximum weight cannot be negative.");

                if (weight.Price < 0)
                    return ValidationResult.Failure("Price cannot be negative.");

                if (weight.MinWeight >= weight.MaxWeight)
                    return ValidationResult.Failure("Minimum weight must be less than maximum weight.");

                if (weight.MaxWeight > 10000) // 10 tons
                    return ValidationResult.Failure("Maximum weight cannot exceed 10,000 kg.");

                if (weight.Price > 1000000) // 1 million
                    return ValidationResult.Failure("Price is too high.");
            }

            // Check for overlapping weight ranges
            for (int i = 0; i < priceWeights.Count; i++)
            {
                for (int j = i + 1; j < priceWeights.Count; j++)
                {
                    var range1 = priceWeights[i];
                    var range2 = priceWeights[j];

                    if (RangesOverlap(range1.MinWeight, range1.MaxWeight, range2.MinWeight, range2.MaxWeight))
                    {
                        return ValidationResult.Failure($"Weight ranges overlap: {range1.MinWeight}-{range1.MaxWeight}kg and {range2.MinWeight}-{range2.MaxWeight}kg");
                    }
                }
            }

            // Check for gaps in weight ranges (optional - remove if not needed)
            var sortedWeights = priceWeights.OrderBy(w => w.MinWeight).ToList();
            for (int i = 0; i < sortedWeights.Count - 1; i++)
            {
                if (sortedWeights[i].MaxWeight != sortedWeights[i + 1].MinWeight)
                {
                    // This is just a warning, you might want to make it optional
                    _logger.LogInformation("Gap detected in weight ranges: {Max} to {Min}",
                        sortedWeights[i].MaxWeight, sortedWeights[i + 1].MinWeight);
                }
            }

            return ValidationResult.Success();
        }

        private bool RangesOverlap(decimal min1, decimal max1, decimal min2, decimal max2)
        {
            return min1 < max2 && min2 < max1;
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        // Helper class for validation results
        public class ValidationResult
        {
            public bool IsValid { get; set; }
            public string ErrorMessage { get; set; }

            public static ValidationResult Success() => new ValidationResult { IsValid = true };
            public static ValidationResult Failure(string message) => new ValidationResult { IsValid = false, ErrorMessage = message };
        }

        public async Task<BulkUploadResponse<DeliveryLocationDto>> BulkUploadFromFileAsync(
		Guid userId,
		Stream fileStream,
		string fileType,
		string originalFileName)
		{
			var response = new BulkUploadResponse<DeliveryLocationDto>
			{
				OriginalFileName = originalFileName,
				Errors = new List<BulkUploadError>()
			};

			try
			{
				// Step 1: Parse the file
				List<DeliveryLocationDto> dtos;
				try
				{
					dtos = await ParseFileAsync(fileStream, fileType);
                    if (dtos.Count > 0)
                    {
                        foreach (var d in dtos)
                        {

                        }
                    }
					response.TotalRecords = dtos.Count;
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Error parsing upload file");
					response.StatusCode = 400;
					response.Message = "Error parsing file. Please check the file format.";
					return response;
				}

				if (dtos == null || dtos.Count == 0)
				{
					response.StatusCode = 400;
					response.Message = "No valid records found in the uploaded file";
					return response;
				}

				// Step 2: Process records
				return await BulkUploadAsync(userId, dtos);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error during bulk upload from file");
				response.StatusCode = 500;
				response.Message = "An unexpected error occurred during file upload";
				return response;
			}
		}

        public async Task<BulkUploadResponse<DeliveryLocationDto>> BulkUploadAsync(Guid userId, List<DeliveryLocationDto> dtos)
        {
            var response = new BulkUploadResponse<DeliveryLocationDto>
            {
                TotalRecords = dtos.Count,
                SuccessfulRecords = 0,
                FailedRecords = 0,
                Errors = new List<BulkUploadError>(),
                SuccessfulItems = new List<DeliveryLocationDto>()
            };

            if (dtos == null || dtos.Count == 0)
            {
                response.Message = "No records provided for bulk upload";
                response.StatusCode = 400;
                return response;
            }

            // Track row number (1-based for user-friendly display)
            int rowNumber = 0;

            // Process each record individually
            foreach (var dto in dtos)
            {
                rowNumber++;

                // Create a record identifier with row number
                var recordIdentifier = $"Row {rowNumber}: Provider='{dto.ShippingProvider}', State='{dto.State}'";

                // Default error message if none provided
                string errorMessage = string.Empty;
                int statusCode = 400;

                try
                {
                    // 1. DTO Validation
                    var validationResult = await ValidateDeliveryLocation(dto);
                    if (!validationResult.IsValid)
                    {
                        response.FailedRecords++;
                        errorMessage = !string.IsNullOrWhiteSpace(validationResult.ErrorMessage)
                            ? validationResult.ErrorMessage
                            : "Validation failed for this record";
                        statusCode = 400;

                        response.Errors.Add(new BulkUploadError
                        {
                            Record = dto,
                            ErrorMessage = $"{recordIdentifier} - {errorMessage}",
                            RowNumber = rowNumber,
                            StatusCode = statusCode
                        });
                        continue; // Skip to the next record
                    }

                    // 2. State Logic
                    var stateName = NigeriaStates.States.FirstOrDefault(s =>
                        s.Code.Equals(dto.State, StringComparison.OrdinalIgnoreCase) ||
                        s.Name.Equals(dto.State, StringComparison.OrdinalIgnoreCase) ||
                        (dto.State != null && s.Name.ToLower().Contains(dto.State.ToLower()))
                    );

                    if (stateName != null)
                    {
                        dto.State = stateName.Name;
                        dto.Code = stateName.Code;
                    }
                    else
                    {
                        response.FailedRecords++;
                        errorMessage = $"State '{dto.State}' not found in Nigerian states list";
                        statusCode = 400;

                        response.Errors.Add(new BulkUploadError
                        {
                            Record = dto,
                            ErrorMessage = $"{recordIdentifier} - {errorMessage}",
                            RowNumber = rowNumber,
                            StatusCode = statusCode
                        });
                        continue; // Skip to next record
                    }

                    // 3. Shipping Provider Logic
                    var shippingProvider = await GetShippingProviderNameByCode(dto.ShippingProvider);
                    if (shippingProvider.StatusCode != 200)
                    {
                        response.FailedRecords++;
                        errorMessage = !string.IsNullOrWhiteSpace(shippingProvider.Message)
                            ? shippingProvider.Message
                            : $"Invalid Shipping Provider: '{dto.ShippingProvider}'";
                        statusCode = shippingProvider.StatusCode;

                        response.Errors.Add(new BulkUploadError
                        {
                            Record = dto,
                            ErrorMessage = $"{recordIdentifier} - {errorMessage}",
                            RowNumber = rowNumber,
                            StatusCode = statusCode
                        });
                        continue; // Skip to next record
                    }

                    // Assign the valid provider data
                    dto.ShippingProvider = shippingProvider.Data;

                    // 4. Process the Database Save (ProcessSingleRecord handles DB operations)
                    var recordResponse = await ProcessSingleRecord(userId, dto);

                    if (recordResponse.StatusCode == 201 || recordResponse.StatusCode == 200)
                    {
                        response.SuccessfulRecords++;
                        response.SuccessfulItems.Add(recordResponse.Data);
                    }
                    else
                    {
                        response.FailedRecords++;
                        errorMessage = !string.IsNullOrWhiteSpace(recordResponse.Message)
                            ? recordResponse.Message
                            : "Failed to save record to database";
                        statusCode = recordResponse.StatusCode;

                        response.Errors.Add(new BulkUploadError
                        {
                            Record = dto,
                            ErrorMessage = $"{recordIdentifier} - {errorMessage}",
                            RowNumber = rowNumber,
                            StatusCode = statusCode
                        });
                    }
                }
                catch (Exception ex)
                {
                    // Log and handle unexpected exceptions per record
                    _logger.LogError(ex, "Unexpected error processing {RecordIdentifier} during bulk upload.", recordIdentifier);

                    response.FailedRecords++;
                    errorMessage = !string.IsNullOrWhiteSpace(ex.Message)
                        ? $"An unexpected server error occurred: {ex.Message}"
                        : "An unexpected server error occurred";
                    statusCode = 500;

                    response.Errors.Add(new BulkUploadError
                    {
                        Record = dto,
                        ErrorMessage = $"{recordIdentifier} - {errorMessage}",
                        RowNumber = rowNumber,
                        StatusCode = statusCode
                    });
                    // Continue to the next record to try and process it
                }
            }

            // Final Summary
            response.Message = $"Bulk upload completed. Success: {response.SuccessfulRecords}, Failed: {response.FailedRecords}";

            // Generate a summary of errors if any
            if (response.Errors.Any())
            {
                var errorSummary = response.Errors
                    .GroupBy(e => e.ErrorMessage)
                    .Select(g => new { Error = g.Key, Count = g.Count(), Rows = string.Join(", ", g.Select(e => e.RowNumber)) })
                    .ToList();

                response.ErrorSummary = $"Errors occurred in {response.Errors.Count} row(s). " +
                                       string.Join("; ", errorSummary.Select(e => $"{e.Error} (Rows: {e.Rows})"));
            }

            // Determine final status code
            if (response.FailedRecords == 0)
            {
                response.StatusCode = 200;
            }
            else if (response.SuccessfulRecords > 0)
            {
                response.StatusCode = 207; // 207 Multi-Status for partial success
            }
            else
            {
                response.StatusCode = 400;
            }

            return response;
        }


        private async Task<ServiceResponse<DeliveryLocationDto>> ProcessSingleRecord(Guid userId, DeliveryLocationDto dto)
		{
			var response = new ServiceResponse<DeliveryLocationDto>();

			try
			{
				// Validation (similar to your existing validation)
				if (string.IsNullOrWhiteSpace(dto.City) ||
					string.IsNullOrWhiteSpace(dto.State) ||
					string.IsNullOrWhiteSpace(dto.Country))
				{
					response.Message = "Missing required fields";
					response.StatusCode = 400;
					return response;
				}

				/*string ckPhone = CheckInput.PhoneNumber(dto.PhoneNumber);
				if (ckPhone != null)
				{
					response.Message = ckPhone;
					response.StatusCode = 400;
					return response;
				}*/

				DeliveryLocation entity;

				// Update case
				if (dto.Id.HasValue && dto.Id != Guid.Empty)
				{
					entity = await _unitOfWork.DeliveryLocationRepository.Get(x => x.Id == dto.Id);
					if (entity == null)
					{
						response.StatusCode = 404;
						response.Message = "Delivery location not found";
						return response;
					}

					_mapper.Map(dto, entity);
					await _unitOfWork.DeliveryLocationRepository.Upsert(entity);

                    // Add PriceByWeights if provided
                    if (dto.PriceByWeights != null && dto.PriceByWeights.Any())
                    {
						var existingPrices = await _unitOfWork.PriceByWeightRepository.GetAll(x => x.DeliveryLocationId == entity.Id);
                        if(existingPrices.Count > 0)
						{
                            // Remove existing prices
                            foreach (var existingPrice in existingPrices)
                            {
                                await _unitOfWork.PriceByWeightRepository.Remove(existingPrice.Id);
                            }
                        }
                        // Add new prices
                        foreach (var priceDto in dto.PriceByWeights)
                        {
                            entity.PriceByWeights.Add(new PriceByWeight
                            {
                                Id = Guid.NewGuid(),
                                MinWeight = priceDto.MinWeight,
                                MaxWeight = priceDto.MaxWeight,
                                Price = priceDto.Price,
                                DeliveryLocationId = entity.Id
                            });
                        }
                    }

                    await _unitOfWork.CompletedAsync(userId);
                    response.Message = "Delivery location updated successfully";
					response.StatusCode = 200;
				}
				else // Create case
				{
					var existing = await _unitOfWork.DeliveryLocationRepository
						.Get(x => x.State == dto.State && x.City == dto.City);

					/*if (existing != null)
					{
						response.StatusCode = 400;
						response.Message = "A delivery location with the same state and city already exists";
						return response;
					}*/
					if(existing == null)
					{
					entity = _mapper.Map<DeliveryLocation>(dto);
					entity.Id = Guid.NewGuid();
                        // Add PriceByWeights if provided
                        if (dto.PriceByWeights != null && dto.PriceByWeights.Any())
                        {
                            foreach (var priceDto in dto.PriceByWeights)
                            {
                                entity.PriceByWeights.Add(new PriceByWeight
                                {
                                    Id = Guid.NewGuid(),
                                    MinWeight = priceDto.MinWeight,
                                    MaxWeight = priceDto.MaxWeight,
                                    Price = priceDto.Price,
                                    DeliveryLocationId = entity.Id
                                });
                            }
                        }
                        await _unitOfWork.DeliveryLocationRepository.Add(entity);
					response.Message = "Delivery location created successfully";
					response.StatusCode = 201;

                    await _unitOfWork.CompletedAsync(userId);
                    response.Data = _mapper.Map<DeliveryLocationDto>(entity);
                    }
                }

			}
			catch (Exception ex)
			{
				_logger.LogError(ex, $"Error processing delivery location record: {dto.City}, {dto.State}");
				response.StatusCode = 500;
				response.Message = "An error occurred while processing this record";
			}

			return response;
		}

		public async Task<List<DeliveryLocationDto>> ParseFileAsync(Stream fileStream, string fileType)
		{
			return fileType.ToLower() switch
			{
				//"csv" => await ParseCsvFileAsync(fileStream),
				"xlsx" or "xls" => await ParseExcelFileAsync(fileStream),
				_ => throw new NotSupportedException($"File type {fileType} is not supported")
			};
		}

		private async Task<List<DeliveryLocationDto>> ParseCsvFileAsync(Stream fileStream)
		{
			using var reader = new StreamReader(fileStream);
			using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
			List<PriceByWeightDto> weightDto = new List<PriceByWeightDto>();
            try
			{
				var records = csv.GetRecords<DeliveryLocationCsvRecord>().ToList();
				return records.Select(r => new DeliveryLocationDto
				{
					City = r.City,
					State = r.State,
					Country = r.Country ?? "Nigeria", // Set default if needed
					PostalCode = r.PostalCode,
					PhoneNumber = r.PhoneNumber,
					Email = r.Email,
					PickupAddress = r.PickupAddress,
					PickupDeliveryAmount = r.PickupDeliveryAmount ?? 0,
					DoorDeliveryAmount = r.DoorDeliveryAmount ?? 0,
                    IsActive = r.IsActive ?? true, // Default to true if not specified
                    IsHomeDelivery = r.IsHomeDelivery ?? false,
                    EstimatedDeliveryDays = r.EstimatedDeliveryDays ?? 3, // Default to 3 days
                    ShippingProvider = r.ShippingProvider ?? "Ga",
					PriceByWeights = new List<PriceByWeightDto>
					{
						new PriceByWeightDto
						{
							MinWeight = 0,
							MaxWeight = 1,
							Price = r.WeightRangeOnePrice
						},
						new PriceByWeightDto
						{
							MinWeight = 1.1m,
							MaxWeight = 2,
							Price = r.WeightRangeTwoPrice
						},
						new PriceByWeightDto
						{
							MinWeight = 2.1m,
							MaxWeight = 10,
							Price = r.WeightRangeThreePrice
						},
                        /*
						new PriceByWeightDto
						{
							MinWeight = 10.1m,
							MaxWeight = 20,
							Price = r.WeightRangeFourPrice
                        }*/
                    }
                }).ToList();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error parsing CSV file");
				throw;
			}
		}

		private async Task<List<DeliveryLocationDto>> ParseExcelFileAsync(Stream fileStream)
		{
			//using var package = new ExcelPackage(fileStream);
			//var worksheet = package.Workbook.Worksheets[0];
			using var workbook = new XLWorkbook(fileStream);
			var worksheet = workbook.Worksheet(1);
			/*
			var rowCount = worksheet.Dimension.Rows;
			var result = new List<DeliveryLocationDto>();

			for (int row = 2; row <= rowCount; row++) // Assuming row 1 is header */
			var result = new List<DeliveryLocationDto>();
			var rows = worksheet.RowsUsed().Skip(1); // Skip header row

			foreach (var row in rows)
			{
				try
				{
					var dto = new DeliveryLocationDto
					{
                        State = row.Cell(1).GetString(),
                        ShippingProvider = row.Cell(2).GetString(),
                        HubName = row.Cell(3).GetString(),
                        City = row.Cell(3).GetString(),
                        PickupAddress = row.Cell(4).GetString(),
                        WorkingHours = row.Cell(5).GetString(),
                        EstimatedDeliveryDays = int.TryParse(row.Cell(6).GetString(), out var days) ? days : 3,
                        IsHomeDelivery = int.TryParse(row.Cell(7).GetString(), out var isHome) ? isHome == 1 : false,
                        Country = "Nigeria",
						//PostalCode = row.Cell(3).GetString(),
						//PhoneNumber = row.Cell(4).GetString(),
						//Email = row.Cell(5).GetString(),
                        //PickupDeliveryAmount = decimal.TryParse(row.Cell(7).GetString(), out var pickupAmt) ? pickupAmt : null,
                        //DoorDeliveryAmount = decimal.TryParse(row.Cell(8).GetString(), out var doorAmt) ? doorAmt : null,
                        //IsActive = bool.TryParse(row.Cell(9).GetString(), out var isActive) ? isActive : true,
                        PickupDeliveryAmount = 0,
                        DoorDeliveryAmount = 0,
                        IsActive = true,
                        PriceByWeights = new List<PriceByWeightDto>
						{
							new PriceByWeightDto
							{
								MinWeight = 0,
								MaxWeight = 1,
								Price = decimal.TryParse(row.Cell(8).GetString(), out var price1) ? price1 : 0
							},
							new PriceByWeightDto
							{
								MinWeight = 1.1m,
								MaxWeight = 2,
								Price = decimal.TryParse(row.Cell(9).GetString(), out var price2) ? price2 : 0
							},
							new PriceByWeightDto
							{
								MinWeight = 2.1m,
								MaxWeight = 10,
								Price = decimal.TryParse(row.Cell(10).GetString(), out var price3) ? price3 : 0
							},
							/*new PriceByWeightDto
							{
								MinWeight = 10.1m,
								MaxWeight = 20,
								Price = decimal.TryParse(row.Cell(11).GetString(), out var price4) ? price4 : 0
                            }*/
                        }
                    };

					result.Add(dto);
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, $"Error parsing Excel row {row}");
					// Continue with next row
				}
			}

			return result;
		}

        private async Task<ServiceResponse<string>> GetShippingProviderNameByCode(string Code)
        {
            var response = new ServiceResponse<string>();
            try
            {
                var shippingProvider = await _unitOfWork.ShippingProviderRepository.Get(s => s.Code == Code || s.Name == Code);
                if (shippingProvider == null)
                {
                    response.StatusCode = 404;
                    response.Message = $"Shipping provider with code {Code} not found";
                    return response;
                }
                else
                {
                    response.Data = shippingProvider.Name;
                    response.StatusCode = 200;
                    response.Message = "Shipping provider retrieved successfully";
                    return response;
                }
            } catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipping provider with code {Code}", Code);
                response.StatusCode = 500;
                response.Message = "An error occurred while retrieving shipping provider";
                return response;
            } 
        }

        public async Task<ServiceResponse<bool>> DeleteAsync(Guid userId, Guid id)
		{
			var response = new ServiceResponse<bool>();
			try
			{
				if (id == Guid.Empty)
				{
					response.StatusCode = 400;
					response.Message = "Invalid location ID";
					return response;
				}

				var location = await _unitOfWork.DeliveryLocationRepository.Get(x => x.Id == id);
				if (location == null)
				{
					response.StatusCode = 404;
					response.Message = "Delivery location not found";
					return response;
				}

                //remove price by weight entries associated with this location
				var priceWeights = await _unitOfWork.PriceByWeightRepository.GetAll(x => x.DeliveryLocationId == id);
				if(priceWeights != null)
				{
                    foreach (var pw in priceWeights)
                    {
                        await _unitOfWork.PriceByWeightRepository.Remove(pw.Id);
                    }
                }
                    

                await _unitOfWork.DeliveryLocationRepository.Remove(id);
				await _unitOfWork.CompletedAsync(userId);

				response.Data = true;
				response.StatusCode = 200;
				response.Message = "Delivery location deleted successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting delivery location {LocationId}", id);
				response.StatusCode = 500;
				response.Message = "An error occurred while deleting delivery location";
			}
			return response;
		}

		public async Task<ServiceResponse<bool>> SetActiveStatusAsync(Guid userId, Guid id, bool isActive)
		{
			var response = new ServiceResponse<bool>();
			try
			{
				if (id == Guid.Empty)
				{
					response.StatusCode = 400;
					response.Message = "Invalid location ID";
					return response;
				}

				var location = await _unitOfWork.DeliveryLocationRepository.Get(x => x.Id == id);
				if (location == null)
				{
					response.StatusCode = 404;
					response.Message = "Delivery location not found";
					return response;
				}

				location.IsActive = isActive;
				await _unitOfWork.DeliveryLocationRepository.Upsert(location);
				await _unitOfWork.CompletedAsync(userId);

				response.Data = true;
				response.StatusCode = 200;
				response.Message = $"Delivery location {(isActive ? "activated" : "deactivated")} successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating active status of delivery location {LocationId}", id);
				response.StatusCode = 500;
				response.Message = "An error occurred while updating active status";
			}
			return response;
		}
	}
}
