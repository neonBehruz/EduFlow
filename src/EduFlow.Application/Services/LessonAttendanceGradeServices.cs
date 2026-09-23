using AutoMapper;
using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class LessonService : ILessonService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _auditLogService;
    private readonly IMapper _mapper;

    public LessonService(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAuditLogService auditLogService,
        IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _auditLogService = auditLogService;
        _mapper = mapper;
    }

    public async Task<PagedResult<LessonDto>> GetLessonsAsync(Guid? groupId, DateTime? date, int page = 1, int pageSize = 20, bool descending = false)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.Lessons
            .Include(l => l.Teacher)
            .Include(l => l.Group).ThenInclude(g => g.Subject)
            .Include(l => l.Group).ThenInclude(g => g.Teacher)
            .Include(l => l.Group).ThenInclude(g => g.GroupStudents)
            .Include(l => l.Attendances)
            .AsQueryable();

        if (_currentUser.Role == EduFlow.Domain.Enums.UserRole.Teacher && _currentUser.UserId.HasValue)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId.Value);
            if (teacher != null)
            {
                query = query.Where(l => l.TeacherId == teacher.Id || l.Group.TeacherId == teacher.Id);
            }
        }

        if (groupId.HasValue) query = query.Where(l => l.GroupId == groupId.Value);
        if (date.HasValue)
        {
            var d = date.Value.Date;
            query = query.Where(l => l.StartTime.Date == d);
        }

        var totalCount = await query.CountAsync();
        query = descending ? query.OrderByDescending(l => l.StartTime) : query.OrderBy(l => l.StartTime);
        var lessons = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<LessonDto>(_mapper.Map<List<LessonDto>>(lessons), totalCount, page, pageSize);
    }

    public async Task<List<LessonDto>> GetTodayLessonsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var query = _context.Lessons
            .Include(l => l.Group).ThenInclude(g => g.Subject)
            .Include(l => l.Group).ThenInclude(g => g.Teacher)
            .Include(l => l.Group).ThenInclude(g => g.GroupStudents)
            .Include(l => l.Attendances)
            .Where(l => l.StartTime.Date == today);

        if (_currentUser.Role == EduFlow.Domain.Enums.UserRole.Teacher && _currentUser.UserId.HasValue)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId.Value);
            if (teacher != null)
            {
                query = query.Where(l => l.TeacherId == teacher.Id || l.Group.TeacherId == teacher.Id);
            }
        }

        var lessons = await query
            .OrderBy(l => l.StartTime)
            .ToListAsync();

        return _mapper.Map<List<LessonDto>>(lessons);
    }

    public async Task<ApiResponse<LessonDto>> GetLessonByIdAsync(Guid id)
    {
        var lesson = await _context.Lessons
            .Include(l => l.Group).ThenInclude(g => g.Subject)
            .Include(l => l.Group).ThenInclude(g => g.Teacher)
            .Include(l => l.Group).ThenInclude(g => g.GroupStudents)
            .Include(l => l.Attendances)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lesson == null) throw new NotFoundException("Dars topilmadi.");
        return ApiResponse<LessonDto>.Ok(_mapper.Map<LessonDto>(lesson));
    }

    public async Task<ApiResponse<LessonDto>> CreateLessonAsync(CreateLessonDto dto)
    {
        var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == dto.GroupId);
        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && group.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException("Ushbu guruh boshqa markazga tegishli.");
        }

        if (dto.StartTime >= dto.EndTime)
        {
            throw new ValidationException("Darsning boshlanish vaqti tugash vaqtidan oldin bo'lishi kerak.");
        }

        // Schedule Conflict Validation: Check group conflict
        var groupConflict = await _context.Lessons
            .AnyAsync(l => l.GroupId == dto.GroupId
                        && l.StartTime < dto.EndTime
                        && l.EndTime > dto.StartTime);

        if (groupConflict)
        {
            throw new ValidationException("Ushbu guruhda ushbu vaqt oralig'ida boshqa dars mavjud (darslar kesishuvi)!");
        }

        // Schedule Conflict Validation: Check teacher conflict
        var effectiveTeacherId = group.TeacherId;
        if (effectiveTeacherId.HasValue)
        {
            var teacherConflict = await _context.Lessons
                .AnyAsync(l => (l.TeacherId == effectiveTeacherId || l.Group.TeacherId == effectiveTeacherId)
                            && l.OrganizationId == group.OrganizationId
                            && l.StartTime < dto.EndTime
                            && l.EndTime > dto.StartTime);

            if (teacherConflict)
            {
                throw new ValidationException("O'qituvchining ushbu vaqt oralig'ida boshqa darsi mavjud (darslar kesishuvi)!");
            }
        }

        // Schedule Conflict Validation: Check room conflict
        var effectiveRoomId = group.RoomId;
        if (effectiveRoomId.HasValue)
        {
            var roomConflict = await _context.Lessons
                .AnyAsync(l => (l.RoomId == effectiveRoomId || l.Group.RoomId == effectiveRoomId)
                            && l.OrganizationId == group.OrganizationId
                            && l.StartTime < dto.EndTime
                            && l.EndTime > dto.StartTime);

            if (roomConflict)
            {
                throw new ValidationException("Ushbu xonada ushbu vaqt oralig'ida boshqa dars mavjud (xonalar kesishuvi)!");
            }
        }

        var lesson = new Lesson
        {
            OrganizationId = group.OrganizationId,
            GroupId = dto.GroupId,
            TeacherId = group.TeacherId,
            RoomId = group.RoomId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Topic = dto.Topic.Trim(),
            Status = LessonStatus.Scheduled
        };
        _context.Lessons.Add(lesson);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("CreateLesson", "Lesson", lesson.Id.ToString(), $"Created lesson: {lesson.Topic}");

        return await GetLessonByIdAsync(lesson.Id);
    }

    public async Task<ApiResponse<LessonDto>> UpdateLessonAsync(Guid id, UpdateLessonDto dto)
    {
        var lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.Id == id);
        if (lesson == null) throw new NotFoundException("Dars topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && lesson.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        if (dto.StartTime >= dto.EndTime)
        {
            throw new ValidationException("Darsning boshlanish vaqti tugash vaqtidan oldin bo'lishi kerak.");
        }

        var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == lesson.GroupId);
        var effectiveTeacherId = lesson.TeacherId ?? group?.TeacherId;
        var effectiveRoomId = lesson.RoomId ?? group?.RoomId;

        // Schedule Conflict Validation: Check group conflict
        var groupConflict = await _context.Lessons
            .AnyAsync(l => l.Id != id
                        && l.GroupId == lesson.GroupId
                        && l.StartTime < dto.EndTime
                        && l.EndTime > dto.StartTime);

        if (groupConflict)
        {
            throw new ValidationException("Ushbu guruhda ushbu vaqt oralig'ida boshqa dars mavjud (darslar kesishuvi)!");
        }

        if (effectiveTeacherId.HasValue)
        {
            var teacherConflict = await _context.Lessons
                .AnyAsync(l => l.Id != id
                            && (l.TeacherId == effectiveTeacherId || l.Group.TeacherId == effectiveTeacherId)
                            && l.OrganizationId == lesson.OrganizationId
                            && l.StartTime < dto.EndTime
                            && l.EndTime > dto.StartTime);

            if (teacherConflict)
            {
                throw new ValidationException("O'qituvchining ushbu vaqt oralig'ida boshqa darsi mavjud (darslar kesishuvi)!");
            }
        }

        if (effectiveRoomId.HasValue)
        {
            var roomConflict = await _context.Lessons
                .AnyAsync(l => l.Id != id
                            && (l.RoomId == effectiveRoomId || l.Group.RoomId == effectiveRoomId)
                            && l.OrganizationId == lesson.OrganizationId
                            && l.StartTime < dto.EndTime
                            && l.EndTime > dto.StartTime);

            if (roomConflict)
            {
                throw new ValidationException("Ushbu xonada ushbu vaqt oralig'ida boshqa dars mavjud (xonalar kesishuvi)!");
            }
        }

        lesson.StartTime = dto.StartTime;
        lesson.EndTime = dto.EndTime;
        lesson.Topic = dto.Topic.Trim();
        lesson.Status = dto.Status;
        lesson.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("UpdateLesson", "Lesson", lesson.Id.ToString(), $"Updated lesson: {lesson.Topic}");

        return await GetLessonByIdAsync(lesson.Id);
    }

    public async Task<ApiResponse<bool>> DeleteLessonAsync(Guid id)
    {
        var lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.Id == id);
        if (lesson == null) throw new NotFoundException("Dars topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && lesson.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        _context.Lessons.Remove(lesson);
        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("DeleteLesson", "Lesson", lesson.Id.ToString(), $"Deleted lesson: {lesson.Topic}");

        return ApiResponse<bool>.Ok(true, "Dars o'chirildi.");
    }

    public async Task<ApiResponse<LessonDto>> GetOrCreateTodayLessonAsync(Guid groupId)
    {
        var group = await _context.Groups
            .Include(g => g.Subject)
            .Include(g => g.Teacher)
            .Include(g => g.GroupStudents)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        var todayUtc = DateTime.UtcNow.Date;
        var existingLesson = await _context.Lessons
            .Include(l => l.Group).ThenInclude(g => g.Subject)
            .Include(l => l.Group).ThenInclude(g => g.Teacher)
            .Include(l => l.Group).ThenInclude(g => g.GroupStudents)
            .Include(l => l.Attendances)
            .FirstOrDefaultAsync(l => l.GroupId == groupId && l.StartTime.Date == todayUtc);

        if (existingLesson != null)
        {
            return ApiResponse<LessonDto>.Ok(_mapper.Map<LessonDto>(existingLesson), "Bugungi dars ro'yxati mavjud.");
        }

        // Auto-create today's lesson based on group schedule
        int startHour = 14, startMinute = 0;
        int durationMinutes = 120;
        if (!string.IsNullOrWhiteSpace(group.ScheduleDescription))
        {
            var match = System.Text.RegularExpressions.Regex.Match(group.ScheduleDescription, @"(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})");
            if (match.Success)
            {
                startHour = int.Parse(match.Groups[1].Value);
                startMinute = int.Parse(match.Groups[2].Value);
                var endHour = int.Parse(match.Groups[3].Value);
                var endMinute = int.Parse(match.Groups[4].Value);
                durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                if (durationMinutes <= 0) durationMinutes = 120;
            }
        }

        var startTime = todayUtc.AddHours(startHour).AddMinutes(startMinute);
        var endTime = startTime.AddMinutes(durationMinutes);

        var newLesson = new Lesson
        {
            OrganizationId = group.OrganizationId,
            GroupId = group.Id,
            TeacherId = group.TeacherId,
            RoomId = group.RoomId,
            Topic = $"{group.Name} - Bugungi dars",
            StartTime = startTime,
            EndTime = endTime,
            Status = LessonStatus.Scheduled
        };

        _context.Lessons.Add(newLesson);
        await _context.SaveChangesAsync();

        var createdLesson = await _context.Lessons
            .Include(l => l.Group).ThenInclude(g => g.Subject)
            .Include(l => l.Group).ThenInclude(g => g.Teacher)
            .Include(l => l.Group).ThenInclude(g => g.GroupStudents)
            .Include(l => l.Attendances)
            .FirstOrDefaultAsync(l => l.Id == newLesson.Id);

        await _auditLogService.LogAsync("AutoCreateTodayLesson", "Lesson", newLesson.Id.ToString(), $"Tizim tomonidan bugungi dars avtomatik ochildi: {group.Name}");

        return ApiResponse<LessonDto>.Ok(_mapper.Map<LessonDto>(createdLesson), "Bugungi dars va davomat ro'yxati avtomatik shakllantirildi.");
    }
}

public class AttendanceService : IAttendanceService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _auditLogService;
    private readonly ITelegramService _telegramService;
    private readonly INotificationService _notificationService;
    private readonly IMapper _mapper;

    public AttendanceService(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAuditLogService auditLogService,
        ITelegramService telegramService,
        INotificationService notificationService,
        IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _auditLogService = auditLogService;
        _telegramService = telegramService;
        _notificationService = notificationService;
        _mapper = mapper;
    }

    public async Task<List<AttendanceDto>> GetLessonAttendanceAsync(Guid lessonId)
    {
        var attendances = await _context.Attendances
            .Include(a => a.Student)
            .Include(a => a.Lesson)
            .Where(a => a.LessonId == lessonId)
            .ToListAsync();

        return _mapper.Map<List<AttendanceDto>>(attendances);
    }

    public async Task<ApiResponse<AttendanceDto>> MarkAttendanceAsync(CreateAttendanceDto dto)
    {
        var lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.Id == dto.LessonId);
        if (lesson == null) throw new NotFoundException("Dars topilmadi.");

        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == dto.StudentId);
        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        if (student.OrganizationId != lesson.OrganizationId)
        {
            throw new ForbiddenException("O'quvchi va dars turli markazlarga tegishli.");
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && lesson.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        var existing = await _context.Attendances
            .Include(a => a.Student)
            .Include(a => a.Lesson)
            .FirstOrDefaultAsync(a => a.LessonId == dto.LessonId && a.StudentId == dto.StudentId);

        if (existing != null)
        {
            existing.Status = dto.Status;
            existing.Comment = dto.Comment;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new Attendance
            {
                OrganizationId = lesson.OrganizationId,
                LessonId = dto.LessonId,
                StudentId = dto.StudentId,
                Status = dto.Status,
                Comment = dto.Comment
            };
            _context.Attendances.Add(existing);
        }

        await _context.SaveChangesAsync();

        // Trigger parent telegram alert if absent or late
        if (dto.Status == AttendanceStatus.Absent || dto.Status == AttendanceStatus.Late)
        {
            await _telegramService.SendStudentAttendanceAlertAsync(dto.StudentId, lesson.Topic ?? "Dars", dto.Status);
        }

        return ApiResponse<AttendanceDto>.Ok(_mapper.Map<AttendanceDto>(existing), "Davomat saqlandi.");
    }

    public async Task<ApiResponse<AttendanceDto>> UpdateAttendanceAsync(Guid id, UpdateAttendanceDto dto)
    {
        var attendance = await _context.Attendances
            .Include(a => a.Student)
            .Include(a => a.Lesson)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance == null) throw new NotFoundException("Davomat yozuvi topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && attendance.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        if (_currentUser.Role == UserRole.Teacher)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);
            var group = attendance.Lesson != null ? await _context.Groups.FirstOrDefaultAsync(g => g.Id == attendance.Lesson.GroupId) : null;
            if (teacher != null && group != null && group.TeacherId != teacher.Id && attendance.Lesson?.TeacherId != teacher.Id)
            {
                throw new ForbiddenException("O'qituvchi faqat o'z guruhiga davomat qo'yishi mumkin.");
            }
        }

        attendance.Status = dto.Status;
        attendance.Comment = dto.Comment;
        attendance.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<AttendanceDto>.Ok(_mapper.Map<AttendanceDto>(attendance));
    }

    public async Task<ApiResponse<bool>> SaveBulkAttendanceAsync(BulkAttendanceDto dto)
    {
        var lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.Id == dto.LessonId);
        if (lesson == null) throw new NotFoundException("Dars topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && lesson.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        if (_currentUser.Role == UserRole.Teacher)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);
            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == lesson.GroupId);
            if (teacher != null && group != null && group.TeacherId != teacher.Id && lesson.TeacherId != teacher.Id)
            {
                throw new ForbiddenException("O'qituvchi faqat o'z guruhiga davomat qo'yishi mumkin.");
            }
        }

        var existingList = await _context.Attendances
            .Where(a => a.LessonId == dto.LessonId)
            .ToListAsync();

        var studentIds = dto.Items.Select(i => i.StudentId).Distinct().ToList();
        var validStudents = await _context.Students
            .Where(s => studentIds.Contains(s.Id) && s.OrganizationId == lesson.OrganizationId)
            .Select(s => s.Id)
            .ToListAsync();
        var validStudentSet = validStudents.ToHashSet();

        foreach (var item in dto.Items)
        {
            if (!validStudentSet.Contains(item.StudentId)) continue;

            var existing = existingList.FirstOrDefault(a => a.StudentId == item.StudentId);
            if (existing != null)
            {
                existing.Status = item.Status;
                existing.Comment = item.Comment;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newAtt = new Attendance
                {
                    OrganizationId = lesson.OrganizationId,
                    LessonId = dto.LessonId,
                    StudentId = item.StudentId,
                    Status = item.Status,
                    Comment = item.Comment
                };
                _context.Attendances.Add(newAtt);
            }

            // Send notification for Absent or Late students
            if (item.Status == AttendanceStatus.Absent || item.Status == AttendanceStatus.Late)
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _telegramService.SendStudentAttendanceAlertAsync(item.StudentId, lesson.Topic, item.Status);
                    }
                    catch { }
                });
            }
        }

        lesson.Status = LessonStatus.Completed;
        lesson.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("BulkAttendance", "Lesson", lesson.Id.ToString(), $"Bulk attendance recorded for {dto.Items.Count} students");

        return ApiResponse<bool>.Ok(true, "Barcha o'quvchilar davomati muvaffaqiyatli saqlandi.");
    }
}

public class GradeService : IGradeService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _auditLogService;
    private readonly ITelegramService _telegramService;
    private readonly IMapper _mapper;

    public GradeService(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAuditLogService auditLogService,
        ITelegramService telegramService,
        IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _auditLogService = auditLogService;
        _telegramService = telegramService;
        _mapper = mapper;
    }

    public async Task<List<GradeDto>> GetStudentGradesAsync(Guid studentId)
    {
        var grades = await _context.Grades
            .Include(g => g.Student)
            .Include(g => g.Lesson).ThenInclude(l => l.Group).ThenInclude(g => g.Subject)
            .Where(g => g.StudentId == studentId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<GradeDto>>(grades);
    }

    public async Task<List<GradeDto>> GetLessonGradesAsync(Guid lessonId)
    {
        var grades = await _context.Grades
            .Include(g => g.Student)
            .Include(g => g.Lesson).ThenInclude(l => l.Group).ThenInclude(g => g.Subject)
            .Where(g => g.LessonId == lessonId)
            .ToListAsync();

        return _mapper.Map<List<GradeDto>>(grades);
    }

    public async Task<ApiResponse<GradeDto>> AddGradeAsync(CreateGradeDto dto)
    {
        if (dto.Score < 0 || dto.Score > 100)
        {
            throw new ValidationException("Baho 0 va 100 oralig'ida bo'lishi kerak.");
        }

        var lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.Id == dto.LessonId);
        if (lesson == null) throw new NotFoundException("Dars topilmadi.");

        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == dto.StudentId);
        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        if (student.OrganizationId != lesson.OrganizationId)
        {
            throw new ForbiddenException("O'quvchi va dars turli markazlarga tegishli.");
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && lesson.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        var existing = await _context.Grades
            .FirstOrDefaultAsync(g => g.LessonId == dto.LessonId && g.StudentId == dto.StudentId);

        if (existing != null)
        {
            existing.Score = dto.Score;
            existing.Comment = dto.Comment;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new Grade
            {
                OrganizationId = lesson.OrganizationId,
                LessonId = dto.LessonId,
                StudentId = dto.StudentId,
                Score = dto.Score,
                Comment = dto.Comment
            };
            _context.Grades.Add(existing);
        }

        await _context.SaveChangesAsync();

        _ = Task.Run(async () =>
        {
            try { await _telegramService.SendGradeAlertAsync(existing.Id); } catch { }
        });

        return ApiResponse<GradeDto>.Ok(_mapper.Map<GradeDto>(existing), "Baho saqlandi.");
    }

    public async Task<ApiResponse<GradeDto>> UpdateGradeAsync(Guid id, UpdateGradeDto dto)
    {
        if (dto.Score < 0 || dto.Score > 100)
        {
            throw new ValidationException("Baho 0 va 100 oralig'ida bo'lishi kerak.");
        }

        var grade = await _context.Grades.FirstOrDefaultAsync(g => g.Id == id);
        if (grade == null) throw new NotFoundException("Baho topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && grade.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        grade.Score = dto.Score;
        grade.Comment = dto.Comment;
        grade.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<GradeDto>.Ok(_mapper.Map<GradeDto>(grade), "Baho yangilandi.");
    }

    public async Task<ApiResponse<bool>> SaveBulkGradesAsync(BulkGradeDto dto)
    {
        var lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.Id == dto.LessonId);
        if (lesson == null) throw new NotFoundException("Dars topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && lesson.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        var studentIds = dto.Items.Select(i => i.StudentId).Distinct().ToList();
        var validStudents = await _context.Students
            .Where(s => studentIds.Contains(s.Id) && s.OrganizationId == lesson.OrganizationId)
            .Select(s => s.Id)
            .ToListAsync();
        var validStudentSet = validStudents.ToHashSet();

        var existingList = await _context.Grades
            .Where(g => g.LessonId == dto.LessonId)
            .ToListAsync();

        foreach (var item in dto.Items)
        {
            if (!validStudentSet.Contains(item.StudentId)) continue;
            if (item.Score < 0 || item.Score > 100) continue;

            var existing = existingList.FirstOrDefault(g => g.StudentId == item.StudentId);
            if (existing != null)
            {
                existing.Score = item.Score;
                existing.Comment = item.Comment;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newGrade = new Grade
                {
                    OrganizationId = lesson.OrganizationId,
                    LessonId = dto.LessonId,
                    StudentId = item.StudentId,
                    Score = item.Score,
                    Comment = item.Comment
                };
                _context.Grades.Add(newGrade);
            }
        }

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("BulkGrade", "Lesson", lesson.Id.ToString(), $"Bulk grades recorded for {dto.Items.Count} students");

        return ApiResponse<bool>.Ok(true, "Baholar muvaffaqiyatli saqlandi.");
    }
}
