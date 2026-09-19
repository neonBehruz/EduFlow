using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class ExtendedDashboardService : IExtendedDashboardService
{
    private readonly IApplicationDbContext _context;

    public ExtendedDashboardService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<ExtendedDashboardStatsDto>> GetExtendedDashboardStatsAsync(DashboardFilterRequestDto request)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1).AddTicks(-1);

        // Date filter calculation
        DateTime filterStart;
        DateTime filterEnd = now;

        switch (request.Range?.ToLower())
        {
            case "today":
                filterStart = todayStart;
                filterEnd = todayEnd;
                break;
            case "7d":
                filterStart = now.AddDays(-7);
                break;
            case "30d":
                filterStart = now.AddDays(-30);
                break;
            case "3m":
                filterStart = now.AddMonths(-3);
                break;
            case "6m":
                filterStart = now.AddMonths(-6);
                break;
            case "1y":
                filterStart = now.AddYears(-1);
                break;
            case "custom":
                filterStart = request.StartDate ?? now.AddDays(-30);
                filterEnd = request.EndDate ?? now;
                break;
            default:
                filterStart = now.AddDays(-30);
                break;
        }

        // Students metrics
        var allStudents = await _context.Students.AsNoTracking().ToListAsync();
        var studentsCount = allStudents.Count;
        var activeStudentsCount = allStudents.Count(s => s.IsActive);
        var inactiveStudentsCount = allStudents.Count(s => !s.IsActive);

        // Teachers & Groups
        var teachersCount = await _context.Teachers.AsNoTracking().CountAsync();
        var groupsCount = await _context.Groups.AsNoTracking().CountAsync(g => g.IsActive);

        // Today's Lessons & Attendance
        var todayLessons = await _context.Lessons
            .AsNoTracking()
            .Where(l => l.StartTime >= todayStart && l.StartTime <= todayEnd)
            .Include(l => l.Group)
            .ThenInclude(g => g.Teacher)
            .Include(l => l.Group)
            .ThenInclude(g => g.Subject)
            .Include(l => l.Room)
            .OrderBy(l => l.StartTime)
            .ToListAsync();

        var todayLessonsCount = todayLessons.Count;
        var todayLessonIds = todayLessons.Select(l => l.Id).ToList();

        var todayAttendances = await _context.Attendances
            .AsNoTracking()
            .Where(a => todayLessonIds.Contains(a.LessonId))
            .ToListAsync();

        var todayPresent = todayAttendances.Count(a => a.Status == AttendanceStatus.Present);
        var todayAbsent = todayAttendances.Count(a => a.Status == AttendanceStatus.Absent);
        var todayLate = todayAttendances.Count(a => a.Status == AttendanceStatus.Late);
        var todayExcused = todayAttendances.Count(a => a.Status == AttendanceStatus.Excused);

        // Revenue in filtered period
        var filteredPayments = await _context.Payments
            .AsNoTracking()
            .Where(p => p.PaymentDate >= filterStart && p.PaymentDate <= filterEnd && p.Status == PaymentStatus.Paid)
            .ToListAsync();

        var monthlyRevenue = filteredPayments.Sum(p => p.PaidAmount);

        // Expenses in filtered period
        var filteredExpenses = await _context.CenterExpenses
            .AsNoTracking()
            .Where(e => e.ExpenseDate >= filterStart && e.ExpenseDate <= filterEnd)
            .ToListAsync();

        var monthlyExpenses = filteredExpenses.Sum(e => e.Amount);
        var netProfit = monthlyRevenue - monthlyExpenses;

        // Outstanding/Overdue debt
        var outstandingPayments = await _context.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Overdue || p.Status == PaymentStatus.Partial)
            .SumAsync(p => p.DebtAmount > 0 ? p.DebtAmount : p.FinalAmount - p.PaidAmount);

        // CRM Leads & Trials in period
        var newLeadsCount = await _context.Leads
            .AsNoTracking()
            .Where(l => l.CreatedAt >= filterStart && l.CreatedAt <= filterEnd)
            .CountAsync();

        var trialLessonsCount = await _context.TrialLessons
            .AsNoTracking()
            .Where(tl => tl.ScheduledDate >= filterStart && tl.ScheduledDate <= filterEnd)
            .CountAsync();

        // Attendance Rate
        var allPeriodAttendances = await _context.Attendances
            .AsNoTracking()
            .Where(a => a.CreatedAt >= filterStart && a.CreatedAt <= filterEnd)
            .ToListAsync();

        var totalAtt = allPeriodAttendances.Count;
        var presentAtt = allPeriodAttendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
        var attendanceRate = totalAtt > 0 ? Math.Round((decimal)presentAtt / totalAtt * 100, 1) : 100m;

        // Student Retention Rate: active / total
        var retentionRate = studentsCount > 0 ? Math.Round((decimal)activeStudentsCount / studentsCount * 100, 1) : 100m;

        // At-risk students count (students with attendance < 70% or overdue payment)
        var overdueStudentIds = await _context.Payments
            .AsNoTracking()
            .Where(p => (p.Status == PaymentStatus.Overdue || (p.Status == PaymentStatus.Pending && p.DueDate < now)) && p.DebtAmount > 0)
            .Select(p => p.StudentId)
            .Distinct()
            .ToListAsync();

        var atRiskCount = overdueStudentIds.Count;

        // Period Revenue Chart (grouped by month or week)
        var revenueChart = new List<MonthlyRevenueItemDto>();
        var expensesChart = new List<MonthlyRevenueItemDto>();
        var profitChart = new List<MonthlyRevenueItemDto>();

        for (int i = 5; i >= 0; i--)
        {
            var mStart = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            var mEnd = mStart.AddMonths(1).AddTicks(-1);
            var mLabel = mStart.ToString("MMM yyyy");

            var mRev = await _context.Payments
                .AsNoTracking()
                .Where(p => p.PaymentDate >= mStart && p.PaymentDate <= mEnd && p.Status == PaymentStatus.Paid)
                .SumAsync(p => p.PaidAmount);

            var mExp = await _context.CenterExpenses
                .AsNoTracking()
                .Where(e => e.ExpenseDate >= mStart && e.ExpenseDate <= mEnd)
                .SumAsync(e => e.Amount);

            revenueChart.Add(new MonthlyRevenueItemDto(mLabel, mRev));
            expensesChart.Add(new MonthlyRevenueItemDto(mLabel, mExp));
            profitChart.Add(new MonthlyRevenueItemDto(mLabel, mRev - mExp));
        }

        // Recent Payments
        var recentPaymentsEntities = await _context.Payments
            .AsNoTracking()
            .Include(p => p.Student)
            .Include(p => p.Group)
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .ToListAsync();

        var recentPayments = recentPaymentsEntities.Select(p => new PaymentDto
        {
            Id = p.Id,
            StudentId = p.StudentId,
            StudentName = $"{p.Student.FirstName} {p.Student.LastName}",
            StudentPhone = p.Student.PhoneNumber,
            Amount = p.Amount,
            BasePrice = p.BasePrice,
            DiscountPercent = p.DiscountPercent,
            DiscountAmount = p.DiscountAmount,
            FinalAmount = p.FinalAmount,
            PaidAmount = p.PaidAmount,
            DebtAmount = p.DebtAmount,
            TeacherSharePercent = p.TeacherSharePercent,
            TeacherShareAmount = p.TeacherShareAmount,
            CenterShareAmount = p.CenterShareAmount,
            GroupId = p.GroupId,
            GroupName = p.Group?.Name,
            PaymentDate = p.PaymentDate,
            DueDate = p.DueDate,
            Status = p.Status,
            Description = p.Description,
            CreatedAt = p.CreatedAt
        }).ToList();

        // Overdue Payments
        var overdueEntities = await _context.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Overdue || (p.Status == PaymentStatus.Pending && p.DueDate < now))
            .Include(p => p.Student)
            .Include(p => p.Group)
            .OrderBy(p => p.DueDate)
            .Take(5)
            .ToListAsync();

        var overduePayments = overdueEntities.Select(p => new PaymentDto
        {
            Id = p.Id,
            StudentId = p.StudentId,
            StudentName = $"{p.Student.FirstName} {p.Student.LastName}",
            StudentPhone = p.Student.PhoneNumber,
            Amount = p.Amount,
            BasePrice = p.BasePrice,
            DiscountPercent = p.DiscountPercent,
            DiscountAmount = p.DiscountAmount,
            FinalAmount = p.FinalAmount,
            PaidAmount = p.PaidAmount,
            DebtAmount = p.DebtAmount,
            TeacherSharePercent = p.TeacherSharePercent,
            TeacherShareAmount = p.TeacherShareAmount,
            CenterShareAmount = p.CenterShareAmount,
            GroupId = p.GroupId,
            GroupName = p.Group?.Name,
            PaymentDate = p.PaymentDate,
            DueDate = p.DueDate,
            Status = p.Status,
            Description = p.Description,
            CreatedAt = p.CreatedAt
        }).ToList();

        var todayLessonsDto = todayLessons.Select(l => new LessonDto
        {
            Id = l.Id,
            GroupId = l.GroupId,
            GroupName = l.Group.Name,
            SubjectName = l.Group.Subject?.Name,
            TeacherName = l.Group.Teacher?.FullName ?? l.Teacher?.FullName,
            StartTime = l.StartTime,
            EndTime = l.EndTime,
            Topic = l.Topic,
            Status = l.Status,
            TotalStudents = 0,
            PresentCount = 0,
            AbsentCount = 0
        }).ToList();

        var stats = new ExtendedDashboardStatsDto(
            StudentsCount: studentsCount,
            ActiveStudentsCount: activeStudentsCount,
            InactiveStudentsCount: inactiveStudentsCount,
            TeachersCount: teachersCount,
            GroupsCount: groupsCount,
            TodayLessonsCount: todayLessonsCount,
            TodayPresent: todayPresent,
            TodayAbsent: todayAbsent,
            TodayLate: todayLate,
            TodayExcused: todayExcused,
            MonthlyRevenue: monthlyRevenue,
            MonthlyExpenses: monthlyExpenses,
            NetProfit: netProfit,
            OutstandingPayments: outstandingPayments,
            NewLeadsCount: newLeadsCount,
            TrialLessonsCount: trialLessonsCount,
            AttendanceRate: attendanceRate,
            StudentRetentionRate: retentionRate,
            AtRiskStudentsCount: atRiskCount,
            PeriodRevenueChart: revenueChart,
            PeriodExpensesChart: expensesChart,
            NetProfitChart: profitChart,
            TodayLessons: todayLessonsDto,
            RecentPayments: recentPayments,
            OverduePayments: overduePayments
        );

        return ApiResponse<ExtendedDashboardStatsDto>.Ok(stats);
    }
}
