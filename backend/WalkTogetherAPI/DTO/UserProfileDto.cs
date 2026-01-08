namespace WalkTogetherAPI.DTO
{
    public class UserProfileDto
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int MotivationPoint { get; set; }
        public bool HasBadge { get; set; }
    }
}
