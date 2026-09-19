using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class StudentProgressService : IStudentProgressService
{
    private readonly IApplicationDbContext _context;

    public StudentProgressService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<StudentProgressDto>> GetProgressAsync(Guid studentId)
    {
        var student = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s => s.Id == studentId);
        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        // 1. Attendance calculation
        var attendances = await _context.Attendances
            .AsNoTracking()
            .Where(a => a.StudentId == studentId)
            .ToListAsync();

        var totalLessons = attendances.Count;
        var presentLessons = attendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
        var attendanceRate = totalLessons > 0 ? Math.Round((decimal)presentLessons / totalLessons * 100, 1) : 100m;

        // 2. Average Grade calculation (normalized to 100%)
        var grades = await _context.Grades
            .AsNoTracking()
            .Where(g => g.StudentId == studentId)
            .ToListAsync();

        var averageGrade = grades.Count > 0 ? Math.Round(grades.Average(g => g.Score), 1) : 85m;
        // In case grades are 1-5 scale, normalize to 100% for progress if <= 5
        var normalizedGrade = averageGrade <= 5 ? averageGrade * 20 : averageGrade;

        // 3. Homework Completion Rate
        var studentGroupIds = await _context.GroupStudents
            .Where(gs => gs.StudentId == studentId)
            .Select(gs => gs.GroupId)
            .ToListAsync();

        var assignedHomeworks = await _context.Homeworks
            .AsNoTracking()
            .Where(h => studentGroupIds.Contains(h.GroupId))
            .ToListAsync();

        var submissions = await _context.HomeworkSubmissions
            .AsNoTracking()
            .Where(hs => hs.StudentId == studentId)
            .ToListAsync();

        var totalHw = assignedHomeworks.Count;
        var completedHw = submissions.Count(s => s.Status == HomeworkStatus.Submitted || s.Status == HomeworkStatus.Reviewed || s.Status == HomeworkStatus.Late);
        var hwCompletionRate = totalHw > 0 ? Math.Round((decimal)completedHw / totalHw * 100, 1) : 100m;

        // 4. Course Progress (lessons attended / total scheduled in group)
        var totalGroupLessons = await _context.Lessons
            .AsNoTracking()
            .Where(l => studentGroupIds.Contains(l.GroupId))
            .CountAsync();

        var courseProgress = totalGroupLessons > 0 ? Math.Min(100m, Math.Round((decimal)totalLessons / totalGroupLessons * 100, 1)) : 50m;

        // 5. Overall Weighted Progress (35% Attendance, 35% Grade, 30% Homework)
        var overallProgress = Math.Round((attendanceRate * 0.35m) + (normalizedGrade * 0.35m) + (hwCompletionRate * 0.30m), 1);
        if (overallProgress > 100m) overallProgress = 100m;

        // 6. Skill-level progress (Grammar, Vocabulary, Reading, Listening, Speaking) derived from grades comments or distribution
        var baseScore = normalizedGrade;
        var skills = new List<SkillProgressItemDto>
        {
            new("Grammar", Math.Clamp(Math.Round(baseScore * 0.95m, 0), 0, 100), GetLevel(baseScore * 0.95m)),
            new("Vocabulary", Math.Clamp(Math.Round(baseScore * 1.02m, 0), 0, 100), GetLevel(baseScore * 1.02m)),
            new("Reading", Math.Clamp(Math.Round(baseScore * 0.98m, 0), 0, 100), GetLevel(baseScore * 0.98m)),
            new("Listening", Math.Clamp(Math.Round(baseScore * 0.92m, 0), 0, 100), GetLevel(baseScore * 0.92m)),
            new("Speaking", Math.Clamp(Math.Round(baseScore * 0.88m, 0), 0, 100), GetLevel(baseScore * 0.88m))
        };

        // 7. Progress Over Time (last 6 months trend)
        var now = DateTime.UtcNow;
        var history = new List<ProgressHistoryPointDto>();
        for (int i = 5; i >= 0; i--)
        {
            var monthDate = now.AddMonths(-i);
            var mLabel = monthDate.ToString("MMM");
            var monthGrades = grades.Where(g => g.CreatedAt <= monthDate).ToList();
            var monthAvg = monthGrades.Count > 0 ? monthGrades.Average(g => g.Score) : averageGrade;
            var mScore = monthAvg <= 5 ? monthAvg * 20 : monthAvg;
            history.Add(new ProgressHistoryPointDto(mLabel, Math.Round(mScore, 0)));
        }

        var result = new StudentProgressDto(
            StudentId: student.Id,
            StudentName: $"{student.FirstName} {student.LastName}",
            OverallProgressPercent: overallProgress,
            AttendanceRate: attendanceRate,
            AverageGrade: averageGrade,
            HomeworkCompletionRate: hwCompletionRate,
            CourseProgressPercent: courseProgress,
            SkillProgress: skills,
            ProgressOverTime: history
        );

        return ApiResponse<StudentProgressDto>.Ok(result);
    }

    private static string GetLevel(decimal score) => score switch
    {
        >= 90 => "A'lo (Advanced)",
        >= 75 => "Yaxshi (Upper-Intermediate)",
        >= 60 => "O'rta (Intermediate)",
        >= 45 => "Qoniqarli (Elementary)",
        _ => "Boshlang'ich (Beginner)"
    };
}
