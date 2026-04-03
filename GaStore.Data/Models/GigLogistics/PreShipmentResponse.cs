using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;


namespace GaStore.Data.Models.GigLogistics
{
    public class PreShipmentResponse
    {
        [JsonPropertyName("object")]
        public ResponseObject? Object { get; set; }

        [JsonPropertyName("magayaErrorMessage")]
        public int? MagayaErrorMessage { get; set; }

        [JsonPropertyName("more_reults")]
        public int? MoreResults { get; set; }

        [JsonPropertyName("total")]
        public int? Total { get; set; }

        [JsonPropertyName("validationErrors")]
        public Dictionary<string, object>? ValidationErrors { get; set; }

        [JsonPropertyName("averageRatings")]
        public int? AverageRatings { get; set; }

        [JsonPropertyName("isVerified")]
        public bool? IsVerified { get; set; }

        [JsonPropertyName("isEligible")]
        public bool? IsEligible { get; set; }
    }

    public class ResponseObject
    {
        [JsonPropertyName("deliveryPrice")]
        public decimal? DeliveryPrice { get; set; }

        [JsonPropertyName("insuranceValue")]
        public decimal? InsuranceValue { get; set; }

        [JsonPropertyName("vat")]
        public decimal? Vat { get; set; }

        [JsonPropertyName("grandTotal")]
        public decimal? GrandTotal { get; set; }

        [JsonPropertyName("priorityGrandTotal")]
        public decimal? PriorityGrandTotal { get; set; }

        [JsonPropertyName("discount")]
        public decimal? Discount { get; set; }

        [JsonPropertyName("preshipmentMobile")]
        public PreShipmentMobile? PreShipmentMobile { get; set; }

        [JsonPropertyName("mainCharge")]
        public decimal? MainCharge { get; set; }

        [JsonPropertyName("pickUpCharge")]
        public decimal? PickUpCharge { get; set; }

        [JsonPropertyName("currencySymbol")]
        public string? CurrencySymbol { get; set; }

        [JsonPropertyName("currencyCode")]
        public string? CurrencyCode { get; set; }

        [JsonPropertyName("isWithinProcessingTime")]
        public bool? IsWithinProcessingTime { get; set; }
    }

    public class PreShipmentMobile
    {
        [JsonPropertyName("preShipmentMobileId")]
        public int? PreShipmentMobileId { get; set; }

        [JsonPropertyName("dateCreated")]
        public DateTime? DateCreated { get; set; }

        [JsonPropertyName("senderName")]
        public string? SenderName { get; set; }

        [JsonPropertyName("senderPhoneNumber")]
        public string? SenderPhoneNumber { get; set; }

        [JsonPropertyName("value")]
        public decimal? Value { get; set; }

        [JsonPropertyName("senderStationId")]
        public int? SenderStationId { get; set; }

        [JsonPropertyName("inputtedSenderAddress")]
        public string? InputtedSenderAddress { get; set; }

        [JsonPropertyName("senderLocality")]
        public string? SenderLocality { get; set; }

        [JsonPropertyName("receiverStationId")]
        public int? ReceiverStationId { get; set; }

        [JsonPropertyName("customerCode")]
        public string? CustomerCode { get; set; }

        [JsonPropertyName("senderAddress")]
        public string? SenderAddress { get; set; }

        [JsonPropertyName("receiverName")]
        public string? ReceiverName { get; set; }

        [JsonPropertyName("receiverPhoneNumber")]
        public string? ReceiverPhoneNumber { get; set; }

        [JsonPropertyName("receiverAddress")]
        public string? ReceiverAddress { get; set; }

        [JsonPropertyName("internationalShippingCost")]
        public decimal? InternationalShippingCost { get; set; }

        [JsonPropertyName("companyMap")]
        public int? CompanyMap { get; set; }

        [JsonPropertyName("isInternationalShipment")]
        public bool? IsInternationalShipment { get; set; }

        [JsonPropertyName("isPriority")]
        public bool? IsPriority { get; set; }

        [JsonPropertyName("declarationOfValueCheck")]
        public int? DeclarationOfValueCheck { get; set; }

        [JsonPropertyName("departureCountryId")]
        public int? DepartureCountryId { get; set; }

        [JsonPropertyName("destinationCountryId")]
        public int? DestinationCountryId { get; set; }

        [JsonPropertyName("inputtedReceiverAddress")]
        public string? InputtedReceiverAddress { get; set; }

        [JsonPropertyName("senderLocation")]
        public ResponseLocation? SenderLocation { get; set; }

        [JsonPropertyName("receiverLocation")]
        public ResponseLocation? ReceiverLocation { get; set; }

        [JsonPropertyName("isHomeDelivery")]
        public bool? IsHomeDelivery { get; set; }

        [JsonPropertyName("preShipmentItems")]
        public List<ResponsePreShipmentItem>? PreShipmentItems { get; set; }

        [JsonPropertyName("grandTotal")]
        public decimal? GrandTotal { get; set; }

        [JsonPropertyName("isCashOnDelivery")]
        public bool? IsCashOnDelivery { get; set; }

        [JsonPropertyName("cashOnDeliveryAmount")]
        public decimal? CashOnDeliveryAmount { get; set; }

        [JsonPropertyName("userId")]
        public string? UserId { get; set; }

        [JsonPropertyName("isdeclaredVal")]
        public bool? IsDeclaredVal { get; set; }

        [JsonPropertyName("discountValue")]
        public decimal? DiscountValue { get; set; }

        [JsonPropertyName("deliveryPrice")]
        public decimal? DeliveryPrice { get; set; }

        [JsonPropertyName("isCancelled")]
        public bool? IsCancelled { get; set; }

        [JsonPropertyName("isConfirmed")]
        public bool? IsConfirmed { get; set; }

        [JsonPropertyName("calculatedTotal")]
        public decimal? CalculatedTotal { get; set; }

        [JsonPropertyName("isDelivered")]
        public bool? IsDelivered { get; set; }

        [JsonPropertyName("trackingId")]
        public int? TrackingId { get; set; }

        [JsonPropertyName("vehicleType")]
        public string? VehicleType { get; set; }

        [JsonPropertyName("zoneMapping")]
        public int? ZoneMapping { get; set; }

        [JsonPropertyName("isRated")]
        public bool? IsRated { get; set; }

        [JsonPropertyName("countryId")]
        public int? CountryId { get; set; }

        [JsonPropertyName("shipmentype")]
        public int? ShipmentType { get; set; }

        [JsonPropertyName("serviceCentreLocation")]
        public ServiceCentreLocation? ServiceCentreLocation { get; set; }

        [JsonPropertyName("departureServiceCentreId")]
        public int? DepartureServiceCentreId { get; set; }

        [JsonPropertyName("customerId")]
        public int? CustomerId { get; set; }

        [JsonPropertyName("isCodNeeded")]
        public bool? IsCodNeeded { get; set; }

        [JsonPropertyName("currentWalletAmount")]
        public decimal? CurrentWalletAmount { get; set; }

        [JsonPropertyName("shipmentPickupPrice")]
        public decimal? ShipmentPickupPrice { get; set; }

        [JsonPropertyName("partnerDTO")]
        public PartnerDto? PartnerDto { get; set; }

        [JsonPropertyName("isScheduled")]
        public bool? IsScheduled { get; set; }

        [JsonPropertyName("destinationServiceCenterId")]
        public int? DestinationServiceCenterId { get; set; }

        [JsonPropertyName("isBatchPickUp")]
        public bool? IsBatchPickUp { get; set; }

        [JsonPropertyName("isFromAgility")]
        public bool? IsFromAgility { get; set; }

        [JsonPropertyName("pickupOptions")]
        public int? PickupOptions { get; set; }

        [JsonPropertyName("destinationServiceCentreId")]
        public int? DestinationServiceCentreId { get; set; }

        [JsonPropertyName("isCoupon")]
        public bool? IsCoupon { get; set; }

        [JsonPropertyName("deliveryType")]
        public int? DeliveryType { get; set; }

        [JsonPropertyName("paymentType")]
        public int? PaymentType { get; set; }

        [JsonPropertyName("isAlpha")]
        public bool? IsAlpha { get; set; }

        [JsonPropertyName("customerSelected")]
        public bool? CustomerSelected { get; set; }

        [JsonPropertyName("dateModified")]
        public DateTime? DateModified { get; set; }

        [JsonPropertyName("isDeleted")]
        public bool? IsDeleted { get; set; }

        [JsonPropertyName("rowVersion")]
        public string? RowVersion { get; set; }
    }

    public class ResponseLocation
    {
        [JsonPropertyName("locationId")]
        public int? LocationId { get; set; }

        [JsonPropertyName("latitude")]
        public decimal? Latitude { get; set; }

        [JsonPropertyName("longitude")]
        public decimal? Longitude { get; set; }

        [JsonPropertyName("originLatitude")]
        public decimal? OriginLatitude { get; set; }

        [JsonPropertyName("originLongitude")]
        public decimal? OriginLongitude { get; set; }

        [JsonPropertyName("destinationLatitude")]
        public decimal? DestinationLatitude { get; set; }

        [JsonPropertyName("destinationLongitude")]
        public decimal? DestinationLongitude { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("formattedAddress")]
        public string? FormattedAddress { get; set; }

        [JsonPropertyName("lga")]
        public string? Lga { get; set; }

        [JsonPropertyName("dateCreated")]
        public DateTime? DateCreated { get; set; }

        [JsonPropertyName("dateModified")]
        public DateTime? DateModified { get; set; }

        [JsonPropertyName("isDeleted")]
        public bool? IsDeleted { get; set; }

        [JsonPropertyName("rowVersion")]
        public string? RowVersion { get; set; }
    }

    public class ResponsePreShipmentItem
    {
        [JsonPropertyName("preShipmentItemMobileId")]
        public int? PreShipmentItemMobileId { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("weight")]
        public int? Weight { get; set; }

        [JsonPropertyName("weight2")]
        public int? Weight2 { get; set; }

        [JsonPropertyName("itemType")]
        public string? ItemType { get; set; }

        [JsonPropertyName("shipmentType")]
        public int? ShipmentType { get; set; }

        [JsonPropertyName("itemName")]
        public string? ItemName { get; set; }

        [JsonPropertyName("estimatedPrice")]
        public decimal? EstimatedPrice { get; set; }

        [JsonPropertyName("value")]
        public string? Value { get; set; }

        [JsonPropertyName("imageUrl")]
        public string? ImageUrl { get; set; }

        [JsonPropertyName("quantity")]
        public int? Quantity { get; set; }

        [JsonPropertyName("serialNumber")]
        public int? SerialNumber { get; set; }

        [JsonPropertyName("isVolumetric")]
        public bool? IsVolumetric { get; set; }

        [JsonPropertyName("preShipmentMobileId")]
        public int? PreShipmentMobileId { get; set; }

        [JsonPropertyName("calculatedPrice")]
        public decimal? CalculatedPrice { get; set; }

        [JsonPropertyName("isCancelled")]
        public bool? IsCancelled { get; set; }

        [JsonPropertyName("pictureName")]
        public string? PictureName { get; set; }

        [JsonPropertyName("weightRange")]
        public string? WeightRange { get; set; }

        [JsonPropertyName("dateModified")]
        public DateTime? DateModified { get; set; }

        [JsonPropertyName("dateCreated")]
        public DateTime? DateCreated { get; set; }

        [JsonPropertyName("isDeleted")]
        public bool? IsDeleted { get; set; }

        [JsonPropertyName("rowVersion")]
        public string? RowVersion { get; set; }
    }

    public class ServiceCentreLocation
    {
        [JsonPropertyName("locationId")]
        public int? LocationId { get; set; }

        [JsonPropertyName("originLatitude")]
        public decimal? OriginLatitude { get; set; }

        [JsonPropertyName("originLongitude")]
        public decimal? OriginLongitude { get; set; }

        [JsonPropertyName("destinationLatitude")]
        public decimal? DestinationLatitude { get; set; }

        [JsonPropertyName("destinationLongitude")]
        public decimal? DestinationLongitude { get; set; }

        [JsonPropertyName("dateCreated")]
        public DateTime? DateCreated { get; set; }

        [JsonPropertyName("dateModified")]
        public DateTime? DateModified { get; set; }

        [JsonPropertyName("isDeleted")]
        public bool? IsDeleted { get; set; }

        [JsonPropertyName("rowVersion")]
        public string? RowVersion { get; set; }
    }

    public class PartnerDto
    {
        [JsonPropertyName("partnerId")]
        public int? PartnerId { get; set; }

        [JsonPropertyName("partnerType")]
        public int? PartnerType { get; set; }

        [JsonPropertyName("partnerApplicationId")]
        public int? PartnerApplicationId { get; set; }

        [JsonPropertyName("walletId")]
        public int? WalletId { get; set; }

        [JsonPropertyName("isActivated")]
        public bool? IsActivated { get; set; }

        [JsonPropertyName("userActiveCountryId")]
        public int? UserActiveCountryId { get; set; }

        [JsonPropertyName("walletBalance")]
        public decimal? WalletBalance { get; set; }

        [JsonPropertyName("activityStatus")]
        public int? ActivityStatus { get; set; }

        [JsonPropertyName("activityDate")]
        public DateTime? ActivityDate { get; set; }

        [JsonPropertyName("dateCreated")]
        public DateTime? DateCreated { get; set; }

        [JsonPropertyName("dateModified")]
        public DateTime? DateModified { get; set; }

        [JsonPropertyName("isDeleted")]
        public bool? IsDeleted { get; set; }

        [JsonPropertyName("rowVersion")]
        public string? RowVersion { get; set; }
    }
}
