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

    // ---------------------------------------------------------
    // 🔒 HELPER: Get User ID Securely
    // ---------------------------------------------------------
    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdString, out Guid userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("Invalid or missing User ID in token.");
    }

    // ---------------------------------------------------------
    // 🔒 SECURED ENDPOINTS
    // ---------------------------------------------------------

    [HttpGet("user-id/{userId}")]
    public async Task<IActionResult> GetEventsByUserId(Guid userId)
    {
        try
        {
            // Security Check: Ensure user is only requesting their own data
            var tokenUserId = GetUserId();
            if (userId != tokenUserId)
                return Forbid();

            var events = await _eventService.GetEventsByUserIdAsync(userId);
            return Ok(events);
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }


    [HttpPost("create")]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest request)
    {
        try
        {
            // 1. Force CreatorId from Token (Ignore whatever the client sent)
            var userId = GetUserId();
            request.CreatorId = userId;

            var newEventId = await _eventService.CreateEventAsync(request);
            var createdEvent = await _eventService.GetEventByIdAsync(newEventId);

            return Ok(new
            {
                eventId = newEventId,
                message = "Event created successfully",
                invitationCode = createdEvent?.InvitationCode.ToString()
            });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }


    [HttpPost("{eventId}/create-route")]
    public async Task<IActionResult> CreateRoute(Guid eventId, [FromBody] List<LatLng> waypoints)
    {
        try
        {
            // 1. Get User ID
            var userId = GetUserId();

            // 2. Validate Event
            var eventEntity = await _context.Events.FindAsync(eventId); // use the same DbContext instance we save with
            if (eventEntity == null) return NotFound("Event not found");

            // 3. Security Check: Compare Token ID vs Event Creator ID
            if (eventEntity.CreatorId != userId)
                return StatusCode(403, "Only the event creator can add a route.");

            // 4. Call Google Routes API
            var routeResult = await _routeService.ComputeRouteAsync(waypoints);

            if (routeResult?.Routes == null || !routeResult.Routes.Any())
                return BadRequest("Could not calculate a route.");

            var bestRoute = routeResult.Routes.First();

            // 5. Save Data
            eventEntity.RoutePolyline = bestRoute.Polyline.EncodedPolyline;
            eventEntity.TotalDistanceMeters = bestRoute.DistanceMeters;
            eventEntity.WaypointsJson = JsonSerializer.Serialize(waypoints);

            // Parse duration string like "123s" into seconds if present
            if (!string.IsNullOrWhiteSpace(bestRoute.Duration) && bestRoute.Duration.EndsWith("s"))
            {
                if (int.TryParse(bestRoute.Duration.TrimEnd('s'), out var seconds))
                {
                    eventEntity.EstimatedDurationSeconds = seconds;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Route saved successfully",
                polyline = eventEntity.RoutePolyline,
                distance = eventEntity.TotalDistanceMeters
            });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinEvent([FromBody] JoinEventRequest request)
    {
        try
        {
            // 1. Get User ID from Token
            var userId = GetUserId();

            // 2. Call Service
            var result = await _eventService.JoinEventByCodeAsync(userId, request.InviteCode);

            return result switch
            {
                JoinResult.Success => Ok(new { message = "Joined event successfully." }),
                JoinResult.AlreadyJoined => Ok(new { message = "You are already a participant of this event." }),
                JoinResult.InvalidCode => NotFound(new { message = "Invalid invitation code." }),
                _ => BadRequest(new { message = "Unable to join event." })
            };
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An internal error occurred." });
        }
    }

    // POST: api/events/leave
    [HttpPost("leave")]
    public async Task<IActionResult> LeaveEvent([FromBody] LeaveEventRequest request)
    {
        try
        {
            // 1. Force User ID from Token (Ignore client body userId)
            var userId = GetUserId();

            // 2. Perform Action
            var success = await _eventService.LeaveEventAsync(userId, request.EventId);

            if (success)
                return Ok(new { message = "Left event successfully" });
            else
                return BadRequest(new { message = "Failed to leave event" });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE: api/events/{eventId}
    [HttpDelete("{eventId}")]
    public async Task<IActionResult> DeleteEvent(Guid eventId)
    {
        try
        {
            // 1. Get User ID from Token
            var userId = GetUserId();

            // 2. Validate Event
            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
                return NotFound(new { message = "Event not found" });

            // 3. Security Check: Only event creator can delete
            if (eventEntity.CreatorId != userId)
                return StatusCode(403, new { message = "Only the event creator can delete this event." });

            // 4. Delete the event
            var success = await _eventService.DeleteEventAsync(eventId);

            if (success)
                return Ok(new { message = "Event deleted successfully" });
            else
                return BadRequest(new { message = "Failed to delete event" });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // ==================================================================================
    // 🔓 GENERAL READ-ONLY ENDPOINTS (Still requires Auth, but safe to share)
    // ==================================================================================

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