using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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


    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdString, out Guid userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("Token içinde geçersiz veya eksik Kullanıcı Kimliği.");
    }


    private bool IsUserAdmin()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        return role == "admin" || role == "Admin";
    }



    [HttpGet("user-id/{userId}")]
    public async Task<IActionResult> GetEventsByUserId(Guid userId)
    {
        try
        {
            
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
           
            var userId = GetUserId();
            request.CreatorId = userId;

            var newEventId = await _eventService.CreateEventAsync(request);
            var createdEvent = await _eventService.GetEventByIdAsync(newEventId);

            return Ok(new
            {
                eventId = newEventId,
                message = "Etkinlik başarıyla oluşturuldu",
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
            
            var userId = GetUserId();

            
            var eventEntity = await _context.Events.FindAsync(eventId); 
            if (eventEntity == null) return NotFound("Etkinlik bulunamadı.");

            // 3. Security Check: Compare Token ID vs Event Creator ID
            if (eventEntity.CreatorId != userId)
                return StatusCode(403, "Sadece etkinlik oluşturucusu rota ekleyebilir.");

            // 4. Call Google Routes API
            var routeResult = await _routeService.ComputeRouteAsync(waypoints);

            if (routeResult?.Routes == null || !routeResult.Routes.Any())
                return BadRequest("Rota hesaplanamadı.");

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
                message = "Rota başarıyla kaydedildi",
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
            
            var userId = GetUserId();

            
            var result = await _eventService.JoinEventByCodeAsync(userId, request.InviteCode);

            return result switch
            {
                JoinResult.Success => Ok(new { message = "Etkinliğe başarıyla katıldınız." }),
                JoinResult.AlreadyJoined => Ok(new { message = "Zaten bu etkinliğin bir katılımcısısınız." }),
                JoinResult.InvalidCode => NotFound(new { message = "Geçersiz davet kodu." }),
                _ => BadRequest(new { message = "Etkinliğe katılamadı." })
            };
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Bir server hatası oluştu." });
        }
    }

    
    [HttpPost("leave")]
    public async Task<IActionResult> LeaveEvent([FromBody] LeaveEventRequest request)
    {
        try
        {
            
            var userId = GetUserId();

            
            var success = await _eventService.LeaveEventAsync(userId, request.EventId);

            if (success)
                return Ok(new { message = "Etkinlikten başarıyla ayrıldınız." });
            else
                return BadRequest(new { message = "Etkinlikten ayrılamadı." });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    
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
                return NotFound(new { message = "Etkinlik bulunamadı" });

            // 3. Security Check: Only event creator or admin can delete
            var isAdmin = IsUserAdmin();
            if (eventEntity.CreatorId != userId && !isAdmin)
                return StatusCode(403, new { message = "Sadece etkinlik yaratıcısı veya admin bu etkinliği silebilir." });

            // 4. Delete the event
            var success = await _eventService.DeleteEventAsync(eventId);

            if (success)
                return Ok(new { message = "Etkinlik başarıyla silindi" });
            else
                return BadRequest(new { message = "Etkinlik silinemedi" });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("{eventId}/add-distance-to-attendees")]
    public async Task<IActionResult> AddEventDistanceToAttendees(Guid eventId)
    {
        try
        {
            
            var userId = GetUserId();

            
            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
                return NotFound(new { message = "Etkinlik bulunamadı" });

            
            if (eventEntity.CreatorId != userId)
                return StatusCode(403, new { message = "Sadece etkinlik yaratıcısı katılımcılara mesafe ekleyebilir." });
            
            var updatedCount = await _eventService.AddEventDistanceToAttendeesAsync(eventId);

            return Ok(new { message = $"Katılımcılara mesafe başarıyla eklendi: {updatedCount}", updatedCount });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("{eventId}/create-destination")]
    public async Task<IActionResult> CreateDestination(Guid eventId, [FromBody] CreateDestinationRequest request)
    {
        try
        {
            // 1. Get User ID from Token
            var userId = GetUserId();

            // 2. Validate Event and Route
            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
                return NotFound(new { message = "Etkinlik bulunamadı" });

            if (!eventEntity.RouteId.HasValue)
                return BadRequest(new { message = "Etkinlik bir rotaya sahip değil" });

            // 3. Security Check: Only event creator can add destinations
            if (eventEntity.CreatorId != userId)
                return StatusCode(403, new { message = "Sadece etkinlik yaratıcısı destinasyon ekleyebilir." });

            // 4. Create destination
            var destinationId = await _eventService.CreateDestinationAsync(
                eventEntity.RouteId.Value,
                request.Latitude,
                request.Longitude,
                request.OrderInRoute);

            return Ok(new { message = "Destinasyon başarıyla oluşturuldu", destinationId });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("{eventId}/update-route-distance")]
    public async Task<IActionResult> UpdateRouteDistance(Guid eventId, [FromBody] UpdateRouteDistanceRequest request)
    {
        try
        {
            // 1. Get User ID from Token
            var userId = GetUserId();

            // 2. Validate Event and Route
            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
                return NotFound(new { message = "Etkinlik bulunamadı" });

            if (!eventEntity.RouteId.HasValue)
                return BadRequest(new { message = "Etkinlik bir rotaya sahip değil" });

            // 3. Security Check: Only event creator can update route distance
            if (eventEntity.CreatorId != userId)
                return StatusCode(403, new { message = "Sadece etkinlik yaratıcısı rota mesafesini güncelleyebilir." });

            // 4. Update route distance
            await _eventService.UpdateRouteDistanceAsync(eventEntity.RouteId.Value, request.Distance);

            return Ok(new { message = "Rota mesafesi başarıyla güncellendi" });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

   
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

    [HttpGet("attended-events")]
    public async Task<IActionResult> GetAttendedEvents()
    {
        try
        {
            var userId = GetUserId();
            var attendedEvents = await _eventService.GetAttendedEventsAsync(userId);
            return Ok(attendedEvents);
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("{eventId}/report")]
    public async Task<IActionResult> GetEventReport(Guid eventId)
    {
        try
        {
            var userId = GetUserId();

            // Validate event exists and user is creator or admin
            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
                return NotFound(new { message = "Etkinlik bulunamadı" });

            var isAdmin = IsUserAdmin();
            if (eventEntity.CreatorId != userId && !isAdmin)
                return StatusCode(403, new { message = "Sadece etkinlik yaratıcısı veya admin bu raporu görüntüleyebilir." });

            var report = await _eventService.GetEventReportAsync(eventId);
            return Ok(new { report });
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("{eventId}/participants")]
    public async Task<IActionResult> GetEventParticipants(Guid eventId)
    {
        try
        {
            var userId = GetUserId();

            // Validate event exists
            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
                return NotFound(new { message = "Etkinlik bulunamadı" });

            // Authorization: Admin can see all, creator can see their own events
            var isAdmin = IsUserAdmin();
            if (eventEntity.CreatorId != userId && !isAdmin)
                return StatusCode(403, new { message = "Sadece etkinlik yaratıcısı veya admin katılımcıları görüntüleyebilir." });

            var participants = await _eventService.GetEventParticipantsAsync(eventId);
            return Ok(participants);
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("admin/inactive-users")]
    public async Task<IActionResult> GetInactiveUsers()
    {
        try
        {
            
            var inactiveUsers = await _eventService.GetInactiveUsersAsync();
            return Ok(inactiveUsers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("admin/total-count")]
    public async Task<IActionResult> GetTotalEventCount()
    {
        try
        {
            
            var count = await _eventService.GetTotalEventCountAsync();
            return Ok(new { totalEventCount = count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("admin/system-logs")]
    public async Task<IActionResult> GetSystemLogs([FromQuery] int limit = 100, [FromQuery] string? severity = null, [FromQuery] string? tableName = null)
    {
        try
        {
            if (!IsUserAdmin())
            {
                return StatusCode(403, new { message = "Bu endpoint'e sadece adminler erişebilir." });
            }

            var query = _context.SystemLogs
                .OrderByDescending(l => l.CreatedAt)
                .AsQueryable();

            if (!string.IsNullOrEmpty(severity))
            {
                query = query.Where(l => l.Severity == severity.ToUpper());
            }

            if (!string.IsNullOrEmpty(tableName))
            {
                query = query.Where(l => l.TableName == tableName);
            }

            var logs = await query
                .Take(limit)
                .Select(l => new
                {
                    logId = l.LogId,
                    userId = l.UserId,
                    actionType = l.ActionType,
                    tableName = l.TableName,
                    recordId = l.RecordId,
                    oldData = l.OldData,
                    newData = l.NewData,
                    severity = l.Severity,
                    createdAt = l.CreatedAt
                })
                .ToListAsync();

            return Ok(logs);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}