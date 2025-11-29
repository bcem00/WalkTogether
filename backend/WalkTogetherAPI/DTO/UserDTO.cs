namespace WalkTogether.DTO
{
    // CQRS'te veri taşımak için record kullanımı idealdir
    public record UserDto(int Id, string Username, string Email, string Role, int TotalPoints);

    // Create işlemi için ayrı bir DTO
    public record CreateUserDto(string Username, string Email);
}