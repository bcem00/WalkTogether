using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WalkTogether.Domain.Entities
{
    public class SystemLog
    {
        [Key]
        [Column("log_id")]
        public Guid LogId { get; set; }

        [Column("user_id")]
        public Guid? UserId { get; set; }

        [Required]
        [MaxLength(10)]
        [Column("action_type")]
        public string ActionType { get; set; } = string.Empty; 

        [Required]
        [MaxLength(50)]
        [Column("table_name")]
        public string TableName { get; set; } = string.Empty;

        [Column("record_id")]
        public Guid? RecordId { get; set; }

        [Column("old_data", TypeName = "jsonb")]
        public string? OldData { get; set; }

        [Column("new_data", TypeName = "jsonb")]
        public string? NewData { get; set; }

        [MaxLength(10)]
        [Column("severity")]
        public string Severity { get; set; } = "INFO"; // 'INFO', 'WARNING', 'ERROR'

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
