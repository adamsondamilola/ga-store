using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;


namespace GaStore.Data.Models.GigLogistics
{

    public class PreShipmentRequest
    {
        [JsonPropertyName("PreShipmentMobileId")]
        public int? PreShipmentMobileId { get; set; }

        [JsonPropertyName("SenderName")]
        public string? SenderName { get; set; }

        [JsonPropertyName("SenderPhoneNumber")]
        public string? SenderPhoneNumber { get; set; }

        [JsonPropertyName("SenderStationId")]
        public int? SenderStationId { get; set; }

        [JsonPropertyName("InputtedSenderAddress")]
        public string? InputtedSenderAddress { get; set; }

        [JsonPropertyName("SenderLocality")]
        public string? SenderLocality { get; set; }

        [JsonPropertyName("ReceiverStationId")]
        public int? ReceiverStationId { get; set; }

        [JsonPropertyName("SenderAddress")]
        public string? SenderAddress { get; set; }

        [JsonPropertyName("ReceiverName")]
        public string? ReceiverName { get; set; }

        [JsonPropertyName("ReceiverPhoneNumber")]
        public string? ReceiverPhoneNumber { get; set; }

        [JsonPropertyName("ReceiverAddress")]
        public string? ReceiverAddress { get; set; }

        [JsonPropertyName("InputtedReceiverAddress")]
        public string? InputtedReceiverAddress { get; set; }

        [JsonPropertyName("SenderLocation")]
        public Location? SenderLocation { get; set; }

        [JsonPropertyName("ReceiverLocation")]
        public Location? ReceiverLocation { get; set; }

        [JsonPropertyName("PreShipmentItems")]
        public List<PreShipmentItem>? PreShipmentItems { get; set; }

        [JsonPropertyName("VehicleType")]
        public string? VehicleType { get; set; }

        [JsonPropertyName("IsBatchPickUp")]
        public bool? IsBatchPickUp { get; set; }

        [JsonPropertyName("WaybillImage")]
        public string? WaybillImage { get; set; }

        [JsonPropertyName("WaybillImageFormat")]
        public string? WaybillImageFormat { get; set; }

        [JsonPropertyName("DestinationServiceCenterId")]
        public int? DestinationServiceCenterId { get; set; }

        [JsonPropertyName("DestinationServiceCentreId")]
        public int? DestinationServiceCentreId { get; set; }

        [JsonPropertyName("IsCashOnDelivery")]
        public bool? IsCashOnDelivery { get; set; }

        [JsonPropertyName("CashOnDeliveryAmount")]
        public decimal? CashOnDeliveryAmount { get; set; }
    }

    public class Location
    {
        [JsonPropertyName("Latitude")]
        public string? Latitude { get; set; }

        [JsonPropertyName("Longitude")]
        public string? Longitude { get; set; }

        [JsonPropertyName("FormattedAddress")]
        public string? FormattedAddress { get; set; }

        [JsonPropertyName("Name")]
        public string? Name { get; set; }

        [JsonPropertyName("LGA")]
        public string? LGA { get; set; }
    }

    public class PreShipmentItem
    {
        [JsonPropertyName("PreShipmentItemMobileId")]
        public int? PreShipmentItemMobileId { get; set; }

        [JsonPropertyName("Description")]
        public string? Description { get; set; }

        [JsonPropertyName("Weight")]
        public int? Weight { get; set; }

        [JsonPropertyName("Weight2")]
        public int? Weight2 { get; set; }

        [JsonPropertyName("ItemType")]
        public string? ItemType { get; set; }

        [JsonPropertyName("ShipmentType")]
        public int? ShipmentType { get; set; }

        [JsonPropertyName("ItemName")]
        public string? ItemName { get; set; }

        [JsonPropertyName("EstimatedPrice")]
        public int? EstimatedPrice { get; set; }

        [JsonPropertyName("Value")]
        public string? Value { get; set; }

        [JsonPropertyName("ImageUrl")]
        public string? ImageUrl { get; set; }

        [JsonPropertyName("Quantity")]
        public int? Quantity { get; set; }

        [JsonPropertyName("SerialNumber")]
        public int? SerialNumber { get; set; }

        [JsonPropertyName("IsVolumetric")]
        public bool? IsVolumetric { get; set; }

        [JsonPropertyName("Length")]
        public decimal? Length { get; set; }

        [JsonPropertyName("Width")]
        public decimal? Width { get; set; }

        [JsonPropertyName("Height")]
        public decimal? Height { get; set; }

        [JsonPropertyName("PreShipmentMobileId")]
        public int? PreShipmentMobileId { get; set; }

        [JsonPropertyName("CalculatedPrice")]
        public decimal? CalculatedPrice { get; set; }

        [JsonPropertyName("SpecialPackageId")]
        public int? SpecialPackageId { get; set; }

        [JsonPropertyName("IsCancelled")]
        public bool? IsCancelled { get; set; }

        [JsonPropertyName("PictureName")]
        public string? PictureName { get; set; }

        [JsonPropertyName("PictureDate")]
        public DateTime? PictureDate { get; set; }

        [JsonPropertyName("WeightRange")]
        public string? WeightRange { get; set; }
    }
}
