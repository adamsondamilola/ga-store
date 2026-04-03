using System.ComponentModel.DataAnnotations;

namespace GaStore.Data.Dtos.ProductsDto
{
    public class TagDto
    {
        public Guid Id { get; set; }

        [Required, MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public int ProductCount { get; set; } // For display purposes
    }

    public class TaggedProductDto
    {
        public Guid Id { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        [Required]
        public Guid TagId { get; set; }

        public string? ProductName { get; set; } // For display purposes
        public string? TagName { get; set; } // For display purposes


    }
}