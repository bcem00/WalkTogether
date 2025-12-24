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

    public EventsController(GoogleRoutesService routeService, AppDbContext context)
    {
        _routeService = routeService;
        _context = context;
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
}