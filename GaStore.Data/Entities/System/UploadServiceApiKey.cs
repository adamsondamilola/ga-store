using System.ComponentModel.DataAnnotations;

namespace GaStore.Data.Entities.System
{
    public class UploadServiceApiKey : EntityBase
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string ApiKey { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}
