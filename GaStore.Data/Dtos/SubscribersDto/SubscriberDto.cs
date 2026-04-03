using System;
using System.ComponentModel.DataAnnotations;

namespace GaStore.Data.Dtos.SubscribersDto
{
    public class SubscriberDto
    {
        public Guid Id { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; }

        public bool IsActive { get; set; }

        public DateTime? DateCreated { get; set; }

        [MaxLength(100)]
        public string SubscriptionSource { get; set; }
    }
}

public class CreateSubscriberDto
{
    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; }

    [MaxLength(100)]
    public string SubscriptionSource { get; set; } = "website";
}

public class UpdateSubscriberDto
{
    public bool IsActive { get; set; }
}