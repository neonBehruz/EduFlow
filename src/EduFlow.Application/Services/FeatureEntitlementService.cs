using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class FeatureEntitlementService : IFeatureEntitlementService
{
    private readonly IApplicationDbContext _context;

    public FeatureEntitlementService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<FeatureEntitlementDto>> GetEntitlementsAsync()
    {
        var subscription = await _context.Subscriptions
            .AsNoTracking()
            .Include(s => s.SubscriptionPlan)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        var plan = subscription?.SubscriptionPlan;

        var studentsCount = await _context.Students.AsNoTracking().CountAsync(s => s.IsActive);
        var teachersCount = await _context.Teachers.AsNoTracking().CountAsync();
        var groupsCount = await _context.Groups.AsNoTracking().CountAsync(g => g.IsActive);

        var isPro = plan != null && (plan.Name.Contains("PRO", StringComparison.OrdinalIgnoreCase) || plan.MonthlyPrice > 200000);
        var isStarter = plan != null && (plan.Name.Contains("STARTER", StringComparison.OrdinalIgnoreCase) || plan.MonthlyPrice > 0);

        var dto = new FeatureEntitlementDto(
            CanUseCRM: isPro || isStarter,
            CanUseSMS: isPro,
            CanUseTelegram: plan?.HasTelegram ?? true,
            CanUseAnalytics: plan?.HasAdvancedAnalytics ?? isPro,
            CanUseBranches: isPro,
            CanUseOnlinePayments: isPro,
            CanUsePayroll: isPro || isStarter,
            MaxStudents: plan?.MaxStudents ?? 50,
            MaxTeachers: plan?.MaxTeachers ?? 5,
            MaxGroups: plan?.MaxGroups ?? 10,
            CurrentStudents: studentsCount,
            CurrentTeachers: teachersCount,
            CurrentGroups: groupsCount
        );

        return ApiResponse<FeatureEntitlementDto>.Ok(dto);
    }

    public async Task<bool> CanUseFeatureAsync(string featureKey)
    {
        var entitlements = (await GetEntitlementsAsync()).Data;
        if (entitlements == null) return true;

        return featureKey.ToLower() switch
        {
            "crm" => entitlements.CanUseCRM,
            "sms" => entitlements.CanUseSMS,
            "telegram" => entitlements.CanUseTelegram,
            "analytics" => entitlements.CanUseAnalytics,
            "branches" => entitlements.CanUseBranches,
            "payments" or "onlinepayments" => entitlements.CanUseOnlinePayments,
            "payroll" => entitlements.CanUsePayroll,
            _ => true
        };
    }

    public async Task ValidateLimitAsync(string limitKey)
    {
        var ent = (await GetEntitlementsAsync()).Data;
        if (ent == null) return;

        switch (limitKey.ToLower())
        {
            case "students":
                if (ent.CurrentStudents >= ent.MaxStudents)
                {
                    throw new BadRequestException($"Tarif bo'yicha o'quvchilar soni chekloviga yetildi ({ent.MaxStudents} ta). Tarifni yangilang.");
                }
                break;
            case "teachers":
                if (ent.CurrentTeachers >= ent.MaxTeachers)
                {
                    throw new BadRequestException($"Tarif bo'yicha o'qituvchilar soni chekloviga yetildi ({ent.MaxTeachers} ta). Tarifni yangilang.");
                }
                break;
            case "groups":
                if (ent.CurrentGroups >= ent.MaxGroups)
                {
                    throw new BadRequestException($"Tarif bo'yicha guruhlar soni chekloviga yetildi ({ent.MaxGroups} ta). Tarifni yangilang.");
                }
                break;
        }
    }
}
