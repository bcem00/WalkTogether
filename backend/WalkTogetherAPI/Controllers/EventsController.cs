using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using WalkTogether.Data;
using WalkTogetherAPI.DTO.GoogleRoutes;
using WalkTogetherAPI.Services;

[Route("api/[controller]")]
[ApiController]
public class EventsController : ControllerBase
{
    private readonly GoogleRoutesService _routeService;
    private readonly AppDbContext _context;
    private readonly EventService _eventService;

    public EventsController(GoogleRoutesService routeService, AppDbContext context, EventService eventService)
    {
        _routeService = routeService;
        _context = context;
        _eventService = eventService;
    }

    // POST: api/events/{id}/create-route
    [HttpPost("{eventId}/create-route")]
    public async Task<IActionResult> CreateRoute(Guid eventId, [FromBody] List<LatLng> waypoints)
    {
        // 1. Validate Event
        var eventEntity = await _context.Events.FindAsync(eventId);
        if (eventEntity == null) return NotFound("Event not found");

        try
        {
            // 2. Call Google Routes API
            var routeResult = await _routeService.ComputeRouteAsync(waypoints);

            if (routeResult?.Routes == null || !routeResult.Routes.Any())
                return BadRequest("Could not calculate a route.");

            var bestRoute = routeResult.Routes.First();

            // 3. Save Data to Database
            eventEntity.RoutePolyline = bestRoute.Polyline.EncodedPolyline;
            eventEntity.TotalDistanceMeters = bestRoute.DistanceMeters;

            // Duration comes as "1234s", verify format parsing if needed
            // eventEntity.EstimatedDurationSeconds = ... 

            // Save the raw waypoints too, so the user can "Edit" the stops later
            eventEntity.WaypointsJson = JsonSerializer.Serialize(waypoints);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Route saved successfully",
                polyline = eventEntity.RoutePolyline,
                distance = eventEntity.TotalDistanceMeters
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    // GET: api/events/upcoming
    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcomingEvents()
    {
        try
        {
            var events = await _eventService.GetUpcomingEventsAsync();
            return Ok(events);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    // POST: api/events/join
    [HttpPost("join")]
    public async Task<IActionResult> JoinEvent([FromBody] JoinEventRequest request)
    {
        try
        {
            var success = await _eventService.JoinEventByCodeAsync(request.UserId, request.InviteCode);
            if (success)
                return Ok(new { message = "Joined event successfully" });
            else
                return BadRequest(new { message = "Failed to join event" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST: api/events/leave
    [HttpPost("leave")]
    public async Task<IActionResult> LeaveEvent([FromBody] LeaveEventRequest request)
    {
        try
        {
            var success = await _eventService.LeaveEventAsync(request.UserId, request.EventId);
            if (success)
                return Ok(new { message = "Left event successfully" });
            else
                return BadRequest(new { message = "Failed to leave event" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET: api/events/user/{username}
    [HttpGet("user/{username}")]
    public async Task<IActionResult> GetEventsByUsername(string username)
    {
        try
        {
            var events = await _eventService.GetEventsByUsernameAsync(username);
            return Ok(events);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    // GET: api/events/filter?minDist={min}&maxDist={max}
    [HttpGet("filter")]
    public async Task<IActionResult> FilterEventsByDistance(int minDist, int maxDist)
    {
        try
        {
            var events = await _eventService.FilterEventsByDistanceAsync(minDist, maxDist);
            return Ok(events);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    // GET: api/events/{eventId}/destinations
    [HttpGet("{eventId}/destinations")]
    public async Task<IActionResult> GetDestinationsForEvent(Guid eventId)
    {
        try
        {
            var destinations = await _eventService.GetDestinationsForEventAsync(eventId);
            return Ok(destinations);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}