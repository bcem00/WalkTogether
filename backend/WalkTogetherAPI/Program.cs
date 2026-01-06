using Microsoft.EntityFrameworkCore;
using WalkTogether.Data;
using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WalkTogetherAPI.Helpers; // Ensure this is using your TokenHelper namespace

var builder = WebApplication.CreateBuilder(args);

// 1. Add Services (BEFORE Build)
// -------------------------------------------------------------------------

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register your custom services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<EventService>();
builder.Services.AddScoped<TokenHelper>(); // Don't forget to register TokenHelper itself!
builder.Services.AddHttpClient<WalkTogetherAPI.Services.GoogleRoutesService>();

// --- AUTHENTICATION CONFIGURATION ---
// This matches the logic in your TokenHelper.cs
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        // These must match appsettings.json
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],

        // This Key must match the one in TokenHelper
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});

// 2. Build the App
// -------------------------------------------------------------------------
var app = builder.Build();

// 3. Middleware & Initialization (AFTER Build)
// -------------------------------------------------------------------------

// Database Initialization (using scope)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        // Ensure migration/creation exists
        // await context.Database.MigrateAsync(); // Optional: Use this instead of EnsureCreated for migrations
        await WalkTogether.Data.DbInitializer.InitializeAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Veritabani olusturulurken bir hata meydana geldi.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// IMPORTANT: Authentication must come BEFORE Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();