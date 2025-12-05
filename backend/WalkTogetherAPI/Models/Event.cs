using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WalkTogether.Domain.Entities
{
    public class Event
    {
        [Key]
        [Column("event_id")]
        public Guid Id { get; set; }

        [Column("creator_id")]
        public Guid CreatorId { get; set; }
        public User? Creator { get; set; }

        [Column("start_date")]
        public DateTimeOffset StartDate { get; set; }

        [Column("route_id")]
        public Guid? RouteId { get; set; }
        public Route? Route { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("title")]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Column("invitation_code")]
        [MaxLength(20)]
        public string? InvitationCode { get; set; }

        [Column("creation_date")]
        public DateTimeOffset CreationDate { get; set; }

        public ICollection<Attendance>? Attendances { get; set; }
    }
}
