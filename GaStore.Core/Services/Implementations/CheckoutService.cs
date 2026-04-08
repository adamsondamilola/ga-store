
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GaStore.Data.Entities.Referrals;
using GaStore.Shared;
using GaStore.Core.Services.Interfaces;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Entities.Wallets;
using GaStore.Shared.Constants;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos;
using GaStore.Core.Services.Interfaces.PaymentGateways.Flutterwave;
using GaStore.Core.Services.Interfaces.PaymentGateways.Paystack;
using GaStore.Data.Models;
using Microsoft.Extensions.Options;
using GaStore.Data.Dtos.MessagingDto;
using GaStore.Data.Enums;
using GaStore.Data.Dtos.PaymentGatewaysDto.PaystackDto;

namespace GaStore.Core.Services.Implementations
{
    public class CheckoutService : ICheckoutService
	{
		private readonly IUnitOfWork _unitOfWork;
		private readonly DatabaseContext _context;
		private readonly ILogger<CheckoutService> _logger;
        private readonly IFlutterwaveService _flutterwave;
		private readonly IPaystackService _paystackService;
        private readonly IShippingService _shippingService;
		private readonly IOrderService _orderService;
		private readonly IEmailTemplateFactory _emailTemplateFactory;
		private readonly ISmsTemplateFactory _smsTemplateFactory;
		private readonly ISmsService _smsService;
		private readonly IEmailService _emailService;
        private readonly AppSettings _appSettings;
		private readonly ICartService _cartService;
		private readonly ICouponService _couponService;
        private readonly IManualPaymentService _manualPaymentService;
        private readonly IPaymentMethodConfigurationService _paymentMethodConfigurationService;
        private readonly IVoucherService _voucherService;
        private readonly IVendorEarningService _vendorEarningService;

        public CheckoutService(IUnitOfWork unitOfWork, 
			DatabaseContext context, 
			ILogger<CheckoutService> logger, 
			IFlutterwaveService flutterwave, 
			IPaystackService paystackService, 
			IShippingService shippingService, 
			IOrderService orderService, 
			IOptions<AppSettings> appSettings,
			IEmailTemplateFactory emailTemplateFactory,
			ISmsTemplateFactory smsTemplateFactory,
			ISmsService smsService,
			IEmailService emailService, ICartService cartService, ICouponService couponService,
            IManualPaymentService manualPaymentService,
            IPaymentMethodConfigurationService paymentMethodConfigurationService,
            IVoucherService voucherService,
            IVendorEarningService vendorEarningService)
		{
			_unitOfWork = unitOfWork;
			_context = context;
			_logger = logger;
			_flutterwave = flutterwave;
			_paystackService = paystackService;
			_shippingService = shippingService;
			_orderService = orderService;
			_appSettings = appSettings.Value;
			_emailTemplateFactory = emailTemplateFactory;
			_smsTemplateFactory = smsTemplateFactory;
			_smsService = smsService;
			_emailService = emailService;
			_cartService = cartService;
			_couponService = couponService;
            _manualPaymentService = manualPaymentService;
            _paymentMethodConfigurationService = paymentMethodConfigurationService;
            _voucherService = voucherService;
            _vendorEarningService = vendorEarningService;
        }



		public async Task<ServiceResponse<PaymentInitiationResponseDto>> RegisterPurchaseAsync(Guid userId, OrderSummaryDto summaryDto)
		{
			var response = new ServiceResponse<PaymentInitiationResponseDto>();
			try
			{
                response.StatusCode = 400;
                if (!string.IsNullOrWhiteSpace(summaryDto.PaymentGateway))
                {
                    var selectedMethodKey =
                        string.Equals(summaryDto.PaymentGateway, "Manual", StringComparison.OrdinalIgnoreCase) ? "manual" :
                        string.Equals(summaryDto.PaymentGateway, "Voucher", StringComparison.OrdinalIgnoreCase) ? "voucher" :
                        summaryDto.PaymentGateway;
                    var selectedMethodEnabled = await _paymentMethodConfigurationService.IsMethodEnabledAsync(selectedMethodKey);
                    if (selectedMethodEnabled.StatusCode != 200 || !selectedMethodEnabled.Data)
                    {
                        response.Message = $"{summaryDto.PaymentGateway} payment is currently disabled.";
                        return response;
                    }
                }

                if (string.Equals(summaryDto.PaymentGateway, "Manual", StringComparison.OrdinalIgnoreCase))
                {
                    var manualEnabled = await _paymentMethodConfigurationService.IsMethodEnabledAsync("manual");
                    if (!manualEnabled.Data)
                    {
                        response.Message = "Manual payment is currently disabled.";
                        return response;
                    }
                }
                if (string.Equals(summaryDto.PaymentGateway, "Voucher", StringComparison.OrdinalIgnoreCase))
                {
                    var voucherEnabled = await _paymentMethodConfigurationService.IsMethodEnabledAsync("voucher");
                    if (!voucherEnabled.Data)
                    {
                        response.Message = "Voucher payment is currently disabled.";
                        return response;
                    }

                    if (string.IsNullOrWhiteSpace(summaryDto.VoucherCode))
                    {
                        response.Message = "Voucher code is required.";
                        return response;
                    }

                    var voucherValidation = await _voucherService.ValidateVoucherAsync(summaryDto.VoucherCode);
                    if (voucherValidation.StatusCode != 200 || voucherValidation.Data == null || !voucherValidation.Data.IsValid)
                    {
                        response.Message = voucherValidation.Data?.Message ?? voucherValidation.Message;
                        return response;
                    }
                }
				//check if order is valid
				var checkOrder = await _orderService.OrderSummaryAsync(userId, summaryDto);

                //check and apply coupon
                if (checkOrder != null && checkOrder?.Data?.CouponCode != null) {
					var couponCheck = await _couponService.ApplyCouponAsync(userId, checkOrder.Data.CouponCode, checkOrder.Data.SubTotal);					
                }

                if (checkOrder.StatusCode == 200) 
				{
					//register order

					//order items
					List<OrderItemDto> orderItemDto = new List<OrderItemDto>();
					var items = summaryDto.CartProducts ?? checkOrder?.Data?.CartProducts;
					// Calculate subtotal
					if (items != null && items.Count > 0)
					{
					foreach (var item in items)
					{
						//use this to get productId
						var pricingTier = await _unitOfWork.PricingTierRepository.GetAllAsync(
						p => p.VariantId == item.VariantId,
						q => q.OrderByDescending(pt => pt.MinQuantity)
                            );

                            var applicableTier = pricingTier.FirstOrDefault(t => item.Quantity >= t.MinQuantity)
                                       ?? pricingTier.Last();

                            OrderItemDto orderItemDto1 = new OrderItemDto() {
							UserId = userId,
							//OrderId = 
							ProductId = applicableTier?.ProductId,
							VariantId = item.VariantId,
							Quantity = item.Quantity,
							Price = (decimal)(applicableTier?.PricePerUnit)
							//Price = (decimal)(item.Quantity * pricingTier?.PricePerUnit)
						};
						orderItemDto.Add(orderItemDto1);
					}
					}

					OrderDto orderDto = new OrderDto() { 
					UserId = userId,
					HasPaid = false,
					Amount = checkOrder.Data.Total, 
					AmountAfterDiscount = checkOrder.Data.TotalAfterDiscount,
					SubTotal = checkOrder.Data.SubTotal,
					SubTotalAfterDiscount = checkOrder.Data.SubTotalAfterDiscount,
					DiscountPercentage = checkOrder.Data.DiscountPercentage,
					CouponCode = checkOrder.Data.CouponCode,
					DeliveryFee = checkOrder.Data.DeliveryFee,
					Tax = checkOrder.Data.Tax,
					PaymentGateway = summaryDto.PaymentGateway,
					PaymentGatewayTransactionId = summaryDto.PaymentGatewayTransactionId,
                    VoucherCode = string.IsNullOrWhiteSpace(summaryDto.VoucherCode) ? null : summaryDto.VoucherCode.Trim().ToUpperInvariant(),
                    VoucherAmountApplied = string.Equals(summaryDto.PaymentGateway, "Voucher", StringComparison.OrdinalIgnoreCase)
                        ? (checkOrder.Data.TotalAfterDiscount ?? checkOrder.Data.Total)
                        : null,
					OrderDate = DateTime.UtcNow,
					Items = orderItemDto
					};
					var order = await _orderService.CreateOrderAsync(orderDto, userId);

					if(order.StatusCode == 201)
					{
                        if (string.Equals(summaryDto.PaymentGateway, "Manual", StringComparison.OrdinalIgnoreCase))
                        {
                            await _manualPaymentService.CreatePendingManualPaymentAsync(
                                order.Data.Id ?? Guid.Empty,
                                userId,
                                checkOrder.Data.TotalAfterDiscount ?? checkOrder.Data.Total);
                        }

                        //assign order id
                        //response.Data.OrderId = order.Data?.Id;
						//register shipping
						double days = (double)checkOrder.Data.DeliveryDays;
						ShippingDto shippingDto = new ShippingDto()
						{
							ShippingCost = summaryDto.DeliveryFee,
							ShippingProvider = summaryDto.ShippingProvider,
							ShippingMethod = summaryDto.IsDoorStepDelivery ? "Door Step Delivery" : "Pickup Location",
							State = summaryDto.State,
							City = summaryDto.City,
							EstimatedDeliveryDate = DateTime.Now.AddDays(days),
							Country = "Nigeria",
							AddressLine1 = summaryDto.DeliveryAddress,
							PhoneNumber = summaryDto.CustomerPhone,
							UserId = userId,
							Status = "Pending",
							OrderId = order.Data.Id,
							FullName = checkOrder.Data.FullName
						};

						var shipping = await _shippingService.CreateShippingAsync(shippingDto, userId);

                    }

                    //update product stock variant
                    if (items != null && items.Count > 0) 
					{ 
                        foreach (var item in items)
							{
								var variant = await _unitOfWork.ProductVariantRepository.GetById(item.VariantId);
								if(variant != null)
								{
									variant.StockQuantity -= item.Quantity;
									variant.StockSold += item.Quantity;
                                if (variant.StockQuantity < 1)
									{
										variant.StockQuantity = 0;
									}
									await _unitOfWork.ProductVariantRepository.Upsert(variant);
									await _unitOfWork.CompletedAsync(userId);
								}
							}
                    }
					await _cartService.ClearCartAsync(userId);
					Guid? orderId_ = order.Data?.Id;
					summaryDto.OrderId = orderId_;
                    response.StatusCode = 200;
					response.Message = "Order processed";
					response.Data = new PaymentInitiationResponseDto
					{
						OrderId = orderId_.ToString()
					};
					return response;

				}
				else
				{
					response.Message = "Invalid cart items.";
					return response;
				}
			}
			catch (Exception ex)
			{
				_logger.LogError($"Purchase failed: {ex.Message}");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}
			return response;
		}

        public async Task<ServiceResponse<OrderSummaryDto>> ApprovePurchaseAsync(Guid userId, Guid orderId, OrderSummaryDto summaryDto)
        {
            var response = new ServiceResponse<OrderSummaryDto>();
            try
            {
                response.StatusCode = 400;
                //check if order is valid
                var checkOrder = await _orderService.OrderSummaryAsync(userId, summaryDto);

                if (checkOrder.StatusCode == 200)
                {
                    

                    //update order
					var order = await _unitOfWork.OrderRepository.Get(o => o.UserId == userId && o.Id == orderId);
					
                    if (order != null)
                    {
						order.HasPaid = true;
						await _unitOfWork.OrderRepository.Upsert(order);
                        await _vendorEarningService.ProcessOrderVendorEarningsAsync(order.Id, userId);

                        var shipping = await _unitOfWork.ShippingRepository.Get(s => s.OrderId == orderId);

                        //send mail and sms
                        //get user info
                        var user = await _unitOfWork.UserRepository.GetById(userId);
                        var address = await _unitOfWork.DeliveryAddressRepository.Get(u => u.UserId == userId && u.IsPrimary == true);
                        if (user != null && address != null)
                        {
                            string trackUrl = $"{_appSettings.FrontendUrl}/customer/orders/{orderId.ToString()}";
                            var OrderId = shipping.OrderId.ToString().ToUpper().Substring(0, 8);
                            var smsMessage = _smsTemplateFactory.OrderConfirmationSms(OrderId, summaryDto.Total, shipping.EstimatedDeliveryDate);
                            var sendSMS = await _smsService.SendMessage(
                                new MessageDto
                                {
                                    Channel = MessagingChannels.SMS,
                                    Content = smsMessage.Message,
                                    Recipient = address.PhoneNumber,
                                    RecipientName = address.FullName,
                                    Subject = ""
                                });

                            var emailMessage = _emailTemplateFactory.OrderConfirmation(user.FirstName, OrderId, summaryDto.Total, [], shipping.EstimatedDeliveryDate, trackUrl);
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

					//await _cartService.ClearCartAsync(userId);
					await _unitOfWork.CompletedAsync(userId);
                    Guid? orderId_ = orderId;
                    summaryDto.OrderId = orderId_;
                    response.StatusCode = 200;
                    response.Message = "Order completed";
                    response.Data = summaryDto;
                    return response;

                }
                else
                {
                    response.Message = "Invalid cart items.";
                    return response;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Purchase failed: {ex.Message}");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }
            return response;
        }

		public async Task<ServiceResponse<bool>> ProcessCheckoutWithWalletAsync(Guid userId, Guid orderId, OrderSummaryDto summaryDto)
		{
			var response = new ServiceResponse<bool>();

			try
			{
                var walletEnabled = await _paymentMethodConfigurationService.IsMethodEnabledAsync("commission");
                if (!walletEnabled.Data)
                {
                    response.StatusCode = 400;
                    response.Message = "Commission wallet payment is currently disabled.";
                    return response;
                }

				var userWallet = await _unitOfWork.WalletRepository.Get(w => w.UserId == userId);
				if (userWallet == null)
				{
					response.StatusCode = 404;
					response.Message = "Commission account not found.";
					return response;
				}

				var checkCart = await _orderService.OrderSummaryAsync(userId, summaryDto);
				if(checkCart.StatusCode != 200)
				{
					response.StatusCode = 400;
					response.Message = checkCart.Message;
					return response;
				}
				decimal totalOrderAmount = checkCart.Data.Total; // checkoutDto.Order.Sum(o => o.Items.Sum(i => i.Price * i.Quantity));

					if (userWallet.Balance >= totalOrderAmount)
					{
						// Deduct from wallet
						userWallet.Balance -= totalOrderAmount;

						// Create transaction
						var transaction = new Transaction
						{
							UserId = userId,
							WalletId = userWallet.Id,
							Amount = totalOrderAmount,
							TransactionType = "Debit",
							Status = "Completed",
							Description = "Wallet Payment"
						};

						//await _context.WalletTransactions.AddAsync(transaction);
					await _unitOfWork.TransactionRepository.Add(transaction);
					await _unitOfWork.WalletRepository.Upsert(userWallet);
					await _unitOfWork.CompletedAsync(userId);
					/*
                    // Update order as paid
                    foreach (var order in checkoutDto.Order)
                    {
                        order.HasPaid = true;
                    }

                    */

					//await _context.SaveChangesAsync();

					var registerOrder = await ApprovePurchaseAsync(userId, orderId, summaryDto); //RegisterPurchaseAsync(userId, summaryDto);
                    // Process referral commission
                    await ProcessReferralCommissionAsync(userId, totalOrderAmount, registerOrder.Data.OrderId);

                    response.StatusCode = 200;
						response.Message = "Checkout successful.";
						response.Data = true;
					}
					else
					{
						response.StatusCode = 400;
						response.Message = "Insufficient balance.";
						response.Data = false;
					}
			}
			catch (Exception ex)
			{
				_logger.LogError($"Checkout process failed: {ex.Message}");
				response.StatusCode = 500;
				response.Message = ErrorMessages.InternalServerError;
			}
			return response;
		}

        public async Task<ServiceResponse<bool>> ProcessCheckoutWithVoucherAsync(Guid userId, Guid orderId, OrderSummaryDto summaryDto)
        {
            var response = new ServiceResponse<bool>();

            try
            {
                var voucherEnabled = await _paymentMethodConfigurationService.IsMethodEnabledAsync("voucher");
                if (!voucherEnabled.Data)
                {
                    response.StatusCode = 400;
                    response.Message = "Voucher payment is currently disabled.";
                    return response;
                }

                if (string.IsNullOrWhiteSpace(summaryDto.VoucherCode))
                {
                    response.StatusCode = 400;
                    response.Message = "Voucher code is required.";
                    return response;
                }

                var checkCart = await _orderService.OrderSummaryAsync(userId, summaryDto);
                if (checkCart.StatusCode != 200)
                {
                    response.StatusCode = 400;
                    response.Message = checkCart.Message;
                    return response;
                }

                var totalOrderAmount = checkCart.Data.Total;
                var redeemVoucher = await _voucherService.RedeemVoucherAsync(userId, orderId, summaryDto.VoucherCode, totalOrderAmount);
                if (redeemVoucher.StatusCode != 200 || redeemVoucher.Data == null)
                {
                    response.StatusCode = redeemVoucher.StatusCode;
                    response.Message = redeemVoucher.Message;
                    response.Data = false;
                    return response;
                }

                var order = await _unitOfWork.OrderRepository.Get(o => o.Id == orderId && o.UserId == userId);
                if (order == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Order not found.";
                    return response;
                }

                order.VoucherId = redeemVoucher.Data.Id;
                order.VoucherCode = redeemVoucher.Data.Code;
                order.VoucherAmountApplied = totalOrderAmount;
                order.PaymentGateway = "Voucher";
                order.PaymentGatewayTransactionId = redeemVoucher.Data.Code;
                order.HasPaid = true;
                await _unitOfWork.OrderRepository.Upsert(order);

                var registerOrder = await ApprovePurchaseAsync(userId, orderId, summaryDto);
                if (registerOrder.StatusCode == 200)
                {
                    await ProcessReferralCommissionAsync(userId, checkCart.Data.SubTotal, registerOrder.Data.OrderId);
                }

                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 200;
                response.Message = "Voucher payment completed successfully.";
                response.Data = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Voucher checkout failed for order {OrderId}", orderId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

		public async Task<ServiceResponse<bool>> VerifyTransaction(OrderSummaryDto summaryDto, string transactionId, Guid userId, Guid orderId)
        {
			var response = new ServiceResponse<bool>();

			try
			{
                var gatewayEnabled = await _paymentMethodConfigurationService.IsMethodEnabledAsync(summaryDto.PaymentGateway ?? string.Empty);
                if (!gatewayEnabled.Data)
                {
                    response.StatusCode = 400;
                    response.Message = $"{summaryDto.PaymentGateway} is currently disabled.";
                    return response;
                }

                // Verify transaction with Flutterwave or paystack

                //switch (_appSettings.DefaultPaymentGateway)
                switch (summaryDto.PaymentGateway)
                {
                    case "Paystack":
						var verifyTransactionResponse = await _paystackService.VerifyTransactions(transactionId);
                        if (verifyTransactionResponse.StatusCode != 200 || verifyTransactionResponse.Data == null)
                        {
                            response.StatusCode = 400;
                            response.Message = "Transaction verification failed.";
                            return response;
                        }
						break;
                    case "Flutterwave":
                        var verifyTransactionResponse2 = await _flutterwave.VerifyTransactions(Int32.Parse(transactionId));
                        if (verifyTransactionResponse2.StatusCode != 200 || verifyTransactionResponse2.Data == null)
                        {
                            response.StatusCode = 400;
                            response.Message = "Transaction verification failed.";
                            return response;
                        }
						break;
					default:
                        throw new InvalidOperationException($"Unsupported payment gateway: {summaryDto.PaymentGateway}");

                }
					
				
                var order = await _unitOfWork.OrderRepository.Get(o => o.Id == orderId && o.UserId == userId);
                if (order == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Order not found.";
                    return response;
                }

                if (order.HasPaid)
                {
                    response.StatusCode = 400;
                    response.Message = "Transaction already processed.";
                    return response;
                }

                order.PaymentGateway = summaryDto.PaymentGateway;
                order.PaymentGatewayTransactionId = transactionId.ToString();
                order.HasPaid = true;
                await _unitOfWork.OrderRepository.Upsert(order);

                var transaction = await _unitOfWork.TransactionRepository.Get(tr => tr.TransactionId == transactionId.ToString());
                if (transaction != null)
                {
                    transaction.Status = "Completed";
                    transaction.OrderId = orderId;
                    await _unitOfWork.TransactionRepository.Upsert(transaction);
                }
                else
                {
                    var userWallet = await _unitOfWork.WalletRepository.Get(tr => tr.UserId == userId);
                    if (userWallet != null)
                    {
                        var newTnx = new Transaction
                        {
                            UserId = userId,
                            TransactionId = transactionId.ToString(),
                            WalletId = userWallet.Id,
                            OrderId = orderId,
                            Amount = summaryDto.Total,
                            TransactionType = "Purchase",
                            Status = "Completed",
                            Description = "Order Payment"
                        };
                        await _unitOfWork.TransactionRepository.Add(newTnx);
                    }
                }

				//register purchase
				var registerOrder = await ApprovePurchaseAsync(userId, orderId, summaryDto); //RegisterPurchaseAsync(userId, summaryDto);


                if (registerOrder.StatusCode == 200)
				{
                    // Process referral commission
                    await ProcessReferralCommissionAsync(userId, summaryDto.SubTotal, registerOrder.Data.OrderId);

                }

                //decimal totalOrderAmount = registerOrder.Data.SubTotal; //checkoutDto.Order.Sum(o => o.Items.Sum(i => i.Price * i.Quantity));

                // Fetch and update order
                /*var order = await _unitOfWork.OrderRepository.GetById(transaction.Id);
				if (order != null)
				{
					order.HasPaid = true;
					await _unitOfWork.OrderRepository.Upsert(order);
				}*/



                // Check if the user has a referrer for commission
                /*var referral = await _unitOfWork.ReferralRepository.Get(r => r.ReferralId == transaction.UserId);
				if (referral != null)
				{
				}*/

                
                await _unitOfWork.CompletedAsync(userId);

				response.StatusCode = 200;
				response.Message = "Transaction verified and order updated successfully.";
				response.Data = true;
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error verifying transaction {transactionId}: {ex.Message}");
				response.StatusCode = 500;
				response.Message = "An unexpected error occurred.";
			}

			return response;
		}

        public async Task<ServiceResponse<bool>> ProcessGatewayWebhookAsync(string paymentGateway, string transactionId, string? paymentReference = null, Guid? orderId = null, Guid? userId = null)
        {
            var response = new ServiceResponse<bool>();

            try
            {
                if (string.IsNullOrWhiteSpace(paymentGateway) || string.IsNullOrWhiteSpace(transactionId))
                {
                    response.StatusCode = 400;
                    response.Message = "Payment gateway and transaction ID are required.";
                    return response;
                }

                decimal verifiedAmount;
                switch (paymentGateway.Trim())
                {
                    case "Paystack":
                        var paystackVerification = await _paystackService.VerifyTransactions(transactionId);
                        if (paystackVerification.StatusCode != 200 ||
                            paystackVerification.Data?.Data == null ||
                            !string.Equals(paystackVerification.Data.Data.Status, "success", StringComparison.OrdinalIgnoreCase))
                        {
                            response.StatusCode = 400;
                            response.Message = "Paystack transaction verification failed.";
                            return response;
                        }

                        verifiedAmount = (paystackVerification.Data.Data.Amount ?? 0) / 100m;
                        paymentReference ??= paystackVerification.Data.Data.Reference;
                        break;

                    case "Flutterwave":
                        if (!int.TryParse(transactionId, out var flutterwaveTransactionId))
                        {
                            response.StatusCode = 400;
                            response.Message = "Invalid Flutterwave transaction ID.";
                            return response;
                        }

                        var flutterwaveVerification = await _flutterwave.VerifyTransactions(flutterwaveTransactionId);
                        if (flutterwaveVerification.StatusCode != 200 ||
                            flutterwaveVerification.Data?.data == null ||
                            !string.Equals(flutterwaveVerification.Data.data.status, "successful", StringComparison.OrdinalIgnoreCase))
                        {
                            response.StatusCode = 400;
                            response.Message = "Flutterwave transaction verification failed.";
                            return response;
                        }

                        verifiedAmount = flutterwaveVerification.Data.data.amount;
                        paymentReference ??= flutterwaveVerification.Data.data.tx_ref;
                        break;

                    default:
                        response.StatusCode = 400;
                        response.Message = $"Unsupported payment gateway: {paymentGateway}";
                        return response;
                }

                var order = await ResolveOrderForWebhookAsync(paymentGateway, transactionId, paymentReference, orderId, userId, verifiedAmount);
                if (order == null || !order.UserId.HasValue)
                {
                    response.StatusCode = 404;
                    response.Message = "Unable to match webhook payment to an order.";
                    return response;
                }

                if (order.HasPaid)
                {
                    response.StatusCode = 200;
                    response.Message = "Order already marked as paid.";
                    response.Data = true;
                    return response;
                }

                order.PaymentGateway = paymentGateway;
                order.PaymentGatewayTransactionId = transactionId;
                order.HasPaid = true;
                await _unitOfWork.OrderRepository.Upsert(order);

                var transaction = await _unitOfWork.TransactionRepository.Get(
                    tr => tr.OrderId == order.Id ||
                          tr.TransactionId == transactionId ||
                          (!string.IsNullOrWhiteSpace(paymentReference) && tr.TransactionId == paymentReference));

                if (transaction != null)
                {
                    transaction.Status = "Completed";
                    transaction.OrderId = order.Id;
                    transaction.TransactionId = transactionId;
                    transaction.Amount = order.AmountAfterDiscount ?? order.Amount;
                    await _unitOfWork.TransactionRepository.Upsert(transaction);
                }
                else
                {
                    var userWallet = await _unitOfWork.WalletRepository.Get(w => w.UserId == order.UserId.Value);
                    if (userWallet != null)
                    {
                        await _unitOfWork.TransactionRepository.Add(new Transaction
                        {
                            UserId = order.UserId.Value,
                            TransactionId = transactionId,
                            WalletId = userWallet.Id,
                            OrderId = order.Id,
                            Amount = order.AmountAfterDiscount ?? order.Amount,
                            TransactionType = "Purchase",
                            Status = "Completed",
                            Description = "Order Payment"
                        });
                    }
                }

                await ProcessReferralCommissionAsync(order.UserId.Value, order.SubTotal ?? order.Amount, order.Id);
                await _vendorEarningService.ProcessOrderVendorEarningsAsync(order.Id, order.UserId.Value);
                await FinalizePaidOrderAsync(order, order.UserId.Value, order.AmountAfterDiscount ?? order.Amount);
                await _unitOfWork.CompletedAsync(order.UserId.Value);

                response.StatusCode = 200;
                response.Message = "Webhook processed successfully.";
                response.Data = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment webhook for {Gateway} transaction {TransactionId}", paymentGateway, transactionId);
                response.StatusCode = 500;
                response.Message = "An unexpected error occurred while processing the webhook.";
            }

            return response;
        }

        private async Task<Order?> ResolveOrderForWebhookAsync(
            string paymentGateway,
            string transactionId,
            string? paymentReference,
            Guid? orderId,
            Guid? userId,
            decimal verifiedAmount)
        {
            if (orderId.HasValue)
            {
                var explicitOrder = await _context.Orders.FirstOrDefaultAsync(o =>
                    o.Id == orderId.Value &&
                    (!userId.HasValue || o.UserId == userId.Value));

                if (explicitOrder != null)
                {
                    return explicitOrder;
                }
            }

            var directOrder = await _context.Orders
                .OrderByDescending(o => o.OrderDate)
                .FirstOrDefaultAsync(o =>
                    o.PaymentGateway == paymentGateway &&
                    (o.PaymentGatewayTransactionId == transactionId ||
                     (!string.IsNullOrWhiteSpace(paymentReference) && o.PaymentGatewayTransactionId == paymentReference)));

            if (directOrder != null)
            {
                return directOrder;
            }

            var linkedTransaction = await _context.WalletTransactions
                .OrderByDescending(t => t.DateCreated)
                .FirstOrDefaultAsync(t =>
                    t.TransactionId == transactionId ||
                    (!string.IsNullOrWhiteSpace(paymentReference) && t.TransactionId == paymentReference));

            if (linkedTransaction?.OrderId != null)
            {
                var transactionOrder = await _context.Orders.FirstOrDefaultAsync(o => o.Id == linkedTransaction.OrderId.Value);
                if (transactionOrder != null)
                {
                    return transactionOrder;
                }
            }

            if (userId.HasValue)
            {
                var userPendingOrders = await _context.Orders
                    .Where(o =>
                        o.UserId == userId.Value &&
                        !o.HasPaid &&
                        (string.IsNullOrEmpty(o.PaymentGateway) || o.PaymentGateway == paymentGateway))
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();

                var exactUserAmountMatch = userPendingOrders
                    .Where(o => AmountMatchesOrder(o, verifiedAmount))
                    .ToList();

                if (exactUserAmountMatch.Count == 1)
                {
                    return exactUserAmountMatch[0];
                }

                if (userPendingOrders.Count == 1)
                {
                    return userPendingOrders[0];
                }
            }

            var amountMatchedOrders = await _context.Orders
                .Where(o =>
                    !o.HasPaid &&
                    (string.IsNullOrEmpty(o.PaymentGateway) || o.PaymentGateway == paymentGateway) &&
                    o.OrderDate >= DateTime.UtcNow.AddHours(-6))
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var exactGlobalAmountMatch = amountMatchedOrders
                .Where(o => AmountMatchesOrder(o, verifiedAmount))
                .ToList();

            return exactGlobalAmountMatch.Count == 1 ? exactGlobalAmountMatch[0] : null;
        }

        private static bool AmountMatchesOrder(Order order, decimal verifiedAmount)
        {
            var expectedAmount = order.AmountAfterDiscount ?? order.Amount;
            return Math.Abs(expectedAmount - verifiedAmount) <= 0.01m;
        }

        private async Task FinalizePaidOrderAsync(Order order, Guid userId, decimal paymentTotal)
        {
            var shipping = await _unitOfWork.ShippingRepository.Get(s => s.OrderId == order.Id);
            var user = await _unitOfWork.UserRepository.GetById(userId);
            var address = await _unitOfWork.DeliveryAddressRepository.Get(u => u.UserId == userId && u.IsPrimary == true);

            if (shipping == null || user == null || address == null)
            {
                return;
            }

            string trackUrl = $"{_appSettings.FrontendUrl}/customer/orders/{order.Id}";
            var shortOrderId = order.Id.ToString().ToUpperInvariant().Substring(0, 8);

            var smsMessage = _smsTemplateFactory.OrderConfirmationSms(shortOrderId, paymentTotal, shipping.EstimatedDeliveryDate);
            await _smsService.SendMessage(
                new MessageDto
                {
                    Channel = MessagingChannels.SMS,
                    Content = smsMessage.Message,
                    Recipient = address.PhoneNumber,
                    RecipientName = address.FullName,
                    Subject = string.Empty
                });

            var emailMessage = _emailTemplateFactory.OrderConfirmation(user.FirstName, shortOrderId, paymentTotal, [], shipping.EstimatedDeliveryDate, trackUrl);
            await _emailService.SendMailAsync(
                new MessageDto
                {
                    Channel = MessagingChannels.Email,
                    Content = emailMessage.Body,
                    Recipient = user.Email,
                    RecipientName = user.FirstName,
                    Subject = emailMessage.Subject
                });
        }


        private async Task ProcessReferralCommissionAsync(Guid userId, decimal totalAmount, Guid? orderId)
        {
            // Validate inputs
            if (totalAmount <= 0 || !orderId.HasValue)
                return;

            try
            {

                // Get referral
                var referral = await _unitOfWork.ReferralRepository
                    .Get(r => r.ReferralId == userId);

                if (referral == null)
                {
                    return;
                }

                // Get commission percentage
                var commissionSetting = await _unitOfWork.ReferralCommissionRepository
                    .Get(rc => rc.IsDefault);

                if (commissionSetting == null || commissionSetting.Percentage <= 0)
                {
                    return;
                }

                // Calculate commission
                decimal commissionAmount = (totalAmount * commissionSetting.Percentage) / 100;

                // Apply min/max limits
                if (commissionAmount < commissionSetting.MinAmount)
                {
                    return;
                }

                if (commissionSetting.MaxAmount > 0 && commissionAmount > commissionSetting.MaxAmount)
                {
                    commissionAmount = commissionSetting.MaxAmount;
                }

                // Get or create referrer's wallet
                var referrerWallet = await _unitOfWork.WalletRepository
                    .Get(w => w.UserId == referral.ReferrerId);

                if (referrerWallet == null)
                {
                    // Create wallet if it doesn't exist
                    referrerWallet = new Wallet
                    {
                        Id = Guid.NewGuid(),
                        UserId = referral.ReferrerId,
                        Balance = 0,
                        Commission = 0
                    };
					await _unitOfWork.WalletRepository.Add(referrerWallet);
                }

                // Update wallet balances
                referrerWallet.Balance += commissionAmount;
                referrerWallet.Commission += commissionAmount;
                referrerWallet.DateUpdated = DateTime.UtcNow;

                // Update referral stats
                referral.TotalCommissionEarned += commissionAmount;
                referral.DateUpdated = DateTime.UtcNow;

                // Create referral purchase record
                var referralPurchase = new ReferralPurchase
                {
                    Id = Guid.NewGuid(),
                    ReferralId = referral.Id,
                    OrderId = orderId.Value,
                    CommissionAmount = commissionAmount
                };
                await _unitOfWork.ReferralPurchaseRepository.Add(referralPurchase);

                // Create transaction record
                DateTime dateTime = DateTime.UtcNow;
                long dateAsLong = long.Parse(dateTime.ToString("yyyyMMddHHmmss"));

                var transactionRecord = new Transaction
                {
                    Id = Guid.NewGuid(),
                    UserId = referral.ReferrerId, // Should be referrer's ID, not the referral's ID
                    TransactionId = dateAsLong.ToString(),
                    WalletId = referrerWallet.Id,
                    Amount = commissionAmount,
                    TransactionType = "Commission",
                    Status = "Completed",
                    Description = $"Referral Commission from order {orderId}",
                };
                await _unitOfWork.TransactionRepository.Add(transactionRecord);

                // Save all changes
                //await _unitOfWork.CompletedAsync(userId);
            }
            catch (Exception ex)
            {
                // Log the error
                _logger.LogError(ex, "Error processing referral commission for user {UserId}", userId);

                // Consider whether to rethrow or handle silently
                throw;
            }
        }

        public ServiceResponse<string> DefaultPaymentGateway()
		{
            return new ServiceResponse<string>
            {
                StatusCode = 200,
                Data = _appSettings.DefaultPaymentGateway ?? "Paystack",
                Message = "Successful"
            };
        }

        public async Task<ServiceResponse<List<PaymentMethodConfigurationDto>>> GetPaymentMethodsAsync()
        {
            return await _paymentMethodConfigurationService.GetPaymentMethodsAsync();
        }
	}
}







