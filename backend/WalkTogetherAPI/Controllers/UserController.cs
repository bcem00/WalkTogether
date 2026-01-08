using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WalkTogetherAPI.DTO;


namespace WalkTogetherAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AuthService _authService;

        public UsersController(AuthService authService)
        {
            _authService = authService;
        }


        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = await _authService.RegisterAsync(request);
                return Ok(new { message = "Registration successful", userId = userId });
            }
            catch (Exception ex)
            {
                
                return BadRequest(new { message = ex.Message });
            }
        }

   
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var token = await _authService.LoginAsync(request);
                return Ok(new { token = token });
            }
            catch (Exception ex)
            {
                // Returns 401 Unauthorized for login failures
                return Unauthorized(new { message = ex.Message });
            }
        }

       


        [HttpPut("change-password")]
        [Authorize] 
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {

                var userIdFromToken = GetUserIdFromToken();
                request.UserId = userIdFromToken;

                var result = await _authService.ChangePasswordAsync(request);

                if (result)
                    return Ok(new { message = "Password changed successfully." });
                else
                    return BadRequest(new { message = "Failed to change password." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

  
        [HttpPut("change-username")]
        [Authorize] 
        public async Task<IActionResult> ChangeUsername([FromBody] ChangeUsernameRequest request)
        {
            try
            {
    
                var userIdFromToken = GetUserIdFromToken();
                request.UserId = userIdFromToken;

                var result = await _authService.ChangeUsernameAsync(request);

                if (result)
                    return Ok(new { message = "Username updated successfully." });
                else
                    return BadRequest(new { message = "Failed to update username." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userIdFromToken = GetUserIdFromToken();
                var profile = await _authService.GetUserProfileAsync(userIdFromToken);
                return Ok(profile);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        private Guid GetUserIdFromToken()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (idClaim == null || !Guid.TryParse(idClaim.Value, out Guid userId))
            {
                throw new UnauthorizedAccessException("Invalid token claims.");
            }
            return userId;
        }

        
    }
}