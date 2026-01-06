namespace WalkTogetherAPI.DTO
{
    public class EventSummary
    {
        public Guid EventId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTimeOffset StartDate { get; set; } // Matches DateTimeOffset in Entity
        public int TotalDistanceMeters { get; set; }
        public string InvitationCode { get; set; }
        public string CreatorUsername { get; set; }
        public bool IsCreator { get; set; }

       
        public string? RoutePolyline { get; set; }
        public string? WaypointsJson { get; set; }
    }

    public class UpcomingEvent
    {
        public Guid event_id { get; set; }
        public string title { get; set; }
        public string description { get; set; }
        public DateTime start_date { get; set; }
        public string invitation_code { get; set; }
        public string creator_full_name { get; set; }
        public string creator_username { get; set; }
        public int route_distance_meters { get; set; }
        public long participant_count { get; set; }
    }

    public class EventDistanceSummary
    {
        public string event_title { get; set; }
        public DateTime event_start_date { get; set; }
        public int route_distance { get; set; }
        public long participant_count { get; set; }
    }

    public class EventDestination
    {
        public Guid destination_id { get; set; }
        public double latitude { get; set; }
        public double longitude { get; set; }
        public int order_in_route { get; set; }
    }

    public class JoinEventRequest
    {
        public Guid UserId { get; set; }
        public string InviteCode { get; set; }
    }

    public class LeaveEventRequest
    {
        public Guid UserId { get; set; }
        public Guid EventId { get; set; }
    }

    public class CreateEventRequest
    {
        public Guid CreatorId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTimeOffset StartDate { get; set; }
        public string? RoutePolyline { get; set; }
        public string? WaypointsJson { get; set; }
        public int? TotalDistanceMeters { get; set; }
        public int? EstimatedDurationSeconds { get; set; }
    }

    
}