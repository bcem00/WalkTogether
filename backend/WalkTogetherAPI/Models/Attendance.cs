using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WalkTogether.Domain.Entities
{
    public class Attendance
    {
        [Key]
        [Column("attendance_id")]
        public Guid Id { get; set; }

        [Column("user_id")]
        public Guid UserId { get; set; }
        public User? User { get; set; }

        [Column("event_id")]
        public Guid EventId { get; set; }
        public Event? Event { get; set; }

        [Column("has_completed")]
        public bool HasCompleted { get; set; }
    }
}
