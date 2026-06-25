using System.Text;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SavingsApp.API.Data;
using SavingsApp.API.Jobs;
using SavingsApp.API.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

// ---- EF Core ----
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(
    connectionString,
    npgsql => npgsql.EnableRetryOnFailure(
        maxRetryCount: 8,
        maxRetryDelay: TimeSpan.FromSeconds(3),
        errorCodesToAdd: null)));

// ---- Auth (JWT Bearer) ----
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret))
    throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

// ---- Application services ----
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISchedulerService, SchedulerService>();
builder.Services.AddScoped<DebitJob>();

// Typed HttpClient integrations.
builder.Services.AddHttpClient<IGoCardlessService, GoCardlessService>();
builder.Services.AddHttpClient<ISwanService, SwanService>();

// ---- Hangfire (PostgreSQL storage) ----
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(opt => opt.UseNpgsqlConnection(connectionString)));
builder.Services.AddHangfireServer();

// ---- CORS (dev: allow the Expo web client to call the API) ----
const string DevCorsPolicy = "DevCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy => policy
        .SetIsOriginAllowed(_ => true)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// ---- MVC + Swagger ----
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "SavingsApp API", Version = "v1" });
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", scheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { [scheme] = Array.Empty<string>() });
});

var app = builder.Build();

// ---- Migrate + seed (Development) ----
// Retry the initial connect so a transient DB hiccup at startup doesn't crash the host.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    const int maxAttempts = 15;
    for (var attempt = 1; ; attempt++)
    {
        try
        {
            db.Database.Migrate();
            if (app.Environment.IsDevelopment())
                await db.SeedAsync();
            break;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            startupLogger.LogWarning("DB not ready (attempt {Attempt}/{Max}): {Message}. Retrying…",
                attempt, maxAttempts, ex.Message);
            await Task.Delay(TimeSpan.FromSeconds(2));
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors(DevCorsPolicy);
}

app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire");
app.MapControllers();

app.Run();

// Exposed for WebApplicationFactory-based integration tests.
public partial class Program { }
