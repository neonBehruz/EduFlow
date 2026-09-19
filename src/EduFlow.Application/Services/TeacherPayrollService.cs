using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class TeacherPayrollService : ITeacherPayrollService
{
    private readonly IApplicationDbContext _context;

    public TeacherPayrollService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<TeacherPayrollDto>> CalculatePayrollAsync(CalculatePayrollDto dto)
    {
        var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == dto.TeacherId);
        if (teacher == null) throw new NotFoundException("O'qituvchi topilmadi.");

        var monthStart = new DateTime(dto.Year, dto.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddTicks(-1);

        // 1. Lessons taught by this teacher in the month
        var lessons = await _context.Lessons
            .AsNoTracking()
            .Where(l => (l.TeacherId == teacher.Id || (l.Group != null && l.Group.TeacherId == teacher.Id)) &&
                        l.StartTime >= monthStart && l.StartTime <= monthEnd &&
                        l.Status == LessonStatus.Completed)
            .ToListAsync();

        var lessonsTaught = lessons.Count;

        // 2. Groups & active students count
        var groups = await _context.Groups
            .AsNoTracking()
            .Where(g => g.TeacherId == teacher.Id && g.IsActive)
            .Include(g => g.GroupStudents)
            .ToListAsync();

        var studentCount = groups.Sum(g => g.GroupStudents.Count);

        // 3. Collected revenue for teacher's groups/lessons
        var groupIds = groups.Select(g => g.Id).ToList();
        var payments = await _context.Payments
            .AsNoTracking()
            .Where(p => (p.TeacherId == teacher.Id || (p.GroupId.HasValue && groupIds.Contains(p.GroupId.Value))) &&
                        p.PaymentDate >= monthStart && p.PaymentDate <= monthEnd &&
                        p.Status == PaymentStatus.Paid)
            .ToListAsync();

        var totalRevenue = payments.Sum(p => p.PaidAmount);

        // Share percentage
        var sharePercent = dto.CustomSharePercentage ?? teacher.CustomSharePercentage ?? 25m;

        // Salary calculation based on type
        decimal calculatedSalary = 0m;
        switch (dto.CalculationType)
        {
            case PayrollType.FixedSalary:
                calculatedSalary = dto.FixedBaseSalary ?? 3000000m;
                break;
            case PayrollType.Percentage:
                calculatedSalary = Math.Round(totalRevenue * (sharePercent / 100m), 2);
                break;
            case PayrollType.PerLesson:
                var ratePerLesson = dto.FixedBaseSalary ?? 100000m; // Default per-lesson fee
                calculatedSalary = lessonsTaught * ratePerLesson;
                break;
            case PayrollType.Combined:
                var fixedPart = dto.FixedBaseSalary ?? 2000000m;
                var bonusPart = Math.Round(totalRevenue * (sharePercent / 100m), 2);
                calculatedSalary = fixedPart + bonusPart;
                break;
        }

        // Check if payroll record already exists for this teacher & period
        var existing = await _context.TeacherPayrolls
            .FirstOrDefaultAsync(tp => tp.TeacherId == teacher.Id && tp.Year == dto.Year && tp.Month == dto.Month);

        TeacherPayroll payroll;
        if (existing != null)
        {
            payroll = existing;
            payroll.CalculationType = dto.CalculationType;
            payroll.LessonsTaught = lessonsTaught;
            payroll.StudentsCount = studentCount;
            payroll.TotalRevenue = totalRevenue;
            payroll.SharePercentage = sharePercent;
            payroll.CalculatedSalary = calculatedSalary;
            payroll.RemainingAmount = Math.Max(0, calculatedSalary - payroll.PaidAmount);
        }
        else
        {
            payroll = new TeacherPayroll
            {
                Id = Guid.NewGuid(),
                TeacherId = teacher.Id,
                Year = dto.Year,
                Month = dto.Month,
                CalculationType = dto.CalculationType,
                LessonsTaught = lessonsTaught,
                StudentsCount = studentCount,
                TotalRevenue = totalRevenue,
                SharePercentage = sharePercent,
                CalculatedSalary = calculatedSalary,
                PaidAmount = 0m,
                RemainingAmount = calculatedSalary,
                Notes = $"{dto.Year}-{dto.Month:D2} oylik hisob-kitob"
            };
            _context.TeacherPayrolls.Add(payroll);
        }

        await _context.SaveChangesAsync();

        var result = new TeacherPayrollDto(
            payroll.Id,
            payroll.TeacherId,
            teacher.FullName,
            payroll.Year,
            payroll.Month,
            payroll.CalculationType,
            payroll.LessonsTaught,
            payroll.StudentsCount,
            payroll.TotalRevenue,
            payroll.SharePercentage,
            payroll.CalculatedSalary,
            payroll.PaidAmount,
            payroll.RemainingAmount,
            payroll.PaidDate,
            payroll.Notes
        );

        return ApiResponse<TeacherPayrollDto>.Ok(result, "Oylik maosh muvaffaqiyatli hisoblandi.");
    }

    public async Task<ApiResponse<List<TeacherPayrollDto>>> GetPayrollHistoryAsync(Guid? teacherId, int? year, int? month)
    {
        var query = _context.TeacherPayrolls
            .AsNoTracking()
            .Include(tp => tp.Teacher)
            .AsQueryable();

        if (teacherId.HasValue && teacherId != Guid.Empty) query = query.Where(tp => tp.TeacherId == teacherId.Value);
        if (year.HasValue) query = query.Where(tp => tp.Year == year.Value);
        if (month.HasValue) query = query.Where(tp => tp.Month == month.Value);

        var list = await query
            .OrderByDescending(tp => tp.Year)
            .ThenByDescending(tp => tp.Month)
            .Select(tp => new TeacherPayrollDto(
                tp.Id,
                tp.TeacherId,
                tp.Teacher.FullName,
                tp.Year,
                tp.Month,
                tp.CalculationType,
                tp.LessonsTaught,
                tp.StudentsCount,
                tp.TotalRevenue,
                tp.SharePercentage,
                tp.CalculatedSalary,
                tp.PaidAmount,
                tp.RemainingAmount,
                tp.PaidDate,
                tp.Notes
            ))
            .ToListAsync();

        return ApiResponse<List<TeacherPayrollDto>>.Ok(list);
    }

    public async Task<ApiResponse<TeacherPayrollDto>> PayTeacherPayrollAsync(Guid id, PayTeacherPayrollDto dto)
    {
        var payroll = await _context.TeacherPayrolls
            .Include(tp => tp.Teacher)
            .FirstOrDefaultAsync(tp => tp.Id == id);

        if (payroll == null) throw new NotFoundException("Maosh qaydi topilmadi.");

        payroll.PaidAmount += dto.Amount;
        payroll.RemainingAmount = Math.Max(0, payroll.CalculatedSalary - payroll.PaidAmount);
        payroll.PaidDate = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            payroll.Notes = (payroll.Notes + $"\n[To'lov]: {dto.Notes}").Trim();
        }

        // Also record as a center expense automatically!
        _context.CenterExpenses.Add(new CenterExpense
        {
            Id = Guid.NewGuid(),
            OrganizationId = payroll.OrganizationId,
            Category = "Ish haqi",
            Amount = dto.Amount,
            ExpenseDate = DateTime.UtcNow,
            Description = $"{payroll.Teacher.FullName} uchun oylik maosh to'lovi ({payroll.Year}-{payroll.Month:D2})"
        });

        await _context.SaveChangesAsync();

        var result = new TeacherPayrollDto(
            payroll.Id,
            payroll.TeacherId,
            payroll.Teacher.FullName,
            payroll.Year,
            payroll.Month,
            payroll.CalculationType,
            payroll.LessonsTaught,
            payroll.StudentsCount,
            payroll.TotalRevenue,
            payroll.SharePercentage,
            payroll.CalculatedSalary,
            payroll.PaidAmount,
            payroll.RemainingAmount,
            payroll.PaidDate,
            payroll.Notes
        );

        return ApiResponse<TeacherPayrollDto>.Ok(result, "Maosh to'lovi qayd etildi va xarajatlarga qo'shildi.");
    }
}
