using Microsoft.EntityFrameworkCore;
using WalkTogether.Data;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// 1. DB Context Ekleme (PostgreSQL)
// appsettings.json dosyas�ndaki "DefaultConnection" okunur.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. MediatR Kayd� (CQRS i�in)
// Mevcut Assembly'deki t�m Handler'lar� otomatik bulur.
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

// 3. Controller ve Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<AuthService>();
builder.Services.AddHttpClient<WalkTogetherAPI.Services.GoogleRoutesService>();

var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        // Yazd���m�z Initializer'� asenkron olarak çağırıyoruz
        await WalkTogether.Data.DbInitializer.InitializeAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Veritaban� olu�turulurken bir hata meydana geldi.");
    }
}

// Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();