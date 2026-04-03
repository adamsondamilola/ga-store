using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Models.GigLogistics
{
    public class DropOffPriceRequest
    {
        [JsonProperty("SenderStationId")]
        public int SenderStationId { get; set; }

        [JsonProperty("ReceiverStationId")]
        public int ReceiverStationId { get; set; }

        [JsonProperty("DeliveryType")]
        public int DeliveryType { get; set; } = 1;

        [JsonProperty("PickUpOptions")]
        public int PickUpOptions { get; set; } = 0;

        [JsonProperty("ShipmentItems")]
        public List<ShipmentItemRequest> ShipmentItems { get; set; } = new();
    }

    public class DoorStepPriceRequest
    {
        [JsonProperty("SenderStationId")]
        public int SenderStationId { get; set; }

        [JsonProperty("ReceiverStationId")]
        public int ReceiverStationId { get; set; }

        [JsonProperty("VehicleType")]
        public int VehicleType { get; set; } = 1;

        [JsonProperty("ReceiverLocation")]
        public LocationProperty ReceiverLocation { get; set; }

        [JsonProperty("SenderLocation")]
        public LocationProperty SenderLocation { get; set; }

        [JsonProperty("IsFromAgility")]
        public bool IsFromAgility { get; set; } = false;

        [JsonProperty("CustomerCode")]
        public string CustomerCode { get; set; }

        [JsonProperty("CustomerType")]
        public int CustomerType { get; set; } = 0;

        [JsonProperty("DeliveryOptionIds")]
        public List<int> DeliveryOptionIds { get; set; } = new() { 2 };

        [JsonProperty("Value")]
        public decimal Value { get; set; }

        [JsonProperty("PickUpOptions")]
        public int PickUpOptions { get; set; } = 1;

        [JsonProperty("ShipmentItems")]
        public List<ShipmentItemRequest> ShipmentItems { get; set; } = new();
    }

    public class ShipmentItemRequest
    {
        [JsonProperty("ItemName")]
        public string ItemName { get; set; } = string.Empty;

        [JsonProperty("Description")]
        public string Description { get; set; } = string.Empty;

        [JsonProperty("SpecialPackageId")]
        public int SpecialPackageId { get; set; }

        [JsonProperty("Quantity")]
        public int Quantity { get; set; } = 1;

        [JsonProperty("Weight")]
        public double Weight { get; set; }

        [JsonProperty("IsVolumetric")]
        public bool IsVolumetric { get; set; } = false;

        [JsonProperty("Length")]
        public double Length { get; set; }

        [JsonProperty("Width")]
        public double Width { get; set; }

        [JsonProperty("Height")]
        public double Height { get; set; }

        [JsonProperty("ShipmentType")]
        public int ShipmentType { get; set; } // 0 = special, 1 = regular

        [JsonProperty("Value")]
        public decimal Value { get; set; }

        [JsonProperty("Nature")]
        public string Nature { get; set; } = string.Empty;
    }

    public class PriceResponse
    {
        [JsonProperty("message")]
        public string Message { get; set; }

        [JsonProperty("apiId")]
        public string ApiId { get; set; }

        [JsonProperty("status")]
        public int Status { get; set; }

        [JsonProperty("data")]
        public PriceData Data { get; set; }
    }

    public class PriceData
    {
        [JsonProperty("isWithinProcessingTime")]
        public bool? IsWithinProcessingTime { get; set; }

        [JsonProperty("MainCharge")]
        public decimal MainCharge { get; set; }

        [JsonProperty("DeliverPrice")]
        public decimal DeliverPrice { get; set; }

        [JsonProperty("PickupCharge")]
        public decimal PickupCharge { get; set; }

        [JsonProperty("InsuranceValue")]
        public decimal InsuranceValue { get; set; }

        [JsonProperty("GrandTotal")]
        public decimal GrandTotal { get; set; }

        [JsonProperty("DeclaredValue")]
        public decimal DeclaredValue { get; set; }

        [JsonProperty("Discount")]
        public decimal Discount { get; set; }

        [JsonProperty("ShipmentItems")]
        public List<ShipmentItemResponse> ShipmentItems { get; set; } = new();
    }

    public class ShipmentItemResponse
    {
        [JsonProperty("ItemName")]
        public string ItemName { get; set; }

        [JsonProperty("Description")]
        public string Description { get; set; }

        [JsonProperty("SpecialPackageId")]
        public int SpecialPackageId { get; set; }

        [JsonProperty("Quantity")]
        public int Quantity { get; set; }

        [JsonProperty("Weight")]
        public double Weight { get; set; }

        [JsonProperty("IsVolumetric")]
        public bool IsVolumetric { get; set; }

        [JsonProperty("Length")]
        public double Length { get; set; }

        [JsonProperty("Width")]
        public double Width { get; set; }

        [JsonProperty("Height")]
        public double Height { get; set; }

        [JsonProperty("ShipmentType")]
        public int ShipmentType { get; set; }

        [JsonProperty("Value")]
        public decimal Value { get; set; }

        [JsonProperty("Nature")]
        public string Nature { get; set; }

        [JsonProperty("CalculatedPrice")]
        public decimal CalculatedPrice { get; set; }
    }

    public class LocationProperty
    {
        [JsonProperty("Latitude")]
        public double Latitude { get; set; }

        [JsonProperty("Longitude")]
        public double Longitude { get; set; }
    }

    public class CartItem
    {
        public string? Id { get; set; }
        public string? ProductId { get; set; }
        public string? VariantId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Image { get; set; }
        public decimal Price { get; set; }
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public double Weight { get; set; }
        public List<PricingTier> PricingTiers { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class PricingTier
    {
        public int MinQuantity { get; set; }
        public int MaxQuantity { get; set; }
        public decimal PricePerUnit { get; set; }
    }
}
