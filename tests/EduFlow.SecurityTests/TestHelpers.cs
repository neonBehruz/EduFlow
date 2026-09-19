using AutoMapper;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Application.Mapping;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using EduFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EduFlow.SecurityTests;

public class TestCurrentUserService : ICurrentUserService
{
    public Guid? UserId { get; set; } = Guid.NewGuid();
    public Guid? OrganizationId { get; set; } = Guid.NewGuid();
    public UserRole? Role { get; set; } = UserRole.CenterAdmin;
    public string? Email { get; set; } = "admin@test.com";
    public bool IsAuthenticated => UserId.HasValue;
}

public class TestTenantService : ITenantService
{
    public Guid? CurrentOrganizationId { get; set; } = Guid.NewGuid();
    public void SetTenant(Guid organizationId) => CurrentOrganizationId = organizationId;
}

public class TestAuditLogService : IAuditLogService
{
    public List<AuditLog> Logs { get; } = new();

    public Task LogAsync(
        string action,
        string resource,
        string? resourceId = null,
        string? details = null,
        Guid? organizationId = null,
        Guid? userId = null,
        string? userEmail = null,
        string? ipAddress = null)
    {
        Logs.Add(new AuditLog
        {
            Action = action,
            Resource = resource,
            ResourceId = resourceId,
            Details = details,
            OrganizationId = organizationId,
            UserId = userId,
            UserEmail = userEmail,
            IpAddress = ipAddress,
            CreatedAt = DateTime.UtcNow
        });
        return Task.CompletedTask;
    }
}

public class TestTelegramService : ITelegramService
{
    public Task<bool> SendMessageAsync(string chatId, string message) => Task.FromResult(true);
    public Task<bool> SendStudentAttendanceAlertAsync(Guid studentId, string lessonTopic, AttendanceStatus status) => Task.FromResult(true);
    public Task<bool> SendPaymentReminderAsync(Guid paymentId) => Task.FromResult(true);
    public Task<bool> SendGradeAlertAsync(Guid gradeId) => Task.FromResult(true);
}

public class TestNotificationService : INotificationService
{
    public Task CreateNotificationAsync(Guid? studentId, Guid? parentId, string message, NotificationType type) => Task.CompletedTask;
    public Task<PagedResult<NotificationDto>> GetNotificationsAsync(int page = 1, int pageSize = 20)
        => Task.FromResult(new PagedResult<NotificationDto>(new List<NotificationDto>(), 0, page, pageSize));
}

public class TestSubscriptionService : ISubscriptionService
{
    public Task<ApiResponse<SubscriptionDto>> GetCurrentSubscriptionAsync()
        => Task.FromResult(ApiResponse<SubscriptionDto>.Ok(null!));
    public Task<List<SubscriptionPlanDto>> GetPlansAsync()
        => Task.FromResult(new List<SubscriptionPlanDto>());
    public Task<ApiResponse<bool>> UpgradePlanAsync(Guid planId)
        => Task.FromResult(ApiResponse<bool>.Ok(true));
    public Task ValidatePlanLimitAsync(string resourceType) => Task.CompletedTask;
}

public class TestSecurityLockoutService : ISecurityLockoutService
{
    public Task<bool> IsLockedOutAsync(string key) => Task.FromResult(false);
    public Task<TimeSpan?> GetRemainingLockoutTimeAsync(string key) => Task.FromResult<TimeSpan?>(null);
    public Task RecordFailedAttemptAsync(string key) => Task.CompletedTask;
    public Task ResetFailedAttemptsAsync(string key) => Task.CompletedTask;
}

public static class TestDbContextFactory
{
    public static (EduFlowDbContext Context, IMapper Mapper) CreateContext(TestCurrentUserService currentUser)
    {
        var options = new DbContextOptionsBuilder<EduFlowDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .EnableServiceProviderCaching(false)
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        var tenantService = new TestTenantService { CurrentOrganizationId = currentUser.OrganizationId };
        var context = new EduFlowDbContext(options, tenantService, currentUser);

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());
        var provider = services.BuildServiceProvider();
        var mapper = provider.GetRequiredService<IMapper>();

        return (context, mapper);
    }
}
