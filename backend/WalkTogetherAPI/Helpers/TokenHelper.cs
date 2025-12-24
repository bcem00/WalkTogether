using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using WalkTogetherAPI.DTO;

namespace WalkTogetherAPI.Helpers
{
    public class TokenHelper
    {
        private readonly IConfiguration _configuration;

        // Constructor injection to access appsettings.json
        public TokenHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateJwtToken(UserLoginResult user)
        {
            // 1. Create Claims (Payload)
            // These are the details embedded inside the token
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.user_id.ToString()),
                new Claim(ClaimTypes.Name, user.username),
                new Claim(ClaimTypes.Role, user.role_name ?? "User") 
            };

            // 2. Get the Secret Key
            // This key is used to sign the token. It must match what is in Program.cs
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // 3. Create the Token
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2), // Token valid for 2 hours
                signingCredentials: creds
            );

            // 4. Write the Token to a string
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}