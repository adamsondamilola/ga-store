using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace GaStore.Data.Models.GigLogistics
{
    // Models/GigLogistics/StationResponse.cs
    public class StationResponse
    {
        public List<Station> Object { get; set; }
        [JsonPropertyName("magayaErrorMessage")]
        public int MagayaErrorMessage { get; set; }

        [JsonPropertyName("more_reults")]
        public int MoreResults { get; set; }

        [JsonPropertyName("total")]
        public double Total { get; set; }

        [JsonPropertyName("validationErrors")]
        public Dictionary<string, object> ValidationErrors { get; set; } = new Dictionary<string, object>();

        [JsonPropertyName("averageRatings")]
        public double AverageRatings { get; set; }

        [JsonPropertyName("isVerified")]
        public bool IsVerified { get; set; }

        [JsonPropertyName("isEligible")]
        public bool IsEligible { get; set; }
    }

    public class ServiceCentreResponse
    {
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("apiId")]
        public string ApiId { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public int Status { get; set; }

        [JsonPropertyName("data")]
        public List<ServiceCentre> ServiceCentres { get; set; } = new List<ServiceCentre>();
    }

    public class ServiceCentre
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("StationId")]
        public int StationId { get; set; }

        [JsonPropertyName("StationName")]
        public string StationName { get; set; } = string.Empty;

        [JsonPropertyName("StationCode")]
        public string StationCode { get; set; } = string.Empty;

        [JsonPropertyName("StateId")]
        public int StateId { get; set; }

        [JsonPropertyName("SuperServiceCentreId")]
        public int SuperServiceCentreId { get; set; }

        [JsonPropertyName("IsPublic")]
        public bool IsPublic { get; set; }

        [JsonPropertyName("StateName")]
        public string StateName { get; set; } = string.Empty;

        [JsonPropertyName("CountryName")]
        public string CountryName { get; set; } = string.Empty;

        [JsonPropertyName("CountryId")]
        public int CountryId { get; set; }

        [JsonPropertyName("CountryCode")]
        public string CountryCode { get; set; } = string.Empty;

        [JsonPropertyName("CurrencyCode")]
        public string CurrencyCode { get; set; } = string.Empty;

        [JsonPropertyName("CurrencySymbol")]
        public string CurrencySymbol { get; set; } = string.Empty;
    }

    public class Station
    {
        public int StationId { get; set; }
        public string StationName { get; set; }
        public string StationCode { get; set; }
        public string StateName { get; set; }
        public int StateId { get; set; }
        public string Country { get; set; }
        public CountryDTO CountryDTO { get; set; }
        public int SuperServiceCentreId { get; set; }
        public decimal StationPickupPrice { get; set; }
        public bool GigGoActive { get; set; }
        public bool IsPublic { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public bool IsDeleted { get; set; }
        public string RowVersion { get; set; }
    }

    public class ServiceCentreByStationResponse
    {
        [JsonProperty("message")]
        public string Message { get; set; }

        [JsonProperty("apiId")]
        public string ApiId { get; set; }

        [JsonProperty("status")]
        public int Status { get; set; }

        [JsonProperty("data")]
        public List<ServiceCentreDetail> data { get; set; }
    }

    public class ServiceCentreDetail
    {
        [JsonProperty("StationId")]
        public int StationId { get; set; }

        [JsonProperty("ServiceCentreId")]
        public int ServiceCentreId { get; set; }

        [JsonProperty("ServiceCentreName")]
        public string ServiceCentreName { get; set; }

        [JsonProperty("ServiceCentreCode")]
        public string ServiceCentreCode { get; set; }

        [JsonProperty("Latitude")]
        public double Latitude { get; set; }

        [JsonProperty("Longitude")]
        public double Longitude { get; set; }

        // Convenience property
        [System.Text.Json.Serialization.JsonIgnore]
        public string DisplayName => $"{ServiceCentreName} ({ServiceCentreCode})";
    }

    public class CountryDTO
    {
        public int CountryId { get; set; }
        public string CountryName { get; set; }
        public string CountryCode { get; set; }
        public List<State> States { get; set; }
        public decimal CurrencyRatio { get; set; }
        public bool IsActive { get; set; }
        public bool IsInternationalShippingCountry { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public bool IsDeleted { get; set; }
        public string RowVersion { get; set; }
    }

    // Models/GigLogistics/State.cs
    public class State
    {
        public int StateId { get; set; }
        public string StateName { get; set; }
        // Add other state properties if needed
    }
}
