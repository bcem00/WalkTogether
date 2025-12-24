namespace WalkTogetherAPI.DTO
{
    public class ChangeUsernameRequest
    {
        public Guid UserId { get; set; }
        public string NewUsername { get; set; }
    }
}
