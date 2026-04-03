using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Entities.System;
using GaStore.Shared;
using static GaStore.Core.Services.Implementations.AuditLogService;

namespace GaStore.Core.Services.Interfaces
{
    public interface IAuditLogService
    {
        // API Logging
        Task<AuditLog> LogApiRequestAsync(HttpContext context, string requestBody = null);
        Task LogApiResponseAsync(AuditLog auditLog, string responseBody, int statusCode, long durationMs);
        Task LogApiErrorAsync(AuditLog auditLog, Exception exception, long durationMs);

        // Database Change Logging
        Task LogDatabaseChangeAsync(string entityName, string entityId, string action,
                                    Dictionary<string, object> oldValues = null,
                                    Dictionary<string, object> newValues = null,
                                    string userId = null, string userEmail = null);

        // Business Operation Logging
        Task<AuditLog> StartOperationAsync(string operation, string endpoint, object requestData = null);
        Task CompleteOperationAsync(AuditLog auditLog, object responseData = null, bool isSuccess = true);
        Task FailOperationAsync(AuditLog auditLog, Exception exception);

        // Query Methods
        Task<PaginatedServiceResponse<List<AuditLog>>> GetAuditLogsAsync(
            int page = 1,
            int pageSize = 50,
            string search = null,
            string action = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            string userId = null,
            string entityName = null);

        Task<ServiceResponse<AuditLog>> GetAuditLogByIdAsync(int id);
        Task<ServiceResponse<int>> GetAuditLogsCountAsync();
        Task<ServiceResponse<bool>> ClearOldLogsAsync(int daysToKeep = 90);

        // Statistics
        Task<AuditStatistics> GetAuditStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);

        // Helper methods
        string GetCurrentUserId();
        string GetCurrentUserEmail();
        string GetCurrentIpAddress();
    }

}
