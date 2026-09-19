using AutoMapper;
using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class ReportService : IReportService
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ReportService(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApiResponse<AttendanceReportDto>> GetAttendanceReportAsync(DateTime? startDate, DateTime? endDate, Guid? groupId)
    {
        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow;

        var lessonsQuery = _context.Lessons
            .Include(l => l.Group)
            .Include(l => l.Attendances)
            .Where(l => l.StartTime >= start && l.StartTime <= end)
            .AsQueryable();

        if (groupId.HasValue)
        {
            lessonsQuery = lessonsQuery.Where(l => l.GroupId == groupId.Value);
        }

        var lessons = await lessonsQuery.ToListAsync();
        var allAtt = lessons.SelectMany(l => l.Attendances).ToList();

        var totalPresent = allAtt.Count(a => a.Status == AttendanceStatus.Present);
        var totalAbsent = allAtt.Count(a => a.Status == AttendanceStatus.Absent);
        var totalLate = allAtt.Count(a => a.Status == AttendanceStatus.Late);
        var totalExcused = allAtt.Count(a => a.Status == AttendanceStatus.Excused);
        var total = allAtt.Count;

        var percentage = total > 0 ? Math.Round((decimal)(totalPresent + totalLate) / total * 100, 1) : 100;

        var groupSummaries = lessons
            .GroupBy(l => l.Group)
            .Select(g =>
            {
                var gAtt = g.SelectMany(l => l.Attendances).ToList();
                var gTotal = gAtt.Count;
                var gPres = gAtt.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
                var gPct = gTotal > 0 ? Math.Round((decimal)gPres / gTotal * 100, 1) : 100;
                return new GroupAttendanceSummaryDto(g.Key.Id, g.Key.Name, gTotal, gPres, gPct);
            }).ToList();

        return ApiResponse<AttendanceReportDto>.Ok(new AttendanceReportDto(
            lessons.Count,
            totalPresent,
            totalAbsent,
            totalLate,
            totalExcused,
            percentage,
            groupSummaries
        ));
    }

    public async Task<ApiResponse<PaymentReportDto>> GetPaymentReportAsync(DateTime? startDate, DateTime? endDate)
    {
        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow;

        var payments = await _context.Payments
            .Where(p => p.CreatedAt >= start && p.CreatedAt <= end)
            .ToListAsync();

        var totalPaid = payments.Where(p => p.Status == PaymentStatus.Paid).Sum(p => p.Amount);
        var totalPending = payments.Where(p => p.Status == PaymentStatus.Pending).Sum(p => p.Amount);
        var totalOverdue = payments.Where(p => p.Status == PaymentStatus.Overdue).Sum(p => p.Amount);

        var paidCount = payments.Count(p => p.Status == PaymentStatus.Paid);
        var pendingCount = payments.Count(p => p.Status == PaymentStatus.Pending);
        var overdueCount = payments.Count(p => p.Status == PaymentStatus.Overdue);

        var monthlyTrend = new List<MonthlyRevenueItemDto>();
        for (int i = 5; i >= 0; i--)
        {
            var mDate = DateTime.UtcNow.AddMonths(-i);
            var mStart = new DateTime(mDate.Year, mDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var mEnd = mStart.AddMonths(1);
            var mSum = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= mStart && p.PaymentDate < mEnd)
                .SumAsync(p => p.Amount);
            monthlyTrend.Add(new MonthlyRevenueItemDto(mStart.ToString("MMM"), mSum));
        }

        return ApiResponse<PaymentReportDto>.Ok(new PaymentReportDto(
            totalPaid,
            totalPending,
            totalOverdue,
            paidCount,
            pendingCount,
            overdueCount,
            monthlyTrend
        ));
    }

    public async Task<ApiResponse<StudentReportDto>> GetStudentReportAsync()
    {
        var students = await _context.Students
            .Include(s => s.Parent)
            .Include(s => s.GroupStudents).ThenInclude(gs => gs.Group)
            .Include(s => s.Attendances)
            .Include(s => s.Grades)
            .Include(s => s.Payments)
            .ToListAsync();

        var totalStudents = students.Count;
        var activeStudents = students.Count(s => s.IsActive);
        var inactiveStudents = totalStudents - activeStudents;

        var allGrades = students.SelectMany(s => s.Grades).ToList();
        var avgGrade = allGrades.Any() ? Math.Round(allGrades.Average(g => g.Score), 1) : 0;

        var allAtt = students.SelectMany(s => s.Attendances).ToList();
        var avgAtt = allAtt.Any() ? Math.Round((decimal)allAtt.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late) / allAtt.Count * 100, 1) : 100;

        var studentDtos = _mapper.Map<List<StudentDto>>(students);

        return ApiResponse<StudentReportDto>.Ok(new StudentReportDto(
            totalStudents,
            activeStudents,
            inactiveStudents,
            avgGrade,
            avgAtt,
            studentDtos
        ));
    }
}

public class SubscriptionService : ISubscriptionService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public SubscriptionService(IApplicationDbContext context, ICurrentUserService currentUser, IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<SubscriptionDto>> GetCurrentSubscriptionAsync()
    {
        if (!_currentUser.OrganizationId.HasValue) throw new ForbiddenException();

        var orgId = _currentUser.OrganizationId.Value;
        var subscription = await _context.Subscriptions
            .Include(s => s.SubscriptionPlan)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(s => s.OrganizationId == orgId);

        if (subscription == null)
        {
            var defaultPlan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Name == "TRIAL")
                ?? await _context.SubscriptionPlans.FirstAsync();
            subscription = new Subscription
            {
                OrganizationId = orgId,
                SubscriptionPlanId = defaultPlan.Id,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(30),
                Status = SubscriptionStatus.Trial,
                AutoRenew = true
            };
            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();
            subscription.SubscriptionPlan = defaultPlan;
        }

        var curStudents = await _context.Students.CountAsync(s => s.IsActive);
        var curTeachers = await _context.Teachers.CountAsync();
        var curGroups = await _context.Groups.CountAsync(g => g.IsActive);

        var dto = new SubscriptionDto(
            subscription.Id,
            subscription.OrganizationId,
            subscription.SubscriptionPlanId,
            subscription.SubscriptionPlan.Name,
            subscription.StartDate,
            subscription.EndDate,
            subscription.Status,
            subscription.AutoRenew,
            curStudents,
            curTeachers,
            curGroups,
            _mapper.Map<SubscriptionPlanDto>(subscription.SubscriptionPlan)
        );

        return ApiResponse<SubscriptionDto>.Ok(dto);
    }

    public async Task<List<SubscriptionPlanDto>> GetPlansAsync()
    {
        var plans = await _context.SubscriptionPlans.ToListAsync();
        return _mapper.Map<List<SubscriptionPlanDto>>(plans.OrderBy(p => p.MonthlyPrice).ToList());
    }

    public async Task ValidatePlanLimitAsync(string entityType)
    {
        if (!_currentUser.OrganizationId.HasValue) return;

        var subRes = await GetCurrentSubscriptionAsync();
        var sub = subRes.Data;
        if (sub == null) return;

        if (sub.Plan.Name == "PRO" || sub.Plan.Name == "UNLIMITED") return; // Unlimited

        switch (entityType.ToLower())
        {
            case "student":
                if (sub.CurrentStudentsCount >= sub.Plan.MaxStudents)
                {
                    throw new PlanLimitExceededException($"Sizning tarifingizda o'quvchilar soni limitiga ({sub.Plan.MaxStudents} ta) yetildi. Iltimos, tarifingizni yangilang.");
                }
                break;
            case "teacher":
                if (sub.CurrentTeachersCount >= sub.Plan.MaxTeachers)
                {
                    throw new PlanLimitExceededException($"Sizning tarifingizda o'qituvchilar soni limitiga ({sub.Plan.MaxTeachers} ta) yetildi. Iltimos, tarifingizni yangilang.");
                }
                break;
            case "group":
                if (sub.CurrentGroupsCount >= sub.Plan.MaxGroups)
                {
                    throw new PlanLimitExceededException($"Sizning tarifingizda guruhlar soni limitiga ({sub.Plan.MaxGroups} ta) yetildi. Iltimos, tarifingizni yangilang.");
                }
                break;
        }
    }

    public async Task<ApiResponse<bool>> UpgradePlanAsync(Guid planId)
    {
        if (!_currentUser.OrganizationId.HasValue) throw new ForbiddenException();

        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == planId);
        if (plan == null) throw new NotFoundException("Tarif rejasi topilmadi.");

        var currentSub = await _context.Subscriptions
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(s => s.OrganizationId == _currentUser.OrganizationId.Value);

        if (currentSub != null)
        {
            currentSub.SubscriptionPlanId = planId;
            currentSub.Status = SubscriptionStatus.Active;
            currentSub.EndDate = DateTime.UtcNow.AddMonths(1);
            currentSub.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.Subscriptions.Add(new Subscription
            {
                OrganizationId = _currentUser.OrganizationId.Value,
                SubscriptionPlanId = planId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Status = SubscriptionStatus.Active,
                AutoRenew = true
            });
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Tarif muvaffaqiyatli yangilandi.");
    }
}

public class OrganizationService : IOrganizationService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public OrganizationService(IApplicationDbContext context, ICurrentUserService currentUser, IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<OrganizationDto>> GetOrganizationDetailsAsync()
    {
        if (!_currentUser.OrganizationId.HasValue) throw new ForbiddenException();

        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == _currentUser.OrganizationId.Value);
        if (org == null) throw new NotFoundException("Tashkilot topilmadi.");

        return ApiResponse<OrganizationDto>.Ok(_mapper.Map<OrganizationDto>(org));
    }

    public async Task<ApiResponse<OrganizationDto>> UpdateOrganizationDetailsAsync(UpdateOrganizationDto dto)
    {
        if (!_currentUser.OrganizationId.HasValue) throw new ForbiddenException();

        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == _currentUser.OrganizationId.Value);
        if (org == null) throw new NotFoundException("Tashkilot topilmadi.");

        org.Name = dto.Name.Trim();
        org.Phone = dto.Phone.Trim();
        org.Email = dto.Email.Trim();
        org.Address = dto.Address.Trim();
        if (dto.LogoUrl != null) org.LogoUrl = dto.LogoUrl;
        org.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<OrganizationDto>.Ok(_mapper.Map<OrganizationDto>(org), "Tashkilot ma'lumotlari saqlandi.");
    }
}

public class SuperAdminService : ISuperAdminService
{
    private readonly IApplicationDbContext _context;

    public SuperAdminService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<SuperAdminStatsDto>> GetPlatformStatsAsync()
    {
        var totalOrgs = await _context.Organizations.CountAsync();
        var activeOrgs = await _context.Organizations.CountAsync(o => o.IsActive);
        var trialOrgs = await _context.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Trial);
        var totalStudents = await _context.Students.CountAsync();

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var totalRevenue = await _context.Payments.Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= startOfMonth).SumAsync(p => p.Amount);

        var recentOrgs = await _context.Organizations
            .Include(o => o.Subscriptions).ThenInclude(s => s.SubscriptionPlan)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new OrganizationSummaryDto(
                o.Id,
                o.Name,
                o.Email,
                o.Phone,
                o.IsActive,
                o.Subscriptions.OrderByDescending(s => s.CreatedAt).Select(s => s.SubscriptionPlan.Name).FirstOrDefault() ?? "Trial",
                o.Subscriptions.OrderByDescending(s => s.CreatedAt).Select(s => s.Status).FirstOrDefault(),
                o.CreatedAt
            ))
            .ToListAsync();

        return ApiResponse<SuperAdminStatsDto>.Ok(new SuperAdminStatsDto(
            totalOrgs,
            activeOrgs,
            trialOrgs,
            totalStudents,
            totalRevenue,
            recentOrgs
        ));
    }

    public async Task<List<OrganizationSummaryDto>> GetAllOrganizationsAsync()
    {
        return await _context.Organizations
            .Include(o => o.Subscriptions).ThenInclude(s => s.SubscriptionPlan)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrganizationSummaryDto(
                o.Id,
                o.Name,
                o.Email,
                o.Phone,
                o.IsActive,
                o.Subscriptions.OrderByDescending(s => s.CreatedAt).Select(s => s.SubscriptionPlan.Name).FirstOrDefault() ?? "Trial",
                o.Subscriptions.OrderByDescending(s => s.CreatedAt).Select(s => s.Status).FirstOrDefault(),
                o.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<ApiResponse<bool>> ToggleOrganizationStatusAsync(Guid organizationId)
    {
        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId);
        if (org == null) throw new NotFoundException("Tashkilot topilmadi.");

        org.IsActive = !org.IsActive;
        org.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, $"Tashkilot holati o'zgartirildi: {(org.IsActive ? "Faol" : "Nofaol")}");
    }

    public async Task<ApiResponse<bool>> ChangeOrganizationPlanAsync(Guid organizationId, Guid planId)
    {
        var sub = await _context.Subscriptions
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

        if (sub != null)
        {
            sub.SubscriptionPlanId = planId;
            sub.Status = SubscriptionStatus.Active;
            sub.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.Subscriptions.Add(new Subscription
            {
                OrganizationId = organizationId,
                SubscriptionPlanId = planId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Status = SubscriptionStatus.Active
            });
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Tashkilot tarifi muvaffaqiyatli yangilandi.");
    }
}

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public NotificationService(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task CreateNotificationAsync(Guid? studentId, Guid? parentId, string message, NotificationType type)
    {
        var notif = new Notification
        {
            StudentId = studentId,
            ParentId = parentId,
            Message = message,
            Type = type,
            IsSent = true,
            SentAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notif);
        await _context.SaveChangesAsync();
    }

    public async Task<PagedResult<NotificationDto>> GetNotificationsAsync(int page = 1, int pageSize = 20)
    {
        var query = _context.Notifications
            .Include(n => n.Student)
            .Include(n => n.Parent)
            .OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<NotificationDto>(_mapper.Map<List<NotificationDto>>(items), totalCount, page, pageSize);
    }
}
