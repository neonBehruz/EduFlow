using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class HomeworkService : IHomeworkService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public HomeworkService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<HomeworkDto>> GetHomeworksAsync(Guid? groupId, int page = 1, int pageSize = 20)
    {
        var query = _context.Homeworks
            .AsNoTracking()
            .Include(h => h.Group)
            .Include(h => h.Teacher)
            .Include(h => h.Submissions)
            .AsQueryable();

        if (groupId.HasValue && groupId != Guid.Empty)
        {
            query = query.Where(h => h.GroupId == groupId.Value);
        }

        // If current user is Teacher, filter to teacher's groups
        if (_currentUserService.Role == UserRole.Teacher && _currentUserService.UserId.HasValue)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == _currentUserService.UserId.Value);
            if (teacher != null)
            {
                query = query.Where(h => h.TeacherId == teacher.Id || h.Group.TeacherId == teacher.Id);
            }
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(h => h.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new HomeworkDto(
                h.Id,
                h.GroupId,
                h.Group.Name,
                h.LessonId,
                h.TeacherId,
                h.Teacher.FullName,
                h.Title,
                h.Description,
                h.DueDate,
                h.MaxScore,
                h.AttachmentUrls,
                h.Submissions.Count,
                h.Submissions.Count(s => s.Status == HomeworkStatus.Reviewed),
                h.CreatedAt
            ))
            .ToListAsync();

        return new PagedResult<HomeworkDto>(items, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<HomeworkDto>> GetHomeworkByIdAsync(Guid id)
    {
        var h = await _context.Homeworks
            .AsNoTracking()
            .Include(h => h.Group)
            .Include(h => h.Teacher)
            .Include(h => h.Submissions)
            .FirstOrDefaultAsync(h => h.Id == id);

        if (h == null) throw new NotFoundException("Vazifa topilmadi.");

        var dto = new HomeworkDto(
            h.Id,
            h.GroupId,
            h.Group.Name,
            h.LessonId,
            h.TeacherId,
            h.Teacher.FullName,
            h.Title,
            h.Description,
            h.DueDate,
            h.MaxScore,
            h.AttachmentUrls,
            h.Submissions.Count,
            h.Submissions.Count(s => s.Status == HomeworkStatus.Reviewed),
            h.CreatedAt
        );

        return ApiResponse<HomeworkDto>.Ok(dto);
    }

    public async Task<ApiResponse<HomeworkDto>> CreateHomeworkAsync(CreateHomeworkDto dto)
    {
        var group = await _context.Groups.Include(g => g.Teacher).FirstOrDefaultAsync(g => g.Id == dto.GroupId);
        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        Guid teacherId;
        if (_currentUserService.Role == UserRole.Teacher && _currentUserService.UserId.HasValue)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == _currentUserService.UserId.Value);
            teacherId = teacher?.Id ?? group.TeacherId ?? Guid.Empty;
        }
        else
        {
            teacherId = group.TeacherId ?? Guid.Empty;
        }

        if (teacherId == Guid.Empty)
        {
            var anyTeacher = await _context.Teachers.FirstOrDefaultAsync();
            if (anyTeacher != null) teacherId = anyTeacher.Id;
            else throw new BadRequestException("Guruhga o'qituvchi biriktirilmagan.");
        }

        var homework = new Homework
        {
            Id = Guid.NewGuid(),
            GroupId = dto.GroupId,
            LessonId = dto.LessonId,
            TeacherId = teacherId,
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            MaxScore = dto.MaxScore > 0 ? dto.MaxScore : 100m,
            AttachmentUrls = dto.AttachmentUrls
        };

        _context.Homeworks.Add(homework);
        await _context.SaveChangesAsync();

        return await GetHomeworkByIdAsync(homework.Id);
    }

    public async Task<ApiResponse<HomeworkDto>> UpdateHomeworkAsync(Guid id, UpdateHomeworkDto dto)
    {
        var h = await _context.Homeworks.FirstOrDefaultAsync(hw => hw.Id == id);
        if (h == null) throw new NotFoundException("Vazifa topilmadi.");

        h.Title = dto.Title;
        h.Description = dto.Description;
        h.DueDate = dto.DueDate;
        h.MaxScore = dto.MaxScore;
        h.AttachmentUrls = dto.AttachmentUrls;

        await _context.SaveChangesAsync();
        return await GetHomeworkByIdAsync(h.Id);
    }

    public async Task<ApiResponse<bool>> DeleteHomeworkAsync(Guid id)
    {
        var h = await _context.Homeworks.FirstOrDefaultAsync(hw => hw.Id == id);
        if (h == null) throw new NotFoundException("Vazifa topilmadi.");

        _context.Homeworks.Remove(h);
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Vazifa o'chirildi.");
    }

    public async Task<ApiResponse<List<HomeworkSubmissionDto>>> GetSubmissionsAsync(Guid homeworkId)
    {
        var subs = await _context.HomeworkSubmissions
            .AsNoTracking()
            .Where(s => s.HomeworkId == homeworkId)
            .Include(s => s.Homework)
            .Include(s => s.Student)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new HomeworkSubmissionDto(
                s.Id,
                s.HomeworkId,
                s.Homework.Title,
                s.StudentId,
                $"{s.Student.FirstName} {s.Student.LastName}",
                s.SubmittedAt,
                s.Content,
                s.AttachmentUrls,
                s.Score,
                s.Feedback,
                s.Status,
                s.ReviewedAt
            ))
            .ToListAsync();

        return ApiResponse<List<HomeworkSubmissionDto>>.Ok(subs);
    }

    public async Task<ApiResponse<HomeworkSubmissionDto>> GradeSubmissionAsync(Guid submissionId, GradeHomeworkSubmissionDto dto)
    {
        var submission = await _context.HomeworkSubmissions
            .Include(s => s.Homework)
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null) throw new NotFoundException("Topshiriq topilmadi.");

        submission.Score = dto.Score;
        submission.Feedback = dto.Feedback;
        submission.Status = HomeworkStatus.Reviewed;
        submission.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var result = new HomeworkSubmissionDto(
            submission.Id,
            submission.HomeworkId,
            submission.Homework.Title,
            submission.StudentId,
            $"{submission.Student.FirstName} {submission.Student.LastName}",
            submission.SubmittedAt,
            submission.Content,
            submission.AttachmentUrls,
            submission.Score,
            submission.Feedback,
            submission.Status,
            submission.ReviewedAt
        );

        return ApiResponse<HomeworkSubmissionDto>.Ok(result, "Baholandi va izoh saqlandi.");
    }
}
