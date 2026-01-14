using Microsoft.EntityFrameworkCore;
using WalkTogether.Data;

namespace WalkTogetherAPI.Services
{
    
    public class DeletePastEventsService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DeletePastEventsService> _logger;
        private readonly TimeSpan _period = TimeSpan.FromHours(1); 

        public DeletePastEventsService(
            IServiceProvider serviceProvider,
            ILogger<DeletePastEventsService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Delete Past Events Service is starting.");

            
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await DeletePastEventsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while deleting past events.");
                }

                
                await Task.Delay(_period, stoppingToken);
            }

            _logger.LogInformation("Delete Past Events Service is stopping.");
        }

        private async Task DeletePastEventsAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var currentTime = DateTime.UtcNow;
            
            
            var pastEvents = await dbContext.Events
                .Where(e => e.StartDate < currentTime)
                .ToListAsync(cancellationToken);

            if (pastEvents.Any())
            {
                _logger.LogInformation(
                    "Processing {Count} past event(s) scheduled before {CurrentTime}",
                    pastEvents.Count,
                    currentTime);

                
                foreach (var pastEvent in pastEvents)
                {
                    await dbContext.Database.ExecuteSqlRawAsync(
                        "SELECT add_event_distance_to_attendees({0})",
                        cancellationToken,
                        pastEvent.Id);
                }

                _logger.LogInformation("Awarded motivation points to attendees of past events");

                
                dbContext.Events.RemoveRange(pastEvents);
                await dbContext.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Successfully deleted {Count} past event(s)", pastEvents.Count);
            }
            else
            {
                _logger.LogDebug("No past events to delete at {CurrentTime}", currentTime);
            }
        }
    }
}
