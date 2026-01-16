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

        
        public TokenHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateJwtToken(UserLoginResult user)
        {
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.user_id.ToString()),
                new Claim(ClaimTypes.Name, user.username),
                new Claim(ClaimTypes.Role, user.role_name ?? "User") 
            };

            
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2), 
                signingCredentials: creds
            );

            

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

           

            return tokenString;
        }
    }
}