using System.Text.Json.Serialization;

namespace GaStore.Data.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum KycStatus
    {
        NotStarted = 0,
        Pending = 1,
        Approved = 2,
        Rejected = 3
    }
}
