using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Finance;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class FinanceService : IFinanceService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _auditLogService;

    public FinanceService(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAuditLogService auditLogService)
    {
        _context = context;
        _currentUser = currentUser;
        _auditLogService = auditLogService;
    }

    private Guid GetOrgId()
    {
        if (!_currentUser.OrganizationId.HasValue) throw new ForbiddenException("Tashkilot aniqlanmadi.");
        return _currentUser.OrganizationId.Value;
    }

    private async Task<FinanceSetting> GetOrCreateSettingEntityAsync(Guid orgId)
    {
        var setting = await _context.FinanceSettings.FirstOrDefaultAsync(s => s.OrganizationId == orgId);
        if (setting == null)
        {
            setting = new FinanceSetting
            {
                OrganizationId = orgId,
                DefaultTeacherSharePercentage = 20m,
                FamilyDiscount2ndStudent = 10m,
                FamilyDiscount3rdStudent = 15m,
                FamilyDiscount4thPlusStudent = 20m,
                DiscountConflictRule = DiscountConflictRule.HighestDiscount,
                ExcusedAbsenceRefundEnabled = true
            };
            _context.FinanceSettings.Add(setting);
            await _context.SaveChangesAsync();
        }
        return setting;
    }

    public async Task<ApiResponse<FinanceSettingDto>> GetFinanceSettingsAsync()
    {
        var orgId = GetOrgId();
        var setting = await GetOrCreateSettingEntityAsync(orgId);

        return ApiResponse<FinanceSettingDto>.Ok(new FinanceSettingDto(
            setting.Id,
            setting.OrganizationId,
            setting.DefaultTeacherSharePercentage,
            setting.FamilyDiscount2ndStudent,
            setting.FamilyDiscount3rdStudent,
            setting.FamilyDiscount4thPlusStudent,
            setting.DiscountConflictRule,
            setting.ExcusedAbsenceRefundEnabled
        ));
    }

    public async Task<ApiResponse<FinanceSettingDto>> UpdateFinanceSettingsAsync(UpdateFinanceSettingDto dto)
    {
        var orgId = GetOrgId();
        var setting = await GetOrCreateSettingEntityAsync(orgId);

        setting.DefaultTeacherSharePercentage = Math.Clamp(dto.DefaultTeacherSharePercentage, 0m, 100m);
        setting.FamilyDiscount2ndStudent = Math.Clamp(dto.FamilyDiscount2ndStudent, 0m, 100m);
        setting.FamilyDiscount3rdStudent = Math.Clamp(dto.FamilyDiscount3rdStudent, 0m, 100m);
        setting.FamilyDiscount4thPlusStudent = Math.Clamp(dto.FamilyDiscount4thPlusStudent, 0m, 100m);
        setting.DiscountConflictRule = dto.DiscountConflictRule;
        setting.ExcusedAbsenceRefundEnabled = dto.ExcusedAbsenceRefundEnabled;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "FINANCE_SETTINGS_UPDATED",
            resource: "FinanceSetting",
            resourceId: setting.Id.ToString(),
            details: $"Sozlamalar yangilandi: O'qituvchi ulushi={setting.DefaultTeacherSharePercentage}%, Qoida={setting.DiscountConflictRule}",
            organizationId: orgId
        );

        return ApiResponse<FinanceSettingDto>.Ok(new FinanceSettingDto(
            setting.Id,
            setting.OrganizationId,
            setting.DefaultTeacherSharePercentage,
            setting.FamilyDiscount2ndStudent,
            setting.FamilyDiscount3rdStudent,
            setting.FamilyDiscount4thPlusStudent,
            setting.DiscountConflictRule,
            setting.ExcusedAbsenceRefundEnabled
        ), "Moliyaviy sozlamalar muvaffaqiyatli yangilandi.");
    }

    public async Task<ApiResponse<PaymentCalculationPreviewDto>> PreviewPaymentCalculationAsync(
        Guid studentId,
        Guid? groupId,
        decimal? customDiscountPercent)
    {
        var orgId = GetOrgId();
        var setting = await GetOrCreateSettingEntityAsync(orgId);

        var student = await _context.Students
            .Include(s => s.Parent)
            .Include(s => s.GroupStudents).ThenInclude(gs => gs.Group).ThenInclude(g => g.Teacher)
            .FirstOrDefaultAsync(s => s.Id == studentId && s.OrganizationId == orgId);

        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        Group? group = null;
        if (groupId.HasValue)
        {
            group = await _context.Groups.Include(g => g.Teacher).FirstOrDefaultAsync(g => g.Id == groupId.Value && g.OrganizationId == orgId);
        }
        if (group == null)
        {
            group = student.GroupStudents.Select(gs => gs.Group).FirstOrDefault();
        }

        decimal basePrice = group?.MonthlyFee ?? 450000m;

        // Family calculation: count siblings sharing ParentId
        int familyOrder = 1;
        if (student.ParentId.HasValue)
        {
            var siblings = await _context.Students
                .Where(s => s.ParentId == student.ParentId && s.IsActive && s.OrganizationId == orgId)
                .OrderBy(s => s.EnrollmentDate)
                .Select(s => s.Id)
                .ToListAsync();

            var idx = siblings.IndexOf(student.Id);
            familyOrder = idx >= 0 ? idx + 1 : 1;
        }

        // Active individual discount
        var now = DateTime.UtcNow;
        var indivDiscount = await _context.StudentDiscounts
            .Where(sd => sd.StudentId == studentId && sd.OrganizationId == orgId && sd.IsActive && sd.StartDate <= now && (!sd.EndDate.HasValue || sd.EndDate.Value >= now))
            .OrderByDescending(sd => sd.DiscountPercentage)
            .FirstOrDefaultAsync();

        decimal? effectiveIndivPercent = customDiscountPercent ?? indivDiscount?.DiscountPercentage;

        var discountResult = FinancialCalculator.CalculateDiscount(basePrice, effectiveIndivPercent, familyOrder, setting);

        Teacher? teacher = group?.Teacher;
        if (teacher == null && group?.TeacherId != null)
        {
            teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == group.TeacherId && t.OrganizationId == orgId);
        }
        decimal teacherPercent = teacher?.CustomSharePercentage ?? setting.DefaultTeacherSharePercentage;
        var shareResult = FinancialCalculator.CalculateShares(discountResult.FinalAmount, teacherPercent);

        return ApiResponse<PaymentCalculationPreviewDto>.Ok(new PaymentCalculationPreviewDto(
            StudentId: student.Id,
            StudentName: $"{student.FirstName} {student.LastName}".Trim(),
            GroupId: group?.Id,
            GroupName: group?.Name,
            TeacherId: teacher?.Id,
            TeacherName: teacher?.FullName,
            BasePrice: discountResult.BasePrice,
            FamilyStudentOrder: familyOrder,
            FamilyDiscountPercent: discountResult.FamilyDiscountPercent,
            IndividualDiscountPercent: discountResult.IndividualDiscountPercent,
            AppliedDiscountPercent: discountResult.AppliedDiscountPercent,
            DiscountType: discountResult.DiscountType,
            DiscountAmount: discountResult.DiscountAmount,
            FinalAmount: discountResult.FinalAmount,
            TeacherSharePercent: teacherPercent,
            EstimatedTeacherShare: shareResult.TeacherShareAmount,
            EstimatedCenterShare: shareResult.CenterShareAmount
        ));
    }

    public async Task<ApiResponse<PaymentTransactionDto>> AddPaymentTransactionAsync(CreatePaymentTransactionDto dto)
    {
        var orgId = GetOrgId();

        if (dto.Amount <= 0)
        {
            throw new ValidationException("To'lov summasi 0 dan katta bo'lishi kerak.");
        }

        if (dto.Amount > 1_000_000_000m)
        {
            throw new ValidationException("To'lov summasi ruxsat etilgan maksimal miqdordan oshib ketdi.");
        }

        using var dbTx = await _context.BeginTransactionAsync();

        // DUPLICATE PAYMENT IDEMPOTENCY PROTECTION
        if (!string.IsNullOrWhiteSpace(dto.IdempotencyKey))
        {
            var existingTx = await _context.PaymentTransactions
                .Include(pt => pt.Payment)
                .FirstOrDefaultAsync(pt => pt.OrganizationId == orgId && pt.IdempotencyKey == dto.IdempotencyKey);

            if (existingTx != null)
            {
                await dbTx.RollbackAsync();
                return ApiResponse<PaymentTransactionDto>.Ok(new PaymentTransactionDto(
                    existingTx.Id,
                    existingTx.PaymentId,
                    existingTx.Amount,
                    existingTx.PaymentDate,
                    existingTx.Method,
                    existingTx.IdempotencyKey,
                    existingTx.Notes
                ), "To'lov allaqachon qabul qilingan (takroriy so'rov oldi olindi).");
            }
        }

        var payment = await _context.Payments
            .Include(p => p.Transactions)
            .FirstOrDefaultAsync(p => p.Id == dto.PaymentId && p.OrganizationId == orgId);

        if (payment == null)
        {
            await dbTx.RollbackAsync();
            throw new NotFoundException("To'lov qaydi topilmadi.");
        }

        var tx = new PaymentTransaction
        {
            OrganizationId = orgId,
            PaymentId = dto.PaymentId,
            Amount = dto.Amount,
            PaymentDate = DateTime.UtcNow,
            Method = dto.Method,
            IdempotencyKey = dto.IdempotencyKey,
            Notes = dto.Notes
        };

        _context.PaymentTransactions.Add(tx);

        // Recalculate payment totals
        decimal newPaidAmount = payment.PaidAmount + dto.Amount;
        payment.PaidAmount = newPaidAmount;

        var debtResult = FinancialCalculator.CalculateDebtAndStatus(payment.FinalAmount, payment.PaidAmount, payment.DueDate);
        payment.DebtAmount = debtResult.DebtAmount;
        payment.Status = debtResult.Status;
        payment.PaymentDate = DateTime.UtcNow;
        payment.UpdatedAt = DateTime.UtcNow;

        // Recalculate teacher & center shares deterministically from historical snapshot TeacherSharePercent
        decimal teacherPercent = payment.TeacherSharePercent > 0 ? payment.TeacherSharePercent : 20m;
        var shares = FinancialCalculator.CalculateShares(payment.PaidAmount, teacherPercent);
        payment.TeacherShareAmount = shares.TeacherShareAmount;
        payment.CenterShareAmount = shares.CenterShareAmount;

        await _context.SaveChangesAsync();
        await dbTx.CommitAsync();

        await _auditLogService.LogAsync(
            action: "TRANSACTION_ADDED",
            resource: "PaymentTransaction",
            resourceId: tx.Id.ToString(),
            details: $"PaymentId={payment.Id}, Amount={tx.Amount}, Method={tx.Method}, IdempotencyKey={tx.IdempotencyKey}",
            organizationId: orgId
        );

        return ApiResponse<PaymentTransactionDto>.Ok(new PaymentTransactionDto(
            tx.Id,
            tx.PaymentId,
            tx.Amount,
            tx.PaymentDate,
            tx.Method,
            tx.IdempotencyKey,
            tx.Notes
        ), "To'lov muvaffaqiyatli qabul qilindi.");
    }

    public async Task<ApiResponse<List<PaymentTransactionDto>>> GetPaymentTransactionsAsync(Guid paymentId)
    {
        var transactions = await _context.PaymentTransactions
            .Where(pt => pt.PaymentId == paymentId)
            .OrderByDescending(pt => pt.PaymentDate)
            .Select(pt => new PaymentTransactionDto(
                pt.Id,
                pt.PaymentId,
                pt.Amount,
                pt.PaymentDate,
                pt.Method,
                pt.IdempotencyKey,
                pt.Notes
            ))
            .ToListAsync();

        return ApiResponse<List<PaymentTransactionDto>>.Ok(transactions);
    }

    public async Task<ApiResponse<List<StudentDiscountDto>>> GetStudentDiscountsAsync(Guid? studentId)
    {
        var query = _context.StudentDiscounts
            .Include(sd => sd.Student)
            .AsQueryable();

        if (studentId.HasValue) query = query.Where(sd => sd.StudentId == studentId.Value);

        var list = await query
            .OrderByDescending(sd => sd.CreatedAt)
            .Select(sd => new StudentDiscountDto(
                sd.Id,
                sd.StudentId,
                $"{sd.Student.FirstName} {sd.Student.LastName}".Trim(),
                sd.DiscountPercentage,
                sd.StartDate,
                sd.EndDate,
                sd.Reason,
                sd.IsActive
            ))
            .ToListAsync();

        return ApiResponse<List<StudentDiscountDto>>.Ok(list);
    }

    public async Task<ApiResponse<StudentDiscountDto>> CreateStudentDiscountAsync(CreateStudentDiscountDto dto)
    {
        var orgId = GetOrgId();
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == dto.StudentId && s.OrganizationId == orgId);
        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        if (dto.DiscountPercentage < 0 || dto.DiscountPercentage > 100)
        {
            throw new ValidationException("Chegirma foizi 0 dan 100 gacha bo'lishi shart.");
        }

        var sd = new StudentDiscount
        {
            OrganizationId = orgId,
            StudentId = dto.StudentId,
            DiscountPercentage = dto.DiscountPercentage,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Reason = dto.Reason.Trim(),
            IsActive = true
        };

        _context.StudentDiscounts.Add(sd);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "STUDENT_DISCOUNT_CREATED",
            resource: "StudentDiscount",
            resourceId: sd.Id.ToString(),
            details: $"O'quvchi: {student.FirstName} {student.LastName}, Foiz: {sd.DiscountPercentage}%, Sabab: {sd.Reason}",
            organizationId: orgId
        );

        return ApiResponse<StudentDiscountDto>.Ok(new StudentDiscountDto(
            sd.Id,
            sd.StudentId,
            $"{student.FirstName} {student.LastName}".Trim(),
            sd.DiscountPercentage,
            sd.StartDate,
            sd.EndDate,
            sd.Reason,
            sd.IsActive
        ), "Individual chegirma saqlandi.");
    }

    public async Task<ApiResponse<bool>> DeleteStudentDiscountAsync(Guid id)
    {
        var orgId = GetOrgId();
        var sd = await _context.StudentDiscounts.FirstOrDefaultAsync(d => d.Id == id && d.OrganizationId == orgId);
        if (sd == null) throw new NotFoundException("Chegirma topilmadi.");

        _context.StudentDiscounts.Remove(sd);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "STUDENT_DISCOUNT_DELETED",
            resource: "StudentDiscount",
            resourceId: sd.Id.ToString(),
            details: $"Chegirma o'chirildi (StudentId: {sd.StudentId})",
            organizationId: orgId
        );

        return ApiResponse<bool>.Ok(true, "Chegirma o'chirildi.");
    }

    public async Task<ApiResponse<List<CenterExpenseDto>>> GetCenterExpensesAsync(DateTime? startDate, DateTime? endDate)
    {
        var orgId = GetOrgId();
        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow.AddDays(1);

        var expenses = await _context.CenterExpenses
            .Where(e => e.OrganizationId == orgId && e.ExpenseDate >= start && e.ExpenseDate <= end)
            .OrderByDescending(e => e.ExpenseDate)
            .Select(e => new CenterExpenseDto(
                e.Id,
                e.OrganizationId,
                e.Category,
                e.Amount,
                e.ExpenseDate,
                e.Description
            ))
            .ToListAsync();

        return ApiResponse<List<CenterExpenseDto>>.Ok(expenses);
    }

    public async Task<ApiResponse<CenterExpenseDto>> CreateCenterExpenseAsync(CreateCenterExpenseDto dto)
    {
        var orgId = GetOrgId();

        if (dto.Amount <= 0)
        {
            throw new ValidationException("Xarajat summasi 0 dan katta bo'lishi kerak.");
        }

        if (dto.Amount > 1_000_000_000m)
        {
            throw new ValidationException("Xarajat summasi ruxsat etilgan maksimal miqdordan oshib ketdi.");
        }

        var expense = new CenterExpense
        {
            OrganizationId = orgId,
            Category = dto.Category.Trim(),
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate,
            Description = dto.Description.Trim()
        };

        _context.CenterExpenses.Add(expense);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "EXPENSE_CREATED",
            resource: "CenterExpense",
            resourceId: expense.Id.ToString(),
            details: $"Kategoriya: {expense.Category}, Summa: {expense.Amount}, Tavsif: {expense.Description}",
            organizationId: orgId
        );

        return ApiResponse<CenterExpenseDto>.Ok(new CenterExpenseDto(
            expense.Id,
            expense.OrganizationId,
            expense.Category,
            expense.Amount,
            expense.ExpenseDate,
            expense.Description
        ), "Xarajat qayd etildi.");
    }

    public async Task<ApiResponse<bool>> DeleteCenterExpenseAsync(Guid id)
    {
        var orgId = GetOrgId();
        var expense = await _context.CenterExpenses.FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId);
        if (expense == null) throw new NotFoundException("Xarajat topilmadi.");

        _context.CenterExpenses.Remove(expense);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "EXPENSE_DELETED",
            resource: "CenterExpense",
            resourceId: expense.Id.ToString(),
            details: $"Xarajat o'chirildi (Category: {expense.Category}, Amount: {expense.Amount})",
            organizationId: orgId
        );

        return ApiResponse<bool>.Ok(true, "Xarajat o'chirildi.");
    }

    public async Task<ApiResponse<FinanceSummaryReportDto>> GetFinanceSummaryReportAsync(DateTime? startDate, DateTime? endDate)
    {
        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow.AddDays(1);

        var payments = await _context.Payments
            .Where(p => p.CreatedAt >= start && p.CreatedAt <= end)
            .ToListAsync();

        var expenses = await _context.CenterExpenses
            .Where(e => e.ExpenseDate >= start && e.ExpenseDate <= end)
            .OrderByDescending(e => e.ExpenseDate)
            .Take(10)
            .Select(e => new CenterExpenseDto(e.Id, e.OrganizationId, e.Category, e.Amount, e.ExpenseDate, e.Description))
            .ToListAsync();

        decimal totalExpected = payments.Sum(p => p.FinalAmount > 0 ? p.FinalAmount : p.Amount);
        decimal totalCollected = payments.Sum(p => p.PaidAmount > 0 ? p.PaidAmount : (p.Status == PaymentStatus.Paid ? p.Amount : 0m));
        decimal totalDebt = payments.Sum(p => p.DebtAmount > 0 ? p.DebtAmount : (p.Status != PaymentStatus.Paid ? p.Amount : 0m));
        decimal totalTeacherShares = payments.Sum(p => p.TeacherShareAmount > 0 ? p.TeacherShareAmount : Math.Round((p.Status == PaymentStatus.Paid ? p.Amount : 0m) * 0.20m, 2));
        decimal centerGross = Math.Max(0m, totalCollected - totalTeacherShares);

        var totalExpensesSum = await _context.CenterExpenses
            .Where(e => e.ExpenseDate >= start && e.ExpenseDate <= end)
            .SumAsync(e => e.Amount);

        decimal netProfit = centerGross - totalExpensesSum;

        var teacherSalariesRes = await GetTeacherSalaryReportAsync(startDate, endDate);

        return ApiResponse<FinanceSummaryReportDto>.Ok(new FinanceSummaryReportDto(
            TotalExpectedRevenue: totalExpected,
            TotalCollectedRevenue: totalCollected,
            TotalDebtAmount: totalDebt,
            TotalTeacherShares: totalTeacherShares,
            CenterGrossMargin: centerGross,
            TotalCenterExpenses: totalExpensesSum,
            NetProfit: netProfit,
            TeacherSalaries: teacherSalariesRes.Data ?? new List<TeacherSalaryReportItemDto>(),
            RecentExpenses: expenses
        ));
    }

    public async Task<ApiResponse<List<TeacherSalaryReportItemDto>>> GetTeacherSalaryReportAsync(DateTime? startDate, DateTime? endDate)
    {
        var orgId = GetOrgId();
        var setting = await GetOrCreateSettingEntityAsync(orgId);

        var teachers = await _context.Teachers
            .Include(t => t.Groups).ThenInclude(g => g.GroupStudents)
            .ToListAsync();

        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow.AddDays(1);

        var payments = await _context.Payments
            .Where(p => p.CreatedAt >= start && p.CreatedAt <= end)
            .ToListAsync();

        var result = new List<TeacherSalaryReportItemDto>();

        foreach (var teacher in teachers)
        {
            decimal sharePercent = teacher.CustomSharePercentage ?? setting.DefaultTeacherSharePercentage;
            var groupIds = teacher.Groups.Select(g => g.Id).ToList();

            // Strict teacher attribution: payments explicitly assigned to this teacher (or fallback to historical group assignment)
            var teacherPayments = payments.Where(p => 
                (p.TeacherId.HasValue && p.TeacherId.Value == teacher.Id) ||
                (!p.TeacherId.HasValue && p.GroupId.HasValue && groupIds.Contains(p.GroupId.Value))
            ).ToList();

            decimal totalCollected = teacherPayments.Sum(p => p.PaidAmount > 0 ? p.PaidAmount : (p.Status == PaymentStatus.Paid ? p.Amount : 0m));
            decimal totalCourseFees = teacherPayments.Sum(p => p.FinalAmount > 0 ? p.FinalAmount : p.Amount);

            // Calculate salary from each payment's immutable snapshot TeacherShareAmount
            decimal salary = teacherPayments.Sum(p => p.TeacherShareAmount > 0 
                ? p.TeacherShareAmount 
                : Math.Round((p.PaidAmount > 0 ? p.PaidAmount : (p.Status == PaymentStatus.Paid ? p.Amount : 0m)) * (p.TeacherSharePercent > 0 ? p.TeacherSharePercent / 100m : sharePercent / 100m), 2, MidpointRounding.AwayFromZero));

            decimal centerRetained = Math.Max(0m, totalCollected - salary);

            int totalStudents = teacher.Groups.SelectMany(g => g.GroupStudents).Select(gs => gs.StudentId).Distinct().Count();

            result.Add(new TeacherSalaryReportItemDto(
                TeacherId: teacher.Id,
                TeacherName: teacher.FullName,
                PhoneNumber: teacher.PhoneNumber,
                SharePercentage: sharePercent,
                ActiveGroupsCount: teacher.Groups.Count(g => g.IsActive),
                TotalStudentsCount: totalStudents,
                TotalCourseFees: totalCourseFees,
                TotalCollectedFromStudents: totalCollected,
                TeacherSalaryAmount: salary,
                CenterRetainedAmount: centerRetained
            ));
        }

        return ApiResponse<List<TeacherSalaryReportItemDto>>.Ok(result);
    }
}
