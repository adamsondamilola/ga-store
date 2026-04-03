using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GaStore.Data.Entities.Products
{
	public class ProductSpecification : EntityBase
	{

		[Required]
		public Guid ProductId { get; set; } // Associated product ID
		[JsonIgnore]
		public virtual Product? Product { get; set; } // Navigation property to the product
		[MaxLength(255)]
		public string? Certification { get; set; } // Certification details (e.g., ISO certification)

		[MaxLength(255)]
		public string? MainMaterial { get; set; } // Primary material of the product

		[MaxLength(255)]
		public string? MaterialFamily { get; set; } // Family of the material (e.g., Wood, Plastic)

		[MaxLength(255)]
		public string? Model { get; set; } // Model identifier or number

		public string? Note { get; set; } // Additional notes or remarks about the product

		[MaxLength(255)]
		public string? ProductionCountry { get; set; } // Country where the product was manufactured

		[MaxLength(255)]
		public string? ProductLine { get; set; } // Product line or series name

		[MaxLength(50)]
		public string? Size { get; set; } // Size description (e.g., "Medium", "42 inches")

		[MaxLength(50)]
		public string? WarrantyDuration { get; set; } // Duration of warranty (e.g., "1 Year")

		[MaxLength(255)]
		public string? WarrantyType { get; set; } // Type of warranty (e.g., "Manufacturer's Warranty")

		[MaxLength(255)]
		public string? YouTubeId { get; set; } // YouTube video ID for the product demo or tutorial

        public string? Nafdac { get; set; } // Nafdac code
        public string? Fda { get; set; } // FDA code
        public bool? FdaApproved { get; set; } // FDA approval status (true or false)
        public string? Disclaimer { get; set; }
        public string? FromTheManufacturer { get; set; } // Message or details from the manufacturer

		public string? WhatIsInTheBox { get; set; } // Contents of the product package

		public string? ProductWarranty { get; set; } // Detailed warranty terms

		[MaxLength(255)]
		public string? WarrantyAddress { get; set; } // Address for warranty claims or service
	}
}
