using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GaStore.Common;
using GaStore.Core.Services.Interfaces.GigLogistics;
using GaStore.Data.Models.GigLogistics;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("FixedPolicy")]
    public class GigDeliveryController : RootController
    {
        private readonly IGigDeliveryService _gigDeliveryService;

        public GigDeliveryController(IGigDeliveryService gigDeliveryService)
        {
            _gigDeliveryService = gigDeliveryService;
        }

        [HttpPost("authenticate")]
        [AllowAnonymous]
        public async Task<ActionResult<ServiceResponse<LoginResponse>>> Authenticate([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<LoginResponse>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _gigDeliveryService.AuthenticateAsync(request);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        //[Authorize(Roles = CustomRoles.User)]
        [HttpGet("stations")]
        public async Task<ActionResult<ServiceResponse<StationResponse>>> GetAllStations()
        {
            var response = await _gigDeliveryService.GetAllStationsAsync();

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        //[Authorize(Roles = CustomRoles.User)]
        [HttpGet("service-centres")]
        public async Task<ActionResult<ServiceResponse<ServiceCentreResponse>>> GetAllServiceCentres()
        {
            var response = await _gigDeliveryService.GetAllServiceCentresAsync();

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        //[Authorize(Roles = CustomRoles.User)]
        [HttpGet("track-shipment/{trackingNumber}")]
        public async Task<ActionResult<ServiceResponse<ShipmentTrackingResponse>>> TrackShipment(string trackingNumber)
        {
            if (string.IsNullOrWhiteSpace(trackingNumber))
            {
                return BadRequest(new ServiceResponse<ShipmentTrackingResponse>
                {
                    StatusCode = 400,
                    Message = "Tracking number is required."
                });
            }

            var response = await _gigDeliveryService.TrackShipmentAsync(trackingNumber);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpGet("service-centres-by-station")]
        public async Task<ActionResult<ServiceResponse<ServiceCentreByStationResponse>>> GetServiceCentresByStation([FromQuery] int StationId)
        {
            var response = await _gigDeliveryService.GetServiceCentresByStationAsync(StationId);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize(Roles = CustomRoles.User)]
        [HttpGet("service-centres/{serviceCentreId}")]
        public async Task<ActionResult<ServiceResponse<ServiceCentre>>> GetServiceCentreById(int serviceCentreId)
        {
            var response = await _gigDeliveryService.GetAllServiceCentresAsync();

            if (response.StatusCode == 200 && response.Data != null)
            {
                var serviceCentre = response.Data.ServiceCentres
                    .FirstOrDefault(sc => sc.SuperServiceCentreId == serviceCentreId);

                if (serviceCentre != null)
                {
                    return Ok(new ServiceResponse<ServiceCentre>
                    {
                        StatusCode = 200,
                        Message = "Service centre retrieved successfully",
                        Data = serviceCentre
                    });
                }

                return NotFound(new ServiceResponse<ServiceCentre>
                {
                    StatusCode = 404,
                    Message = "Service centre not found."
                });
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("get-shipment-price")]
        [AllowAnonymous]
        public async Task<ActionResult<ServiceResponse<PreShipmentResponse>>> GetPreShipmentPrice([FromBody] PreShipmentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<PreShipmentResponse>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _gigDeliveryService.GetPreShipmentPriceAsync(request);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("create-shipment")]
        [AllowAnonymous]
        public async Task<ActionResult<ServiceResponse<ShipmentCaptureResponse>>> CreateShipment([FromBody] PreShipmentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<ShipmentCaptureResponse>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _gigDeliveryService.CreateShipmentAsync(request);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("dropoff-price")]
        [AllowAnonymous]
        public async Task<ActionResult<ServiceResponse<PriceResponse>>> GetDropOffPrice([FromBody] DropOffPriceRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<PriceResponse>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _gigDeliveryService.GetDropOffPriceAsync(request);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("doorstep-price")]
        [AllowAnonymous]
        public async Task<ActionResult<ServiceResponse<PriceResponse>>> GetDoorStepPrice([FromBody] DoorStepPriceRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ServiceResponse<PriceResponse>
                {
                    StatusCode = 400,
                    Message = "Invalid input data."
                });
            }

            var response = await _gigDeliveryService.GetDoorStepPriceAsync(request);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("calculate-dropoff-price")]
        [AllowAnonymous]
        public async Task<ActionResult<ServiceResponse<PriceResponse>>> CalculateDropOffPrice(
            [FromQuery] int senderStationId,
            [FromQuery] int receiverStationId,
            [FromBody] List<CartItem> cartItems)
        {
            if (cartItems == null || !cartItems.Any())
            {
                return BadRequest(new ServiceResponse<PriceResponse>
                {
                    StatusCode = 400,
                    Message = "Cart items are required."
                });
            }

            var response = await _gigDeliveryService.CalculateDropOffPrice(senderStationId, receiverStationId, cartItems);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("calculate-doorstep-price")]
        [AllowAnonymous]
        public async Task<ActionResult<ServiceResponse<PriceResponse>>> CalculateDoorStepPrice(
            [FromQuery] int senderStationId,
            [FromQuery] int receiverStationId,
            [FromQuery] double senderLatitude,
            [FromQuery] double senderLongitude,
            [FromQuery] double receiverLatitude,
            [FromQuery] double receiverLongitude,
            [FromBody] List<CartItem> cartItems,
            [FromQuery] string customerCode = null)
        {
            if (cartItems == null || !cartItems.Any())
            {
                return BadRequest(new ServiceResponse<PriceResponse>
                {
                    StatusCode = 400,
                    Message = "Cart items are required."
                });
            }

            var senderLocation = new LocationProperty { Latitude = senderLatitude, Longitude = senderLongitude };
            var receiverLocation = new LocationProperty { Latitude = receiverLatitude, Longitude = receiverLongitude };

            var response = await _gigDeliveryService.CalculateDoorStepPrice(
                senderStationId, receiverStationId, senderLocation, receiverLocation, cartItems, customerCode);

            if (response.StatusCode == 200)
            {
                return Ok(response);
            }

            return StatusCode(response.StatusCode, response);
        }
    }
}