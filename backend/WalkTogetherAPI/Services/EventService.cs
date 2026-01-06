using Microsoft.EntityFrameworkCore;
using WalkTogether.Data;
using WalkTogetherAPI.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class EventService
{
    private readonly AppDbContext _context;

    public EventService(AppDbContext context)
    {
        _context = context;
    }

    // 1. Get events created by a user
    public async Task<List<EventSummary>> GetEventsByUsernameAsync(string username)
    {
        var sql = "SELECT * FROM get_events_by_username(@p0) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<EventSummary>(sql, username)
            .ToListAsync();
    }

    // 2. Join an event by invitation code
    public async Task<bool> JoinEventByCodeAsync(Guid userId, string inviteCode)
    {
        var sql = "SELECT join_event_by_code(@p0, @p1) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<bool>(sql, userId, inviteCode)
            .FirstOrDefaultAsync();
    }

    // 3. Leave an event
    public async Task<bool> LeaveEventAsync(Guid userId, Guid eventId)
    {
        var sql = "SELECT leave_event(@p0, @p1) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<bool>(sql, userId, eventId)
            .FirstOrDefaultAsync();
    }

    // 4. Get upcoming events (using the view)
    public async Task<List<UpcomingEvent>> GetUpcomingEventsAsync()
    {
        var sql = "SELECT * FROM view_upcoming_events_detailed AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<UpcomingEvent>(sql)
            .ToListAsync();
    }

    // 5. Filter events by distance
    public async Task<List<EventDistanceSummary>> FilterEventsByDistanceAsync(int minDist, int maxDist)
    {
        var sql = "SELECT * FROM filter_events_by_distance(@p0, @p1) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<EventDistanceSummary>(sql, minDist, maxDist)
            .ToListAsync();
    }

    // 6. Get destinations for an event
    public async Task<List<EventDestination>> GetDestinationsForEventAsync(Guid eventId)
    {
        var sql = "SELECT * FROM get_all_destinations_for_event(@p0) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<EventDestination>(sql, eventId)
            .ToListAsync();
    }


    public async Task<Guid> CreateEventAsync(CreateEventRequest request)
    {
        var sql = "SELECT create_event(@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<Guid>(sql,
                request.CreatorId,
                request.Title,
                request.Description,
                request.StartDate,
                request.RoutePolyline,
                request.WaypointsJson,
                request.TotalDistanceMeters,
                request.EstimatedDurationSeconds)
            .FirstOrDefaultAsync();
    }

    
    public async Task<WalkTogether.Domain.Entities.Event> GetEventByIdAsync(Guid eventId)
    {
        return await _context.Events.FindAsync(eventId);
    }

}