using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Newtonsoft.Json;
using GaStore.Data.Entities.System;

namespace GaStore.Interceptors
{
    public class AuditDbContextInterceptor : SaveChangesInterceptor
    {
        private readonly IServiceProvider _serviceProvider;

        public AuditDbContextInterceptor(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public override InterceptionResult<int> SavingChanges(
            DbContextEventData eventData,
            InterceptionResult<int> result)
        {
            TrackChanges(eventData.Context);
            return base.SavingChanges(eventData, result);
        }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            TrackChanges(eventData.Context);
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        private void TrackChanges(DbContext context)
        {
            if (context == null) return;

            var entries = context.ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added ||
                           e.State == EntityState.Modified ||
                           e.State == EntityState.Deleted)
                .ToList();

            if (!entries.Any()) return;

            // Get HTTP context to extract user info
            var httpContextAccessor = _serviceProvider.GetService<IHttpContextAccessor>();
            var currentUser = httpContextAccessor?.HttpContext?.User;

            foreach (var entry in entries)
            {
                // Skip audit logs to prevent infinite recursion
                if (entry.Entity is AuditLog) continue;

                var auditLog = new AuditLog
                {
                    Action = entry.State.ToString(),
                    EntityName = entry.Entity.GetType().Name,
                    EntityId = GetEntityId(entry).ToString(),
                    UserId = GetUserId(currentUser).ToString(),
                    UserEmail = GetUserEmail(currentUser),
                    RequestTime = DateTime.UtcNow,
                    Status = "Database Change"
                };

                // Track changes for modified entities
                if (entry.State == EntityState.Modified)
                {
                    var changes = new Dictionary<string, object>();

                    foreach (var property in entry.OriginalValues.Properties)
                    {
                        var originalValue = entry.OriginalValues[property];
                        var currentValue = entry.CurrentValues[property];

                        if (!Equals(originalValue, currentValue))
                        {
                            changes[property.Name] = new
                            {
                                Old = originalValue,
                                New = currentValue
                            };
                        }
                    }

                    if (changes.Any())
                    {
                        auditLog.Changes = JsonConvert.SerializeObject(changes, Formatting.Indented);
                    }
                }
                else if (entry.State == EntityState.Added)
                {
                    var newValues = new Dictionary<string, object>();

                    foreach (var property in entry.CurrentValues.Properties)
                    {
                        newValues[property.Name] = entry.CurrentValues[property];
                    }

                    auditLog.Changes = JsonConvert.SerializeObject(newValues, Formatting.Indented);
                }
                else if (entry.State == EntityState.Deleted)
                {
                    var oldValues = new Dictionary<string, object>();

                    foreach (var property in entry.OriginalValues.Properties)
                    {
                        oldValues[property.Name] = entry.OriginalValues[property];
                    }

                    auditLog.Changes = JsonConvert.SerializeObject(oldValues, Formatting.Indented);
                }

                // Add to context
                context.Set<AuditLog>().Add(auditLog);
            }
        }

        private int? GetEntityId(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
        {
            var idProperty = entry.Properties
                .FirstOrDefault(p => p.Metadata.Name.EndsWith("Id", StringComparison.OrdinalIgnoreCase));

            if (idProperty != null)
            {
                if (idProperty.CurrentValue is int intId)
                    return intId;

                if (int.TryParse(idProperty.CurrentValue?.ToString(), out int parsedId))
                    return parsedId;
            }

            return null;
        }

        private int? GetUserId(System.Security.Claims.ClaimsPrincipal user)
        {
            var userIdClaim = user?.FindFirst("userId")?.Value ??
                             user?.FindFirst("sub")?.Value;

            if (int.TryParse(userIdClaim, out int userId))
                return userId;

            return null;
        }

        private string GetUserEmail(System.Security.Claims.ClaimsPrincipal user)
        {
            return user?.FindFirst("email")?.Value ??
                   user?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        }
    }
}