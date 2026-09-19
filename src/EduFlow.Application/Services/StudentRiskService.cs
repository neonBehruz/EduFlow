using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class StudentRiskService : IStudentRiskService
{
    private readonly IApplicationDbContext _context;

    public StudentRiskService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<StudentRiskDto>>> GetAtRiskStudentsAsync()
    {
        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        var students = await _context.Students
            .AsNoTracking()
            .Where(s => s.IsActive)
            .Include(s => s.GroupStudents)
            .ThenInclude(gs => gs.Group)
            .Include(s => s.Attendances)
            .Include(s => s.Grades)
            .Include(s => s.Payments)
            .ToListAsync();

        var riskList = new List<StudentRiskDto>();

        foreach (var student in students)
        {
            var reasons = new List<string>();
            int riskScore = 0; // 0 to 100

            // 1. Attendance analysis
            var recentAttendances = student.Attendances.Where(a => a.CreatedAt >= thirtyDaysAgo).ToList();
            decimal attRate = 100m;
            if (recentAttendances.Count > 0)
            {
                var presentCount = recentAttendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
                attRate = Math.Round((decimal)presentCount / recentAttendances.Count * 100, 1);

                if (attRate < 60)
                {
                    riskScore += 40;
                    reasons.Add($"Davomat keskin pasaygan ({attRate}%)");
                }
                else if (attRate < 75)
                {
                    riskScore += 20;
                    reasons.Add($"Davomat o'rtachadan past ({attRate}%)");
                }
            }

            // 2. Grade trend analysis
            var recentGrades = student.Grades.Where(g => g.CreatedAt >= thirtyDaysAgo).ToList();
            decimal avgGrade = 85m;
            if (recentGrades.Count > 0)
            {
                avgGrade = Math.Round(recentGrades.Average(g => g.Score), 1);
                // Normalized to 100 scale if 1-5
                var normGrade = avgGrade <= 5 ? avgGrade * 20 : avgGrade;
                if (normGrade < 60)
                {
                    riskScore += 30;
                    reasons.Add($"O'zlashtirish darajasi past (O'rtacha: {avgGrade})");
                }
                else if (normGrade < 70)
                {
                    riskScore += 15;
                    reasons.Add($"Baholar pasayish tendensiyasida ({avgGrade})");
                }
            }

            // 3. Payment delay analysis
            var overduePayments = student.Payments
                .Where(p => (p.Status == PaymentStatus.Overdue || (p.Status == PaymentStatus.Pending && p.DueDate < now)) && p.DebtAmount > 0)
                .ToList();

            decimal overdueDebt = overduePayments.Sum(p => p.DebtAmount > 0 ? p.DebtAmount : p.FinalAmount - p.PaidAmount);
            if (overdueDebt > 0)
            {
                riskScore += 30;
                reasons.Add($"Muddati o'tgan to'lov mavjud ({overdueDebt:N0} so'm)");
            }

            // 4. Inactivity days
            var lastActivityDate = student.Attendances.Select(a => (DateTime?)a.CreatedAt)
                .Concat(student.Grades.Select(g => (DateTime?)g.CreatedAt))
                .Max() ?? student.CreatedAt;

            var inactiveDays = (int)(now - lastActivityDate).TotalDays;
            if (inactiveDays > 14)
            {
                riskScore += 25;
                reasons.Add($"{inactiveDays} kundan beri markazda faollik kuzatilmadi");
            }

            // 5. Homework missing
            var studentGroupIds = student.GroupStudents.Select(gs => gs.GroupId).ToList();
            var recentHwCount = await _context.Homeworks.AsNoTracking().CountAsync(h => studentGroupIds.Contains(h.GroupId) && h.CreatedAt >= thirtyDaysAgo);
            var submittedHwCount = await _context.HomeworkSubmissions.AsNoTracking().CountAsync(hs => hs.StudentId == student.Id && hs.SubmittedAt >= thirtyDaysAgo);
            decimal hwRate = recentHwCount > 0 ? Math.Round((decimal)submittedHwCount / recentHwCount * 100, 1) : 100m;

            if (hwRate < 50 && recentHwCount > 0)
            {
                riskScore += 20;
                reasons.Add($"Uyga vazifalar topshirilmayapti ({submittedHwCount}/{recentHwCount})");
            }

            // Classify Risk Level
            StudentRiskLevel level;
            if (riskScore >= 50) level = StudentRiskLevel.High;
            else if (riskScore >= 25) level = StudentRiskLevel.Medium;
            else level = StudentRiskLevel.Low;

            // Only add if reasons exist or Medium/High, or for ranking
            if (reasons.Count > 0)
            {
                riskList.Add(new StudentRiskDto(
                    StudentId: student.Id,
                    StudentName: $"{student.FirstName} {student.LastName}",
                    PhoneNumber: student.PhoneNumber,
                    GroupNames: student.GroupStudents.Select(gs => gs.Group.Name).ToList(),
                    RiskLevel: level,
                    RiskScore: riskScore,
                    Reasons: reasons,
                    AttendanceRate: attRate,
                    AverageGrade: avgGrade,
                    HomeworkRate: hwRate,
                    OverdueDebtAmount: overdueDebt,
                    InactiveDays: inactiveDays
                ));
            }
        }

        var sorted = riskList.OrderByDescending(r => r.RiskScore).ToList();
        return ApiResponse<List<StudentRiskDto>>.Ok(sorted);
    }
}
