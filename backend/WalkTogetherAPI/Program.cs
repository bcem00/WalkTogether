using Microsoft.EntityFrameworkCore;
using WalkTogether.Data;
using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WalkTogetherAPI.Helpers;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Services (BEFORE Build)
// -------------------------------------------------------------------------

// --- 1. ADIM: CORS SERVİSİNİ EKLEYİN ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()   // Her yerden gelen isteğe izin ver (Geliştirme aşaması için)
                   .AllowAnyMethod()   // GET, POST, PUT, DELETE vb. hepsine izin ver
                   .AllowAnyHeader();  // Authorization vb. tüm başlıklara izin ver
        });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register your custom services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<EventService>();
builder.Services.AddScoped<TokenHelper>();
builder.Services.AddHttpClient<WalkTogetherAPI.Services.GoogleRoutesService>();

// --- AUTHENTICATION CONFIGURATION ---
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
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});

// 2. Build the App
// -------------------------------------------------------------------------
var app = builder.Build();

// 3. Middleware & Initialization (AFTER Build)
// -------------------------------------------------------------------------

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
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



// --- 2. ADIM: CORS MIDDLEWARE'I EKLEYİN ---
// ÖNEMLİ: UseAuthentication ve UseAuthorization'dan ÖNCE gelmelidir.
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();