using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Models.GigLogistics;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces.GigLogistics
{
    public interface IGigDeliveryService
    {
        Task<ServiceResponse<LoginResponse>> AuthenticateAsync(LoginRequest request);
        string GetToken();
        Task<ServiceResponse<StationResponse>> GetAllStationsAsync();
        Task<ServiceResponse<ServiceCentreResponse>> GetAllServiceCentresAsync();
        Task<ServiceResponse<ServiceCentreByStationResponse>> GetServiceCentresByStationAsync(int stationId);
        Task<ServiceResponse<ShipmentTrackingResponse>> TrackShipmentAsync(string trackingNumber);
        Task<ServiceResponse<PreShipmentResponse>> GetPreShipmentPriceAsync(PreShipmentRequest request);
        Task<ServiceResponse<ShipmentCaptureResponse>> CreateShipmentAsync(PreShipmentRequest request);
        Task<ServiceResponse<PriceResponse>> GetDropOffPriceAsync(DropOffPriceRequest request);
        Task<ServiceResponse<PriceResponse>> GetDoorStepPriceAsync(DoorStepPriceRequest request);
        Task<ServiceResponse<PriceResponse>> CalculateDropOffPrice(int senderStationId, int receiverStationId, List<CartItem> cartItems);
        Task<ServiceResponse<PriceResponse>> CalculateDoorStepPrice(
            int senderStationId,
            int receiverStationId,
            LocationProperty senderLocation,
            LocationProperty receiverLocation,
            List<CartItem> cartItems,
            string customerCode = null);
    }
}
