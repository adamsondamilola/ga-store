using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GaStore.Common;
using GaStore.Core.Services.Interfaces.Google;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("FixedPolicy")]
    public class GoogleMapController : RootController
    {
        private readonly IGoogleMapService _googleMapService;

        public GoogleMapController(IGoogleMapService googleMapService)
        {
            _googleMapService = googleMapService;
        }

        [HttpGet("place")]
        [Authorize]
        public async Task<IActionResult> Search(string query, string? location = null, int radius = 1000)
        {
            var response = await _googleMapService.SearchPlacesAsync(query, location, radius);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("place/{placeId}")]
        [Authorize]
        public async Task<IActionResult> GetDetails(string placeId)
        {
            var response = await _googleMapService.GetPlaceDetailsAsync(placeId);
            return StatusCode(response.StatusCode, response);
        }
    }
}
