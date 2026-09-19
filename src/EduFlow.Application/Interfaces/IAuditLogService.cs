namespace EduFlow.Application.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(
        string action,
        string resource,
        string? resourceId = null,
        string? details = null,
        Guid? organizationId = null,
        Guid? userId = null,
        string? userEmail = null,
        string? ipAddress = null);
}
