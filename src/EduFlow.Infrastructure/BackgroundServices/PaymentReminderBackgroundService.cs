using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EduFlow.Infrastructure.BackgroundServices;

public class PaymentReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PaymentReminderBackgroundService> _logger;

    public PaymentReminderBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<PaymentReminderBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PaymentReminderBackgroundService ishga tushdi.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPaymentRemindersAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PaymentReminderBackgroundService da to'lov eslatmalarini tekshirishda xatolik.");
            }

            // Run once every 12 hours
            await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
        }
    }

    private async Task ProcessPaymentRemindersAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var telegramService = scope.ServiceProvider.GetRequiredService<ITelegramService>();
        var smsService = scope.ServiceProvider.GetRequiredService<ISmsService>();

        var now = DateTime.UtcNow;
        var inThreeDays = now.AddDays(3);

        // Find upcoming pending/partial payments due within 3 days
        var upcomingPayments = await context.Payments
            .Where(p => (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Partial) && p.DueDate >= now && p.DueDate <= inThreeDays && p.DebtAmount > 0)
            .Select(p => p.Id)
            .ToListAsync();

        // Find overdue payments (due date passed and debt remains)
        var overduePayments = await context.Payments
            .Where(p => (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Overdue || p.Status == PaymentStatus.Partial) && p.DueDate < now && p.DebtAmount > 0)
            .Select(p => p.Id)
            .ToListAsync();

        foreach (var paymentId in upcomingPayments.Concat(overduePayments).Distinct())
        {
            try
            {
                // Send Telegram reminder
                await telegramService.SendPaymentReminderAsync(paymentId);

                // Automated SMS reminder when due date has passed
                if (overduePayments.Contains(paymentId))
                {
                    await smsService.SendPaymentReminderSmsAsync(paymentId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "To'lov eslatmasini yuborishda xatolik (PaymentId: {Id})", paymentId);
            }
        }
    }
}
