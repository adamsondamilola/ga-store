using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.AuditDto;
using GaStore.Data.Entities.System;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        public AuditLogController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        /// <summary>
        /// Get all audit logs (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet]
        public async Task<ActionResult<PaginatedServiceResponse<List<AuditLog>>>> GetAuditLogs(
            [FromQuery] string search = null,
            [FromQuery] string action = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string userId = null,
            [FromQuery] string entityName = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            if (pageNumber < 1 || pageSize < 1)
            {
                return BadRequest(new PaginatedServiceResponse<List<AuditLog>>
                {
                    Status = 400,
                    Message = "Page number and page size must be greater than 0."
                });
            }

            var response = await _auditLogService.GetAuditLogsAsync(
                pageNumber, pageSize, search, action, fromDate, toDate, userId, entityName);

            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Get audit log by ID (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResponse<AuditLog>>> GetAuditLogById(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new ServiceResponse<AuditLog>
                {
                    StatusCode = 400,
                    Message = "Valid audit log ID is required."
                });
            }

            var response = await _auditLogService.GetAuditLogByIdAsync(id);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Get audit statistics (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("statistics")]
        public async Task<ActionResult<ServiceResponse<AuditStatistics>>> GetAuditStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var statistics = await _auditLogService.GetAuditStatisticsAsync(fromDate, toDate);

                return Ok(new ServiceResponse<AuditStatistics>
                {
                    StatusCode = 200,
                    Message = "Audit statistics retrieved successfully",
                    Data = new AuditStatistics
                    {
                        TotalRequests = statistics.TotalRequests,
                        SuccessfulRequests = statistics.SuccessfulRequests,
                        FailedRequests = statistics.FailedRequests,
                        ErrorRequests = statistics.ErrorRequests,
                        AverageDurationMs = statistics.AverageDurationMs
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResponse<AuditStatistics>
                {
                    StatusCode = 500,
                    Message = "Error retrieving audit statistics"
                });
            }
        }

        /// <summary>
        /// Get audit log count (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("count")]
        public async Task<ActionResult<ServiceResponse<int>>> GetAuditLogsCount(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                // For filtered count, we need to query with filters
                var allLogsResponse = await _auditLogService.GetAuditLogsAsync(
                    1, 1, null, null, fromDate, toDate);

                return Ok(new ServiceResponse<int>
                {
                    StatusCode = 200,
                    Message = "Audit log count retrieved successfully",
                    Data = allLogsResponse.TotalRecords
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResponse<int>
                {
                    StatusCode = 500,
                    Message = "Error retrieving audit log count",
                    
                });
            }
        }

        /// <summary>
        /// Search audit logs by text (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("search")]
        public async Task<ActionResult<PaginatedServiceResponse<List<AuditLog>>>> SearchAuditLogs(
            [FromQuery] string query,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new PaginatedServiceResponse<List<AuditLog>>
                {
                    Status = 400,
                    Message = "Search query is required."
                });
            }

            var response = await _auditLogService.GetAuditLogsAsync(
                pageNumber, pageSize, query);

            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Get audit logs by user (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<PaginatedServiceResponse<List<AuditLog>>>> GetAuditLogsByUser(
            string userId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest(new PaginatedServiceResponse<List<AuditLog>>
                {
                    Status = 400,
                    Message = "User ID is required."
                });
            }

            var response = await _auditLogService.GetAuditLogsAsync(
                pageNumber, pageSize, userId: userId);

            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Get audit logs by entity (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("entity/{entityName}")]
        public async Task<ActionResult<PaginatedServiceResponse<List<AuditLog>>>> GetAuditLogsByEntity(
            string entityName,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            if (string.IsNullOrWhiteSpace(entityName))
            {
                return BadRequest(new PaginatedServiceResponse<List<AuditLog>>
                {
                    Status = 400,
                    Message = "Entity name is required."
                });
            }

            var response = await _auditLogService.GetAuditLogsAsync(
                pageNumber, pageSize, entityName: entityName);

            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Get audit logs by action type (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("action/{actionType}")]
        public async Task<ActionResult<PaginatedServiceResponse<List<AuditLog>>>> GetAuditLogsByAction(
            string actionType,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            if (string.IsNullOrWhiteSpace(actionType))
            {
                return BadRequest(new PaginatedServiceResponse<List<AuditLog>>
                {
                    Status = 400,
                    Message = "Action type is required."
                });
            }

            var response = await _auditLogService.GetAuditLogsAsync(
                pageNumber, pageSize, action: actionType);

            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Get audit logs by date range (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("date-range")]
        public async Task<ActionResult<PaginatedServiceResponse<List<AuditLog>>>> GetAuditLogsByDateRange(
            [FromQuery] DateTime fromDate,
            [FromQuery] DateTime toDate,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            if (fromDate > toDate)
            {
                return BadRequest(new PaginatedServiceResponse<List<AuditLog>>
                {
                    Status = 400,
                    Message = "From date must be before or equal to to date."
                });
            }

            var response = await _auditLogService.GetAuditLogsAsync(
                pageNumber, pageSize, fromDate: fromDate, toDate: toDate);

            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Get recent audit logs (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("recent")]
        public async Task<ActionResult<PaginatedServiceResponse<List<AuditLog>>>> GetRecentAuditLogs(
            [FromQuery] int count = 50)
        {
            if (count <= 0 || count > 500)
            {
                return BadRequest(new PaginatedServiceResponse<List<AuditLog>>
                {
                    Status = 400,
                    Message = "Count must be between 1 and 500."
                });
            }

            var response = await _auditLogService.GetAuditLogsAsync(
                1, count);

            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Get failed/error audit logs (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("errors")]
        public async Task<ActionResult<PaginatedServiceResponse<List<AuditLog>>>> GetErrorAuditLogs(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var response = await _auditLogService.GetAuditLogsAsync(
                pageNumber, pageSize,
                action: "Error",
                fromDate: fromDate,
                toDate: toDate);

            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Clear old audit logs (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.SuperAdmin)]
        [HttpDelete("clear-old")]
        public async Task<ActionResult<ServiceResponse<bool>>> ClearOldAuditLogs(
            [FromQuery] int daysToKeep = 90)
        {
            if (daysToKeep < 1)
            {
                return BadRequest(new ServiceResponse<bool>
                {
                    StatusCode = 400,
                    Message = "Days to keep must be at least 1.",
                    Data = false
                });
            }

            var response = await _auditLogService.ClearOldLogsAsync(daysToKeep);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Export audit logs (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("export")]
        public async Task<IActionResult> ExportAuditLogs(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string format = "json")
        {
            try
            {
                // Get all logs for the date range (without pagination)
                var query = _auditLogService.GetAuditLogsAsync(
                    1, int.MaxValue, null, null, fromDate, toDate);

                var response = await query;

                if (response.Data == null)
                {
                    return StatusCode(response.Status, response);
                }

                if (format.ToLower() == "csv")
                {
                    var csv = GenerateCsv(response.Data);
                    var bytes = System.Text.Encoding.UTF8.GetBytes(csv);

                    return File(bytes, "text/csv", $"audit-logs-{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
                }
                else
                {
                    // Default to JSON
                    var json = System.Text.Json.JsonSerializer.Serialize(response.Data,
                        new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                    var bytes = System.Text.Encoding.UTF8.GetBytes(json);

                    return File(bytes, "application/json", $"audit-logs-{DateTime.UtcNow:yyyyMMddHHmmss}.json");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResponse<bool>
                {
                    StatusCode = 500,
                    Message = "Error exporting audit logs",
                    Data = false
                });
            }
        }

        /// <summary>
        /// Get user activity summary (Admin only)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("user-activity/{userId}")]
        public async Task<ActionResult<ServiceResponse<UserActivitySummary>>> GetUserActivitySummary(
            string userId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var logsResponse = await _auditLogService.GetAuditLogsAsync(
                    1, int.MaxValue, userId: userId, fromDate: fromDate, toDate: toDate);

                if (logsResponse.Data == null)
                {
                    return StatusCode(logsResponse.Status, logsResponse);
                }

                var logs = logsResponse.Data;
                var summary = new UserActivitySummary
                {
                    UserId = userId,
                    TotalActivities = logs.Count,
                    FirstActivity = logs.Min(l => l.RequestTime),
                    LastActivity = logs.Max(l => l.RequestTime),
                    SuccessCount = logs.Count(l => l.Status == "Success"),
                    FailedCount = logs.Count(l => l.Status == "Failed"),
                    ErrorCount = logs.Count(l => l.Status == "Error"),
                    TopActions = logs.GroupBy(l => l.Action)
                        .Select(g => new ActionSummary
                        {
                            Action = g.Key,
                            Count = g.Count(),
                            LastPerformed = g.Max(l => l.RequestTime)
                        })
                        .OrderByDescending(a => a.Count)
                        .Take(10)
                        .ToList(),
                    TopEndpoints = logs.GroupBy(l => l.Endpoint)
                        .Select(g => new EndpointSummary
                        {
                            Endpoint = g.Key,
                            Count = g.Count(),
                            AverageDurationMs = g.Where(l => l.DurationMs > 0)
                                .Average(l => l.DurationMs)
                        })
                        .OrderByDescending(e => e.Count)
                        .Take(10)
                        .ToList()
                };

                return Ok(new ServiceResponse<UserActivitySummary>
                {
                    StatusCode = 200,
                    Message = "User activity summary retrieved successfully",
                    Data = summary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ServiceResponse<UserActivitySummary>
                {
                    StatusCode = 500,
                    Message = "Error retrieving user activity summary",
                    
                });
            }
        }

        #region Helper Methods

        private string GenerateCsv(List<AuditLog> logs)
        {
            var csv = new System.Text.StringBuilder();

            // Header
            csv.AppendLine("Id,Action,Endpoint,HttpMethod,StatusCode,Status,IpAddress,UserAgent,UserId,UserEmail,EntityName,EntityId,RequestTime,ResponseTime,DurationMs,ErrorMessage");

            // Data rows
            foreach (var log in logs)
            {
                csv.AppendLine($"\"{log.Id}\"," +
                              $"\"{EscapeCsv(log.Action)}\"," +
                              $"\"{EscapeCsv(log.Endpoint)}\"," +
                              $"\"{EscapeCsv(log.HttpMethod)}\"," +
                              $"{log.StatusCode}," +
                              $"\"{EscapeCsv(log.Status)}\"," +
                              $"\"{EscapeCsv(log.IpAddress)}\"," +
                              $"\"{EscapeCsv(log.UserAgent)}\"," +
                              $"\"{EscapeCsv(log.UserId)}\"," +
                              $"\"{EscapeCsv(log.UserEmail)}\"," +
                              $"\"{EscapeCsv(log.EntityName)}\"," +
                              $"\"{EscapeCsv(log.EntityId)}\"," +
                              $"\"{log.RequestTime:yyyy-MM-dd HH:mm:ss}\"," +
                              $"\"{log.ResponseTime:yyyy-MM-dd HH:mm:ss}\"," +
                              $"{log.DurationMs}," +
                              $"\"{EscapeCsv(log.ErrorMessage)}\"");
            }

            return csv.ToString();
        }

        private string EscapeCsv(string value)
        {
            if (string.IsNullOrEmpty(value))
                return string.Empty;

            // Escape quotes by doubling them
            return value.Replace("\"", "\"\"");
        }

        #endregion
    }
}