using System.Text;
using EduFlow.Application.Interfaces;
using EduFlow.Application.Interfaces.Repositories;
using EduFlow.Infrastructure.Authentication;
using EduFlow.Infrastructure.BackgroundServices;
using EduFlow.Infrastructure.Persistence;
using EduFlow.Infrastructure.Persistence.Repositories;
using EduFlow.Infrastructure.PaymentProviders;
using EduFlow.Infrastructure.Sms;
using EduFlow.Infrastructure.Telegram;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace EduFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Database Configuration (PostgreSQL with SQLite fallback for local developer workstations)
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=EduFlow.db";

        services.AddDbContext<EduFlowDbContext>(options =>
        {
            if (connectionString.Contains("Host=") || connectionString.Contains("Server=") || connectionString.Contains("Port="))
            {
                options.UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(EduFlowDbContext).Assembly.FullName));
            }
            else
            {
                options.UseSqlite(connectionString, b => b.MigrationsAssembly(typeof(EduFlowDbContext).Assembly.FullName));
            }

            options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        });

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<EduFlowDbContext>());

        // Repositories & UnitOfWork
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<ITeacherRepository, TeacherRepository>();
        services.AddScoped<IGroupRepository, GroupRepository>();
        services.AddScoped<ILessonRepository, LessonRepository>();
        services.AddScoped<IAttendanceRepository, AttendanceRepository>();
        services.AddScoped<IGradeRepository, GradeRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<ISubjectRepository, SubjectRepository>();
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();

        // 2. Auth & Multi-Tenancy Services
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<ISecurityLockoutService, SecurityLockoutService>();
        services.AddScoped<IAuditLogService, EduFlow.Infrastructure.Logging.AuditLogService>();

        // 3. Telegram & SMS Services
        services.AddHttpClient<ITelegramService, TelegramService>();
        services.AddHttpClient<ISmsService, EskizSmsService>();

        // 3.1 Payment Providers & Factory
        services.AddScoped<IPaymentProvider, EduFlow.Infrastructure.PaymentProviders.PaymePaymentProvider>();
        services.AddScoped<IPaymentProvider, EduFlow.Infrastructure.PaymentProviders.ClickPaymentProvider>();
        services.AddScoped<IPaymentProvider, EduFlow.Infrastructure.PaymentProviders.UzumPaymentProvider>();
        services.AddScoped<IPaymentProvider, EduFlow.Infrastructure.PaymentProviders.BankTransferPaymentProvider>();
        services.AddScoped<IPaymentProvider, EduFlow.Infrastructure.PaymentProviders.CashPaymentProvider>();
        services.AddScoped<EduFlow.Infrastructure.PaymentProviders.IPaymentProviderFactory, EduFlow.Infrastructure.PaymentProviders.PaymentProviderFactory>();

        // 3.2 Real-time SignalR
        services.AddSignalR();

        // 4. Background Services
        services.AddHostedService<PaymentReminderBackgroundService>();

        // 5. JWT Authentication
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET") 
            ?? configuration["Jwt:Secret"] 
            ?? "EduFlowSuperSecretKeyForSaaSApplication2026!DefaultKey12345";
        var issuer = configuration["Jwt:Issuer"] ?? "EduFlowApi";
        var audience = configuration["Jwt:Audience"] ?? "EduFlowClient";

        var isDevelopment = string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Development", StringComparison.OrdinalIgnoreCase);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = !isDevelopment;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorization();

        return services;
    }
}
