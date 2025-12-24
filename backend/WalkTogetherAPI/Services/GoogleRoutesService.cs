using System.Text;
using System.Text.Json;
using WalkTogetherAPI.DTO.GoogleRoutes;

namespace WalkTogetherAPI.Services
{
    public class GoogleRoutesService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GoogleRoutesService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["GoogleMaps:ApiKey"]; // Ensure this is in appsettings.json
        }

        public async Task<GoogleRouteResponse?> ComputeRouteAsync(List<LatLng> waypoints)
        {
            if (waypoints.Count < 2) throw new ArgumentException("At least 2 points needed.");

            // 1. Prepare the Request Payload
            var requestBody = new GoogleRouteRequest
            {
                Origin = new RouteLocation { Location = new LocationDetail { LatLng = waypoints.First() } },
                Destination = new RouteLocation { Location = new LocationDetail { LatLng = waypoints.Last() } },
                Intermediates = waypoints.Skip(1).Take(waypoints.Count - 2)
                    .Select(w => new RouteLocation { Location = new LocationDetail { LatLng = w } })
                    .ToList(),
                TravelMode = "WALKING"
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            // 2. Prepare the Request Message
            var request = new HttpRequestMessage(HttpMethod.Post, "https://routes.googleapis.com/directions/v2:computeRoutes");
            request.Headers.Add("X-Goog-Api-Key", _apiKey);
            // CRITICAL: Request only what we need to save money and bandwidth
            request.Headers.Add("X-Goog-FieldMask", "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline");
            request.Content = jsonContent;

            // 3. Send Request
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Google Routes API Error: {error}");
            }

            // 4. Deserialize Result
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<GoogleRouteResponse>(content);
        }
    }
}