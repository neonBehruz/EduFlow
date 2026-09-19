using EduFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace EduFlow.Infrastructure.Hubs;

public interface IEduFlowClient
{
    Task ReceiveNotification(object notification);
    Task AttendanceUpdated(object attendanceData);
    Task PaymentStatusUpdated(object paymentData);
    Task DashboardRefreshed();
}

[Authorize]
public class EduFlowNotificationHub : Hub<IEduFlowClient>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<EduFlowNotificationHub> _logger;

    public EduFlowNotificationHub(ICurrentUserService currentUserService, ILogger<EduFlowNotificationHub> logger)
    {
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var orgId = _currentUserService.OrganizationId;
        var userId = _currentUserService.UserId;

        if (orgId.HasValue && orgId != Guid.Empty)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant_{orgId.Value}");
        }

        if (userId.HasValue && userId != Guid.Empty)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId.Value}");
        }

        _logger.LogInformation("SignalR Client connected: {ConnectionId} for User: {UserId}", Context.ConnectionId, userId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("SignalR Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
