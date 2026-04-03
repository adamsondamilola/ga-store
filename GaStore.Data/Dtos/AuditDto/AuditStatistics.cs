using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.AuditDto
{
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
}
