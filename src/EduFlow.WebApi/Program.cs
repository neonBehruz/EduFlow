using System.Threading.RateLimiting;
using EduFlow.Application;
using EduFlow.Infrastructure;
using EduFlow.Infrastructure.Hubs;
using EduFlow.Infrastructure.Persistence;
using EduFlow.WebApi.Middleware;
using Microsoft.AspNetCore.RateLimiting;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// CORS for Frontend
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("EduFlowCorsPolicy", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Development fallback: allow common local dev ports with credentials
            policy.SetIsOriginAllowed(origin =>
            {
                if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return uri.Host == "localhost" || uri.Host == "127.0.0.1";
                }
                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        }
    });
});

// Hardened Kestrel Server options (Strip Server Header)
builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
});

// Rate Limiting (OWASP DoS & Abuse Protection)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 200,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });

    options.AddPolicy("auth-policy", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 30,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"success\":false,\"message\":\"So'rovlar soni belgilangan xavfsizlik me'yoridan oshdi (Rate Limit). Iltimos, 1 daqiqadan so'ng qayta urinib ko'ring.\",\"data\":null,\"errors\":[]}", 
            token);
    };

    options.AddPolicy("sms-policy", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<AntiXssMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("EduFlow SaaS Web API");
        options.WithTheme(ScalarTheme.Purple);
    });
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("EduFlowCorsPolicy");
app.UseRateLimiter();
app.UseStaticFiles();

app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapHub<EduFlowNotificationHub>("/hubs/notifications");

// Seed Database automatically on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<EduFlowDbContext>();
    var logger = services.GetRequiredService<ILogger<Program>>();
    await DbInitializer.SeedAsync(context, logger);
}

app.Run();
