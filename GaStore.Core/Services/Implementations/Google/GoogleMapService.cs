using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces.Google;
using GaStore.Data.Dtos.Google;
using GaStore.Data.Models;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations.Google
{
    public class GoogleMapService : IGoogleMapService
    {
        private readonly HttpClient _httpClient;
        private readonly AppSettings _appSettings;

        public GoogleMapService(HttpClient httpClient, IOptions<AppSettings> appSettings)
        {
            _httpClient = httpClient;
            _appSettings = appSettings.Value;
        }

        public async Task<ServiceResponse<IEnumerable<GooglePlaceDto>>> SearchPlacesAsync(string query, string location = null, int radius = 1000)
        {
            try
            {
                //&region=ng For Nigeria location only
                var url = $"{_appSettings.Google.GoogleMapApiUrl}/place/textsearch/json?query={Uri.EscapeDataString(query)}&region=ng&key={_appSettings.Google.GoogleMapApiKey}";

                if (!string.IsNullOrEmpty(location))
                    url += $"&location={location}&radius={radius}";

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                using var stream = await response.Content.ReadAsStreamAsync();
                using var doc = await JsonDocument.ParseAsync(stream);

                if (doc.RootElement.TryGetProperty("status", out var status) && status.GetString() != "OK")
                {
                    return ServiceResponse<IEnumerable<GooglePlaceDto>>.Fail($"Google API error: {status.GetString()}", 400);
                }

                var results = new List<GooglePlaceDto>();
                foreach (var place in doc.RootElement.GetProperty("results").EnumerateArray())
                {
                    results.Add(new GooglePlaceDto
                    {
                        Name = place.GetProperty("name").GetString(),
                        Address = place.GetProperty("formatted_address").GetString(),
                        Latitude = place.GetProperty("geometry").GetProperty("location").GetProperty("lat").GetDouble(),
                        Longitude = place.GetProperty("geometry").GetProperty("location").GetProperty("lng").GetDouble(),
                        PlaceId = place.GetProperty("place_id").GetString()
                    });
                }

                return ServiceResponse<IEnumerable<GooglePlaceDto>>.Success(results, "Places retrieved successfully");
            }
            catch (Exception ex)
            {
                return ServiceResponse<IEnumerable<GooglePlaceDto>>.Fail(ex.Message, 500);
            }
        }

        public async Task<ServiceResponse<GooglePlaceDto>> GetPlaceDetailsAsync(string placeId)
        {
            try
            {
                var url = $"{_appSettings.Google.GoogleMapApiUrl}/place/details/json?place_id={placeId}&key={_appSettings.Google.GoogleMapApiKey}";

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                using var stream = await response.Content.ReadAsStreamAsync();
                using var doc = await JsonDocument.ParseAsync(stream);

                if (doc.RootElement.TryGetProperty("status", out var status) && status.GetString() != "OK")
                {
                    return ServiceResponse<GooglePlaceDto>.Fail($"Google API error: {status.GetString()}", 400);
                }

                var result = doc.RootElement.GetProperty("result");

                var place = new GooglePlaceDto
                {
                    Name = result.GetProperty("name").GetString(),
                    Address = result.GetProperty("formatted_address").GetString(),
                    Latitude = result.GetProperty("geometry").GetProperty("location").GetProperty("lat").GetDouble(),
                    Longitude = result.GetProperty("geometry").GetProperty("location").GetProperty("lng").GetDouble(),
                    PlaceId = result.GetProperty("place_id").GetString()
                };

                return ServiceResponse<GooglePlaceDto>.Success(place, "Place details retrieved successfully");
            }
            catch (Exception ex)
            {
                return ServiceResponse<GooglePlaceDto>.Fail(ex.Message, 500);
            }
        }


    }
}
