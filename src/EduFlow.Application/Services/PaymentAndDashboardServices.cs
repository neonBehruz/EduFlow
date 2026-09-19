using AutoMapper;
using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using EduFlow.Application.Common.Finance;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _auditLogService;

    public PaymentService(
        IApplicationDbContext context,
        IMapper mapper,
        ICurrentUserService currentUser,
        IAuditLogService auditLogService)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<PaymentDto>> GetPaymentsAsync(PaymentStatus? status, Guid? studentId, int page = 1, int pageSize = 20)
    {
        var query = _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Group)
            .Include(p => p.Teacher)
            .Include(p => p.Transactions)
            .AsQueryable();

        if (_currentUser.Role == UserRole.Student)
        {
            var currentStudent = await _context.Students.FirstOrDefaultAsync(s => s.UserId == _currentUser.UserId);
            if (currentStudent != null)
            {
                query = query.Where(p => p.StudentId == currentStudent.Id);
            }
            else
            {
                return new PagedResult<PaymentDto>(new List<PaymentDto>(), 0, page, pageSize);
            }
        }
        else if (studentId.HasValue)
        {
            query = query.Where(p => p.StudentId == studentId.Value);
        }

        if (status.HasValue) query = query.Where(p => p.Status == status.Value);

        var totalCount = await query.CountAsync();
        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<PaymentDto>(_mapper.Map<List<PaymentDto>>(payments), totalCount, page, pageSize);
    }

    public async Task<List<PaymentDto>> GetOverduePaymentsAsync()
    {
        var now = DateTime.UtcNow;
        var overduePayments = await _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Group)
            .Include(p => p.Teacher)
            .Include(p => p.Transactions)
            .Where(p => (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Overdue || p.Status == PaymentStatus.Partial) && p.DueDate < now && p.DebtAmount > 0)
            .OrderBy(p => p.DueDate)
            .ToListAsync();

        // Update status to Overdue if marked Pending
        bool changed = false;
        foreach (var p in overduePayments.Where(p => p.Status == PaymentStatus.Pending))
        {
            p.Status = PaymentStatus.Overdue;
            p.UpdatedAt = now;
            changed = true;
        }
        if (changed) await _context.SaveChangesAsync();

        return _mapper.Map<List<PaymentDto>>(overduePayments);
    }

    public async Task<List<PaymentDto>> GetUpcomingPaymentsAsync()
    {
        var now = DateTime.UtcNow;
        var inThreeDays = now.AddDays(3);
        var upcoming = await _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Group)
            .Include(p => p.Teacher)
            .Include(p => p.Transactions)
            .Where(p => (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Partial) && p.DueDate >= now && p.DueDate <= inThreeDays)
            .OrderBy(p => p.DueDate)
            .ToListAsync();

        return _mapper.Map<List<PaymentDto>>(upcoming);
    }

    public async Task<ApiResponse<PaymentDto>> GetPaymentByIdAsync(Guid id)
    {
        var payment = await _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Group)
            .Include(p => p.Teacher)
            .Include(p => p.Transactions)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null) throw new NotFoundException("To'lov topilmadi.");

        if (_currentUser.Role == UserRole.Student)
        {
            var currentStudent = await _context.Students.FirstOrDefaultAsync(s => s.UserId == _currentUser.UserId);
            if (currentStudent == null || payment.StudentId != currentStudent.Id)
            {
                throw new ForbiddenException("Faqat o'zingizga tegishli to'lov ma'lumotlarini ko'rishingiz mumkin.");
            }
        }

        return ApiResponse<PaymentDto>.Ok(_mapper.Map<PaymentDto>(payment));
    }

    public async Task<ApiResponse<PaymentDto>> CreatePaymentAsync(CreatePaymentDto dto)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue || orgId.Value == Guid.Empty)
        {
            throw new ForbiddenException("Tashkilot aniqlanmadi.");
        }

        if (dto.Amount.HasValue && dto.Amount.Value <= 0)
        {
            throw new ValidationException("To'lov summasi 0 dan katta bo'lishi kerak.");
        }

        if (dto.Amount.HasValue && dto.Amount.Value > 1_000_000_000m)
        {
            throw new ValidationException("To'lov summasi ruxsat etilgan maksimal miqdordan oshib ketdi.");
        }

        if (dto.InitialPaidAmount.HasValue && dto.InitialPaidAmount.Value < 0)
        {
            throw new ValidationException("Boshlang'ich to'lov summasi manfiy bo'lishi mumkin emas.");
        }

        var student = await _context.Students
            .Include(s => s.Parent)
            .Include(s => s.GroupStudents).ThenInclude(gs => gs.Group).ThenInclude(g => g.Teacher)
            .FirstOrDefaultAsync(s => s.Id == dto.StudentId && s.OrganizationId == orgId.Value);

        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        Group? group = null;
        if (dto.GroupId.HasValue)
        {
            group = await _context.Groups.Include(g => g.Teacher).FirstOrDefaultAsync(g => g.Id == dto.GroupId.Value && g.OrganizationId == orgId.Value);
        }
        if (group == null)
        {
            group = student.GroupStudents.Select(gs => gs.Group).FirstOrDefault();
        }

        var setting = await _context.FinanceSettings.FirstOrDefaultAsync(s => s.OrganizationId == orgId.Value);

        decimal basePrice = dto.Amount ?? group?.MonthlyFee ?? 450000m;

        // Determine family order
        int familyOrder = 1;
        if (student.ParentId.HasValue)
        {
            var siblings = await _context.Students
                .Where(s => s.ParentId == student.ParentId && s.IsActive && s.OrganizationId == orgId.Value)
                .OrderBy(s => s.EnrollmentDate)
                .Select(s => s.Id)
                .ToListAsync();

            var idx = siblings.IndexOf(student.Id);
            familyOrder = idx >= 0 ? idx + 1 : 1;
        }

        // Active individual discount
        var now = DateTime.UtcNow;
        var indivDiscount = await _context.StudentDiscounts
            .Where(sd => sd.StudentId == student.Id && sd.OrganizationId == orgId.Value && sd.IsActive && sd.StartDate <= now && (!sd.EndDate.HasValue || sd.EndDate.Value >= now))
            .OrderByDescending(sd => sd.DiscountPercentage)
            .FirstOrDefaultAsync();

        decimal? effectiveIndivPercent = dto.CustomDiscountPercent ?? indivDiscount?.DiscountPercentage;

        // Run calculation
        var discountResult = FinancialCalculator.CalculateDiscount(basePrice, effectiveIndivPercent, familyOrder, setting);

        Teacher? teacher = null;
        if (dto.TeacherId.HasValue)
        {
            teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == dto.TeacherId.Value && t.OrganizationId == orgId.Value);
        }
        if (teacher == null && group?.Teacher != null)
        {
            teacher = group.Teacher;
        }
        else if (teacher == null && group?.TeacherId != null)
        {
            teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == group.TeacherId && t.OrganizationId == orgId.Value);
        }

        decimal teacherPercent = teacher?.CustomSharePercentage ?? setting?.DefaultTeacherSharePercentage ?? 20m;

        decimal initialPaid = 0m;
        if (dto.InitialPaidAmount.HasValue && dto.InitialPaidAmount.Value > 0)
        {
            initialPaid = dto.InitialPaidAmount.Value;
        }
        else if (dto.Status == PaymentStatus.Paid)
        {
            initialPaid = discountResult.FinalAmount;
        }

        var debtResult = FinancialCalculator.CalculateDebtAndStatus(discountResult.FinalAmount, initialPaid, dto.DueDate);
        var shareResult = FinancialCalculator.CalculateShares(initialPaid, teacherPercent);

        using var dbTx = await _context.BeginTransactionAsync();

        var payment = new Payment
        {
            OrganizationId = orgId.Value,
            StudentId = dto.StudentId,
            GroupId = group?.Id,
            TeacherId = teacher?.Id,
            Amount = discountResult.FinalAmount,
            BasePrice = discountResult.BasePrice,
            DiscountPercent = discountResult.AppliedDiscountPercent,
            DiscountAmount = discountResult.DiscountAmount,
            FinalAmount = discountResult.FinalAmount,
            PaidAmount = initialPaid,
            DebtAmount = debtResult.DebtAmount,
            TeacherSharePercent = teacherPercent,
            TeacherShareAmount = shareResult.TeacherShareAmount,
            CenterShareAmount = shareResult.CenterShareAmount,
            PaymentDate = initialPaid > 0 ? (dto.PaymentDate ?? DateTime.UtcNow) : null,
            DueDate = dto.DueDate,
            Status = debtResult.Status,
            Description = dto.Description ?? (discountResult.DiscountType != "Chegirmasiz" ? $"Oylik to'lov ({discountResult.DiscountType})" : "Oylik to'lov")
        };

        _context.Payments.Add(payment);

        if (initialPaid > 0)
        {
            var tx = new PaymentTransaction
            {
                OrganizationId = orgId.Value,
                PaymentId = payment.Id,
                Amount = initialPaid,
                PaymentDate = payment.PaymentDate ?? DateTime.UtcNow,
                Method = dto.InitialMethod ?? PaymentMethod.Cash,
                Notes = "Boshlang'ich to'lov"
            };
            _context.PaymentTransactions.Add(tx);
        }

        await _context.SaveChangesAsync();
        await dbTx.CommitAsync();

        await _auditLogService.LogAsync(
            action: "PAYMENT_CREATED",
            resource: "Payment",
            resourceId: payment.Id.ToString(),
            details: $"O'quvchi: {student.FirstName} {student.LastName}, Summa: {payment.FinalAmount}, Boshlang'ich to'langan: {initialPaid}",
            organizationId: orgId.Value
        );

        return await GetPaymentByIdAsync(payment.Id);
    }

    public async Task<ApiResponse<PaymentDto>> UpdatePaymentAsync(Guid id, UpdatePaymentDto dto)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        if (dto.Amount <= 0)
        {
            throw new ValidationException("To'lov summasi 0 dan katta bo'lishi kerak.");
        }

        var payment = await _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Group)
            .Include(p => p.Transactions)
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId.Value);

        if (payment == null) throw new NotFoundException("To'lov topilmadi.");

        payment.Amount = dto.Amount;
        payment.FinalAmount = dto.Amount;
        payment.PaymentDate = dto.PaymentDate;
        payment.DueDate = dto.DueDate;
        payment.Status = dto.Status;
        payment.Description = dto.Description;
        payment.DebtAmount = Math.Max(0m, payment.FinalAmount - payment.PaidAmount);
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "PAYMENT_UPDATED",
            resource: "Payment",
            resourceId: payment.Id.ToString(),
            details: $"To'lov yangilandi: Summa={payment.Amount}, Holat={payment.Status}",
            organizationId: orgId.Value
        );

        return ApiResponse<PaymentDto>.Ok(_mapper.Map<PaymentDto>(payment), "To'lov ma'lumotlari yangilandi.");
    }

    public async Task<ApiResponse<PaymentDto>> UpdatePromiseDueDateAsync(Guid id, DateTime newDueDate, string? note)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        var payment = await _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Group)
            .Include(p => p.Transactions)
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId.Value);

        if (payment == null) throw new NotFoundException("To'lov topilmadi.");

        payment.DueDate = newDueDate;
        if (!string.IsNullOrWhiteSpace(note))
        {
            payment.Description = string.IsNullOrWhiteSpace(payment.Description)
                ? $"[Va'da qilingan sana: {newDueDate:dd.MM.yyyy}] {note}"
                : $"{payment.Description} | [Va'da: {newDueDate:dd.MM.yyyy}] {note}";
        }

        // If extended beyond now and was Overdue, restore to Partial or Pending
        if (newDueDate > DateTime.UtcNow && payment.Status == PaymentStatus.Overdue)
        {
            payment.Status = payment.PaidAmount > 0 ? PaymentStatus.Partial : PaymentStatus.Pending;
        }

        payment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "PROMISE_DATE_UPDATED",
            resource: "Payment",
            resourceId: payment.Id.ToString(),
            details: $"Yangi va'da muddati: {newDueDate:dd.MM.yyyy}",
            organizationId: orgId.Value
        );

        return ApiResponse<PaymentDto>.Ok(_mapper.Map<PaymentDto>(payment), "To'lov muddati va va'da qilingan sana muvaffaqiyatli saqlandi.");
    }

    public async Task<ApiResponse<bool>> MarkAsPaidAsync(Guid id)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        var payment = await _context.Payments
            .Include(p => p.Transactions)
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId.Value);

        if (payment == null) throw new NotFoundException("To'lov topilmadi.");

        using var dbTx = await _context.BeginTransactionAsync();

        decimal remainingDebt = Math.Max(0m, payment.FinalAmount - payment.PaidAmount);
        if (remainingDebt > 0)
        {
            var tx = new PaymentTransaction
            {
                OrganizationId = payment.OrganizationId,
                PaymentId = payment.Id,
                Amount = remainingDebt,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash,
                Notes = "To'liq to'landi deb belgilandi"
            };
            _context.PaymentTransactions.Add(tx);
        }

        payment.PaidAmount = payment.FinalAmount;
        payment.DebtAmount = 0m;
        payment.Status = PaymentStatus.Paid;
        payment.PaymentDate = DateTime.UtcNow;
        payment.UpdatedAt = DateTime.UtcNow;

        decimal teacherPercent = payment.TeacherSharePercent > 0 ? payment.TeacherSharePercent : 20m;
        var shares = FinancialCalculator.CalculateShares(payment.PaidAmount, teacherPercent);
        payment.TeacherShareAmount = shares.TeacherShareAmount;
        payment.CenterShareAmount = shares.CenterShareAmount;

        await _context.SaveChangesAsync();
        await dbTx.CommitAsync();

        await _auditLogService.LogAsync(
            action: "PAYMENT_MARKED_PAID",
            resource: "Payment",
            resourceId: payment.Id.ToString(),
            details: $"To'lov to'liq to'landi deb belgilandi (Summa: {payment.FinalAmount})",
            organizationId: orgId.Value
        );

        return ApiResponse<bool>.Ok(true, "To'lov to'liq qabul qilindi deb belgilandi.");
    }

    public async Task<ApiResponse<bool>> DeletePaymentAsync(Guid id)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId.Value);
        if (payment == null) throw new NotFoundException("To'lov topilmadi.");

        _context.Payments.Remove(payment);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "PAYMENT_DELETED",
            resource: "Payment",
            resourceId: payment.Id.ToString(),
            details: $"To'lov o'chirildi (Amount: {payment.Amount}, StudentId: {payment.StudentId})",
            organizationId: orgId.Value
        );

        return ApiResponse<bool>.Ok(true, "To'lov o'chirildi.");
    }
}

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public DashboardService(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var studentsCount = await _context.Students.CountAsync(s => s.IsActive);
        var teachersCount = await _context.Teachers.CountAsync();
        var groupsCount = await _context.Groups.CountAsync(g => g.IsActive);

        var todayLessonsRaw = await _context.Lessons
            .Include(l => l.Group).ThenInclude(g => g.Subject)
            .Include(l => l.Group).ThenInclude(g => g.Teacher)
            .Include(l => l.Group).ThenInclude(g => g.GroupStudents)
            .Include(l => l.Attendances)
            .Where(l => l.StartTime.Date == today)
            .OrderBy(l => l.StartTime)
            .ToListAsync();

        var todayLessons = _mapper.Map<List<LessonDto>>(todayLessonsRaw);

        var todayLessonIds = todayLessonsRaw.Select(l => l.Id).ToList();
        var todayAttendances = await _context.Attendances
            .Where(a => todayLessonIds.Contains(a.LessonId))
            .ToListAsync();

        var presentToday = todayAttendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
        var absentToday = todayAttendances.Count(a => a.Status == AttendanceStatus.Absent);
        var lateToday = todayAttendances.Count(a => a.Status == AttendanceStatus.Late);

        var pendingPaymentsCount = await _context.Payments.CountAsync(p => p.Status == PaymentStatus.Pending);
        var overduePaymentsCount = await _context.Payments.CountAsync(p => p.Status == PaymentStatus.Overdue || (p.Status == PaymentStatus.Pending && p.DueDate < now));

        var monthlyRevenue = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= startOfMonth)
            .SumAsync(p => p.Amount);

        var allAttCount = await _context.Attendances.CountAsync();
        var allPresentCount = await _context.Attendances.CountAsync(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
        var attRate = allAttCount > 0 ? Math.Round((decimal)allPresentCount / allAttCount * 100, 1) : 100;

        var recentPayments = _mapper.Map<List<PaymentDto>>(await _context.Payments
            .Include(p => p.Student)
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .ToListAsync());

        var overduePayments = _mapper.Map<List<PaymentDto>>(await _context.Payments
            .Include(p => p.Student)
            .Where(p => p.Status == PaymentStatus.Overdue || (p.Status == PaymentStatus.Pending && p.DueDate < now))
            .OrderBy(p => p.DueDate)
            .Take(5)
            .ToListAsync());

        // 6 months revenue chart
        var revenueChart = new List<MonthlyRevenueItemDto>();
        for (int i = 5; i >= 0; i--)
        {
            var mDate = now.AddMonths(-i);
            var mStart = new DateTime(mDate.Year, mDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var mEnd = mStart.AddMonths(1);
            var mSum = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= mStart && p.PaymentDate < mEnd)
                .SumAsync(p => p.Amount);
            revenueChart.Add(new MonthlyRevenueItemDto(mStart.ToString("MMM"), mSum));
        }

        // Student growth chart
        var growthChart = new List<StudentGrowthItemDto>();
        for (int i = 5; i >= 0; i--)
        {
            var mDate = now.AddMonths(-i);
            var mEnd = new DateTime(mDate.Year, mDate.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);
            var count = await _context.Students.CountAsync(s => s.EnrollmentDate < mEnd);
            growthChart.Add(new StudentGrowthItemDto(mDate.ToString("MMM"), count));
        }

        var stats = new DashboardStatsDto(
            studentsCount,
            teachersCount,
            groupsCount,
            todayLessons.Count,
            presentToday,
            absentToday,
            lateToday,
            pendingPaymentsCount,
            overduePaymentsCount,
            monthlyRevenue,
            attRate,
            todayLessons,
            recentPayments,
            overduePayments,
            revenueChart,
            growthChart
        );

        return ApiResponse<DashboardStatsDto>.Ok(stats);
    }
}
