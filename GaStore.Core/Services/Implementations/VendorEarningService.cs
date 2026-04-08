using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.WalletsDto;
using GaStore.Data.Entities.Wallets;
using GaStore.Data.Models;
using GaStore.Models.Database;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations
{
    public class VendorEarningService : IVendorEarningService
    {
        private const decimal PlatformCommissionRate = 4m;
        private const decimal FlatFeePerUnit = 350m;

        private readonly DatabaseContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<VendorEarningService> _logger;
        private readonly AppSettings _appSettings;

        public VendorEarningService(
            DatabaseContext context,
            IMapper mapper,
            ILogger<VendorEarningService> logger,
            IOptions<AppSettings> appSettings)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _appSettings = appSettings.Value;
        }

        public async Task ProcessOrderVendorEarningsAsync(Guid orderId, Guid actorId)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Variant)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.HasPaid);

            if (order == null || order.Items == null || order.Items.Count == 0)
            {
                return;
            }

            var existingOrderItemIds = await _context.VendorEarnings
                .Where(x => x.OrderId == orderId)
                .Select(x => x.OrderItemId)
                .ToListAsync();

            var newEarnings = new List<VendorEarning>();

            foreach (var item in order.Items)
            {
                if (existingOrderItemIds.Contains(item.Id))
                {
                    continue;
                }

                var vendorId = item.Product?.VendorId;
                if (!vendorId.HasValue)
                {
                    continue;
                }

                var grossAmount = Math.Round(item.Price * item.Quantity, 2);
                var commissionAmount = Math.Round(grossAmount * (PlatformCommissionRate / 100m), 2);
                var flatFeeAmount = Math.Round(FlatFeePerUnit * item.Quantity, 2);
                var netAmount = Math.Round(Math.Max(0, grossAmount - commissionAmount - flatFeeAmount), 2);

                newEarnings.Add(new VendorEarning
                {
                    VendorId = vendorId.Value,
                    OrderId = order.Id,
                    OrderItemId = item.Id,
                    ProductId = item.ProductId,
                    ProductName = item.Product?.Name,
                    VariantName = item.Variant?.Name,
                    Quantity = item.Quantity,
                    UnitPrice = item.Price,
                    GrossAmount = grossAmount,
                    PlatformCommissionRate = PlatformCommissionRate,
                    PlatformCommissionAmount = commissionAmount,
                    FlatFeeAmount = flatFeeAmount,
                    NetAmount = netAmount,
                    Currency = "NGN",
                    Status = "Available",
                    EarnedOn = DateTime.UtcNow,
                    Notes = $"Generated from paid order {order.Id}"
                });
            }

            if (newEarnings.Count == 0)
            {
                return;
            }

            await _context.VendorEarnings.AddRangeAsync(newEarnings);
            await _context.SaveChangesAsync();
        }

        public async Task<PaginatedServiceResponse<List<VendorEarningDto>>> GetVendorEarningsAsync(
            Guid vendorId,
            string? status,
            Guid? orderId,
            DateTime? startDate,
            DateTime? endDate,
            int pageNumber,
            int pageSize)
        {
            var response = new PaginatedServiceResponse<List<VendorEarningDto>> { Status = 400 };

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                var query = _context.VendorEarnings
                    .Include(x => x.Vendor)
                    .Where(x => x.VendorId == vendorId)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(x => x.Status.ToLower() == status.Trim().ToLower());
                }

                if (orderId.HasValue)
                {
                    query = query.Where(x => x.OrderId == orderId.Value);
                }

                if (startDate.HasValue)
                {
                    query = query.Where(x => x.EarnedOn >= startDate.Value.Date);
                }

                if (endDate.HasValue)
                {
                    var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(x => x.EarnedOn <= endOfDay);
                }

                var totalRecords = await query.CountAsync();
                var records = await query
                    .OrderByDescending(x => x.EarnedOn)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                response.Status = 200;
                response.Message = "Vendor earnings retrieved successfully.";
                response.Data = _mapper.Map<List<VendorEarningDto>>(records);
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vendor earnings for vendor {VendorId}", vendorId);
                response.Status = 500;
                response.Message = "An error occurred while retrieving vendor earnings.";
            }

            return response;
        }

        public async Task<ServiceResponse<VendorEarningsOverviewDto>> GetVendorOverviewAsync(Guid vendorId, DateTime? startDate, DateTime? endDate)
        {
            var response = new ServiceResponse<VendorEarningsOverviewDto> { StatusCode = 400 };

            try
            {
                var query = _context.VendorEarnings.Where(x => x.VendorId == vendorId).AsQueryable();

                if (startDate.HasValue)
                {
                    query = query.Where(x => x.EarnedOn >= startDate.Value.Date);
                }

                if (endDate.HasValue)
                {
                    var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(x => x.EarnedOn <= endOfDay);
                }

                var earnings = await query.ToListAsync();
                var payoutAccount = await _context.BankAccounts
                    .Where(x => x.UserId == vendorId && x.IsDefaultPayoutAccount)
                    .OrderByDescending(x => x.DateUpdated)
                    .FirstOrDefaultAsync();

                var lastPayout = await _context.VendorPayouts
                    .Where(x => x.VendorId == vendorId && x.Status == "Paid")
                    .OrderByDescending(x => x.CompletedOn)
                    .FirstOrDefaultAsync();

                response.StatusCode = 200;
                response.Message = "Vendor earnings overview retrieved successfully.";
                response.Data = new VendorEarningsOverviewDto
                {
                    TotalGrossAmount = earnings.Sum(x => x.GrossAmount),
                    TotalPlatformCommissionAmount = earnings.Sum(x => x.PlatformCommissionAmount),
                    TotalFlatFeeAmount = earnings.Sum(x => x.FlatFeeAmount),
                    TotalNetAmount = earnings.Sum(x => x.NetAmount),
                    TotalPaidAmount = earnings.Where(x => x.Status == "Paid").Sum(x => x.NetAmount),
                    TotalOutstandingAmount = earnings.Where(x => x.Status != "Paid").Sum(x => x.NetAmount),
                    TotalReadyForPayoutAmount = earnings.Where(x => x.Status == "Available").Sum(x => x.NetAmount),
                    TotalEarningsCount = earnings.Count,
                    PaidEarningsCount = earnings.Count(x => x.Status == "Paid"),
                    OutstandingEarningsCount = earnings.Count(x => x.Status != "Paid"),
                    HasDefaultPayoutAccount = payoutAccount != null,
                    DefaultPayoutGateway = payoutAccount?.PreferredPayoutGateway,
                    LastPayoutDate = lastPayout?.CompletedOn,
                    NextWeekendPayoutDate = GetNextWeekendPayoutDateUtc()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vendor earnings overview for vendor {VendorId}", vendorId);
                response.StatusCode = 500;
                response.Message = "An error occurred while retrieving vendor earnings overview.";
            }

            return response;
        }

        public async Task<ServiceResponse<List<VendorPayoutCandidateDto>>> GetAdminPayoutQueueAsync(Guid? vendorId)
        {
            var response = new ServiceResponse<List<VendorPayoutCandidateDto>> { StatusCode = 400 };

            try
            {
                var earningsQuery = _context.VendorEarnings
                    .Include(x => x.Vendor)
                    .Where(x => x.Status == "Available");

                if (vendorId.HasValue)
                {
                    earningsQuery = earningsQuery.Where(x => x.VendorId == vendorId.Value);
                }

                var earnings = await earningsQuery.ToListAsync();
                var vendorIds = earnings.Select(x => x.VendorId).Distinct().ToList();
                var bankAccounts = await _context.BankAccounts
                    .Where(x => vendorIds.Contains(x.UserId) && x.IsDefaultPayoutAccount)
                    .ToListAsync();

                var queue = earnings
                    .GroupBy(x => new { x.VendorId, VendorName = x.Vendor != null ? $"{x.Vendor.FirstName} {x.Vendor.LastName}".Trim() : "Vendor", x.Vendor!.Email })
                    .Select(group =>
                    {
                        var account = bankAccounts
                            .Where(x => x.UserId == group.Key.VendorId)
                            .OrderByDescending(x => x.DateUpdated)
                            .FirstOrDefault();

                        return new VendorPayoutCandidateDto
                        {
                            VendorId = group.Key.VendorId,
                            VendorName = group.Key.VendorName,
                            VendorEmail = group.Key.Email,
                            BankAccountId = account?.Id,
                            BankName = account?.BankName,
                            AccountName = account?.AccountName,
                            AccountNumberMasked = MaskAccountNumber(account?.AccountNumber),
                            PreferredPayoutGateway = account?.PreferredPayoutGateway,
                            HasEligibleBankAccount = account != null && !string.IsNullOrWhiteSpace(account.AccountNumber) && !string.IsNullOrWhiteSpace(account.BankCode),
                            EarningsCount = group.Count(),
                            OrderCount = group.Select(x => x.OrderId).Distinct().Count(),
                            GrossAmount = group.Sum(x => x.GrossAmount),
                            PlatformCommissionAmount = group.Sum(x => x.PlatformCommissionAmount),
                            FlatFeeAmount = group.Sum(x => x.FlatFeeAmount),
                            NetAmount = group.Sum(x => x.NetAmount),
                            OldestEarningDate = group.Min(x => x.EarnedOn),
                            LatestEarningDate = group.Max(x => x.EarnedOn)
                        };
                    })
                    .OrderByDescending(x => x.NetAmount)
                    .ToList();

                response.StatusCode = 200;
                response.Message = "Vendor payout queue retrieved successfully.";
                response.Data = queue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin payout queue.");
                response.StatusCode = 500;
                response.Message = "An error occurred while retrieving payout queue.";
            }

            return response;
        }

        public async Task<PaginatedServiceResponse<List<VendorPayoutDto>>> GetAdminPayoutHistoryAsync(
            Guid? vendorId,
            string? status,
            string? gateway,
            int pageNumber,
            int pageSize)
        {
            var response = new PaginatedServiceResponse<List<VendorPayoutDto>> { Status = 400 };

            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    response.Message = "Page number and page size must be greater than 0.";
                    return response;
                }

                var query = _context.VendorPayouts
                    .Include(x => x.Vendor)
                    .Include(x => x.BankAccount)
                    .AsQueryable();

                if (vendorId.HasValue)
                {
                    query = query.Where(x => x.VendorId == vendorId.Value);
                }

                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(x => x.Status.ToLower() == status.Trim().ToLower());
                }

                if (!string.IsNullOrWhiteSpace(gateway))
                {
                    query = query.Where(x => x.Gateway.ToLower() == gateway.Trim().ToLower());
                }

                var totalRecords = await query.CountAsync();
                var payouts = await query
                    .OrderByDescending(x => x.InitiatedOn)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                response.Status = 200;
                response.Message = "Vendor payout history retrieved successfully.";
                response.Data = _mapper.Map<List<VendorPayoutDto>>(payouts);
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
                response.TotalRecords = totalRecords;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vendor payout history.");
                response.Status = 500;
                response.Message = "An error occurred while retrieving payout history.";
            }

            return response;
        }

        public async Task<ServiceResponse<List<VendorPayoutDto>>> ProcessWeekendPayoutsAsync(Guid adminId, ProcessVendorPayoutRequestDto dto)
        {
            var response = new ServiceResponse<List<VendorPayoutDto>> { StatusCode = 400, Data = new List<VendorPayoutDto>() };

            try
            {
                var today = DateTime.UtcNow.DayOfWeek;
                if (today != DayOfWeek.Saturday && today != DayOfWeek.Sunday)
                {
                    response.Message = "Vendor payouts can only be processed during the weekend.";
                    return response;
                }

                var queueResponse = await GetAdminPayoutQueueAsync(dto.VendorId);
                if (queueResponse.StatusCode != 200 || queueResponse.Data == null || queueResponse.Data.Count == 0)
                {
                    response.Message = "No vendor earnings are ready for payout.";
                    return response;
                }

                var createdPayoutIds = new List<Guid>();
                foreach (var queueItem in queueResponse.Data)
                {
                    if (!queueItem.HasEligibleBankAccount || !queueItem.BankAccountId.HasValue || queueItem.NetAmount <= 0)
                    {
                        continue;
                    }

                    var bankAccount = await _context.BankAccounts.FirstAsync(x => x.Id == queueItem.BankAccountId.Value);
                    var gateway = ResolveGateway(dto.Gateway, bankAccount.PreferredPayoutGateway);
                    var vendorEarnings = await _context.VendorEarnings
                        .Where(x => x.VendorId == queueItem.VendorId && x.Status == "Available")
                        .OrderBy(x => x.EarnedOn)
                        .ToListAsync();

                    if (vendorEarnings.Count == 0)
                    {
                        continue;
                    }

                    var payout = new VendorPayout
                    {
                        VendorId = queueItem.VendorId,
                        BankAccountId = bankAccount.Id,
                        ProcessedByAdminId = adminId,
                        Gateway = gateway,
                        GrossAmount = vendorEarnings.Sum(x => x.GrossAmount),
                        PlatformCommissionAmount = vendorEarnings.Sum(x => x.PlatformCommissionAmount),
                        FlatFeeAmount = vendorEarnings.Sum(x => x.FlatFeeAmount),
                        NetAmount = vendorEarnings.Sum(x => x.NetAmount),
                        EarningsCount = vendorEarnings.Count,
                        Status = "Processing",
                        InitiatedOn = DateTime.UtcNow,
                        Reference = BuildPayoutReference(queueItem.VendorId)
                    };

                    await _context.VendorPayouts.AddAsync(payout);
                    await _context.SaveChangesAsync();

                    var transferResult = gateway.Equals("Flutterwave", StringComparison.OrdinalIgnoreCase)
                        ? await CreateFlutterwaveTransferAsync(bankAccount, payout.NetAmount, payout.Reference!)
                        : await CreatePaystackTransferAsync(bankAccount, payout.NetAmount, payout.Reference!);

                    if (!transferResult.Success)
                    {
                        payout.Status = "Failed";
                        payout.FailureReason = transferResult.FailureReason;
                        payout.ExternalTransferId = transferResult.ExternalTransferId;
                        payout.CompletedOn = DateTime.UtcNow;
                        _context.VendorPayouts.Update(payout);
                        await _context.SaveChangesAsync();
                        createdPayoutIds.Add(payout.Id);
                        continue;
                    }

                    payout.Status = transferResult.Status ?? "Paid";
                    payout.ExternalTransferId = transferResult.ExternalTransferId;
                    payout.Reference = transferResult.Reference ?? payout.Reference;
                    payout.CompletedOn = DateTime.UtcNow;
                    _context.VendorPayouts.Update(payout);

                    foreach (var earning in vendorEarnings)
                    {
                        earning.Status = "Paid";
                        earning.VendorPayoutId = payout.Id;
                        earning.PaidOutOn = DateTime.UtcNow;
                    }

                    await _context.SaveChangesAsync();
                    createdPayoutIds.Add(payout.Id);
                }

                var createdPayouts = await _context.VendorPayouts
                    .Include(x => x.Vendor)
                    .Include(x => x.BankAccount)
                    .Where(x => createdPayoutIds.Contains(x.Id))
                    .OrderByDescending(x => x.InitiatedOn)
                    .ToListAsync();

                response.StatusCode = 200;
                response.Message = createdPayouts.Count > 0
                    ? "Weekend payouts processed."
                    : "No eligible vendors had a valid payout account.";
                response.Data = _mapper.Map<List<VendorPayoutDto>>(createdPayouts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing weekend vendor payouts.");
                response.StatusCode = 500;
                response.Message = "An error occurred while processing weekend payouts.";
            }

            return response;
        }

        private async Task<GatewayTransferResult> CreatePaystackTransferAsync(BankAccount bankAccount, decimal amount, string reference)
        {
            if (string.IsNullOrWhiteSpace(_appSettings.Paystack?.EndPoint) || string.IsNullOrWhiteSpace(_appSettings.Paystack?.SecretKey))
            {
                return GatewayTransferResult.Fail("Paystack configuration is missing.");
            }

            if (string.IsNullOrWhiteSpace(bankAccount.BankCode))
            {
                return GatewayTransferResult.Fail("Vendor bank code is required for Paystack payouts.");
            }

            try
            {
                using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _appSettings.Paystack.SecretKey);

                if (string.IsNullOrWhiteSpace(bankAccount.PaystackRecipientCode))
                {
                    var recipientPayload = JsonSerializer.Serialize(new
                    {
                        type = "nuban",
                        name = bankAccount.AccountName,
                        account_number = bankAccount.AccountNumber,
                        bank_code = bankAccount.BankCode,
                        currency = string.IsNullOrWhiteSpace(bankAccount.Currency) ? "NGN" : bankAccount.Currency
                    });

                    using var recipientResponse = await client.PostAsync(
                        $"{_appSettings.Paystack.EndPoint}transferrecipient",
                        new StringContent(recipientPayload, Encoding.UTF8, "application/json"));

                    var recipientBody = await recipientResponse.Content.ReadAsStringAsync();
                    if (!recipientResponse.IsSuccessStatusCode)
                    {
                        return GatewayTransferResult.Fail($"Paystack recipient creation failed: {recipientBody}");
                    }

                    using var recipientDoc = JsonDocument.Parse(recipientBody);
                    bankAccount.PaystackRecipientCode = recipientDoc.RootElement.GetProperty("data").GetProperty("recipient_code").GetString();
                    bankAccount.IsPayoutVerified = !string.IsNullOrWhiteSpace(bankAccount.PaystackRecipientCode);
                    _context.BankAccounts.Update(bankAccount);
                    await _context.SaveChangesAsync();
                }

                var transferPayload = JsonSerializer.Serialize(new
                {
                    source = "balance",
                    amount = (int)Math.Round(amount * 100, MidpointRounding.AwayFromZero),
                    recipient = bankAccount.PaystackRecipientCode,
                    reason = "Vendor weekend payout",
                    reference
                });

                using var transferResponse = await client.PostAsync(
                    $"{_appSettings.Paystack.EndPoint}transfer",
                    new StringContent(transferPayload, Encoding.UTF8, "application/json"));

                var transferBody = await transferResponse.Content.ReadAsStringAsync();
                if (!transferResponse.IsSuccessStatusCode)
                {
                    return GatewayTransferResult.Fail($"Paystack transfer failed: {transferBody}");
                }

                using var transferDoc = JsonDocument.Parse(transferBody);
                var data = transferDoc.RootElement.GetProperty("data");
                return GatewayTransferResult.Ok(
                    data.TryGetProperty("transfer_code", out var transferCode) ? transferCode.GetString() : null,
                    data.TryGetProperty("reference", out var paystackRef) ? paystackRef.GetString() : reference,
                    data.TryGetProperty("status", out var status) ? ToPayoutStatus(status.GetString()) : "Paid");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Paystack payout for bank account {BankAccountId}", bankAccount.Id);
                return GatewayTransferResult.Fail(ex.Message);
            }
        }

        private async Task<GatewayTransferResult> CreateFlutterwaveTransferAsync(BankAccount bankAccount, decimal amount, string reference)
        {
            if (string.IsNullOrWhiteSpace(_appSettings.Flutterwave?.EndPoint) || string.IsNullOrWhiteSpace(_appSettings.Flutterwave?.SecretKey))
            {
                return GatewayTransferResult.Fail("Flutterwave configuration is missing.");
            }

            if (string.IsNullOrWhiteSpace(bankAccount.BankCode))
            {
                return GatewayTransferResult.Fail("Vendor bank code is required for Flutterwave payouts.");
            }

            try
            {
                using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _appSettings.Flutterwave.SecretKey);

                var payload = JsonSerializer.Serialize(new
                {
                    account_bank = bankAccount.BankCode,
                    account_number = bankAccount.AccountNumber,
                    amount,
                    narration = "Vendor weekend payout",
                    currency = string.IsNullOrWhiteSpace(bankAccount.Currency) ? "NGN" : bankAccount.Currency,
                    reference,
                    beneficiary_name = bankAccount.AccountName,
                    debit_currency = string.IsNullOrWhiteSpace(bankAccount.Currency) ? "NGN" : bankAccount.Currency
                });

                using var transferResponse = await client.PostAsync(
                    $"{_appSettings.Flutterwave.EndPoint}transfers",
                    new StringContent(payload, Encoding.UTF8, "application/json"));

                var responseBody = await transferResponse.Content.ReadAsStringAsync();
                if (!transferResponse.IsSuccessStatusCode)
                {
                    return GatewayTransferResult.Fail($"Flutterwave transfer failed: {responseBody}");
                }

                using var doc = JsonDocument.Parse(responseBody);
                var data = doc.RootElement.TryGetProperty("data", out var dataNode) ? dataNode : default;
                var transferId = data.ValueKind == JsonValueKind.Object && data.TryGetProperty("id", out var idNode)
                    ? idNode.ToString()
                    : null;
                var gatewayReference = data.ValueKind == JsonValueKind.Object && data.TryGetProperty("reference", out var refNode)
                    ? refNode.GetString()
                    : reference;
                var rawStatus = data.ValueKind == JsonValueKind.Object && data.TryGetProperty("status", out var statusNode)
                    ? statusNode.GetString()
                    : doc.RootElement.TryGetProperty("status", out var rootStatus) ? rootStatus.GetString() : "successful";

                return GatewayTransferResult.Ok(transferId, gatewayReference, ToPayoutStatus(rawStatus));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Flutterwave payout for bank account {BankAccountId}", bankAccount.Id);
                return GatewayTransferResult.Fail(ex.Message);
            }
        }

        private static string ResolveGateway(string? requestedGateway, string? preferredGateway)
        {
            if (!string.IsNullOrWhiteSpace(requestedGateway))
            {
                return requestedGateway.Trim();
            }

            if (!string.IsNullOrWhiteSpace(preferredGateway))
            {
                return preferredGateway.Trim();
            }

            return "Paystack";
        }

        private static string MaskAccountNumber(string? accountNumber)
        {
            if (string.IsNullOrWhiteSpace(accountNumber) || accountNumber.Length < 4)
            {
                return "N/A";
            }

            return $"****{accountNumber[^4..]}";
        }

        private static DateTime GetNextWeekendPayoutDateUtc()
        {
            var currentDate = DateTime.UtcNow.Date;
            var daysUntilSaturday = ((int)DayOfWeek.Saturday - (int)currentDate.DayOfWeek + 7) % 7;
            return currentDate.AddDays(daysUntilSaturday == 0 ? 7 : daysUntilSaturday);
        }

        private static string BuildPayoutReference(Guid vendorId)
        {
            return $"VENPAY_{vendorId.ToString("N")[..8]}_{DateTime.UtcNow:yyyyMMddHHmmss}";
        }

        private static string ToPayoutStatus(string? gatewayStatus)
        {
            return gatewayStatus?.ToLower() switch
            {
                "success" => "Paid",
                "successful" => "Paid",
                "completed" => "Paid",
                "pending" => "Processing",
                "processing" => "Processing",
                _ => "Paid"
            };
        }

        private sealed class GatewayTransferResult
        {
            public bool Success { get; private set; }
            public string? ExternalTransferId { get; private set; }
            public string? Reference { get; private set; }
            public string? Status { get; private set; }
            public string? FailureReason { get; private set; }

            public static GatewayTransferResult Ok(string? externalTransferId, string? reference, string status) =>
                new()
                {
                    Success = true,
                    ExternalTransferId = externalTransferId,
                    Reference = reference,
                    Status = status
                };

            public static GatewayTransferResult Fail(string reason) =>
                new()
                {
                    Success = false,
                    FailureReason = reason
                };
        }
    }
}
