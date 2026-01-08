
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Org.BouncyCastle.Crypto.Generators;
using WalkTogether.Data;
using WalkTogetherAPI.DTO;
using WalkTogetherAPI.Helpers;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration; 
    private readonly TokenHelper _tokenHelper;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
        _tokenHelper = new TokenHelper(_configuration);
    }

    // 1. REGISTER
    public async Task<Guid> RegisterAsync(RegisterRequest request)
    {
        // DÜZELTİLEN KISIM BURASI:
        string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var sql = "SELECT auth_register(@p0, @p1, @p2, @p3, @p4) AS \"Value\"";

        try
        {
            var userId = await _context.Database
                .SqlQueryRaw<Guid>(sql,
                    request.FirstName,
                    request.LastName,
                    request.Username,
                    request.Email,
                    passwordHash)
                .FirstOrDefaultAsync();

            return userId;
        }
        catch (PostgresException ex)
        {
            if (ex.SqlState == "23505")
                throw new Exception("Bu e-posta veya kullanıcı adı zaten kullanımda.");

            throw;
        }
    }

    // 2. LOGIN
    public async Task<string> LoginAsync(LoginRequest request)
    {
        var sql = "SELECT * FROM auth_get_user_for_login(@p0) AS \"Value\"";

        var user = await _context.Database
            .SqlQueryRaw<UserLoginResult>(sql, request.Identifier)
            .FirstOrDefaultAsync();

        if (user == null)
            throw new Exception("Kullanıcı bulunamadı.");

   
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.password_hash);

        if (!isPasswordValid)
            throw new Exception("Hatalı şifre.");

        return _tokenHelper.GenerateJwtToken(user);
    }

    // 3. CHANGE PASSWORD
    public async Task<bool> ChangePasswordAsync(ChangePasswordRequest request)
    {
        // Önce kullanıcının mevcut şifresini kontrol etmek için kullanıcıyı çekmeliyiz
        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null) throw new Exception("Kullanıcı bulunamadı.");

        // Eski şifre doğru mu?
        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash)) 
            throw new Exception("Eski şifreniz hatalı.");

        // Yeni şifreyi hashle
        string newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        var sql = "SELECT * FROM user_change_password(@p0, @p1) AS \"Value\"";

        return await _context.Database
            .SqlQueryRaw<bool>(sql, request.UserId, newHash)
            .FirstOrDefaultAsync();
    }

 
    public async Task<bool> ChangeUsernameAsync(ChangeUsernameRequest request)
    {
        var sql = "SELECT * FROM user_change_username(@p0, @p1) AS \"Value\"";

        try
        {
            return await _context.Database
                .SqlQueryRaw<bool>(sql, request.UserId, request.NewUsername)
                .FirstOrDefaultAsync();
        }
        catch (PostgresException ex)
        {
            if (ex.SqlState == "23505")
                throw new Exception("Bu kullanıcı adı zaten kullanımda.");
            throw;
        }
    }

    // 4. GET USER PROFILE
    public async Task<UserProfileDto> GetUserProfileAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        
        if (user == null)
            throw new Exception("Kullanıcı bulunamadı.");

        return new UserProfileDto
        {
            UserId = user.Id,
            Username = user.Username,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            MotivationPoint = user.MotivationPoint,
            HasBadge = user.HasBadge
        };
    }
}