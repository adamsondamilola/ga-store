using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.IO;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.MessagingDto;
using GaStore.Data.Dtos.OrdersDto;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Data.Entities.Orders;
using GaStore.Data.Enums;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class ManualPaymentService : IManualPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<ManualPaymentService> _logger;
        private readonly DatabaseContext _context;
        private readonly IImageUploadService _imageUploadService;
        private readonly IEmailService _emailService;
        private readonly IVendorEarningService _vendorEarningService;

        public ManualPaymentService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<ManualPaymentService> logger,
            DatabaseContext context,
            IImageUploadService imageUploadService,
            IEmailService emailService,
            IVendorEarningService vendorEarningService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _context = context;
            _imageUploadService = imageUploadService;
            _emailService = emailService;
            _vendorEarningService = vendorEarningService;
        }

        public async Task<ServiceResponse<ManualPaymentDto>> CreatePendingManualPaymentAsync(Guid orderId, Guid userId, decimal amountExpected)
        {
            var response = new ServiceResponse<ManualPaymentDto> { StatusCode = 400 };

            try
            {
                var existing = await _unitOfWork.ManualPaymentRepository.Get(x => x.OrderId == orderId);
                if (existing != null)
                {
                    response.StatusCode = 200;
                    response.Message = "Manual payment already initialized.";
                    response.Data = await BuildManualPaymentDtoAsync(existing);
                    return response;
                }

                var payment = new ManualPayment
                {
                    OrderId = orderId,
                    UserId = userId,
                    AmountExpected = amountExpected,
                    Status = "AwaitingProof"
                };

                await _unitOfWork.ManualPaymentRepository.Add(payment);
                await _unitOfWork.CompletedAsync(userId);

                response.StatusCode = 201;
                response.Message = "Manual payment initialized.";
                response.Data = await BuildManualPaymentDtoAsync(payment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating manual payment for order {OrderId}", orderId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ManualPaymentDto>> GetByOrderIdAsync(Guid orderId, Guid requesterId, bool isAdmin)
        {
            var response = new ServiceResponse<ManualPaymentDto> { StatusCode = 400 };

            try
            {
                var order = await _unitOfWork.OrderRepository.Get(o => o.Id == orderId);
                if (order == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Order not found.";
                    return response;
                }

                if (!isAdmin && order.UserId != requesterId)
                {
                    response.StatusCode = 403;
                    response.Message = "You are not authorized to view this manual payment.";
                    return response;
                }

                var payment = await _context.ManualPayments
                    .Include(x => x.BankAccount)
                    .Include(x => x.ReviewedByUser)
                    .FirstOrDefaultAsync(x => x.OrderId == orderId);

                if (payment == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Manual payment was not found for this order.";
                    return response;
                }

                response.StatusCode = 200;
                response.Message = "Manual payment retrieved successfully.";
                response.Data = await BuildManualPaymentDtoAsync(payment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading manual payment for order {OrderId}", orderId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<List<BankAccountDto>>> GetManualPaymentAccountsAsync()
        {
            var response = new ServiceResponse<List<BankAccountDto>> { StatusCode = 400 };

            try
            {
                var accounts = await _context.BankAccounts
                    .Include(x => x.User)
                    .Where(x => x.User.IsAdmin || x.User.IsSuperAdmin)
                    .OrderBy(x => x.BankName)
                    .ToListAsync();

                response.StatusCode = 200;
                response.Message = "Manual payment accounts retrieved successfully.";
                response.Data = _mapper.Map<List<BankAccountDto>>(accounts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving manual payment accounts");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ManualPaymentDto>> SubmitProofAsync(Guid userId, SubmitManualPaymentProofDto dto)
        {
            var response = new ServiceResponse<ManualPaymentDto> { StatusCode = 400 };

            try
            {
                if (dto.ProofFile == null)
                {
                    response.Message = "Proof of payment is required.";
                    return response;
                }

                var order = await _unitOfWork.OrderRepository.Get(o => o.Id == dto.OrderId && o.UserId == userId);
                if (order == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Order not found.";
                    return response;
                }

                if (!string.Equals(order.PaymentGateway, "Manual", StringComparison.OrdinalIgnoreCase))
                {
                    response.Message = "This order is not awaiting manual payment.";
                    return response;
                }

                var payment = await _context.ManualPayments
                    .Include(x => x.BankAccount)
                    .Include(x => x.ReviewedByUser)
                    .Include(x => x.User)
                    .FirstOrDefaultAsync(x => x.OrderId == dto.OrderId && x.UserId == userId);

                if (payment == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Manual payment record not found.";
                    return response;
                }

                var upload = await _imageUploadService.UploadAndOptimizeImageAsync(
                    dto.ProofFile,
                    Path.Combine("wwwroot", "uploads", "manual-payments", DateTime.UtcNow.ToString("yyyy-MM")));

                if (!upload.IsSuccess || string.IsNullOrWhiteSpace(upload.ImageUrl))
                {
                    response.Message = upload.ErrorMessage ?? "Unable to upload proof of payment.";
                    return response;
                }

                payment.BankAccountId = dto.BankAccountId;
                payment.PaymentReference = dto.PaymentReference;
                payment.CustomerNote = dto.CustomerNote;
                payment.ProofImageUrl = upload.ImageUrl;
                payment.ProofUploadedAt = DateTime.UtcNow;
                payment.Status = "ProofSubmitted";
                payment.ReviewNote = null;
                payment.ReviewedAt = null;
                payment.ReviewedByUserId = null;

                await _unitOfWork.ManualPaymentRepository.Upsert(payment);
                await _unitOfWork.CompletedAsync(userId);

                await NotifyAdminsAsync(order, payment);

                response.StatusCode = 200;
                response.Message = "Proof of payment uploaded successfully.";
                response.Data = await BuildManualPaymentDtoAsync(payment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting proof for order {OrderId}", dto.OrderId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<ManualPaymentDto>> ReviewAsync(Guid orderId, Guid adminUserId, ReviewManualPaymentDto dto)
        {
            var response = new ServiceResponse<ManualPaymentDto> { StatusCode = 400 };

            try
            {
                var payment = await _context.ManualPayments
                    .Include(x => x.Order)
                    .Include(x => x.BankAccount)
                    .Include(x => x.User)
                    .Include(x => x.ReviewedByUser)
                    .FirstOrDefaultAsync(x => x.OrderId == orderId);

                if (payment == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Manual payment record not found.";
                    return response;
                }

                var normalizedStatus = dto.Status?.Trim();
                if (normalizedStatus != "Approved" && normalizedStatus != "Rejected")
                {
                    response.Message = "Status must be Approved or Rejected.";
                    return response;
                }

                payment.Status = normalizedStatus;
                payment.ReviewNote = dto.ReviewNote;
                payment.ReviewedAt = DateTime.UtcNow;
                payment.ReviewedByUserId = adminUserId;

                payment.Order.HasPaid = normalizedStatus == "Approved";
                await _unitOfWork.ManualPaymentRepository.Upsert(payment);
                await _unitOfWork.OrderRepository.Upsert(payment.Order);
                await _unitOfWork.CompletedAsync(adminUserId);

                if (normalizedStatus == "Approved")
                {
                    await _vendorEarningService.ProcessOrderVendorEarningsAsync(payment.OrderId, adminUserId);
                }

                await NotifyUserAsync(payment);

                var refreshed = await _context.ManualPayments
                    .Include(x => x.BankAccount)
                    .Include(x => x.ReviewedByUser)
                    .FirstAsync(x => x.OrderId == orderId);

                response.StatusCode = 200;
                response.Message = $"Manual payment {normalizedStatus.ToLower()} successfully.";
                response.Data = await BuildManualPaymentDtoAsync(refreshed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reviewing manual payment for order {OrderId}", orderId);
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        private async Task<ManualPaymentDto> BuildManualPaymentDtoAsync(ManualPayment payment)
        {
            var dto = _mapper.Map<ManualPaymentDto>(payment);
            var accountsResponse = await GetManualPaymentAccountsAsync();
            dto.AvailableAccounts = accountsResponse.Data ?? new List<BankAccountDto>();

            if (payment.BankAccountId.HasValue && dto.BankAccount == null)
            {
                var bank = await _unitOfWork.BankAccountRepository.GetById(payment.BankAccountId.Value);
                if (bank != null)
                {
                    dto.BankAccount = _mapper.Map<BankAccountDto>(bank);
                }
            }

            return dto;
        }

        private async Task NotifyAdminsAsync(Data.Entities.Orders.Order order, ManualPayment payment)
        {
            try
            {
                var admins = await _context.Users
                    .Where(x => x.IsAdmin || x.IsSuperAdmin)
                    .ToListAsync();

                foreach (var admin in admins.Where(x => !string.IsNullOrWhiteSpace(x.Email)))
                {
                    await _emailService.SendMailAsync(new MessageDto
                    {
                        Channel = MessagingChannels.Email,
                        Recipient = admin.Email,
                        RecipientName = admin.FirstName,
                        Subject = $"Manual payment proof submitted for order {order.Id.ToString().ToUpper()[..8]}",
                        Content = $@"
                            <p>A customer has uploaded proof of payment for order <strong>{order.Id.ToString().ToUpper()[..8]}</strong>.</p>
                            <p>Amount expected: <strong>{payment.AmountExpected:N2}</strong></p>
                            <p>Reference: {payment.PaymentReference ?? "N/A"}</p>
                            <p>Please review the order in the admin dashboard.</p>"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to notify admins for order {OrderId}", order.Id);
            }
        }

        private async Task NotifyUserAsync(ManualPayment payment)
        {
            try
            {
                if (payment.User == null || string.IsNullOrWhiteSpace(payment.User.Email))
                {
                    return;
                }

                var subject = payment.Status == "Approved"
                    ? "Your manual payment has been approved"
                    : "Your manual payment was rejected";

                var content = payment.Status == "Approved"
                    ? $@"<p>Your payment for order <strong>{payment.OrderId.ToString().ToUpper()[..8]}</strong> has been approved.</p><p>Your order is now being processed.</p>"
                    : $@"<p>Your payment for order <strong>{payment.OrderId.ToString().ToUpper()[..8]}</strong> was rejected.</p><p>Reason: {payment.ReviewNote ?? "Not provided"}</p>";

                await _emailService.SendMailAsync(new MessageDto
                {
                    Channel = MessagingChannels.Email,
                    Recipient = payment.User.Email,
                    RecipientName = payment.User.FirstName,
                    Subject = subject,
                    Content = content
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to notify user for manual payment {ManualPaymentId}", payment.Id);
            }
        }
    }
}
