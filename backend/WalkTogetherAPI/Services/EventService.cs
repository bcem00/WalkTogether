using Microsoft.EntityFrameworkCore;
using WalkTogether.Data;
using WalkTogetherAPI.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WalkTogether.Domain.Entities;
using Npgsql;


public enum JoinResult
{
    InvalidCode = 0,
    Success = 1,
    AlreadyJoined = 2
}


public class EventService
{
    private readonly AppDbContext _context;

    public EventService(AppDbContext context)
    {
        _context = context;
    }


    public async Task<List<EventSummary>> GetEventsByUsernameAsync(string username)
    {
        var sql = "SELECT * FROM get_events_by_username(@p0) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<EventSummary>(sql, username)
            .ToListAsync();
    }

    public async Task<List<EventSummary>> GetEventsByUserIdAsync(Guid userId)
    {
        var sql = "SELECT * FROM get_events_by_user_id(@p0) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<EventSummary>(sql, userId)
            .ToListAsync();
    }

    
    public async Task<JoinResult> JoinEventByCodeAsync(Guid userId, string inviteCode)
    {
        
        var sql = "SELECT join_event_by_code(@userId, @inviteCode) as \"Value\"";

        var result = await _context.Database
            .SqlQueryRaw<int>(sql,
                new NpgsqlParameter("@userId", userId),
                new NpgsqlParameter("@inviteCode", inviteCode))
            .FirstOrDefaultAsync();

        return (JoinResult)result;
    }


    public async Task<bool> LeaveEventAsync(Guid userId, Guid eventId)
    {
        var sql = "SELECT leave_event(@p0, @p1) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<bool>(sql, userId, eventId)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> DeleteEventAsync(Guid eventId)
    {
        try
        {
            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
                return false;

            _context.Events.Remove(eventEntity);
            await _context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
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

    // 7. Add event distance to attendees
    public async Task<int> AddEventDistanceToAttendeesAsync(Guid eventId)
    {
        var sql = "SELECT add_event_distance_to_attendees(@p0) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<int>(sql, eventId)
            .FirstOrDefaultAsync();
    }

    // 8. Create destination for a route
    public async Task<Guid> CreateDestinationAsync(Guid routeId, double latitude, double longitude, int orderInRoute)
    {
        var sql = "SELECT create_destination(@p0, @p1, @p2, @p3) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<Guid>(sql, routeId, latitude, longitude, orderInRoute)
            .FirstOrDefaultAsync();
    }

    // 9. Update route distance
    public async Task UpdateRouteDistanceAsync(Guid routeId, int distance)
    {
        var sql = "SELECT update_route_distance(@p0, @p1)";
        await _context.Database
            .ExecuteSqlRawAsync(sql, routeId, distance);
    }

    // 10. Get attended events for a user
    public async Task<List<AttendedEvent>> GetAttendedEventsAsync(Guid userId)
    {
        var sql = "SELECT * FROM get_attended_events(@p0) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<AttendedEvent>(sql, userId)
            .ToListAsync();
    }

    // 11. Get event report (admin)
    public async Task<string> GetEventReportAsync(Guid eventId)
    {
        var sql = "SELECT get_event_report(@p0) AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<string>(sql, eventId)
            .FirstOrDefaultAsync() ?? "No report available";
    }

    // 12. Get inactive users (admin)
    public async Task<List<InactiveUser>> GetInactiveUsersAsync()
    {
        var sql = "SELECT * FROM get_inactive_users() AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<InactiveUser>(sql)
            .ToListAsync();
    }

    // 13. Get total event count
    public async Task<int> GetTotalEventCountAsync()
    {
        var sql = "SELECT get_total_event_count() AS \"Value\"";
        return await _context.Database
            .SqlQueryRaw<int>(sql)
            .FirstOrDefaultAsync();
    }

}