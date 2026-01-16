using Microsoft.EntityFrameworkCore;
using WalkTogether.Domain.Entities;
using Route = WalkTogether.Domain.Entities.Route;

namespace WalkTogether.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<Route> Routes { get; set; }
        public DbSet<Destination> Destinations { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<SystemLog> SystemLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<Event>().ToTable("events");
            modelBuilder.Entity<Route>().ToTable("routes");
            modelBuilder.Entity<Destination>().ToTable("destinations");
            modelBuilder.Entity<Attendance>().ToTable("attendances");
            modelBuilder.Entity<SystemLog>().ToTable("system_logs");

            modelBuilder.Entity<Event>()
                .HasOne(e => e.Creator)
                .WithMany(u => u.CreatedEvents)
                .HasForeignKey(e => e.CreatorId)
                .OnDelete(DeleteBehavior.Cascade);

   
            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Event)
                .WithMany(e => e.Attendances)
                .HasForeignKey(a => a.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            
            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.User)
                .WithMany(u => u.Attendances)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            
            modelBuilder.Entity<Destination>()
                .HasOne(d => d.Route)
                .WithMany(r => r.Destinations)
                .HasForeignKey(d => d.RouteId)
                .OnDelete(DeleteBehavior.Cascade);

            
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Route)
                .WithMany(r => r.Events)
                .HasForeignKey(e => e.RouteId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}