using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;
using WalkTogether.Data;
using WalkTogetherAPI.DTO;
using WalkTogetherAPI.DTO.GoogleRoutes;
using WalkTogetherAPI.Services;

[Authorize] 
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

    
    [HttpGet("user-id/{userId}")]
    public async Task<IActionResult> GetEventsByUserId(Guid userId)
    {
        
        if (!ValidateUserAccess(userId)) return Forbid();

        try
        {
            var events = await _eventService.GetEventsByUserIdAsync(userId);
            return Ok(events);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    
    [HttpPost("create")]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest request)
    {
        
        if (!ValidateUserAccess(request.CreatorId)) return Forbid();

        try
        {
            var newEventId = await _eventService.CreateEventAsync(request);

            
            var createdEvent = await _eventService.GetEventByIdAsync(newEventId);

            return Ok(new
            {
                eventId = newEventId,
                message = "Event created successfully",
                invitationCode = createdEvent?.InvitationCode.ToString()
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    
    [HttpPost("{eventId}/create-route")]
    public async Task<IActionResult> CreateRoute(Guid eventId, [FromBody] List<LatLng> waypoints)
    {
        // 1. Validate Event
        var eventEntity = await _eventService.GetEventByIdAsync(eventId);
        if (eventEntity == null) return NotFound("Event not found");

        // 2. Security Check: Only the Creator can modify the route
        if (!ValidateUserAccess(eventEntity.CreatorId))
            return StatusCode(403, "Only the event creator can add a route.");

        try
        {
            // 3. Call Google Routes API
            var routeResult = await _routeService.ComputeRouteAsync(waypoints);

            if (routeResult?.Routes == null || !routeResult.Routes.Any())
                return BadRequest("Could not calculate a route.");

            var bestRoute = routeResult.Routes.First();

            // 4. Save Data
            eventEntity.RoutePolyline = bestRoute.Polyline.EncodedPolyline;
            eventEntity.TotalDistanceMeters = bestRoute.DistanceMeters;
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

    [HttpPost("join")]
    [Authorize] // Ensure the user is logged in
    public async Task<IActionResult> JoinEvent([FromBody] JoinEventRequest request)
    {
        // 1. Get User ID securely from the Token/Context
        // (Assuming you have a standard claim setup, otherwise use your specific claim type)
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.ToString();

        if (!Guid.TryParse(userIdString, out Guid userId))
            return Unauthorized();

        try
        {
            // 2. Call Service
            var result = await _eventService.JoinEventByCodeAsync(userId, request.InviteCode);

            
            return result switch
            {
                JoinResult.Success => Ok(new { message = "Joined event successfully." }),
                JoinResult.AlreadyJoined => Ok(new { message = "You are already a participant of this event." }), // Or 409 Conflict
                JoinResult.InvalidCode => NotFound(new { message = "Invalid invitation code." }),
                _ => BadRequest(new { message = "Unable to join event." })
            };
        }
        catch (Exception ex)
        {

            // Return a generic error message to the client
            return StatusCode(500, new { message = "An internal error occurred. Please try again later." });
        }
    }

    // POST: api/events/leave
    [HttpPost("leave")]
    public async Task<IActionResult> LeaveEvent([FromBody] LeaveEventRequest request)
    {
        // Security Check
        if (!ValidateUserAccess(request.UserId)) return Forbid();

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

    // ==================================================================================
    // 🔓 GENERAL AUTHENTICATED ENDPOINTS (Requires Login, but no specific ID check)
    // ==================================================================================

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

    // ==================================================================================
    // 🛠️ HELPER METHODS
    // ==================================================================================

    /// <summary>
    /// Checks if the logged-in user (from Token) matches the requested User ID.
    /// </summary>
    private bool ValidateUserAccess(Guid requestUserId)
    {
        var userIdFromToken = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdFromToken == null) return false;

        return userIdFromToken == requestUserId.ToString();
    }
}