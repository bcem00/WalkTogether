using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace WalkTogether.Domain.Entities
{
    [Index(nameof(Username))]
    [Index(nameof(Email), IsUnique = true)]
    public class User
    {
        [Key]
        [Column("user_id")]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("username")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("first_name")]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("last_name")]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("password_hash")]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [EmailAddress]
        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Column("motivation_point")]
        public int MotivationPoint { get; set; } = 0;

        [Column("has_badge")]
        public bool HasBadge { get; set; } = false;

        // Navigation properties
        public ICollection<Event>? CreatedEvents { get; set; }
        public ICollection<Attendance>? Attendances { get; set; }
    }
}