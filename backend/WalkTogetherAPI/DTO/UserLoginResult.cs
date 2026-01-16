namespace WalkTogetherAPI.DTO
{
    public class UserLoginResult
    {
        public Guid user_id { get; set; }       
        public string username { get; set; }
        public string email { get; set; }
        public string password_hash { get; set; }
        public string role_name { get; set; }
        public string first_name { get; set; }
        public string last_name { get; set; }
    }
}
