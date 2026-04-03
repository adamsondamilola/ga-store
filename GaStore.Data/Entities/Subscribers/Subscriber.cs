using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GaStore.Data.Entities.Subscribers
{
    public class Subscriber : EntityBase
    {
        [Required]
        [MaxLength(100)]
        public string Email { get; set; }

        public bool IsActive { get; set; } = true;
        public string SubscriptionSource { get; set; }
    }
}