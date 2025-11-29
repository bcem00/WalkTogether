using Microsoft.EntityFrameworkCore;
using WalkTogether.Data;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// 1. DB Context Ekleme (PostgreSQL)
// appsettings.json dosyasýndaki "DefaultConnection" okunur.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. MediatR Kaydý (CQRS için)
// Mevcut Assembly'deki tüm Handler'larý otomatik bulur.
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

// 3. Controller ve Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. VERÝTABANI OLUÞTURMA (Otomatik Migration)
// Uygulama her baþladýðýnda veritabanýný kontrol eder ve günceller.
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        // Yazdýðýmýz Initializer'ý çaðýrýyoruz
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Veritabaný oluþturulurken bir hata meydana geldi.");
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