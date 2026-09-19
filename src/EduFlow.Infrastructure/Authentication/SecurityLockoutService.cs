using System.Collections.Concurrent;
using EduFlow.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace EduFlow.Infrastructure.Authentication;

public class SecurityLockoutService : ISecurityLockoutService
{
    private readonly ILogger<SecurityLockoutService> _logger;

    private class AttemptRecord
    {
        public int FailedCount { get; set; }
        public DateTime FirstAttemptAt { get; set; }
        public DateTime? LockedUntil { get; set; }
    }

    private static readonly ConcurrentDictionary<string, AttemptRecord> Records = new(StringComparer.OrdinalIgnoreCase);
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan WindowPeriod = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public SecurityLockoutService(ILogger<SecurityLockoutService> logger)
    {
        _logger = logger;
    }

    public Task<bool> IsLockedOutAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) return Task.FromResult(false);

        if (Records.TryGetValue(key, out var record))
        {
            if (record.LockedUntil.HasValue)
            {
                if (DateTime.UtcNow < record.LockedUntil.Value)
                {
                    return Task.FromResult(true);
                }
                else
                {
                    // Lockout period has elapsed, clear record
                    Records.TryRemove(key, out _);
                }
            }
        }

        return Task.FromResult(false);
    }

    public Task<TimeSpan?> GetRemainingLockoutTimeAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) return Task.FromResult<TimeSpan?>(null);

        if (Records.TryGetValue(key, out var record) && record.LockedUntil.HasValue)
        {
            var remaining = record.LockedUntil.Value - DateTime.UtcNow;
            if (remaining > TimeSpan.Zero)
            {
                return Task.FromResult<TimeSpan?>(remaining);
            }
        }

        return Task.FromResult<TimeSpan?>(null);
    }

    public Task RecordFailedAttemptAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) return Task.CompletedTask;

        var now = DateTime.UtcNow;
        Records.AddOrUpdate(key,
            _ => new AttemptRecord
            {
                FailedCount = 1,
                FirstAttemptAt = now
            },
            (_, existing) =>
            {
                // Reset window if it has expired
                if (now - existing.FirstAttemptAt > WindowPeriod)
                {
                    existing.FailedCount = 1;
                    existing.FirstAttemptAt = now;
                    existing.LockedUntil = null;
                }
                else
                {
                    existing.FailedCount++;
                    if (existing.FailedCount >= MaxFailedAttempts)
                    {
                        existing.LockedUntil = now.Add(LockoutDuration);
                        _logger.LogWarning("Xavfsizlik ogohlantirishi: '{Key}' hisobi/IPsi ko'p martalik xato urinishlar tufayli 15 daqiqaga bloklandi!", key);
                    }
                }
                return existing;
            });

        return Task.CompletedTask;
    }

    public Task ResetFailedAttemptsAsync(string key)
    {
        if (!string.IsNullOrWhiteSpace(key))
        {
            Records.TryRemove(key, out _);
        }
        return Task.CompletedTask;
    }
}
