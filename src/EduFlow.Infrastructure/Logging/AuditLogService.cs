using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EduFlow.Infrastructure.Logging;

public class AuditLogService : IAuditLogService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditLogService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogAsync(
        string action,
        string resource,
        string? resourceId = null,
        string? details = null,
        Guid? organizationId = null,
        Guid? userId = null,
        string? userEmail = null,
        string? ipAddress = null)
    {
        try
        {
            var orgId = organizationId ?? _currentUser.OrganizationId;
            var uId = userId ?? _currentUser.UserId;
            var email = userEmail ?? _currentUser.Email;
            var ip = ipAddress ?? _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();

            var log = new AuditLog
            {
                OrganizationId = orgId,
                UserId = uId,
                UserEmail = email,
                Action = action,
                Resource = resource,
                ResourceId = resourceId,
                Details = details,
                IpAddress = ip,
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Security Audit: Action={Action} Resource={Resource} ResourceId={ResourceId} OrgId={OrgId} UserId={UserId}",
                action, resource, resourceId, orgId, uId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record security audit log for {Action} on {Resource}", action, resource);
        }
    }
}
