using System.ComponentModel.DataAnnotations;

namespace GaStore.Data.Entities.Products
{
    public class LimitedOfferProduct : EntityBase
    {
        [Required]
        public Guid LimitedOfferId { get; set; }

        public virtual LimitedOffer LimitedOffer { get; set; } = null!;

        [Required]
        public Guid ProductId { get; set; }

        public virtual Product Product { get; set; } = null!;

        public int DisplayOrder { get; set; }
    }
}
