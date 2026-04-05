using System.Text.Json.Serialization;

namespace GaStore.Data.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum ProductReviewStatus
    {
        Draft = 0,
        PendingReview = 1,
        Approved = 2,
        Rejected = 3
    }
}
