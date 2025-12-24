namespace WalkTogetherAPI.DTO
{
    public class ChangePasswordRequest
    {
        public Guid UserId { get; set; }
        public string OldPassword { get; set; } // Güvenlik için eski şifreyi de istemek iyidir
        public string NewPassword { get; set; }
    }
}
