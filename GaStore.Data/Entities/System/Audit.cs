using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Entities.System
{
    public class AuditLog : EntityBase
    {
        [Required]
        [MaxLength(50)]
        public string Action { get; set; }

        [Required]
        [MaxLength(255)]
        public string Endpoint { get; set; }

        [MaxLength(10)]
        public string HttpMethod { get; set; }

        public int? StatusCode { get; set; }

        [MaxLength(20)]
        public string? Status { get; set; }

        public string? Request { get; set; }

        public string? Response { get; set; }

        [MaxLength(100)]
        public string IpAddress { get; set; }

        [MaxLength(500)]
        public string UserAgent { get; set; }

        [MaxLength(100)]
        public string UserId { get; set; }

        [MaxLength(100)]
        public string UserEmail { get; set; }

        [MaxLength(100)]
        public string EntityName { get; set; }

        [MaxLength(100)]
        public string EntityId { get; set; }

        public string? Changes { get; set; }

        public DateTime RequestTime { get; set; }
        public DateTime? ResponseTime { get; set; }
        public long DurationMs { get; set; }

        [MaxLength(500)]
        public string? ErrorMessage { get; set; }

        public string? ErrorDetails { get; set; }

        public AuditLog()
        {
            Id = Guid.NewGuid();
            RequestTime = DateTime.UtcNow;
        }
    }
}
