using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Threading.Tasks;
using GaStore.Core.Services.Implementations.GigLogistics;
using GaStore.Core.Services.Interfaces;
using GaStore.Core.Services.Interfaces.GigLogistics;
using GaStore.Data.Dtos.MessagingDto;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Shippings;
using GaStore.Data.Enums;
using GaStore.Data.Models;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class ShippingService : IShippingService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<ShippingService> _logger;
		private readonly DatabaseContext _context;
		private readonly IGigDeliveryService _gigDeliveryService;
        private readonly IEmailTemplateFactory _emailTemplateFactory;
        private readonly ISmsTemplateFactory _smsTemplateFactory;
        private readonly ISmsService _smsService;
        private readonly IEmailService _emailService;
        private readonly AppSettings _appSettings;

        public ShippingService(
			IUnitOfWork unitOfWork,
			IMapper mapper,
			ILogger<ShippingService> logger, DatabaseContext context, IGigDeliveryService gigDeliveryService,
            IOptions<AppSettings> appSettings,
            IEmailTemplateFactory emailTemplateFactory,
            ISmsTemplateFactory smsTemplateFactory,
            ISmsService smsService,
            IEmailService emailService)
		{
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
			_context = context;
			_gigDeliveryService = gigDeliveryService;
            _appSettings = appSettings.Value;
            _emailTemplateFactory = emailTemplateFactory;
            _smsTemplateFactory = smsTemplateFactory;
            _smsService = smsService;
            _emailService = emailService;
        }


        public async Task<PaginatedServiceResponse<List<ShippingProviderListDto>>> GetShippingProvidersAsync(
    string? searchTerm, int pageNumber, int pageSize)
        {
            var response = new PaginatedServiceResponse<List<ShippingProviderListDto>>();

            try
            {
                var query = _context.ShippingProviders.AsQueryable();

                // Search
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(p =>
                        p.Name.Contains(searchTerm) ||
                        p.Email.Contains(searchTerm) ||
                        p.PhoneNumber.Contains(searchTerm) ||
                        p.Description.Contains(searchTerm));
                }

                var totalRecords = await query.CountAsync();

                var providers = await query
                    .OrderBy(p => p.Name)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .AsNoTracking()
                    .Select(p => _mapper.Map<ShippingProviderListDto>(p))
                    .ToListAsync();

                response.Status = 200;
                response.Message = "Shipping providers retrieved successfully.";
                response.Data = providers;
                response.TotalRecords = totalRecords;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipping providers");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<ServiceResponse<ShippingProviderDto>> CreateShippingProviderAsync(ShippingProviderDto providerDto, Guid userId)
        {
            var response = new ServiceResponse<ShippingProviderDto>();

            try
            {
                if (providerDto == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Provider data is required.";
                    return response;
                }

                if (string.IsNullOrWhiteSpace(providerDto.Name))
                {
                    response.StatusCode = 400;
                    response.Message = "Provider name is required.";
                    return response;
                }

                if (string.IsNullOrWhiteSpace(providerDto.Code))
                {
                    response.StatusCode = 400;
                    response.Message = "Provider code is required.";
                    return response;
                }

                // Check for duplicate Name
                var existingByName = await _unitOfWork.ShippingProviderRepository
                    .GetAll(x => x.Name.ToLower() == providerDto.Name.Trim().ToLower());

                if (existingByName.Any())
                {
                    response.StatusCode = 409;
                    response.Message = "A shipping provider with this name already exists.";
                    return response;
                }

                // Check for duplicate Code
                var existingByCode = await _unitOfWork.ShippingProviderRepository
                    .GetAll(x => x.Code.ToLower() == providerDto.Code.Trim().ToLower());

                if (existingByCode.Any())
                {
                    response.StatusCode = 409;
                    response.Message = "A shipping provider with this code already exists.";
                    return response;
                }

                var entity = _mapper.Map<ShippingProvider>(providerDto);
                entity.Name = entity.Name.Trim();
                entity.Code = entity.Code.Trim();

                if (!string.IsNullOrWhiteSpace(entity.Email))
                    entity.Email = entity.Email.Trim();
                if (!string.IsNullOrWhiteSpace(entity.PhoneNumber))
                    entity.PhoneNumber = entity.PhoneNumber.Trim();
                if (!string.IsNullOrWhiteSpace(entity.Description))
                    entity.Description = entity.Description.Trim();

                await _unitOfWork.ShippingProviderRepository.Add(entity);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 201;
                response.Message = "Shipping provider created successfully.";
                response.Data = _mapper.Map<ShippingProviderDto>(entity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shipping provider");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ShippingProviderDto>> UpdateShippingProviderAsync(Guid id, ShippingProviderDto providerDto, Guid userId)
        {
            var response = new ServiceResponse<ShippingProviderDto>();

            try
            {
                if (providerDto == null)
                {
                    response.StatusCode = 400;
                    response.Message = "Provider data is required.";
                    return response;
                }

                if (string.IsNullOrWhiteSpace(providerDto.Name))
                {
                    response.StatusCode = 400;
                    response.Message = "Provider name is required.";
                    return response;
                }

                if (string.IsNullOrWhiteSpace(providerDto.Code))
                {
                    response.StatusCode = 400;
                    response.Message = "Provider code is required.";
                    return response;
                }

                var provider = await _unitOfWork.ShippingProviderRepository.GetById(id);

                if (provider == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Shipping provider not found.";
                    return response;
                }

                // Check for duplicate Name (excluding current record)
                var existingByName = await _unitOfWork.ShippingProviderRepository
                    .GetAll (x => x.Id != id &&
                                        x.Name.ToLower() == providerDto.Name.Trim().ToLower());

                if (existingByName.Any())
                {
                    response.StatusCode = 409;
                    response.Message = "A shipping provider with this name already exists.";
                    return response;
                }

                // Check for duplicate Code (excluding current record)
                var existingByCode = await _unitOfWork.ShippingProviderRepository
                    .GetAll(x => x.Id != id &&
                                        x.Code.ToLower() == providerDto.Code.Trim().ToLower());

                if (existingByCode.Any())
                {
                    response.StatusCode = 409;
                    response.Message = "A shipping provider with this code already exists.";
                    return response;
                }

                //get all shippings
                var shippings = await _unitOfWork.ShippingRepository
                    .GetAll(x => x.ShippingProvider == providerDto.Code || x.ShippingProvider == providerDto.Name);
                if(shippings.Count > 0)
                {
                    foreach(var ship in shippings)
                    {
                        ship.ShippingProvider = providerDto.Name;
                        await _unitOfWork.ShippingRepository.Upsert(ship);
                    }
                }

                //update delivery locations shipping privider
                var deliveryLocs = await _unitOfWork.DeliveryLocationRepository.GetAll(d => d.ShippingProvider == providerDto.Name
                || d.ShippingProvider == providerDto.Code);
                if(deliveryLocs.Count > 0)
                {
                    foreach(var loc in deliveryLocs)
                    {
                        loc.ShippingProvider = providerDto.Name;
                        await _unitOfWork.DeliveryLocationRepository.Upsert(loc);
                    }
                }

                _mapper.Map(providerDto, provider);

                // Trim all string fields
                provider.Name = provider.Name.Trim();
                provider.Code = provider.Code.Trim();

                if (!string.IsNullOrWhiteSpace(provider.Email))
                    provider.Email = provider.Email.Trim();
                if (!string.IsNullOrWhiteSpace(provider.PhoneNumber))
                    provider.PhoneNumber = provider.PhoneNumber.Trim();
                if (!string.IsNullOrWhiteSpace(provider.Description))
                    provider.Description = provider.Description.Trim();

                await _unitOfWork.ShippingProviderRepository.Upsert(provider);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Shipping provider updated successfully.";
                response.Data = _mapper.Map<ShippingProviderDto>(provider);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shipping provider");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<ServiceResponse<ShippingProviderListDto>> GetShippingProviderByIdAsync(Guid id)
        {
            var response = new ServiceResponse<ShippingProviderListDto>();

            try
            {
                var provider = await _unitOfWork.ShippingProviderRepository.GetById(id);

                if (provider == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Shipping provider not found.";
                    return response;
                }

                response.StatusCode = 200;
                response.Message = "Shipping provider retrieved successfully.";
                response.Data = _mapper.Map<ShippingProviderListDto>(provider);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipping provider");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<ServiceResponse<string>> DeleteShippingProviderAsync(Guid id, Guid userId)
        {
            var response = new ServiceResponse<string>();

            try
            {
                var provider = await _unitOfWork.ShippingProviderRepository.GetById(id);

                if (provider == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Shipping provider not found.";
                    return response;
                }

                await _unitOfWork.ShippingProviderRepository.Remove(id);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Shipping provider deleted successfully.";
                response.Data = response.Message;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting shipping provider");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }


        public async Task<PaginatedServiceResponse<List<Shipping>>> GetPaginatedShippingsAsync(
    string? searchTerm,
    string? status,
    string? state,
    string? city,
    string? provider,
    decimal? minPrice,
    decimal? maxPrice,
    DateTime? startDate,
    DateTime? endDate,
    string sortField = "dateCreated",
    string sortDirection = "desc",
    int pageNumber = 1,
    int pageSize = 10)
        {
            var response = new PaginatedServiceResponse<List<Shipping>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    return new PaginatedServiceResponse<List<Shipping>>
                    {
                        Status = 400,
                        Message = "Page number and page size must be greater than 0."
                    };
                }

                var query = _context.Shippings.AsQueryable();

                // Apply search filter
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(s =>
                        s.FullName.Contains(searchTerm) ||
                        s.AddressLine1.Contains(searchTerm) ||
                        s.City.Contains(searchTerm) ||
                        s.State.Contains(searchTerm) ||
                        s.Country.Contains(searchTerm) ||
                        s.PhoneNumber.Contains(searchTerm) ||
                        s.Status.Contains(searchTerm) ||
                        s.ShippingProvider.Contains(searchTerm) ||
                        s.ShippingProviderTrackingId.Contains(searchTerm) ||
                        s.OrderId.ToString().Contains(searchTerm));
                }

                // Apply status filter
                if (!string.IsNullOrEmpty(status) && status != "all")
                {
                    query = query.Where(s => s.Status == status);
                }

                // Apply state filter
                if (!string.IsNullOrEmpty(state))
                {
                    query = query.Where(s => s.State == state);
                }

                // Apply city filter
                if (!string.IsNullOrEmpty(city))
                {
                    query = query.Where(s => s.City == city);
                }

                // Apply provider filter
                if (!string.IsNullOrEmpty(provider))
                {
                    query = query.Where(s => s.ShippingProvider == provider);
                }

                // Apply price range filter
                if (minPrice.HasValue)
                {
                    query = query.Where(s => s.ShippingCost >= minPrice.Value);
                }
                if (maxPrice.HasValue)
                {
                    query = query.Where(s => s.ShippingCost <= maxPrice.Value);
                }

                // Apply date range filter
                if (startDate.HasValue)
                {
                    query = query.Where(s => s.DateCreated >= startDate.Value);
                }
                if (endDate.HasValue)
                {
                    // Include the entire end date (up to 23:59:59)
                    var endDateWithTime = endDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(s => s.DateCreated <= endDateWithTime);
                }

                // Apply sorting
                query = sortField.ToLower() switch
                {
                    "datecreated" => sortDirection.ToLower() == "asc"
                        ? query.OrderBy(s => s.DateCreated)
                        : query.OrderByDescending(s => s.DateCreated),

                    "fullname" => sortDirection.ToLower() == "asc"
                        ? query.OrderBy(s => s.FullName)
                        : query.OrderByDescending(s => s.FullName),

                    "shippingcost" => sortDirection.ToLower() == "asc"
                        ? query.OrderBy(s => s.ShippingCost)
                        : query.OrderByDescending(s => s.ShippingCost),

                    "estimateddeliverydate" => sortDirection.ToLower() == "asc"
                        ? query.OrderBy(s => s.EstimatedDeliveryDate)
                        : query.OrderByDescending(s => s.EstimatedDeliveryDate),

                    _ => query.OrderByDescending(s => s.DateCreated) // Default sorting
                };

                // Get total count before pagination
                var totalRecords = await query.CountAsync();

                // Apply pagination
                var shippings = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .AsNoTracking()
                    .Select(s => new Shipping
                    {
                        Id = s.Id,
                        FullName = s.FullName,
                        AddressLine1 = s.AddressLine1,
                        AddressLine2 = s.AddressLine2,
                        City = s.City,
                        State = s.State,
                        PostalCode = s.PostalCode,
                        Country = s.Country,
                        PhoneNumber = s.PhoneNumber,
                        Email = s.Email,
                        Status = s.Status,
                        ShippingMethod = s.ShippingMethod,
                        ShippingProvider = s.ShippingProvider,
                        ShippingCost = s.ShippingCost,
                        EstimatedDeliveryDate = s.EstimatedDeliveryDate,
                        OrderId = s.OrderId,
                        //ShippingProviderTrackingId = s.OrderId.ToString().ToUpper().Substring(0, 8),
                        ShippingProviderTrackingId = s.ShippingProviderTrackingId,
                        UserId = s.UserId,
                        DateCreated = s.DateCreated,
                        DateUpdated = s.DateUpdated,
                        // Include related order information for display
                        Order = new Order
                        {
                            Id = s.Order.Id,
                            //OrderNumber = s.Order.OrderNumber,
                            Amount = s.Order.Amount
                        }
                    })
                    .ToListAsync();

                // Create response
                response = new PaginatedServiceResponse<List<Shipping>>
                {
                    Status = 200,
                    Message = "Shippings retrieved successfully",
                    Data = shippings,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalRecords = totalRecords,
                    //TotalPages = (int)Math.Ceiling(totalRecords / (double)pageSize)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipping records.");
                response.Status = 500;
                response.Message = "An error occurred while retrieving shipping records.";
            }

            return response;
        }

        public async Task<ServiceResponse<Dictionary<string, List<string>>>> GetShippingLocationDataAsync()
        {
            var response = new ServiceResponse<Dictionary<string, List<string>>>();

            try
            {
                var states = await _context.Shippings
                    .Where(s => !string.IsNullOrEmpty(s.State))
                    .Select(s => s.State)
                    .Distinct()
                    .OrderBy(s => s)
                    .ToListAsync();

                var cities = await _context.Shippings
                    .Where(s => !string.IsNullOrEmpty(s.City))
                    .Select(s => s.City)
                    .Distinct()
                    .OrderBy(s => s)
                    .ToListAsync();

                var providers = await _context.Shippings
                    .Where(s => !string.IsNullOrEmpty(s.ShippingProvider))
                    .Select(s => s.ShippingProvider)
                    .Distinct()
                    .OrderBy(s => s)
                    .ToListAsync();

                var locationData = new Dictionary<string, List<string>>
        {
            { "states", states },
            { "cities", cities },
            { "providers", providers }
        };

                response.StatusCode = 200;
                response.Message = "Location data retrieved successfully";
                response.Data = locationData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipping location data.");
                response.StatusCode = 500;
                response.Message = "An error occurred while retrieving location data.";
            }

            return response;
        }

        public async Task<ServiceResponse<ShippingDto>> CreateShippingAsync(ShippingDto shippingDto, Guid userId)
		{
			var response = new ServiceResponse<ShippingDto>();

			try
			{
				// Validate the DTO
				if (shippingDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Shipping data is required.";
					return response;
				}

				// Validate required fields
				if (string.IsNullOrEmpty(shippingDto.FullName) ||
					string.IsNullOrEmpty(shippingDto.AddressLine1) ||
					string.IsNullOrEmpty(shippingDto.City) ||
					string.IsNullOrEmpty(shippingDto.State) ||
					string.IsNullOrEmpty(shippingDto.Country) ||
					string.IsNullOrEmpty(shippingDto.PhoneNumber) ||
					string.IsNullOrEmpty(shippingDto.ShippingMethod) ||
					shippingDto.ShippingCost <= 0 ||
					shippingDto.OrderId == Guid.Empty)
				{
					response.StatusCode = 400;
					response.Message = "Required fields are missing or invalid.";
					return response;
				}

				// Map DTO to entity
				var shipping = _mapper.Map<Shipping>(shippingDto);
				shipping.Status = "Pending";

				// Add to database
				await _unitOfWork.ShippingRepository.Add(shipping);
				await _unitOfWork.CompletedAsync(userId);

				// Map entity back to DTO
				var savedShippingDto = _mapper.Map<ShippingDto>(shipping);

				// Return success response
				response.StatusCode = 201;
				response.Message = "Shipping information created successfully.";
				response.Data = savedShippingDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating shipping information by UserId: {UserId}.", userId);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<Shipping>> GetShippingByIdAsync(Guid UserId, Guid id)
		{
			var response = new ServiceResponse<Shipping>();

			try
			{
				// Find the shipping information by ID
				var shipping = await _unitOfWork.ShippingRepository.Get( x => x.Id == id || x.OrderId == id);

				if (shipping == null)
				{
					response.StatusCode = 404;
					response.Message = "Shipping information not found.";
					return response;
				}

				//check shipping 3rd party and update status
				/* if(!shipping.ShippingProviderTrackingId.IsNullOrEmpty() && shipping.ShippingProvider == "GIG")
				{
                    var deliveryStatus = await _gigDeliveryService.TrackShipmentAsync(shipping.ShippingProviderTrackingId);
					if(deliveryStatus != null && deliveryStatus.Data != null && deliveryStatus.StatusCode == 200)
					{
						var status = deliveryStatus.Data.Object.MobileShipmentTrackings[0].Status;

                        if (status == "MCRT")
						{
							shipping.Status = "Pending";
						}
						else if (status == "OKC" || status == "OKT")
                        {
							shipping.Status = "Delivered";
						}
                        else if (status == "DFA")
                        {
                            shipping.Status = "Canceled";
                        }
                        else if (status == "AD")
                        {
                            shipping.Status = "Shipped";
                        }
                        else if (status == "RTNINIT")
                        {
                            shipping.Status = "Returning";
                        }
                        else if (status == "SRC" || status == "SSR")
                        {
                            shipping.Status = "Returned";
                        }
						else
						{
							shipping.Status = "Processing";
						}
						await _unitOfWork.ShippingRepository.Upsert(shipping);
						await _unitOfWork.CompletedAsync(UserId);
                    }
                }*/


                response.StatusCode = 200;
				response.Message = "Shipping information retrieved successfully.";
				response.Data = shipping;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving shipping information with Id: {Id}", id);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

        public async Task<ServiceResponse<bool>> UpdateShippingProviderTrackingId(UpdateShippingProviderTrackingIdDto request, Guid userId)
        {
            var response = new ServiceResponse<bool>();
            response.StatusCode = 200;
            response.Data = false;
            try
            {
                //check if shipping exists
                if(request != null && request.ShippingId != Guid.Empty)
                {
                    var shipping = await _unitOfWork.ShippingRepository.GetById(request.ShippingId);
                    if(shipping != null)
                    {
                        //check if tracking id is already set
                        var existingTracking = await _unitOfWork.ShippingRepository.GetAll(x => x.ShippingProviderTrackingId == request.ShippingProviderTrackingId);
                        if(existingTracking.Count > 0)
                        {
                            response.Message = "The provided tracking ID is already associated with another shipment.";
                            response.StatusCode = 409;
                            return response;
                        }

                        shipping.ShippingProviderTrackingId = request.ShippingProviderTrackingId;
                        await _unitOfWork.ShippingRepository.Upsert(shipping);
                        await _unitOfWork.CompletedAsync(userId);
                        response.Message = "Shipping provider waybill ID successfully updated.";
                        response.StatusCode = 200;
                        response.Data = true;
                    }
                    else
                    {
                        response.Message = "Shipping not found for order";
                    }
                }
                else
                {
                    response.Message = "Invalid request";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shipping information with Id: {Id}", request.ShippingId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<Shipping>> GetShippingByTrackingIdAsync(UpdateShippingProviderDto providerDto)
        {
            var response = new ServiceResponse<Shipping>();

            try
            {
                // Find the shipping information by ID
                var shipping = await _unitOfWork.ShippingRepository.Get(x => x.ShippingProviderTrackingId == providerDto.ShippingProviderTrackingId && x.ShippingProvider == providerDto.ShippingProvider);

                if (shipping == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Shipping information not found.";
                    return response;
                }

                //check shipping 3rd party and update status
               /* if (!shipping.ShippingProviderTrackingId.IsNullOrEmpty() && shipping.ShippingProvider == "GIG")
                {
                    var deliveryStatus = await _gigDeliveryService.TrackShipmentAsync(shipping.ShippingProviderTrackingId);
                    if (deliveryStatus != null && deliveryStatus.StatusCode == 200)
                    {
                        if (deliveryStatus.Data.Object.MobileShipmentTrackings[0].Status == "MCRT")
                        {
                            //update if neccessary
                        }
                    }
                }*/


                response.StatusCode = 200;
                response.Message = "Shipping information retrieved successfully.";
                response.Data = shipping;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipping information with Id: {Id}", providerDto.ShippingProviderTrackingId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ShippingDto>> UpdateShippingAsync(Guid id, ShippingDto shippingDto, Guid userId)
		{
			var response = new ServiceResponse<ShippingDto>();

			try
			{
				// Validate the DTO
				if (shippingDto.Status == null)
				{
					response.StatusCode = 400;
					response.Message = "Shipping status is required.";
					return response;
				}

				// Find the shipping information by ID
				var shipping = await _unitOfWork.ShippingRepository.GetById(id);

				// Validate required fields
				if (string.IsNullOrEmpty(shippingDto.FullName ?? shipping?.FullName) ||
					string.IsNullOrEmpty(shippingDto.AddressLine1 ?? shipping?.AddressLine1) ||
					string.IsNullOrEmpty(shippingDto.City ?? shipping?.City) ||
					string.IsNullOrEmpty(shippingDto.State?? shipping?.State) ||
					string.IsNullOrEmpty(shippingDto.Country ?? shipping?.Country) ||
					string.IsNullOrEmpty(shippingDto.PhoneNumber ?? shipping?.PhoneNumber) ||
					string.IsNullOrEmpty(shippingDto.ShippingMethod ?? shipping?.ShippingMethod))
				{
					response.StatusCode = 400;
					response.Message = "Required fields are missing or invalid.";
					return response;
				}

				if (shipping == null)
				{
					response.StatusCode = 404;
					response.Message = "Shipping information not found.";
					return response;
				}
				/*shipping.FullName = shippingDto.FullName ?? shipping?.FullName;
				shipping.AddressLine1 = shippingDto.AddressLine1 ?? shipping?.AddressLine1;
				shipping.City = shippingDto.City ?? shipping?.City;
				shipping.State = shippingDto.State ?? shipping?.State;
				shipping.Country = shippingDto.Country ?? shipping?.Country;
				shipping.PhoneNumber = shippingDto.PhoneNumber ?? shipping?.PhoneNumber;
				shipping.ShippingMethod  = shippingDto.ShippingMethod ?? shipping?.ShippingMethod; */
				// Update the shipping information
				_mapper.Map(shippingDto, shipping);

				// Save changes
				await _unitOfWork.ShippingRepository.Upsert(shipping);
				await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Shipping information updated successfully.";
				response.Data = shippingDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating shipping information with Id: {Id} by UserId: {UserId}.", id, userId);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

        public async Task<ServiceResponse<ShippingDto>> UpdateShippingProviderAsync(Guid id, UpdateShippingProviderDto shippingDto, Guid userId)
        {
            var response = new ServiceResponse<ShippingDto>();

            try
            {

                // Find the shipping information by ID
                var shipping = await _unitOfWork.ShippingRepository.GetById(id);

                // Validate required fields
                if (string.IsNullOrEmpty(shippingDto.ShippingProvider)  || string.IsNullOrEmpty(shippingDto.ShippingProviderTrackingId))
                {
                    response.StatusCode = 400;
                    response.Message = "Required fields are missing or invalid.";
                    return response;
                }

                if (shipping == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Shipping information not found.";
                    return response;
                }
                
                // Save changes
				shipping.ShippingProvider = shippingDto.ShippingProviderTrackingId;
				shipping.ShippingProviderTrackingId = shippingDto.ShippingProviderTrackingId;
                await _unitOfWork.ShippingRepository.Upsert(shipping);
                await _unitOfWork.CompletedAsync(userId);

                // Return success response
                response.StatusCode = 200;
                response.Message = "Shipping information updated successfully.";
                response.Data = _mapper.Map<ShippingDto>(shipping);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shipping information with Id: {Id} by UserId: {UserId}.", id, userId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<string>> UpdateShippingStatusAsync(UpdateBulkShippingDto dto, Guid userId)
        {
            var response = new ServiceResponse<string>();
            try
            {
              
                    // Validate the DTO
                    if (dto.Status.IsNullOrEmpty())
                    {
                        response.StatusCode = 400;
                        response.Message = "Shipping status is required.";
                        return response;
                    }

                    // Find the shipping information by ID
                    var shipping = await _unitOfWork.ShippingRepository.GetById(dto.Id);

                    if (shipping == null)
                    {
                        response.StatusCode = 404;
                        response.Message = "Shipping information not found.";
                        return response;
                    }

                    shipping.Status = dto.Status;
                    shipping.DateUpdated = DateTime.UtcNow;

                // Save changes
                await _unitOfWork.ShippingRepository.Upsert(shipping);
					await _unitOfWork.CompletedAsync(userId);

                if (dto.Status == "Shipped" || dto.Status == "Delivered" || dto.Status == "Completed")
                {
                    //get user info
                    var user = await _unitOfWork.UserRepository.Get(u => u.Id == shipping.UserId);
                    var order = await _unitOfWork.OrderRepository.Get(o => o.Id == shipping.OrderId);
                    var address = await _unitOfWork.DeliveryAddressRepository.Get(u => u.UserId == shipping.UserId && u.IsPrimary == true);
                    if (user != null && (address != null || shipping != null) && order != null)
                    {
                        string trackUrl = $"{_appSettings.FrontendUrl}/customer/orders/{shipping.OrderId.ToString()}";
                        var orderId = shipping.OrderId.ToString().ToUpper().Substring(0, 8);
                        var smsMessage = _smsTemplateFactory.OrderShippedSms(order.Id.ToString(), orderId, "", shipping.EstimatedDeliveryDate);
                        if (dto.Status == "Delivered" || dto.Status == "Completed")
                        {
                            smsMessage = _smsTemplateFactory.OrderDeliveredSms(order.Id.ToString(), DateTime.Now);
                        }
                        var sendSMS = await _smsService.SendMessage(
                            new MessageDto
                            {
                                Channel = MessagingChannels.SMS,
                                Content = smsMessage.Message,
                                Recipient = address?.PhoneNumber ?? shipping.PhoneNumber,
                                RecipientName = address?.FullName ?? shipping.FullName,
                                Subject = ""
                            });

                        var emailMessage = _emailTemplateFactory.OrderShipped(user.FirstName, order.Id.ToString(), orderId, null, DateTime.Now, shipping.EstimatedDeliveryDate, trackUrl);
                        if (dto.Status == "Delivered" || dto.Status == "Completed")
                        {
                            emailMessage = _emailTemplateFactory.OrderDelivered(user.FirstName, order.Id.ToString(), DateTime.Now);
                        }
                        var sendMessage = await _emailService.SendMailAsync(
                            new MessageDto
                            {
                                Channel = MessagingChannels.Email,
                                Content = emailMessage.Body,
                                Recipient = user.Email,
                                RecipientName = user.FirstName,
                                Subject = emailMessage.Subject
                            });
                    }
                }

                // Return success response
                response.StatusCode = 200;
                response.Message = "Shipping status updated successfully.";
                response.Data = response.Message;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shipping status Id: {Id} by UserId: {UserId}.", dto.Id, userId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }
            return response;
        }
        public async Task<ServiceResponse<string>> UpdateBulkShippingStatusAsync(List<UpdateBulkShippingDto> dto, Guid userId)
		{
			 var response = new ServiceResponse<string>();
            try
            {
				foreach (var sh in dto)
				{

					// Validate the DTO
					if (sh.Status.IsNullOrEmpty())
					{
						response.StatusCode = 400;
						response.Message = "Shipping status is required.";
						return response;
					}

					// Find the shipping information by ID
					var shipping = await _unitOfWork.ShippingRepository.GetById(sh.Id);

					if (shipping == null)
					{
						response.StatusCode = 404;
						response.Message = "Shipping information not found.";
						return response;
					}

					shipping.Status = sh.Status;
                    shipping.DateUpdated = DateTime.UtcNow;
                    // Save changes
                    await _unitOfWork.ShippingRepository.Upsert(shipping);

					if (sh.Status == "Shipped" || sh.Status == "Delivered" || sh.Status == "Completed")
					{
						//get user info
						var user = await _unitOfWork.UserRepository.Get(u => u.Id == shipping.UserId);
						var order = await _unitOfWork.OrderRepository.Get(o => o.Id == shipping.OrderId);
						var address = await _unitOfWork.DeliveryAddressRepository.Get(u => u.UserId == shipping.UserId && u.IsPrimary == true);
						if (user != null && (address != null || shipping.AddressLine1 != null) && order != null)
                        {
                            string trackUrl = $"{_appSettings.FrontendUrl}/customer/orders/{shipping.OrderId.ToString()}";
                            var orderId = shipping.OrderId.ToString().ToUpper().Substring(0, 8);
                            var smsMessage = _smsTemplateFactory.OrderShippedSms(order.Id.ToString(), orderId, "", shipping.EstimatedDeliveryDate);
							if(sh.Status == "Delivered" || sh.Status == "Completed")
							{
                                smsMessage = _smsTemplateFactory.OrderDeliveredSms(order.Id.ToString(), DateTime.Now);
                            }
                            var sendSMS = await _smsService.SendMessage(
                                new MessageDto
                                {
                                    Channel = MessagingChannels.SMS,
                                    Content = smsMessage.Message,
                                    Recipient = address?.PhoneNumber ?? shipping.PhoneNumber,
                                    RecipientName = address?.FullName ?? shipping.FullName,
                                    Subject = ""
                                });

                            var emailMessage = _emailTemplateFactory.OrderShipped(user.FirstName, order.Id.ToString(), orderId, null, DateTime.Now, shipping.EstimatedDeliveryDate, trackUrl);
                            if (sh.Status == "Delivered" || sh.Status == "Completed")
                            {
                                emailMessage = _emailTemplateFactory.OrderDelivered(user.FirstName, order.Id.ToString(), DateTime.Now);
                            }
                            var sendMessage = await _emailService.SendMailAsync(
                                new MessageDto
                                {
                                    Channel = MessagingChannels.Email,
                                    Content = emailMessage.Body,
                                    Recipient = user.Email,
                                    RecipientName = user.FirstName,
                                    Subject = emailMessage.Subject
                                });
                        }
                    }
                }

                await _unitOfWork.CompletedAsync(userId);

                // Return success response
                response.StatusCode = 200;
                response.Message = "Shipping status updated successfully.";
                response.Data = response.Message;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shipping status by UserId: {UserId}.", userId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }
            return response;
        }

        public async Task<ServiceResponse<ShippingDto>> DeleteShippingAsync(Guid id, Guid userId)
		{
			var response = new ServiceResponse<ShippingDto>();

			try
			{
				// Find the shipping information by ID
				var shipping = await _unitOfWork.ShippingRepository.GetById(id);

				if (shipping == null)
				{
					response.StatusCode = 404;
					response.Message = "Shipping information not found.";
					return response;
				}

				// Delete the shipping information
				await _unitOfWork.ShippingRepository.Remove(shipping.Id);
				await _unitOfWork.CompletedAsync(userId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Shipping information deleted successfully.";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting shipping information with Id: {Id} by UserId: {UserId}.", id, userId);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}
	}
}