using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces.GigLogistics;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Models;
using GaStore.Data.Models.GigLogistics;
using GaStore.Shared;

namespace GaStore.Core.Services.Implementations.GigLogistics
{
    
    // Services/DeliveryService.cs
    public class GigDeliveryService : IGigDeliveryService
    {
        private readonly AppSettings _appSettings;
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private const string TokenCacheKey = "DeliveryServiceToken";
        private const string StationsCacheKey = "GigStations";
        private const int CacheExpirationMinutes = 60;

        public GigDeliveryService(HttpClient httpClient, IMemoryCache cache, IOptions<AppSettings> appSettings)
        {
            _httpClient = httpClient;
            _cache = cache;
            _appSettings = appSettings.Value;

            // Configure base address from appsettings
            var baseUrl = _appSettings.LogisticsConfig.GigEndpoint;
            if (string.IsNullOrEmpty(baseUrl))
            {
                throw new ArgumentNullException("ThirdPartyApi:BaseUrl is not configured");
            }
            _httpClient.BaseAddress = new Uri(baseUrl);
        }


        public async Task<ServiceResponse<LoginResponse>> AuthenticateAsync(LoginRequest request)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("login", request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return ServiceResponse<LoginResponse>.Fail(
                        $"Third-party API returned error: {response.StatusCode} - {errorContent}",
                        (int)response.StatusCode);
                }

                var responseContent = await response.Content.ReadAsStringAsync();

                // Parse JSON manually to extract access token
                using var document = JsonDocument.Parse(responseContent);
                var root = document.RootElement;

                var status = root.GetProperty("status").GetInt32();
                if (status != 200)
                {
                    return ServiceResponse<LoginResponse>.Fail("Login failed");
                }

                // Extract access token from data object
                var dataElement = root.GetProperty("data");
                var accessToken = dataElement.GetProperty("access-token").GetString();

                if (string.IsNullOrEmpty(accessToken))
                {
                    return ServiceResponse<LoginResponse>.Fail("Access token not found in response");
                }

                // Save token to memory cache
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(30));

                _cache.Set(TokenCacheKey, accessToken, cacheOptions);

                // You can still return a LoginResponse if needed, or create a simplified response
                var result = new LoginResponse
                {
                    Status = status,
                    Message = root.GetProperty("message").GetString(),
                    ApiId = root.GetProperty("apiId").GetString(),
                    Data = new LoginData { AccessToken = accessToken }
                };

                return ServiceResponse<LoginResponse>.Success(result, "Login successful");
            }
            catch (HttpRequestException ex)
            {
                return ServiceResponse<LoginResponse>.Fail(
                    $"Error communicating with third-party API: {ex.Message}",
                    502);
            }
            catch (Exception ex)
            {
                return ServiceResponse<LoginResponse>.Fail(
                    $"An unexpected error occurred: {ex.Message}",
                    500);
            }
        }

        private HttpRequestMessage CreateAuthorizedRequest(HttpMethod method, string uri)
        {
            var request = new HttpRequestMessage(method, uri);
            var token = GetToken();

            if (!string.IsNullOrEmpty(token))
            {
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                request.Headers.Add("access-token", token);
            }

            return request;
        }

        public string GetToken()
        {
            return _cache.Get<string>(TokenCacheKey);
            //return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIwMDAyZTI1OS05YzM2LTRhMjUtYjc0OC1mZmEwOTQ3OTMxM2IiLCJBY3Rpdml0eSI6IkNyZWF0ZS5UaGlyZFBhcnR5LERlbGV0ZS5UaGlyZFBhcnR5LFVwZGF0ZS5UaGlyZFBhcnR5LFZpZXcuVGhpcmRQYXJ0eSxQdWJsaWM6UHVibGljIiwiVXNlckNoYW5uZWxDb2RlIjoiRUNPMDE3MTIxIiwiVXNlclJvbGVzIjpbIlRoaXJkUGFydHkiXSwiRmlyc3ROYW1lIjoiMjIwOSIsIkxhc3ROYW1lIjoiTHV4dXJ5U2hvcCIsImlhdCI6MTc2MTM3OTEzNywiZXhwIjoxNzYzMTA3MTM3fQ.aDei8ll_rJ9KFDn2MiX1MJK9xt2MbCU0-tZ_ya4DeTc";
        }

        private void AddAuthorizationHeader()
        {
            var token = GetToken();
            if (!string.IsNullOrEmpty(token))
            {
                // Remove existing Authorization headers if present
                if (_httpClient.DefaultRequestHeaders.Contains("Authorization"))
                {
                    _httpClient.DefaultRequestHeaders.Remove("Authorization");
                }

                // Remove existing access-token headers if present
                if (_httpClient.DefaultRequestHeaders.Contains("access-token"))
                {
                    _httpClient.DefaultRequestHeaders.Remove("access-token");
                }

                // Add both headers
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
                _httpClient.DefaultRequestHeaders.Add("access-token", token);
            }
        }



        public async Task<ServiceResponse<StationResponse>> GetAllStationsAsync()
        {
            try
            {
                AddAuthorizationHeader();
                // Check cache first
                if (_cache.TryGetValue(StationsCacheKey, out StationResponse cachedResponse))
                {
                    return ServiceResponse<StationResponse>.Success(cachedResponse, "Stations retrieved from cache");
                }

                // Make API call if not in cache
                var response = await _httpClient.GetAsync("localStations");
                if (response.StatusCode == HttpStatusCode.Unauthorized)
                {
                    _cache.Remove(TokenCacheKey);

                    //login
                    var loginDto = new LoginRequest()
                    {
                        Email = _appSettings.LogisticsConfig.GigUsername,
                        Password = _appSettings.LogisticsConfig.GigPassword
                    };
                    var loginResp = await AuthenticateAsync(loginDto);
                    if (loginResp == null || loginResp.StatusCode != 200) 
                    {
                        return ServiceResponse<StationResponse>.Fail("Unauthorized access. Please login again.", 401);
                    }
                    else
                    {
                        //update header
                        AddAuthorizationHeader();
                        response = await _httpClient.GetAsync("localStations");
                    }
                }
                if (!response.IsSuccessStatusCode)
                {
                    return await HandleFailedResponse<StationResponse>(response);
                }

                var result = await response.Content.ReadFromJsonAsync<StationResponse>();

                if (result?.Object == null)
                {
                    return ServiceResponse<StationResponse>.Fail("No stations found");
                }

                // Cache the response
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheExpirationMinutes));

                _cache.Set(StationsCacheKey, result, cacheOptions);

                return ServiceResponse<StationResponse>.Success(result, "Stations retrieved successfully");
            }
            catch (HttpRequestException ex)
            {
                return ServiceResponse<StationResponse>.Fail(
                    $"Service unavailable: {ex.Message}",
                    (int)HttpStatusCode.BadGateway);
            }
            catch (Exception ex)
            {
                return ServiceResponse<StationResponse>.Fail(
                    $"Error retrieving stations: {ex.Message}",
                    (int)HttpStatusCode.InternalServerError);
            }
        }

        public async Task<ServiceResponse<ServiceCentreResponse>> GetAllServiceCentresAsync()
        {
            try
            {
                AddAuthorizationHeader();
                // Check cache first
                if (_cache.TryGetValue(StationsCacheKey, out ServiceCentreResponse cachedResponse))
                {
                    return ServiceResponse<ServiceCentreResponse>.Success(cachedResponse, "Service centres retrieved from cache");
                }

                // Make API call if not in cache
                var response = await _httpClient.GetAsync("localstations/get");
                if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.BadRequest)
                {
                    _cache.Remove(TokenCacheKey);

                    //login
                    var loginDto = new LoginRequest()
                    {
                        Email= _appSettings.LogisticsConfig.GigUsername,
                        Password = _appSettings.LogisticsConfig.GigPassword
                    };
                    var loginResp = await AuthenticateAsync(loginDto);
                    if (loginResp == null || loginResp.StatusCode != 200)
                    {
                        return ServiceResponse<ServiceCentreResponse>.Fail("Unauthorized access. Please login again.", 401);
                    }
                    else
                    {
                        //update header
                        //AddAuthorizationHeader();
                        var request = CreateAuthorizedRequest(HttpMethod.Get, "localStations/get");
                        response = await _httpClient.SendAsync(request);
                        //response = await _httpClient.GetAsync("localstations/get");
                    }
                }
                if (!response.IsSuccessStatusCode)
                {
                    return await HandleFailedResponse<ServiceCentreResponse>(response);
                }

                var result = await response.Content.ReadFromJsonAsync<ServiceCentreResponse>();

                if (result?.ServiceCentres == null)
                {
                    return ServiceResponse<ServiceCentreResponse>.Fail("No Service centres found");
                }

                // Cache the response
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheExpirationMinutes));

                _cache.Set(StationsCacheKey, result, cacheOptions);

                return ServiceResponse<ServiceCentreResponse>.Success(result, "Service centres retrieved successfully");
            }
            catch (HttpRequestException ex)
            {
                return ServiceResponse<ServiceCentreResponse>.Fail(
                    $"Service unavailable: {ex.Message}",
                    (int)HttpStatusCode.BadGateway);
            }
            catch (Exception ex)
            {
                return ServiceResponse<ServiceCentreResponse>.Fail(
                    $"Error retrieving service centres: {ex.Message}",
                    (int)HttpStatusCode.InternalServerError);
            }
        }


        public async Task<ServiceResponse<ServiceCentreByStationResponse>> GetServiceCentresByStationAsync(int stationId)
        {
            try
            {
                var request = CreateAuthorizedRequest(HttpMethod.Get, $"serviceCentresByStation?StationId={stationId}");
                var response = await _httpClient.SendAsync(request); // Missing this line!

                if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.BadRequest)
                {
                    _cache.Remove(TokenCacheKey);

                    // Login and retry
                    var loginDto = new LoginRequest()
                    {
                        Email = _appSettings.LogisticsConfig.GigUsername,
                        Password = _appSettings.LogisticsConfig.GigPassword
                    };
                    var loginResp = await AuthenticateAsync(loginDto);
                    if (loginResp == null || loginResp.StatusCode != 200)
                    {
                        return ServiceResponse<ServiceCentreByStationResponse>.Fail("Unauthorized access. Please login again.", 401);
                    }
                    else
                    {
                        // Create new request with updated token
                        request = CreateAuthorizedRequest(HttpMethod.Get, $"serviceCentresByStation?StationId={stationId}");
                        response = await _httpClient.SendAsync(request);
                    }
                }

                if (!response.IsSuccessStatusCode)
                {
                    return await HandleFailedResponse<ServiceCentreByStationResponse>(response);
                }

                var result = await response.Content.ReadFromJsonAsync<ServiceCentreByStationResponse>();

                if (result?.data == null || !result.data.Any())
                {
                    return ServiceResponse<ServiceCentreByStationResponse>.Fail($"No service centres found for station ID: {stationId}");
                }

                return ServiceResponse<ServiceCentreByStationResponse>.Success(result, "Service centres retrieved successfully");
            }
            catch (HttpRequestException ex)
            {
                return ServiceResponse<ServiceCentreByStationResponse>.Fail(
                    $"Service unavailable: {ex.Message}",
                    (int)HttpStatusCode.BadGateway);
            }
            catch (Exception ex)
            {
                return ServiceResponse<ServiceCentreByStationResponse>.Fail(
                    $"Error retrieving service centres: {ex.Message}",
                    (int)HttpStatusCode.InternalServerError);
            }
        }

        public async Task<ServiceResponse<ShipmentTrackingResponse>> TrackShipmentAsync(string trackingNumber)
        {
            try
            {
                AddAuthorizationHeader();

                var response = await _httpClient.GetAsync($"TrackAllMobileShipment/{trackingNumber}");

                if (response.StatusCode == HttpStatusCode.Unauthorized)
                {
                    _cache.Remove(TokenCacheKey);

                    var loginDto = new LoginRequest
                    {
                        Email= _appSettings.LogisticsConfig.GigUsername,
                        Password = _appSettings.LogisticsConfig.GigPassword
                    };

                    var loginResp = await AuthenticateAsync(loginDto);
                    if (loginResp == null || loginResp.StatusCode != 200)
                    {
                        return ServiceResponse<ShipmentTrackingResponse>.Fail("Unauthorized access. Please login again.", 401);
                    }

                    AddAuthorizationHeader();
                    response = await _httpClient.GetAsync($"TrackAllMobileShipment/{trackingNumber}");
                }

                if (!response.IsSuccessStatusCode)
                {
                    return await HandleFailedResponse<ShipmentTrackingResponse>(response);
                }

                var result = await response.Content.ReadFromJsonAsync<ShipmentTrackingResponse>();

                if (result?.Object == null)
                {
                    return ServiceResponse<ShipmentTrackingResponse>.Fail("No tracking information found.");
                }

                return ServiceResponse<ShipmentTrackingResponse>.Success(result, "Shipment tracking retrieved successfully");
            }
            catch (Exception ex)
            {
                return ServiceResponse<ShipmentTrackingResponse>.Fail(
                    $"Error tracking shipment: {ex.Message}",
                    (int)HttpStatusCode.InternalServerError);
            }
        }

        public async Task<ServiceResponse<PreShipmentResponse>> GetPreShipmentPriceAsync(PreShipmentRequest request)
        {
            try
            {
                request.IsCashOnDelivery = false;
                request.VehicleType = "BIKE";
                request.SenderLocation = new Location
                {
                    Latitude = _appSettings.CompanyConfig?.Latitude,
                    Longitude = _appSettings.CompanyConfig?.Longitude
                };

                AddAuthorizationHeader();

                var response = await _httpClient.PostAsJsonAsync("price", request);

                if (response.StatusCode == HttpStatusCode.Unauthorized)
                {
                    _cache.Remove(TokenCacheKey);

                    // Login
                    var loginDto = new LoginRequest()
                    {
                        Email = _appSettings.LogisticsConfig.GigUsername,
                        Password = _appSettings.LogisticsConfig.GigPassword
                    };
                    var loginResp = await AuthenticateAsync(loginDto);
                    if (loginResp == null || loginResp.StatusCode != 200)
                    {
                        return ServiceResponse<PreShipmentResponse>.Fail("Unauthorized access. Please login again.", 401);
                    }
                    else
                    {
                        // Update header and retry
                        AddAuthorizationHeader();
                        response = await _httpClient.PostAsJsonAsync("price", request);
                    }
                }

                if (!response.IsSuccessStatusCode)
                {
                    return await HandleFailedResponse<PreShipmentResponse>(response);
                }

                var result = await response.Content.ReadFromJsonAsync<PreShipmentResponse>();

                if (result == null)
                {
                    return ServiceResponse<PreShipmentResponse>.Fail("Failed to create pre-shipment. No response received.");
                }

                return ServiceResponse<PreShipmentResponse>.Success(result, "Pre-shipment created successfully");
            }
            catch (HttpRequestException ex)
            {
                return ServiceResponse<PreShipmentResponse>.Fail(
                    $"Service unavailable: {ex.Message}",
                    (int)HttpStatusCode.BadGateway);
            }
            catch (Exception ex)
            {
                return ServiceResponse<PreShipmentResponse>.Fail(
                    $"Error creating pre-shipment: {ex.Message}",
                    (int)HttpStatusCode.InternalServerError);
            }
        }

        public async Task<ServiceResponse<ShipmentCaptureResponse>> CreateShipmentAsync(PreShipmentRequest request)
        {
            try
            {
                request.IsCashOnDelivery = false;
                request.VehicleType = "BIKE";
                request.SenderLocation = new Location
                {
                    Latitude = _appSettings.CompanyConfig?.Latitude,
                    Longitude = _appSettings.CompanyConfig?.Longitude
                };
                AddAuthorizationHeader();

                var response = await _httpClient.PostAsJsonAsync("captureshipment", request);

                if (response.StatusCode == HttpStatusCode.Unauthorized)
                {
                    _cache.Remove(TokenCacheKey);

                    // Login
                    var loginDto = new LoginRequest()
                    {
                        Email = _appSettings.LogisticsConfig.GigUsername,
                        Password = _appSettings.LogisticsConfig.GigPassword
                    };
                    var loginResp = await AuthenticateAsync(loginDto);
                    if (loginResp == null || loginResp.StatusCode != 200)
                    {
                        return ServiceResponse<ShipmentCaptureResponse>.Fail("Unauthorized access. Please login again.", 401);
                    }
                    else
                    {
                        // Update header and retry
                        AddAuthorizationHeader();
                        response = await _httpClient.PostAsJsonAsync("captureshipment", request);
                    }
                }

                if (!response.IsSuccessStatusCode)
                {
                    return await HandleFailedResponse<ShipmentCaptureResponse>(response);
                }

                var result = await response.Content.ReadFromJsonAsync<ShipmentCaptureResponse>();

                if (result == null)
                {
                    return ServiceResponse<ShipmentCaptureResponse>.Fail("Failed to create shipment. No response received.");
                }

                return ServiceResponse<ShipmentCaptureResponse>.Success(result, "Shipment created successfully");
            }
            catch (HttpRequestException ex)
            {
                return ServiceResponse<ShipmentCaptureResponse>.Fail(
                    $"Service unavailable: {ex.Message}",
                    (int)HttpStatusCode.BadGateway);
            }
            catch (Exception ex)
            {
                return ServiceResponse<ShipmentCaptureResponse>.Fail(
                    $"Error creating shipment: {ex.Message}",
                    (int)HttpStatusCode.InternalServerError);
            }
        }

        public async Task<ServiceResponse<PriceResponse>> GetDropOffPriceAsync(DropOffPriceRequest request)
        {
            try
            {
                var httpRequest = CreateAuthorizedRequest(HttpMethod.Post, "dropOff/price");
                httpRequest.Content = JsonContent.Create(request);

                var response = await _httpClient.SendAsync(httpRequest);

                if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.BadRequest)
                {
                    _cache.Remove(TokenCacheKey);

                    // Login and retry
                    var loginDto = new LoginRequest()
                    {
                        Email = _appSettings.LogisticsConfig.GigUsername,
                        Password = _appSettings.LogisticsConfig.GigPassword
                    };
                    var loginResp = await AuthenticateAsync(loginDto);
                    if (loginResp == null || loginResp.StatusCode != 200)
                    {
                        return ServiceResponse<PriceResponse>.Fail("Unauthorized access. Please login again.", 401);
                    }
                    else
                    {
                        // Create new request with updated token
                        httpRequest = CreateAuthorizedRequest(HttpMethod.Post, "dropOff/price");
                        httpRequest.Content = JsonContent.Create(request);
                        response = await _httpClient.SendAsync(httpRequest);
                    }
                }

                if (!response.IsSuccessStatusCode)
                {
                    return await HandleFailedResponse<PriceResponse>(response);
                }

                var result = await response.Content.ReadFromJsonAsync<PriceResponse>();

                if (result == null)
                {
                    return ServiceResponse<PriceResponse>.Fail("Failed to get drop-off price. No response received.");
                }

                return ServiceResponse<PriceResponse>.Success(result, "Drop-off price calculated successfully");
            }
            catch (HttpRequestException ex)
            {
                return ServiceResponse<PriceResponse>.Fail(
                    $"Service unavailable: {ex.Message}",
                    (int)HttpStatusCode.BadGateway);
            }
            catch (Exception ex)
            {
                return ServiceResponse<PriceResponse>.Fail(
                    $"Error calculating drop-off price: {ex.Message}",
                    (int)HttpStatusCode.InternalServerError);
            }
        }

        public async Task<ServiceResponse<PriceResponse>> GetDoorStepPriceAsync(DoorStepPriceRequest request)
        {
            try
            {
                // Set default customer code if not provided
                if (string.IsNullOrEmpty(request.CustomerCode))
                {
                    request.CustomerCode = _appSettings.LogisticsConfig.CustomerCode ?? "ECO017121";
                }

                var httpRequest = CreateAuthorizedRequest(HttpMethod.Post, "price");
                httpRequest.Content = JsonContent.Create(request);

                var response = await _httpClient.SendAsync(httpRequest);

                if (response.StatusCode == HttpStatusCode.Unauthorized)
                {
                    _cache.Remove(TokenCacheKey);

                    // Login and retry
                    var loginDto = new LoginRequest()
                    {
                        Email = _appSettings.LogisticsConfig.GigUsername,
                        Password = _appSettings.LogisticsConfig.GigPassword
                    };
                    var loginResp = await AuthenticateAsync(loginDto);
                    if (loginResp == null || loginResp.StatusCode != 200)
                    {
                        return ServiceResponse<PriceResponse>.Fail("Unauthorized access. Please login again.", 401);
                    }
                    else
                    {
                        // Create new request with updated token
                        httpRequest = CreateAuthorizedRequest(HttpMethod.Post, "price");
                        httpRequest.Content = JsonContent.Create(request);
                        response = await _httpClient.SendAsync(httpRequest);
                    }
                }

                if (!response.IsSuccessStatusCode)
                {
                    return await HandleFailedResponse<PriceResponse>(response);
                }

                var result = await response.Content.ReadFromJsonAsync<PriceResponse>();

                if (result == null)
                {
                    return ServiceResponse<PriceResponse>.Fail("Failed to get doorstep price. No response received.");
                }

                return ServiceResponse<PriceResponse>.Success(result, "Doorstep price calculated successfully");
            }
            catch (HttpRequestException ex)
            {
                return ServiceResponse<PriceResponse>.Fail(
                    $"Service unavailable: {ex.Message}",
                    (int)HttpStatusCode.BadGateway);
            }
            catch (Exception ex)
            {
                return ServiceResponse<PriceResponse>.Fail(
                    $"Error calculating doorstep price: {ex.Message}",
                    (int)HttpStatusCode.InternalServerError);
            }
        }

        // Enhanced helper method to convert cart items to shipment items
        public List<ShipmentItemRequest> ConvertCartItemsToShipmentItems(List<CartItem> cartItems)
        {
            var shipmentItems = new List<ShipmentItemRequest>();

            foreach (var item in cartItems)
            {
                // Calculate the actual weight or use default
                var weight = item.Weight > 0 ? item.Weight : CalculateEstimatedWeight(item);

                shipmentItems.Add(new ShipmentItemRequest
                {
                    ItemName = item.Name ?? "Product",
                    Description = item.Description ?? item.Name ?? "Product",
                    SpecialPackageId = 0, // Regular item by default
                    Quantity = item.Quantity,
                    Weight = weight,
                    IsVolumetric = false,
                    Length = 0,
                    Width = 0,
                    Height = 0,
                    ShipmentType = 1, // Regular shipment
                    Value = item.UnitPrice * item.Quantity,
                    Nature = "General"
                });
            }

            return shipmentItems;
        }

        // Method to calculate estimated weight based on product type or price
        private double CalculateEstimatedWeight(CartItem item)
        {
            // You can implement your own logic here based on product categories
            // For example:
            if (item.UnitPrice > 50000) return 2.0; // Expensive items might be heavier
            if (item.UnitPrice > 10000) return 1.5;
            return 1.0; // Default 1kg for most items
        }

        // Enhanced helper method for drop-off price calculation with CartItems
        public async Task<ServiceResponse<PriceResponse>> CalculateDropOffPrice(
            int senderStationId,
            int receiverStationId,
            List<CartItem> cartItems)
        {
            var shipmentItems = ConvertCartItemsToShipmentItems(cartItems);

            var request = new DropOffPriceRequest
            {
                SenderStationId = senderStationId,
                ReceiverStationId = receiverStationId,
                DeliveryType = 1,
                PickUpOptions = 0,
                ShipmentItems = shipmentItems
            };

            return await GetDropOffPriceAsync(request);
        }

        // Enhanced helper method for doorstep price calculation with CartItems
        public async Task<ServiceResponse<PriceResponse>> CalculateDoorStepPrice(
            int senderStationId,
            int receiverStationId,
            LocationProperty senderLocation,
            LocationProperty receiverLocation,
            List<CartItem> cartItems,
            string customerCode = null)
        {
            var shipmentItems = ConvertCartItemsToShipmentItems(cartItems);

            var request = new DoorStepPriceRequest
            {
                SenderStationId = senderStationId,
                ReceiverStationId = receiverStationId,
                VehicleType = 1,
                SenderLocation = senderLocation,
                ReceiverLocation = receiverLocation,
                IsFromAgility = false,
                CustomerCode = customerCode,
                CustomerType = 0,
                DeliveryOptionIds = new List<int> { 2 },
                Value = shipmentItems.Sum(x => x.Value),
                PickUpOptions = 1,
                ShipmentItems = shipmentItems
            };

            return await GetDoorStepPriceAsync(request);
        }

        private async Task<ServiceResponse<T>> HandleFailedResponse<T>(HttpResponseMessage response)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            return ServiceResponse<T>.Fail(
                $"Request failed: {response.StatusCode} - {errorContent}",
                (int)response.StatusCode);
        }
    }
}
