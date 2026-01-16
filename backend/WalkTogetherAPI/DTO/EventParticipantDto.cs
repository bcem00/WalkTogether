namespace WalkTogetherAPI.DTO
{
    public class EventParticipantDto
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public bool HasCompleted { get; set; }
    }
}
