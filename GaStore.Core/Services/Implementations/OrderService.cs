using AutoMapper;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Products;
using GaStore.Data.Entities.Users;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
	public class OrderService : IOrderService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly IMapper _mapper;
		private readonly ILogger<OrderService> _logger;
		private readonly DatabaseContext _context;
		private readonly IOrderItemService _orderItemService;
		private readonly ICouponService _couponService;

		public OrderService(
			IUnitOfWork unitOfWork,
			IMapper mapper,
			ILogger<OrderService> logger, DatabaseContext context, IOrderItemService orderItemService, ICouponService couponService)
		{
			_unitOfWork = unitOfWork;
			_mapper = mapper;
			_logger = logger;
			_context = context;
			_orderItemService = orderItemService;
			_couponService = couponService;
		}

		public async Task<ServiceResponse<OrderSummaryDto>> OrderSummaryAsync(Guid UserId, OrderSummaryDto dto)
		{
			var response = new ServiceResponse<OrderSummaryDto>();
			response.Data = new OrderSummaryDto();
			response.StatusCode = 400;

			try
			{
				// Validate input
				if (dto == null || dto.CartProducts == null || !dto.CartProducts.Any())
				{
					response.Message = "Cart products are required.";
					return response;
				}

				decimal subTotal = 0;
				var items = dto.CartProducts.ToList();

				// Calculate subtotal with proper tiered pricing
				foreach (var item in items)
				{
					if (item == null || item.Quantity <= 0)
					{
						response.Message = $"Invalid quantity for product variant";
						return response;
					}

					var product = await _unitOfWork.ProductRepository.Get(p => p.Id == item.ProductId);
					if(product == null)
					{
                        response.Message = $"One or more products not available. Update your cart";
                        return response;
                    }

					// Get all pricing tiers for this variant, ordered by MinQuantity (descending)
					var pricingTiers = await _unitOfWork.PricingTierRepository.GetAllAsync(
						p => p.VariantId == item.VariantId,
						q => q.OrderByDescending(pt => pt.MinQuantity)
					);

					if (pricingTiers == null || !pricingTiers.Any())
					{
						response.Message = $"Pricing not configured for variant.";
						return response;
					}

					// Find the appropriate tier for the quantity
					var applicableTier = pricingTiers.FirstOrDefault(t => item.Quantity >= t.MinQuantity)
									   ?? pricingTiers.Last();

					decimal itemTotal = applicableTier.PricePerUnit * item.Quantity;
					subTotal += itemTotal;
				}

				decimal? totalWeightKg = 0;
                var variants = items.Select(i => i.VariantId).ToList();
				if(variants.Count > 0)
				{
					for (int i = 0; i < variants.Count; i++)
					{
						var variant = await _unitOfWork.ProductVariantRepository.Get(v => v.Id == variants[i]);
						if (variant != null)
						{
							var itemWeightKg = variant.Weight * items[i].Quantity;
							totalWeightKg += itemWeightKg/1000;
						}
                    }
                }

                    subTotal = Math.Round(subTotal, 2);

				// Delivery location
				var location = await _unitOfWork.DeliveryLocationRepository.Get(
					x => x.State.ToLower().Contains(dto.State.ToLower()) && x.City == dto.City, includeProperties: "PriceByWeights");

				if (location == null)
				{
					response.StatusCode = 404;
					response.Message = $"Delivery location not found for {dto.State}, {dto.City}";
					return response;
				}

                // Set delivery fees and method
                //decimal deliveryFee = dto.DeliveryFee;
                decimal deliveryFee = 0;

                //compare delivery fee
                if (location.PriceByWeights != null)
                {
                    var priceByWeight = location.PriceByWeights
                        .OrderBy(p => p.MinWeight)
                        .ToList();

                    var applicableWeightTier = priceByWeight.FirstOrDefault(w =>
                        totalWeightKg >= w.MinWeight &&
                        totalWeightKg <= w.MaxWeight);

                    if (applicableWeightTier != null)
                    {
                        deliveryFee = applicableWeightTier.Price;
                    }
                    else
                    {
                        // Find the closest tier for weight exceeding max
                        var maxTier = priceByWeight.LastOrDefault();
                        if (maxTier != null && totalWeightKg > maxTier.MaxWeight)
                        {
                            deliveryFee = maxTier.Price;
                        }
                        else
                        {
                            deliveryFee = location.PickupDeliveryAmount ?? 0;
                        }
                    }
                }

                //compute delivery fee based on delivery method
				if(deliveryFee != dto.DeliveryFee)
				{
					response.StatusCode = 400;
					response.Message = $"Delivery fee mismatch. Expected: {deliveryFee}, Received: {dto.DeliveryFee}";
					return response;
                }

				if(deliveryFee == 0)
				{
                    response.StatusCode = 400;
                    response.Message = $"Invalid delivery fee.";
                    return response;
                }


                    // Customer details
                /*    var address = await _unitOfWork.DeliveryAddressRepository
					.Get(x => x.UserId == UserId && x.State.ToLower().Contains(dto.State.ToLower()) 
					&& dto.City.ToLower().Replace("-", "").Replace(" ", "").Contains(x.City.ToLower().Replace("-", "").Replace(" ", "")));

				if (address == null && dto.IsDoorStepDelivery)
				{
					response.StatusCode = 404;
					response.Message = $"Doorstep delivery address not found for your selected address. Update address or update delivery method.";
					return response;
				}*/

				// VAT calculation
				var vat = await _unitOfWork.VatRepository.Get(x => x.IsActive == true);
				decimal tax = 0;

				if (vat != null)
				{
					decimal taxableAmount = subTotal + deliveryFee;
					tax = taxableAmount * (vat.Percentage / 100);
					tax = Math.Round(tax, 2);
				}

				//Discount calculation
				decimal discount = 0;
				decimal discountPercentage = 0;
				if(!string.IsNullOrEmpty(dto.CouponCode))
				{
                    var discount_ = _context.Coupons.Where(c => c.Code == dto.CouponCode);
                    if (discount_ != null)
                    {
                        var getDiscount = await _couponService.GetCouponByCodeAsync(UserId, dto.CouponCode, subTotal);
                        if (getDiscount.StatusCode == 200 && getDiscount.Data != null)
                        {
                            discount = getDiscount.Data.NewTotal;
                            discountPercentage = getDiscount.Data.DiscountPercentage;
                        }
                        else
                        {
                            response.Message = getDiscount.Message;
                            return response;
                        }
					}
					else
					{
                        response.Message = "Invalid coupon code";
                        return response;
                    }
                }

				// Prepare response
				response.Data = new OrderSummaryDto
				{
					IsDoorStepDelivery = dto.IsDoorStepDelivery,
					SubTotal = subTotal,
					DeliveryFee = deliveryFee,
					DoorStepDeliveryFee = (decimal)location.DoorDeliveryAmount,
					PickupLocationDeliveryFee = (decimal)location.PickupDeliveryAmount,
					Tax = tax,
					Total = subTotal + deliveryFee + tax,
					TotalAfterDiscount = discount + deliveryFee + tax,
					SubTotalAfterDiscount = discount,
					DiscountPercentage = discountPercentage,
					CouponCode = dto.CouponCode,					
					DeliveryDays = location.EstimatedDeliveryDays,
					ShippingProvider = location.ShippingProvider,
                    /*CustomerAddress = address != null? address.Address : dto.CustomerAddress,
					DeliveryAddress = dto.IsDoorStepDelivery && address != null ? address.Address : location.PickupAddress,
					CustomerPhone = address != null? address.PhoneNumber : dto.CustomerPhone,
                    FullName = address != null ? address.FullName : dto.FullName*/
                    CustomerAddress = dto.CustomerAddress,
                    DeliveryAddress = dto.IsDoorStepDelivery ? dto.DeliveryAddress : location.PickupAddress,
                    CustomerPhone = dto.CustomerPhone,
                    FullName = dto.FullName
                };

				// Round final total
				response.Data.Total = Math.Round(response.Data.Total, 2);

				// Price validation with tolerance
				decimal priceTolerance = 0.1m; // 10 cents tolerance for floating point differences

				/*
				if (Math.Abs(dto.SubTotal - subTotal) > priceTolerance)
				{
					response.Message = $"Subtotal mismatch. Expected: {subTotal}, Received: {dto.SubTotal}";
					return response;
				}*/

				//to check later
				
				if (Math.Abs(dto.Total - response.Data.Total) > priceTolerance)
				{
					response.Message = $"Total mismatch. Expected: {response.Data.Total}, Received: {dto.Total}";
					return response;
				}

				response.StatusCode = 200;
				response.Message = "Order summary calculated successfully";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error summarizing order for user {UserId}", UserId);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<OrderDto>> CreateOrderAsync(OrderDto orderDto, Guid UserId)
		{
			var response = new ServiceResponse<OrderDto>();

			try
			{
				// Validate the DTO
				if (orderDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Order data is required.";
					return response;
				}
				orderDto.UserId = UserId;
				// Map DTO to entity
				var order = _mapper.Map<Order>(orderDto);


				// Add to database
				await _unitOfWork.OrderRepository.Add(order);
				await _unitOfWork.CompletedAsync(UserId);

				//create items
				var items = orderDto.Items.ToList();
				foreach (var item in items)
				{
					item.OrderId = order.Id;
					await _orderItemService.CreateOrderItemAsync(item, UserId);
				}

				// Map entity back to DTO
				var savedOrderDto = _mapper.Map<OrderDto>(order);

				// Return success response
				response.StatusCode = 201;
				response.Message = "Order created successfully.";
				response.Data = savedOrderDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error creating order.");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<Order>> GetOrderByIdAsync(string id)
		{
			var response = new ServiceResponse<Order>();

			try
			{

                string orderIdString = id;
				Guid orderId = Guid.NewGuid();
                if (Guid.TryParse(orderIdString, out Guid guid))
                {
					// Its GUID
					orderId = guid;
                    Console.WriteLine($"Valid GUID: {guid}");
                }
                else
                {
					//find GUID
					var ord = await _unitOfWork.OrderRepository.Get(or => or.Id.ToString().Substring(0, 8).ToUpper().Contains(id.ToUpper()));
					if(ord != null)
					{
						orderId = ord.Id;
					}
                    // Handle invalid GUID format
                    Console.WriteLine("Invalid GUID format");
                }
                // Build the query
                var order = await _context.Orders
					.Include(p => p.Items)
					.Where(x => x.Id == orderId)
					.OrderByDescending(o => o.DateCreated)
					.Select(o => new Order
					{
						Id = o.Id,
						HasPaid = o.HasPaid,
						Amount = o.Amount,
						AmountAfterDiscount = o.AmountAfterDiscount,
						SubTotalAfterDiscount = o.SubTotalAfterDiscount,
						DiscountPercentage = o.DiscountPercentage,
						CouponCode = o.CouponCode,
                        DeliveryFee = o.DeliveryFee,
                        SubTotal = o.SubTotal,
                        Tax = o.Tax,
                        PaymentGateway = o.PaymentGateway,
                        PaymentGatewayTransactionId = o.PaymentGatewayTransactionId,
						OrderDate = o.OrderDate,
						DateCreated = o.DateCreated,
						//User = new User { Email = o.User.Email }, // Include minimal user info
						/*Shipping = o.Shipping != null ? new Shipping
						{
							Id = o.Shipping.Id,
							FullName = o.Shipping.FullName,
							OrderId = o.Shipping.OrderId,
							Status = o.Shipping.Status
							// Include only necessary shipping properties
						} : null,*/
						Items = o.Items.Select(i => new OrderItem
						{
							Id = i.Id,
							ProductId = i.ProductId,
							Product = new Product { Name = i.Product.Name, Images = i.Product.Images }, // Include product name
							Variant = new ProductVariant { ProductId = i.Variant.ProductId, Name = i.Variant.Name, Images = i.Variant.Images },
							VariantId = i.VariantId,
							Quantity = i.Quantity,
							Price = i.Price
						}).ToList()
					})
					.FirstOrDefaultAsync();  // Important: Execute the query and get the first result

				if (order == null)
				{
					response.StatusCode = 404;
					response.Message = "Order not found.";
					return response;
				}

				// Return success response
				response.StatusCode = 200;
				response.Message = "Order retrieved successfully.";
				response.Data = order;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving order with Id: {Id}", id);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

        public async Task<PaginatedServiceResponse<List<Order>>> GetOrdersAsync(
     int pageNumber,
     int pageSize,
     string searchTerm = null,
     string status = null,
     string dateRange = null,
     string couponCode = null,
     string userId = null,
     decimal? minAmount = null,
     decimal? maxAmount = null,
     string shippingStatus = null,
     string shippingState = null,
     string shippingCity = null,
     string shippingProvider = null,
     DateTime? startDate = null,
     DateTime? endDate = null,
     bool? hasDiscount = null,
     string sortBy = "datecreated",
     string sortDirection = "desc")
        {
            var response = new PaginatedServiceResponse<List<Order>>();

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Status = 400;
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                // Base query with includes
                var query = _context.Orders
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Product)
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Variant)
                    .Include(o => o.Shipping)
                    .Include(o => o.User)
                    .AsQueryable();

                //  Search Filter
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(o =>
                        o.Id.ToString().Contains(searchTerm) ||
                        // Search by Product Guid
                        o.Items.Any(i => i.Product.Id.ToString().Contains(searchTerm) ||
                                        i.Product.Name.Contains(searchTerm) ||
                                        i.Order.PaymentGatewayTransactionId.Contains(searchTerm) ||
                                        i.Order.PaymentGateway.Contains(searchTerm) ||
                                        i.Product.Description.Contains(searchTerm)) ||
                        (o.Shipping != null && (o.Shipping.FullName.Contains(searchTerm) ||
                                               o.Shipping.PhoneNumber.Contains(searchTerm) ||
                                               o.Shipping.ShippingProviderTrackingId.Contains(searchTerm) ||
                                               o.Shipping.ShippingProvider.Contains(searchTerm) ||
                                               o.Shipping.Email.Contains(searchTerm))) ||
                        (o.User != null && (o.User.FirstName.Contains(searchTerm) ||
                                           o.User.LastName.Contains(searchTerm) ||
                                           o.User.Email.Contains(searchTerm))));
                }

                // Payment Status Filter
                if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
                {
                    query = status.ToLower() switch
                    {
                        "pending" => query.Where(o => !o.HasPaid || o.Shipping.Status == "Pending"),
                        "completed" => query.Where(o => o.HasPaid),
                        "refunded" => query.Where(o => o.Shipping.Status == "Refunded"),
                        "returned" => query.Where(o => o.Shipping.Status == "Returned"),
                        "cancelled" => query.Where(o => o.Shipping.Status == "Canceled" || o.Shipping.Status == "Cancelled"),
                        "processing" => query.Where(o => o.HasPaid && o.Shipping.Status == "Processing"),
                        "delivered" => query.Where(o => o.Shipping.Status == "Delivered"),
                        _ => query
                    };
                }

                // Date Range Quick Filter
                if (!string.IsNullOrEmpty(dateRange) && dateRange.ToLower() != "all")
                {
                    var today = DateTime.UtcNow.Date;
                    query = dateRange.ToLower() switch
                    {
                        "today" => query.Where(o => o.OrderDate.Date == today),
                        "yesterday" => query.Where(o => o.OrderDate.Date == today.AddDays(-1)),
                        "week" => query.Where(o => o.OrderDate.Date >= today.AddDays(-7)),
                        "month" => query.Where(o => o.OrderDate.Date >= today.AddMonths(-1)),
                        "quarter" => query.Where(o => o.OrderDate.Date >= today.AddMonths(-3)),
                        "year" => query.Where(o => o.OrderDate.Date >= today.AddYears(-1)),
                        _ => query
                    };
                }

                //Custom Date Range Filter
                if (startDate.HasValue)
                {
                    query = query.Where(o => o.OrderDate >= startDate.Value.Date);
                }
                if (endDate.HasValue)
                {
                    var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(o => o.OrderDate <= endOfDay);
                }

                // Coupon Filter
                if (!string.IsNullOrWhiteSpace(couponCode))
                {
                    query = query.Where(o => o.CouponCode != null &&
                                             o.CouponCode.ToLower() == couponCode.ToLower());
                }

                // User Filter
                if (!string.IsNullOrWhiteSpace(userId) && Guid.TryParse(userId, out var userGuid))
                {
                    query = query.Where(o => o.UserId == userGuid);
                }

                // Amount Range Filter
                if (minAmount.HasValue)
                {
                    query = query.Where(o => o.Amount >= minAmount.Value);
                }
                if (maxAmount.HasValue)
                {
                    query = query.Where(o => o.Amount <= maxAmount.Value);
                }

                // Shipping Status Filter
                if (!string.IsNullOrEmpty(shippingStatus) && shippingStatus.ToLower() != "all")
                {
                    query = query.Where(o => o.Shipping != null &&
                                             o.Shipping.Status.ToLower() == shippingStatus.ToLower());
                }

                // Shipping Location Filters
                if (!string.IsNullOrEmpty(shippingState))
                {
                    query = query.Where(o => o.Shipping != null &&
                                             o.Shipping.State.ToLower() == shippingState.ToLower());
                }

                if (!string.IsNullOrEmpty(shippingCity))
                {
                    query = query.Where(o => o.Shipping != null &&
                                             o.Shipping.City.ToLower() == shippingCity.ToLower());
                }

                // Shipping Provider Filter
                if (!string.IsNullOrEmpty(shippingProvider))
                {
                    query = query.Where(o => o.Shipping != null &&
                                             o.Shipping.ShippingProvider.ToLower() == shippingProvider.ToLower());
                }

                // Discount Filter
                if (hasDiscount.HasValue)
                {
                    if (hasDiscount.Value)
                    {
                        query = query.Where(o => o.DiscountPercentage > 0 || !string.IsNullOrEmpty(o.CouponCode));
                    }
                    else
                    {
                        query = query.Where(o => o.DiscountPercentage == 0 && string.IsNullOrEmpty(o.CouponCode));
                    }
                }

                // Sorting
                query = (sortBy?.ToLower(), sortDirection?.ToLower()) switch
                {
                    ("datecreated", "asc") => query.OrderBy(o => o.DateCreated),
                    ("datecreated", _) => query.OrderByDescending(o => o.DateCreated),

                    ("orderdate", "asc") => query.OrderBy(o => o.OrderDate),
                    ("orderdate", _) => query.OrderByDescending(o => o.OrderDate),

                    ("amount", "asc") => query.OrderBy(o => o.Amount),
                    ("amount", _) => query.OrderByDescending(o => o.Amount),

                    ("deliverydate", "asc") => query.OrderBy(o => o.Shipping.EstimatedDeliveryDate),
                    ("deliverydate", _) => query.OrderByDescending(o => o.Shipping.EstimatedDeliveryDate),

                    ("customername", "asc") => query.OrderBy(o => o.Shipping.FullName),
                    ("customername", _) => query.OrderByDescending(o => o.Shipping.FullName),

                    _ => query.OrderByDescending(o => o.DateCreated) // Default
                };

                // Count before pagination
                var totalRecords = await query.CountAsync();

                // Calculate total sales amount for filtered results (optional)
                var totalSales = await query.SumAsync(o => o.Amount);

                // Pagination + projection
                var pagedOrders = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(o => new Order
                    {
                        Id = o.Id,
                        UserId = o.UserId,
                        User = o.User != null ? new User
                        {
                            Id = o.User.Id,
                            FirstName = o.User.FirstName,
                            LastName = o.User.LastName,
                            Email = o.User.Email
                        } : null,
                        HasPaid = o.HasPaid,
                        Amount = o.Amount,
                        AmountAfterDiscount = o.AmountAfterDiscount,
                        SubTotalAfterDiscount = o.SubTotalAfterDiscount,
                        DiscountPercentage = o.DiscountPercentage,
                        DeliveryFee = o.DeliveryFee,
						CouponCode = o.CouponCode,
						SubTotal = o.SubTotal,
                        Tax = o.Tax,
                        PaymentGateway = o.PaymentGateway,
                        PaymentGatewayTransactionId = o.PaymentGatewayTransactionId,
						OrderDate = o.OrderDate,
						DateCreated = o.DateCreated,

                        Shipping = o.Shipping != null ? new Shipping
                        {
                            Id = o.Shipping.Id,
                            Country = o.Shipping.Country,
                            State = o.Shipping.State,
                            City = o.Shipping.City,
                            FullName = o.Shipping.FullName,
                            OrderId = o.Shipping.OrderId,
                            Status = o.Shipping.Status,
                            AddressLine1 = o.Shipping.AddressLine1,
                            AddressLine2 = o.Shipping.AddressLine2,
                            EstimatedDeliveryDate = o.Shipping.EstimatedDeliveryDate,
                            ShippingCost = o.Shipping.ShippingCost,
                            ShippingProvider = o.Shipping.ShippingProvider,
                            //ShippingProviderTrackingId = o.Shipping.OrderId.ToString().ToUpper().Substring(0, 8),
                            ShippingProviderTrackingId = o.Shipping.ShippingProviderTrackingId,
                            PhoneNumber = o.Shipping.PhoneNumber,
                            Email = o.Shipping.Email,
                            ShippingMethod = o.Shipping.ShippingMethod
                        } : null,

                        Items = o.Items.Select(i => new OrderItem
                        {
                            Id = i.Id,
                            ProductId = i.ProductId,
                            Product = new Product
                            {
                                Id = i.Product.Id,
                                Name = i.Product.Name,
                                Images = i.Product.Images
                            },
                            Variant = new ProductVariant
                            {
                                Id = i.Variant.Id,
								Name = i.Variant.Name,
                                Images = i.Variant.Images,
                                SellerSKU = i.Variant.SellerSKU,
                                Size = i.Variant.Size,
                                Color = i.Variant.Color
                            },
                            VariantId = i.VariantId,
                            Quantity = i.Quantity,
                            Price = i.Price
                        }).ToList()
                    })
                    .ToListAsync();

                response.Status = 200;
                response.Message = "Orders retrieved successfully.";
                response.Data = pagedOrders;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
                response.TotalSalesAmount = totalSales; // Optional: include total sales
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving orders.");
                response.Status = 500;
                response.Message = "An error occurred while retrieving orders.";
            }

            return response;
        }


        public async Task<PaginatedServiceResponse<List<Order>>> GetUserOrdersAsync(
			Guid userId,
		int pageNumber,
		int pageSize,
		string searchTerm = null,
		string status = null,
		string dateRange = null
		)
		{
			var response = new PaginatedServiceResponse<List<Order>>();

			try
			{
				// Validate pagination inputs
				if (pageNumber < 1 || pageSize < 1)
				{
					response.Status = 400;
					response.Message = "Page number and page size must be greater than 0.";
					return response;
				}

				// Get the base query
				var query = _context.Orders.Where(x => x.UserId == userId)
					.Include(p => p.Items)
					.AsQueryable();

				// Apply search filter
				if (!string.IsNullOrEmpty(searchTerm))
				{
					query = query.Where(o =>
						o.Id.ToString().Contains(searchTerm) ||
						o.Items.Any(i => i.Product.Name.Contains(searchTerm)));
				}

				// Apply status filter
				if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
				{
					query = status.ToLower() switch
					{
						"pending" => query.Where(o => !o.HasPaid),
						"completed" => query.Where(o => o.HasPaid),
						//"completed" => query.Where(o => o.IsShipped && o.IsDelivered),
						//"cancelled" => query.Where(o => o.IsCancelled),
						_ => query
					};
				}

				// Apply date range filter
				if (!string.IsNullOrEmpty(dateRange) && dateRange.ToLower() != "all")
				{
					var today = DateTime.UtcNow.Date;
					query = dateRange.ToLower() switch
					{
						"today" => query.Where(o => o.OrderDate.Date == today),
						"week" => query.Where(o => o.OrderDate.Date >= today.AddDays(-7)),
						"month" => query.Where(o => o.OrderDate.Date >= today.AddMonths(-1)),
						"year" => query.Where(o => o.OrderDate.Date >= today.AddYears(-1)),
						_ => query
					};
				}

				// Get total count before pagination
				var totalRecords = await query.CountAsync();

				// Apply pagination and projection
				var pagedOrders = await query
					.OrderByDescending(o => o.DateCreated)
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize)
					.Select(o => new Order
					{
						Id = o.Id,
						HasPaid = o.HasPaid,
						Amount = o.Amount,
                        AmountAfterDiscount = o.AmountAfterDiscount,
                        SubTotalAfterDiscount = o.SubTotalAfterDiscount,
                        DiscountPercentage = o.DiscountPercentage,
                        CouponCode = o.CouponCode,
						DeliveryFee = o.DeliveryFee,
                        SubTotal = o.SubTotal,
                        OrderDate = o.OrderDate,
						DateCreated = o.DateCreated,
						//User = new User { Email = o.User.Email }, // Include minimal user info
						Shipping = o.Shipping != null ? new Shipping
						{
							Id = o.Shipping.Id,
							FullName = o.Shipping.FullName,
							OrderId = o.Shipping.OrderId,
							Status = o.Shipping.Status
							// Include only necessary shipping properties
						} : null,
						Items = o.Items.Select(i => new OrderItem
						{
							Id = i.Id,
							ProductId = i.ProductId,
							Product = new Product { Name = i.Product.Name, Images = i.Product.Images }, // Include product name
							Variant = new ProductVariant { Images = i.Variant.Images},
							VariantId = i.VariantId,
							Quantity = i.Quantity,
							Price = i.Price
						}).ToList()
					})
					.ToListAsync();

				// Build response
				response.Status = 200;
				response.Message = "Orders retrieved successfully.";
				response.Data = pagedOrders;
				response.PageNumber = pageNumber;
				response.PageSize = pageSize;
				response.TotalRecords = totalRecords;
				//response.TotalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error retrieving orders.");
				response.Status = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}


		public async Task<ServiceResponse<OrderDto>> UpdateOrderAsync(Guid id, OrderDto orderDto, Guid UserId)
		{
			var response = new ServiceResponse<OrderDto>();

			try
			{
				// Validate the DTO
				if (orderDto == null)
				{
					response.StatusCode = 400;
					response.Message = "Order data is required.";
					return response;
				}

				// Find the order by ID
				var order = await _unitOfWork.OrderRepository.GetById(id);

				if (order == null)
				{
					response.StatusCode = 404;
					response.Message = "Order not found.";
					return response;
				}

				// Update the order
				_mapper.Map(orderDto, order);

				// Save changes
				await _unitOfWork.OrderRepository.Upsert(order);
				await _unitOfWork.CompletedAsync(UserId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Order updated successfully.";
				response.Data = orderDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating order with Id: {Id}", id);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<string>> UpdateOrderAsPaidAsync(Guid id, Guid UserId)
		{
			var response = new ServiceResponse<string>();

			try
			{
				// Find the order by ID
				var order = await _unitOfWork.OrderRepository.GetById(id);

				if (order == null)
				{
					response.StatusCode = 404;
					response.Message = "Order not found.";
					return response;
				}
				order.HasPaid = order.HasPaid? false : true;

					//update transaction that has order id
					var transaction = _unitOfWork.TransactionRepository.Get(tx => tx.OrderId == id).Result;
					if (transaction != null)
					{
						transaction.Status = !order.HasPaid ? "Pending" : "Completed";
						await _unitOfWork.TransactionRepository.Upsert(transaction);
						await _unitOfWork.CompletedAsync(UserId);
					}
				// Save changes
				await _unitOfWork.OrderRepository.Upsert(order);
				await _unitOfWork.CompletedAsync(UserId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Order payment status updated.";
				response.Data = null;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating order with Id: {Id}", id);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}

		public async Task<ServiceResponse<OrderDto>> DeleteOrderAsync(Guid id, Guid UserId)
		{
			var response = new ServiceResponse<OrderDto>();

			try
			{
				// Find the order by ID
				var order = await _unitOfWork.OrderRepository.GetById(id);

				if (order == null)
				{
					response.StatusCode = 404;
					response.Message = "Order not found.";
					return response;
				}

				// Delete the order
				await _unitOfWork.OrderRepository.Remove(order.Id);
				await _unitOfWork.CompletedAsync(UserId);

				// Return success response
				response.StatusCode = 200;
				response.Message = "Order deleted successfully.";
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting order with Id: {Id}", id);
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}

			return response;
		}
	}
}
