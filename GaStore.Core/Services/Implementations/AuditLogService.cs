using global::GaStore.Data.Entities.System;
using global::GaStore.Models.Database;
using global::GaStore.Shared;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Security.Claims;
using GaStore.Core.Services.Interfaces;

namespace GaStore.Core.Services.Implementations
{

        public class AuditLogService : IAuditLogService
        {
            private readonly DatabaseContext _context;
            private readonly IHttpContextAccessor _httpContextAccessor;
            private readonly ILogger<AuditLogService> _logger;

            public AuditLogService(
                DatabaseContext context,
                IHttpContextAccessor httpContextAccessor,
                ILogger<AuditLogService> logger)
            {
                _context = context;
                _httpContextAccessor = httpContextAccessor;
                _logger = logger;
            }

            #region Database Change Logging - Fixed Version

            public async Task LogDatabaseChangeAsync(
                string entityName,
                string entityId,
                string action,
                Dictionary<string, object> oldValues = null,
                Dictionary<string, object> newValues = null,
                string userId = null,
                string userEmail = null)
            {
                try
                {
                    // Create a dictionary to hold the change data
                    var changes = new Dictionary<string, object>();

                    // Handle different scenarios based on the action
                    if (action == "Updated" && oldValues != null && newValues != null)
                    {
                        // For updates, show old vs new
                        var changeDetails = new Dictionary<string, ChangeDetail>();

                        // Check all keys in both dictionaries
                        var allKeys = oldValues.Keys.Union(newValues.Keys);
                        foreach (var key in allKeys)
                        {
                            var oldValue = oldValues.ContainsKey(key) ? oldValues[key] : null;
                            var newValue = newValues.ContainsKey(key) ? newValues[key] : null;

                            // Only add if values are different
                            if (!AreValuesEqual(oldValue, newValue))
                            {
                                changeDetails[key] = new ChangeDetail
                                {
                                    Old = oldValue,
                                    New = newValue
                                };
                            }
                        }

                        if (changeDetails.Any())
                        {
                            changes["type"] = "update";
                            changes["details"] = changeDetails;
                        }
                    }
                    else if (action == "Created" && newValues != null)
                    {
                        // For creations, show new values
                        changes["type"] = "create";
                        changes["details"] = newValues;
                    }
                    else if (action == "Deleted" && oldValues != null)
                    {
                        // For deletions, show old values
                        changes["type"] = "delete";
                        changes["details"] = oldValues;
                    }

                    var auditLog = new AuditLog
                    {
                        Action = action,
                        EntityName = entityName,
                        EntityId = entityId,
                        UserId = userId,
                        UserEmail = userEmail,
                        RequestTime = DateTime.UtcNow,
                        ResponseTime = DateTime.UtcNow,
                        Status = "Database Change",
                        Changes = changes.Any()
                            ? JsonConvert.SerializeObject(changes, new JsonSerializerSettings
                            {
                                ContractResolver = new CamelCasePropertyNamesContractResolver(),
                                Formatting = Formatting.Indented,
                                NullValueHandling = NullValueHandling.Ignore,
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore
                            })
                            : null
                    };

                    await _context.AuditLogs.AddAsync(auditLog);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to log database change for {EntityName} {EntityId}", entityName, entityId);
                }
            }

            private bool AreValuesEqual(object value1, object value2)
            {
                if (value1 == null && value2 == null) return true;
                if (value1 == null || value2 == null) return false;

                // Handle DateTime comparisons
                if (value1 is DateTime dt1 && value2 is DateTime dt2)
                {
                    return dt1 == dt2;
                }

                // Handle Guid comparisons
                if (value1 is Guid guid1 && value2 is Guid guid2)
                {
                    return guid1 == guid2;
                }

                // Default comparison
                return value1.Equals(value2);
            }

            // Helper class for change details
            private class ChangeDetail
            {
                public object Old { get; set; }
                public object New { get; set; }
            }

            #endregion

            #region API Logging Methods

            public async Task<AuditLog> LogApiRequestAsync(HttpContext context, string requestBody = null)
            {
                try
                {
                    var auditLog = new AuditLog
                    {
                        Action = context.Request.Method,
                        Endpoint = context.Request.Path,
                        HttpMethod = context.Request.Method,
                        IpAddress = GetIpAddress(context),
                        UserAgent = context.Request.Headers["User-Agent"].ToString(),
                        UserId = GetUserId(context),
                        UserEmail = GetUserEmail(context),
                        RequestTime = DateTime.UtcNow,
                        Request = TruncateIfTooLong(requestBody, 4000),
                        Status = "Processing"
                    };

                    await _context.AuditLogs.AddAsync(auditLog);
                    await _context.SaveChangesAsync();

                    return auditLog;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to log API request");
                    return null;
                }
            }

            public async Task LogApiResponseAsync(AuditLog auditLog, string responseBody, int statusCode, long durationMs)
            {
                try
                {
                    if (auditLog == null) return;

                    auditLog.ResponseTime = DateTime.UtcNow;
                    auditLog.DurationMs = durationMs;
                    auditLog.StatusCode = statusCode;
                    auditLog.Status = statusCode >= 200 && statusCode < 300 ? "Success" : "Failed";
                    auditLog.Response = TruncateIfTooLong(responseBody, 4000);

                    _context.AuditLogs.Update(auditLog);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to log API response");
                }
            }

            public async Task LogApiErrorAsync(AuditLog auditLog, Exception exception, long durationMs)
            {
                try
                {
                    if (auditLog == null) return;

                    auditLog.ResponseTime = DateTime.UtcNow;
                    auditLog.DurationMs = durationMs;
                    auditLog.StatusCode = 500;
                    auditLog.Status = "Error";
                    auditLog.ErrorMessage = exception.Message;
                    auditLog.ErrorDetails = TruncateIfTooLong(exception.ToString(), 2000);

                    _context.AuditLogs.Update(auditLog);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to log API error");
                }
            }

            #endregion

            #region Business Operation Logging

            public async Task<AuditLog> StartOperationAsync(string operation, string endpoint, object requestData = null)
            {
                try
                {
                    var auditLog = new AuditLog
                    {
                        Action = operation,
                        Endpoint = endpoint,
                        HttpMethod = "SERVICE",
                        IpAddress = GetCurrentIpAddress(),
                        UserId = GetCurrentUserId(),
                        UserEmail = GetCurrentUserEmail(),
                        RequestTime = DateTime.UtcNow,
                        Request = SerializeObject(requestData),
                        Status = "Processing"
                    };

                    await _context.AuditLogs.AddAsync(auditLog);
                    await _context.SaveChangesAsync();

                    return auditLog;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to start operation logging");
                    return null;
                }
            }

            public async Task CompleteOperationAsync(AuditLog auditLog, object responseData = null, bool isSuccess = true)
            {
                try
                {
                    if (auditLog == null) return;

                    auditLog.ResponseTime = DateTime.UtcNow;
                    auditLog.DurationMs = (long)(auditLog.ResponseTime.Value - auditLog.RequestTime).TotalMilliseconds;
                    auditLog.Status = isSuccess ? "Success" : "Failed";
                    auditLog.StatusCode = isSuccess ? 200 : 400;
                    auditLog.Response = SerializeObject(responseData);

                    _context.AuditLogs.Update(auditLog);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to complete operation logging");
                }
            }

            public async Task FailOperationAsync(AuditLog auditLog, Exception exception)
            {
                try
                {
                    if (auditLog == null) return;

                    auditLog.ResponseTime = DateTime.UtcNow;
                    auditLog.DurationMs = (long)(auditLog.ResponseTime.Value - auditLog.RequestTime).TotalMilliseconds;
                    auditLog.Status = "Error";
                    auditLog.StatusCode = 500;
                    auditLog.ErrorMessage = exception.Message;
                    auditLog.ErrorDetails = TruncateIfTooLong(exception.ToString(), 2000);

                    _context.AuditLogs.Update(auditLog);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to log operation error");
                }
            }

            #endregion

            #region Updated BannerService Integration Methods

            // Helper method for BannerService integration
            public async Task<ServiceOperationContext> StartServiceOperationAsync(
                string operationName,
                object requestData = null,
                Guid? userId = null,
                string endpoint = null)
            {
                var auditLog = await StartOperationAsync(
                    operationName,
                    endpoint ?? $"/api/Service/{operationName}",
                    requestData);

                return new ServiceOperationContext
                {
                    AuditLog = auditLog,
                    UserId = userId?.ToString() ?? GetCurrentUserId(),
                    UserEmail = GetCurrentUserEmail(),
                    StartTime = DateTime.UtcNow
                };
            }

            // Helper method to log database changes from services
            public async Task LogEntityChangeAsync<TEntity>(
                ServiceOperationContext context,
                TEntity entity,
                string action,
                Dictionary<string, object> oldValues = null,
                Dictionary<string, object> newValues = null) where TEntity : class
            {
                var entityName = typeof(TEntity).Name;
                var entityId = GetEntityId(entity);

                await LogDatabaseChangeAsync(
                    entityName: entityName,
                    entityId: entityId,
                    action: action,
                    oldValues: oldValues,
                    newValues: newValues,
                    userId: context.UserId,
                    userEmail: context.UserEmail);
            }

            // Helper method to extract entity ID
            private string GetEntityId<TEntity>(TEntity entity)
            {
                if (entity == null) return null;

                var idProperty = entity.GetType().GetProperties()
                    .FirstOrDefault(p => p.Name.Equals("Id", StringComparison.OrdinalIgnoreCase) ||
                                       p.Name.EndsWith("Id", StringComparison.OrdinalIgnoreCase));

                return idProperty?.GetValue(entity)?.ToString();
            }

            // Context class for service operations
            public class ServiceOperationContext
            {
                public AuditLog AuditLog { get; set; }
                public string UserId { get; set; }
                public string UserEmail { get; set; }
                public DateTime StartTime { get; set; }
            }

            #endregion

            #region Query Methods

            public async Task<PaginatedServiceResponse<List<AuditLog>>> GetAuditLogsAsync(
                int page = 1,
                int pageSize = 50,
                string search = null,
                string action = null,
                DateTime? fromDate = null,
                DateTime? toDate = null,
                string userId = null,
                string entityName = null)
            {
                var response = new PaginatedServiceResponse<List<AuditLog>>();

                try
                {
                    IQueryable<AuditLog> query = _context.AuditLogs.AsQueryable();

                    // Apply filters
                    if (!string.IsNullOrEmpty(search))
                    {
                        query = query.Where(x =>
                            EF.Functions.Like(x.Endpoint, $"%{search}%") ||
                            EF.Functions.Like(x.UserEmail, $"%{search}%") ||
                            EF.Functions.Like(x.IpAddress, $"%{search}%") ||
                            EF.Functions.Like(x.EntityName, $"%{search}%") ||
                            EF.Functions.Like(x.ErrorMessage, $"%{search}%"));
                    }

                    if (!string.IsNullOrEmpty(action))
                    {
                        query = query.Where(x => x.Action == action);
                    }

                    if (fromDate.HasValue)
                    {
                        query = query.Where(x => x.RequestTime >= fromDate.Value);
                    }

                    if (toDate.HasValue)
                    {
                        query = query.Where(x => x.RequestTime <= toDate.Value);
                    }

                    if (!string.IsNullOrEmpty(userId))
                    {
                        query = query.Where(x => x.UserId == userId);
                    }

                    if (!string.IsNullOrEmpty(entityName))
                    {
                        query = query.Where(x => x.EntityName == entityName);
                    }

                    // Get total count
                    var totalRecords = await query.CountAsync();

                    // Get paginated data
                    var logs = await query
                        .OrderByDescending(x => x.RequestTime)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();

                    response.Status = 200;
                    response.Message = "Audit logs retrieved successfully";
                    response.Data = logs;
                    response.PageNumber = page;
                    response.PageSize = pageSize;
                    response.TotalRecords = totalRecords;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error retrieving audit logs");
                    response.Status = 500;
                    response.Message = "Internal server error";
                }

                return response;
            }

            public async Task<ServiceResponse<AuditLog>> GetAuditLogByIdAsync(int id)
            {
                var response = new ServiceResponse<AuditLog>();

                try
                {
                    var log = await _context.AuditLogs.FindAsync(id);

                    if (log == null)
                    {
                        response.StatusCode = 404;
                        response.Message = "Audit log not found";
                        return response;
                    }

                    response.StatusCode = 200;
                    response.Message = "Audit log retrieved successfully";
                    response.Data = log;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error retrieving audit log by ID");
                    response.StatusCode = 500;
                    response.Message = "Internal server error";
                }

                return response;
            }

            public async Task<ServiceResponse<int>> GetAuditLogsCountAsync()
            {
                var response = new ServiceResponse<int>();

                try
                {
                    var count = await _context.AuditLogs.CountAsync();

                    response.StatusCode = 200;
                    response.Message = "Count retrieved successfully";
                    response.Data = count;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting audit logs count");
                    response.StatusCode = 500;
                    response.Message = "Internal server error";
                }

                return response;
            }

            public async Task<ServiceResponse<bool>> ClearOldLogsAsync(int daysToKeep = 90)
            {
                var response = new ServiceResponse<bool>();

                try
                {
                    var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);

                    var oldLogs = await _context.AuditLogs
                        .Where(x => x.RequestTime < cutoffDate)
                        .ToListAsync();

                    _context.AuditLogs.RemoveRange(oldLogs);
                    await _context.SaveChangesAsync();

                    response.StatusCode = 200;
                    response.Message = $"Cleared {oldLogs.Count} old audit logs";
                    response.Data = true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error clearing old audit logs");
                    response.StatusCode = 500;
                    response.Message = "Internal server error";
                    response.Data = false;
                }

                return response;
            }

            #endregion

            #region Statistics

            public async Task<AuditStatistics> GetAuditStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null)
            {
                try
                {
                    var query = _context.AuditLogs.AsQueryable();

                    if (fromDate.HasValue)
                    {
                        query = query.Where(x => x.RequestTime >= fromDate.Value);
                    }

                    if (toDate.HasValue)
                    {
                        query = query.Where(x => x.RequestTime <= toDate.Value);
                    }

                    var logs = await query.ToListAsync();

                    return new AuditStatistics
                    {
                        TotalRequests = logs.Count,
                        SuccessfulRequests = logs.Count(x => x.Status == "Success"),
                        FailedRequests = logs.Count(x => x.Status == "Failed"),
                        ErrorRequests = logs.Count(x => x.Status == "Error"),
                        AverageDurationMs = logs.Where(x => x.DurationMs > 0).Average(x => x.DurationMs),
                        TopEndpoints = logs.GroupBy(x => x.Endpoint)
                            .Select(g => new EndpointStatistic
                            {
                                Endpoint = g.Key,
                                Count = g.Count(),
                                AverageDurationMs = g.Where(x => x.DurationMs > 0).Average(x => x.DurationMs)
                            })
                            .OrderByDescending(x => x.Count)
                            .Take(10)
                            .ToList(),
                        TopUsers = logs.Where(x => !string.IsNullOrEmpty(x.UserEmail))
                            .GroupBy(x => x.UserEmail)
                            .Select(g => new UserStatistic
                            {
                                UserEmail = g.Key,
                                Count = g.Count(),
                                LastActivity = g.Max(x => x.RequestTime)
                            })
                            .OrderByDescending(x => x.Count)
                            .Take(10)
                            .ToList(),
                        TopEntities = logs.Where(x => !string.IsNullOrEmpty(x.EntityName))
                            .GroupBy(x => x.EntityName)
                            .Select(g => new EntityStatistic
                            {
                                EntityName = g.Key,
                                Count = g.Count(),
                                Actions = g.GroupBy(x => x.Action)
                                    .ToDictionary(g2 => g2.Key, g2 => g2.Count())
                            })
                            .OrderByDescending(x => x.Count)
                            .Take(10)
                            .ToList()
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting audit statistics");
                    return new AuditStatistics();
                }
            }

            public class AuditStatistics
            {
                public int TotalRequests { get; set; }
                public int SuccessfulRequests { get; set; }
                public int FailedRequests { get; set; }
                public int ErrorRequests { get; set; }
                public double AverageDurationMs { get; set; }
                public List<EndpointStatistic> TopEndpoints { get; set; } = new();
                public List<UserStatistic> TopUsers { get; set; } = new();
                public List<EntityStatistic> TopEntities { get; set; } = new();
            }

            public class EndpointStatistic
            {
                public string Endpoint { get; set; }
                public int Count { get; set; }
                public double AverageDurationMs { get; set; }
            }

            public class UserStatistic
            {
                public string UserEmail { get; set; }
                public int Count { get; set; }
                public DateTime LastActivity { get; set; }
            }

            public class EntityStatistic
            {
                public string EntityName { get; set; }
                public int Count { get; set; }
                public Dictionary<string, int> Actions { get; set; } = new();
            }

            #endregion

            #region Helper Methods

            private string GetIpAddress(HttpContext context)
            {
                return context.Connection.RemoteIpAddress?.ToString() ??
                       context.Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                       "Unknown";
            }

            private string GetUserId(HttpContext context)
            {
                var userIdClaim = context.User?.FindFirst("userId")?.Value ??
                                 context.User?.FindFirst("sub")?.Value ??
                                 context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                return userIdClaim;
            }

            private string GetUserEmail(HttpContext context)
            {
                return context.User?.FindFirst("email")?.Value ??
                       context.User?.FindFirst(ClaimTypes.Email)?.Value;
            }

            public string GetCurrentUserId()
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null) return null;

                return GetUserId(context);
            }

            public string GetCurrentUserEmail()
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null) return null;

                return GetUserEmail(context);
            }

            public string GetCurrentIpAddress()
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null) return null;

                return GetIpAddress(context);
            }

            private string TruncateIfTooLong(string text, int maxLength)
            {
                if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
                    return text;

                return text.Substring(0, maxLength - 100) +
                       $"...[TRUNCATED {text.Length - (maxLength - 100)} CHARACTERS]";
            }

            private string SerializeObject(object obj)
            {
                if (obj == null) return null;

                try
                {
                    return JsonConvert.SerializeObject(obj, new JsonSerializerSettings
                    {
                        ContractResolver = new CamelCasePropertyNamesContractResolver(),
                        Formatting = Formatting.None,
                        NullValueHandling = NullValueHandling.Ignore,
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore
                    });
                }
                catch
                {
                    return obj.ToString();
                }
            }

            #endregion
        }
}
