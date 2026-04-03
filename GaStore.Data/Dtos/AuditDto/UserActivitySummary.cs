using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.AuditDto
{
    public class UserActivitySummary
    {
        public string UserId { get; set; }
        public int TotalActivities { get; set; }
        public DateTime? FirstActivity { get; set; }
        public DateTime? LastActivity { get; set; }
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public int ErrorCount { get; set; }
        public List<ActionSummary> TopActions { get; set; } = new();
        public List<EndpointSummary> TopEndpoints { get; set; } = new();
    }

    public class ActionSummary
    {
        public string Action { get; set; }
        public int Count { get; set; }
        public DateTime? LastPerformed { get; set; }
    }

    public class EndpointSummary
    {
        public string Endpoint { get; set; }
        public int Count { get; set; }
        public double AverageDurationMs { get; set; }
    }
}
