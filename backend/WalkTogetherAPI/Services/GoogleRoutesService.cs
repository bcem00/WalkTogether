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
            _apiKey = config["GoogleMaps:ApiKey"];
        }

        public async Task<GoogleRouteResponse?> ComputeRouteAsync(List<LatLng> waypoints)
        {
            if (waypoints.Count < 2) throw new ArgumentException("At least 2 points needed.");

            var requestBody = new GoogleRouteRequest
            {
                Origin = new RouteLocation { Location = new LocationDetail { LatLng = waypoints.First() } },
                Destination = new RouteLocation { Location = new LocationDetail { LatLng = waypoints.Last() } },
                Intermediates = waypoints.Skip(1).Take(waypoints.Count - 2)
                    .Select(w => new RouteLocation { Location = new LocationDetail { LatLng = w } })
                    .ToList(),
                TravelMode = "WALK",
                RoutingPreference = null 
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, "https://routes.googleapis.com/directions/v2:computeRoutes");
            request.Headers.Add("X-Goog-Api-Key", _apiKey);
            request.Headers.Add("X-Goog-FieldMask", "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline");
            request.Content = jsonContent;

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
              
                var errorBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"GOOGLE API ERROR: {errorBody}"); // Check your console/logs for this!
                throw new Exception($"Google Routes API Failed ({response.StatusCode}): {errorBody}");
            }

            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<GoogleRouteResponse>(content);
        }
    }
}