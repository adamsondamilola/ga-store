using System.Diagnostics;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using GaStore.Data.Entities.System;
using GaStore.Models.Database;

namespace GaStore.Middleware
{
    public class AuditLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuditLoggingMiddleware> _logger;

        public AuditLoggingMiddleware(
            RequestDelegate next,
            ILogger<AuditLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, DatabaseContext dbContext)
        {
            // Skip logging for specific paths
            if (ShouldSkipLogging(context.Request.Path))
            {
                await _next(context);
                return;
            }

            var stopwatch = Stopwatch.StartNew();

            // Create audit log with initial data
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(), // Explicitly set Guid
                Action = context.Request.Method,
                EntityId = context.Request.Query["id"].ToString(),
                EntityName = context.Request.Query["name"].ToString(),
                Endpoint = context.Request.Path,
                HttpMethod = context.Request.Method,
                IpAddress = GetIpAddress(context),
                UserAgent = context.Request.Headers["User-Agent"].ToString(),
                UserId = GetUserId(context),
                UserEmail = GetUserEmail(context),
                RequestTime = DateTime.UtcNow
            };

            // Capture request body
            var requestBody = await CaptureRequestBody(context.Request);
            auditLog.Request = requestBody;

            try
            {
                // Capture original response stream
                var originalResponseBody = context.Response.Body;
                using var responseBodyStream = new MemoryStream();
                context.Response.Body = responseBodyStream;

                // Process request
                await _next(context);

                stopwatch.Stop();

                // Capture response
                var responseBody = await CaptureResponseBody(context.Response, responseBodyStream);
                await responseBodyStream.CopyToAsync(originalResponseBody);
                context.Response.Body = originalResponseBody;

                // Update audit log with response data
                auditLog.StatusCode = context.Response.StatusCode;
                auditLog.Status = context.Response.StatusCode >= 200 && context.Response.StatusCode < 300
                    ? "Success" : "Failed";
                auditLog.Response = responseBody;
                auditLog.DurationMs = stopwatch.ElapsedMilliseconds;
                auditLog.ResponseTime = DateTime.UtcNow;

                // Save to database using injected DbContext
                if(auditLog.UserId != null && auditLog.Action != "GET")
                {
                    await SaveAuditLogAsync(dbContext, auditLog);
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                // Update audit log with error data
                auditLog.StatusCode = context.Response.StatusCode;
                auditLog.Changes = "";
                auditLog.Status = "Error";
                auditLog.ErrorMessage = ex.Message;
                auditLog.ErrorDetails = ex.ToString();
                auditLog.DurationMs = stopwatch.ElapsedMilliseconds;
                auditLog.ResponseTime = DateTime.UtcNow;

                // Save error log
                await SaveAuditLogAsync(dbContext, auditLog);

                throw;
            }
        }

        private bool ShouldSkipLogging(PathString path)
        {
            var excludedPaths = new[]
            {
                "/swagger",
                "/favicon.ico",
                "/health",
                "/api/Auth/google-callback",
                "/api/Auth/google-response",
                "/api/Auth/google",
                "/api/AuditLog", // Also skip audit log endpoints to prevent infinite loops
                "/api/AuditLog/statistics",
                "/api/AuditLog/export",
                "/api/AuditLog/clear-old"
            };

            return excludedPaths.Any(p => path.StartsWithSegments(p));
        }

        private async Task<string> CaptureRequestBody(HttpRequest request)
        {
            try
            {
                if (request.ContentLength == 0 ||
                    !request.ContentType?.Contains("application/json") == true)
                    return null;

                request.EnableBuffering();

                var body = await new StreamReader(request.Body, Encoding.UTF8)
                    .ReadToEndAsync();

                request.Body.Position = 0;

                // Truncate if too long
                return body.Length > 5000 ? body.Substring(0, 5000) + "...[TRUNCATED]" : body;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private async Task<string> CaptureResponseBody(HttpResponse response, MemoryStream responseBodyStream)
        {
            try
            {
                responseBodyStream.Seek(0, SeekOrigin.Begin);
                var responseBody = await new StreamReader(responseBodyStream, Encoding.UTF8)
                    .ReadToEndAsync();

                responseBodyStream.Seek(0, SeekOrigin.Begin);

                // Truncate if too long
                return responseBody.Length > 5000 ? responseBody.Substring(0, 5000) + "...[TRUNCATED]" : responseBody;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private string GetIpAddress(HttpContext context)
        {
            try
            {
                return context.Connection.RemoteIpAddress?.ToString() ??
                       context.Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                       "Unknown";
            }
            catch
            {
                return "Unknown";
            }
        }

        private string GetUserId(HttpContext context)
        {
            try
            {
                var userIdClaim = context.User?.FindFirst("userId")?.Value ??
                                 context.User?.FindFirst("sub")?.Value ??
                                 context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                return userIdClaim;
            }
            catch
            {
                return null;
            }
        }

        private string GetUserEmail(HttpContext context)
        {
            try
            {
                return context.User?.FindFirst("email")?.Value ??
                       context.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            }
            catch
            {
                return null;
            }
        }

        private async Task SaveAuditLogAsync(DatabaseContext dbContext, AuditLog auditLog)
        {
            try
            {
                await dbContext.AuditLogs.AddAsync(auditLog);
                await dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log but don't throw to avoid breaking the request
                _logger.LogError(ex, "Failed to save audit log to database");
            }
        }
    }
}