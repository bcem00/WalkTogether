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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Table mappings (optional but keeps DB names consistent with diagram)
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<Event>().ToTable("events");
            modelBuilder.Entity<Route>().ToTable("routes");
            modelBuilder.Entity<Destination>().ToTable("destinations");
            modelBuilder.Entity<Attendance>().ToTable("attendances");

            // User (1) <- (M) Event (Creator)
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Creator)
                .WithMany(u => u.CreatedEvents)
                .HasForeignKey(e => e.CreatorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Event (1) <- (M) Attendance
            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Event)
                .WithMany(e => e.Attendances)
                .HasForeignKey(a => a.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            // User (1) <- (M) Attendance
            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.User)
                .WithMany(u => u.Attendances)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Route (1) <- (M) Destination
            modelBuilder.Entity<Destination>()
                .HasOne(d => d.Route)
                .WithMany(r => r.Destinations)
                .HasForeignKey(d => d.RouteId)
                .OnDelete(DeleteBehavior.Cascade);

            // Route (1) <- (M) Event
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Route)
                .WithMany(r => r.Events)
                .HasForeignKey(e => e.RouteId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}