using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace GaStore.Data.Models.GigLogistics
{
    public class ShipmentCaptureResponse
    {
        [JsonPropertyName("waybill")]
        public string? Waybill { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("isBalanceSufficient")]
        public bool? IsBalanceSufficient { get; set; }

        [JsonPropertyName("zone")]
        public int? Zone { get; set; }

        [JsonPropertyName("waybillImage")]
        public string? WaybillImage { get; set; }

        [JsonPropertyName("waybillImageFormat")]
        public string? WaybillImageFormat { get; set; }
    }
}
