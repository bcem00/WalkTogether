using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;


namespace WalkTogether.Domain.Entities
{
    // İSTER: Username üzerinde Index (Performans) ve Email üzerinde Unique Constraint
    [Index(nameof(Username))]
    [Index(nameof(Email), IsUnique = true)]
    public class User
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "User";

        public int TotalPoints { get; set; } = 0;
    }
}