using System.Text.Json.Serialization;

namespace WalkTogetherAPI.DTO.GoogleRoutes
{
    // 1. The Request Body we send to Google
    public class GoogleRouteRequest
    {
        [JsonPropertyName("origin")]
        public RouteLocation Origin { get; set; }

        [JsonPropertyName("destination")]
        public RouteLocation Destination { get; set; }

        [JsonPropertyName("intermediates")]
        public List<RouteLocation> Intermediates { get; set; }

        [JsonPropertyName("travelMode")]
        public string TravelMode { get; set; } = "WALKING"; // or DRIVE

        [JsonPropertyName("routingPreference")]
        public string RoutingPreference { get; set; } = "TRAFFIC_UNAWARE";
    }

    public class RouteLocation
    {
        [JsonPropertyName("location")]
        public LocationDetail Location { get; set; }
    }

    public class LocationDetail
    {
        [JsonPropertyName("latLng")]
        public LatLng LatLng { get; set; }
    }

    public class LatLng
    {
        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }

        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }
    }

    // 2. The Response Body we get back
    public class GoogleRouteResponse
    {
        [JsonPropertyName("routes")]
        public List<Route> Routes { get; set; }
    }

    public class Route
    {
        [JsonPropertyName("distanceMeters")]
        public int DistanceMeters { get; set; }

        [JsonPropertyName("duration")]
        public string Duration { get; set; } // Returns "123s" format

        [JsonPropertyName("polyline")]
        public Polyline Polyline { get; set; }
    }

    public class Polyline
    {
        [JsonPropertyName("encodedPolyline")]
        public string EncodedPolyline { get; set; }
    }
}