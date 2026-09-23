using AutoMapper;
using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class SubjectService : ISubjectService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public SubjectService(IApplicationDbContext context, ICurrentUserService currentUser, IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<List<SubjectDto>> GetSubjectsAsync()
    {
        var subjects = await _context.Subjects
            .Include(s => s.Groups)
            .OrderBy(s => s.Name)
            .ToListAsync();

        return _mapper.Map<List<SubjectDto>>(subjects);
    }

    public async Task<ApiResponse<SubjectDto>> GetSubjectByIdAsync(Guid id)
    {
        var orgId = _currentUser.OrganizationId;
        var subject = await _context.Subjects
            .Include(s => s.Groups)
            .FirstOrDefaultAsync(s => s.Id == id && (!orgId.HasValue || s.OrganizationId == orgId.Value));

        if (subject == null) throw new NotFoundException("Fan topilmadi.");
        return ApiResponse<SubjectDto>.Ok(_mapper.Map<SubjectDto>(subject));
    }

    public async Task<ApiResponse<SubjectDto>> CreateSubjectAsync(CreateSubjectDto dto)
    {
        if (!_currentUser.OrganizationId.HasValue) throw new ForbiddenException();

        var subject = new Subject
        {
            OrganizationId = _currentUser.OrganizationId.Value,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Price = dto.Price,
            DurationWeeks = dto.DurationWeeks > 0 ? dto.DurationWeeks : 12,
            IsActive = dto.IsActive
        };
        _context.Subjects.Add(subject);
        await _context.SaveChangesAsync();

        return ApiResponse<SubjectDto>.Ok(_mapper.Map<SubjectDto>(subject), "Kurs/Fan muvaffaqiyatli yaratildi.");
    }

    public async Task<ApiResponse<SubjectDto>> UpdateSubjectAsync(Guid id, UpdateSubjectDto dto)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        var subject = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId.Value);
        if (subject == null) throw new NotFoundException("Kurs/Fan topilmadi.");

        subject.Name = dto.Name.Trim();
        subject.Description = dto.Description?.Trim();
        subject.Price = dto.Price;
        subject.DurationWeeks = dto.DurationWeeks > 0 ? dto.DurationWeeks : 12;
        subject.IsActive = dto.IsActive;
        subject.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<SubjectDto>.Ok(_mapper.Map<SubjectDto>(subject), "Kurs/Fan ma'lumotlari yangilandi.");
    }

    public async Task<ApiResponse<bool>> DeleteSubjectAsync(Guid id)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        var subject = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId.Value);
        if (subject == null) throw new NotFoundException("Fan topilmadi.");

        _context.Subjects.Remove(subject);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Fan o'chirildi.");
    }
}

public class GroupService : IGroupService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IMapper _mapper;

    public GroupService(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        ISubscriptionService subscriptionService,
        IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _subscriptionService = subscriptionService;
        _mapper = mapper;
    }

    public async Task<PagedResult<GroupDto>> GetGroupsAsync(string? search, Guid? subjectId, bool? isActive, int page = 1, int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Groups
            .Include(g => g.Teacher)
            .Include(g => g.Subject)
            .Include(g => g.GroupStudents)
            .AsQueryable();

        if (_currentUser.Role == EduFlow.Domain.Enums.UserRole.Teacher && _currentUser.UserId.HasValue)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId.Value);
            if (teacher == null)
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == _currentUser.UserId.Value);
                if (user != null)
                {
                    teacher = await _context.Teachers.FirstOrDefaultAsync(t =>
                        (t.UserId == null || t.UserId == Guid.Empty) &&
                        (t.PhoneNumber == user.PhoneNumber || (t.FullName.ToLower() == $"{user.FirstName} {user.LastName}".ToLower())));
                    if (teacher != null)
                    {
                        teacher.UserId = user.Id;
                        await _context.SaveChangesAsync();
                    }
                }
            }
            if (teacher != null)
            {
                query = query.Where(g => g.TeacherId == teacher.Id);
            }
        }

        if (isActive.HasValue) query = query.Where(g => g.IsActive == isActive.Value);
        if (subjectId.HasValue) query = query.Where(g => g.SubjectId == subjectId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(g => g.Name.ToLower().Contains(s) || (g.Teacher != null && g.Teacher.FullName.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();
        var groups = await query
            .OrderByDescending(g => g.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<GroupDto>(_mapper.Map<List<GroupDto>>(groups), totalCount, page, pageSize);
    }

    public async Task<ApiResponse<GroupDetailDto>> GetGroupByIdAsync(Guid id)
    {
        var orgId = _currentUser.OrganizationId;
        var group = await _context.Groups
            .Include(g => g.Teacher)
            .Include(g => g.Subject)
            .Include(g => g.GroupStudents).ThenInclude(gs => gs.Student)
            .Include(g => g.Lessons).ThenInclude(l => l.Attendances)
            .FirstOrDefaultAsync(g => g.Id == id && (!orgId.HasValue || g.OrganizationId == orgId.Value));

        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        var now = DateTime.UtcNow;
        bool needsSave = false;
        foreach (var gs in group.GroupStudents)
        {
            if (gs.Student != null && gs.Student.PaidUntil.HasValue && gs.Student.PaidUntil.Value < now && !gs.Student.IsPaymentBlocked)
            {
                gs.Student.IsPaymentBlocked = true;
                gs.Student.PaymentBlockReason = "Oylik to'lov muddati o'tgan (darsga kiritilmasin)";
                needsSave = true;
            }
        }
        if (needsSave)
        {
            await _context.SaveChangesAsync();
        }

        var students = _mapper.Map<List<StudentDto>>(group.GroupStudents.Select(gs => gs.Student).ToList());
        var lessons = _mapper.Map<List<LessonDto>>(group.Lessons.OrderByDescending(l => l.StartTime).Take(50).ToList());

        var detailDto = new GroupDetailDto(
            group.Id,
            group.OrganizationId,
            group.Name,
            group.TeacherId,
            group.Teacher?.FullName,
            group.SubjectId,
            group.Subject?.Name,
            group.MonthlyFee,
            group.MaxStudents,
            group.ScheduleDescription,
            group.Room,
            group.IsActive,
            students,
            lessons
        );

        return ApiResponse<GroupDetailDto>.Ok(detailDto);
    }

    public async Task<ApiResponse<GroupDto>> CreateGroupAsync(CreateGroupDto dto)
    {
        await _subscriptionService.ValidatePlanLimitAsync("group");

        if (!_currentUser.OrganizationId.HasValue) throw new ForbiddenException();
        var orgId = _currentUser.OrganizationId.Value;

        if (dto.TeacherId.HasValue)
        {
            var teacherExists = await _context.Teachers.AnyAsync(t => t.Id == dto.TeacherId.Value && t.OrganizationId == orgId);
            if (!teacherExists) throw new ValidationException("Tanlangan o'qituvchi topilmadi.");
        }

        if (dto.SubjectId.HasValue)
        {
            var subjectExists = await _context.Subjects.AnyAsync(s => s.Id == dto.SubjectId.Value && s.OrganizationId == orgId);
            if (!subjectExists) throw new ValidationException("Tanlangan fan topilmadi.");
        }

        var group = new Group
        {
            OrganizationId = orgId,
            Name = dto.Name.Trim(),
            TeacherId = dto.TeacherId,
            SubjectId = dto.SubjectId,
            MonthlyFee = dto.MonthlyFee,
            MaxStudents = dto.MaxStudents > 0 ? dto.MaxStudents : 15,
            ScheduleDescription = dto.ScheduleDescription,
            Room = dto.Room,
            IsActive = true
        };
        _context.Groups.Add(group);
        await _context.SaveChangesAsync();

        if (dto.StudentIds != null && dto.StudentIds.Any())
        {
            foreach (var sId in dto.StudentIds.Distinct())
            {
                var studentExists = await _context.Students.AnyAsync(s => s.Id == sId && s.OrganizationId == orgId);
                if (studentExists)
                {
                    _context.GroupStudents.Add(new GroupStudent
                    {
                        GroupId = group.Id,
                        StudentId = sId,
                        JoinedAt = DateTime.UtcNow
                    });
                }
            }
            await _context.SaveChangesAsync();
        }

        if (!string.IsNullOrWhiteSpace(group.ScheduleDescription))
        {
            await GenerateRecurringLessonsAsync(group);
        }

        return await GetGroupDtoByIdAsync(group.Id);
    }

    public async Task<ApiResponse<GroupDto>> UpdateGroupAsync(Guid id, UpdateGroupDto dto)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == id && g.OrganizationId == orgId.Value);
        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        if (dto.TeacherId.HasValue)
        {
            var teacherExists = await _context.Teachers.AnyAsync(t => t.Id == dto.TeacherId.Value && t.OrganizationId == orgId.Value);
            if (!teacherExists) throw new ValidationException("Tanlangan o'qituvchi topilmadi.");
        }

        if (dto.SubjectId.HasValue)
        {
            var subjectExists = await _context.Subjects.AnyAsync(s => s.Id == dto.SubjectId.Value && s.OrganizationId == orgId.Value);
            if (!subjectExists) throw new ValidationException("Tanlangan fan topilmadi.");
        }

        group.Name = dto.Name.Trim();
        group.TeacherId = dto.TeacherId;
        group.SubjectId = dto.SubjectId;
        group.MonthlyFee = dto.MonthlyFee;
        group.MaxStudents = dto.MaxStudents;
        group.ScheduleDescription = dto.ScheduleDescription;
        group.Room = dto.Room;
        group.IsActive = dto.IsActive;
        group.UpdatedAt = DateTime.UtcNow;

        if (dto.StudentIds != null)
        {
            var currentStudentIds = await _context.GroupStudents
                .Where(gs => gs.GroupId == group.Id)
                .Select(gs => gs.StudentId)
                .ToListAsync();

            var newStudentIds = dto.StudentIds.Distinct().ToList();
            var toAdd = newStudentIds.Except(currentStudentIds).ToList();

            foreach (var sId in toAdd)
            {
                var studentExists = await _context.Students.AnyAsync(s => s.Id == sId && s.OrganizationId == orgId.Value);
                if (studentExists)
                {
                    _context.GroupStudents.Add(new GroupStudent
                    {
                        GroupId = group.Id,
                        StudentId = sId,
                        JoinedAt = DateTime.UtcNow
                    });
                }
            }
        }

        await _context.SaveChangesAsync();

        var hasFutureLessons = await _context.Lessons.AnyAsync(l => l.GroupId == group.Id && l.StartTime >= DateTime.UtcNow);
        if (!hasFutureLessons && !string.IsNullOrWhiteSpace(group.ScheduleDescription))
        {
            await GenerateRecurringLessonsAsync(group);
        }

        return await GetGroupDtoByIdAsync(group.Id);
    }

    private async Task GenerateRecurringLessonsAsync(Group group)
    {
        if (string.IsNullOrWhiteSpace(group.ScheduleDescription)) return;
        var desc = group.ScheduleDescription.ToLower();

        var targetDays = new List<DayOfWeek>();
        if (desc.Contains("toq") || desc.Contains("du-cho-ju") || desc.Contains("du, cho, ju"))
        {
            targetDays.AddRange(new[] { DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday });
        }
        else if (desc.Contains("juft") || desc.Contains("se-pa-sha") || desc.Contains("se, pay, sha"))
        {
            targetDays.AddRange(new[] { DayOfWeek.Tuesday, DayOfWeek.Thursday, DayOfWeek.Saturday });
        }
        else if (desc.Contains("har kuni") || desc.Contains("every day"))
        {
            targetDays.AddRange(new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday });
        }
        else if (desc.Contains("dam olish") || desc.Contains("weekend"))
        {
            targetDays.AddRange(new[] { DayOfWeek.Saturday, DayOfWeek.Sunday });
        }

        if (!targetDays.Any())
        {
            if (desc.Contains("dush") || desc.Contains("mon")) targetDays.Add(DayOfWeek.Monday);
            if (desc.Contains("sesh") || desc.Contains("tue")) targetDays.Add(DayOfWeek.Tuesday);
            if (desc.Contains("chor") || desc.Contains("wed")) targetDays.Add(DayOfWeek.Wednesday);
            if (desc.Contains("pay") || desc.Contains("thu")) targetDays.Add(DayOfWeek.Thursday);
            if (desc.Contains("jum") || desc.Contains("fri")) targetDays.Add(DayOfWeek.Friday);
            if (desc.Contains("shan") || desc.Contains("sat")) targetDays.Add(DayOfWeek.Saturday);
            if (desc.Contains("yak") || desc.Contains("sun")) targetDays.Add(DayOfWeek.Sunday);
        }

        if (!targetDays.Any())
        {
            targetDays.AddRange(new[] { DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday });
        }

        targetDays = targetDays.Distinct().ToList();

        int startHour = 14, startMinute = 0;
        int endHour = 16, endMinute = 0;

        var rangeMatch = System.Text.RegularExpressions.Regex.Match(desc, @"(\d{1,2}):(\d{2})\s*(?:-|dan|to)\s*(\d{1,2}):(\d{2})");
        if (rangeMatch.Success)
        {
            startHour = int.Parse(rangeMatch.Groups[1].Value);
            startMinute = int.Parse(rangeMatch.Groups[2].Value);
            endHour = int.Parse(rangeMatch.Groups[3].Value);
            endMinute = int.Parse(rangeMatch.Groups[4].Value);
        }
        else
        {
            var singleMatch = System.Text.RegularExpressions.Regex.Match(desc, @"(\d{1,2}):(\d{2})");
            if (singleMatch.Success)
            {
                startHour = int.Parse(singleMatch.Groups[1].Value);
                startMinute = int.Parse(singleMatch.Groups[2].Value);
                endHour = (startHour + 2) % 24;
                endMinute = startMinute;
            }
        }

        var subject = group.Subject ?? await _context.Subjects.FirstOrDefaultAsync(s => s.Id == group.SubjectId);
        var subjectName = subject?.Name ?? group.Name;

        var now = DateTime.UtcNow;
        var baseDate = now.Date;
        var lessonsToAdd = new List<Lesson>();
        int lessonIndex = 1;

        for (int i = 0; i < 28 && lessonsToAdd.Count < 16; i++)
        {
            var currentDate = baseDate.AddDays(i);
            if (targetDays.Contains(currentDate.DayOfWeek))
            {
                var lessonStart = DateTime.SpecifyKind(new DateTime(currentDate.Year, currentDate.Month, currentDate.Day, startHour, startMinute, 0), DateTimeKind.Utc);
                var lessonEnd = DateTime.SpecifyKind(new DateTime(currentDate.Year, currentDate.Month, currentDate.Day, endHour, endMinute, 0), DateTimeKind.Utc);

                if (lessonStart < now) continue;

                lessonsToAdd.Add(new Lesson
                {
                    OrganizationId = group.OrganizationId,
                    GroupId = group.Id,
                    StartTime = lessonStart,
                    EndTime = lessonEnd,
                    Topic = $"{subjectName} - {lessonIndex}-dars: Amaliy mashg'ulot",
                    Status = LessonStatus.Scheduled
                });
                lessonIndex++;
            }
        }

        if (lessonsToAdd.Any())
        {
            await _context.Lessons.AddRangeAsync(lessonsToAdd);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<ApiResponse<bool>> DeleteGroupAsync(Guid id)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == id && g.OrganizationId == orgId.Value);
        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        group.IsActive = false;
        group.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Guruh o'chirildi.");
    }

    public async Task<ApiResponse<bool>> AddStudentToGroupAsync(Guid groupId, Guid studentId)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        var group = await _context.Groups.Include(g => g.GroupStudents).FirstOrDefaultAsync(g => g.Id == groupId && g.OrganizationId == orgId.Value);
        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == studentId && s.OrganizationId == orgId.Value);
        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        if (!student.IsActive)
        {
            throw new ValidationException("Guruhga faqat faol o'quvchilarni qo'shish mumkin.");
        }

        if (group.GroupStudents.Any(gs => gs.StudentId == studentId))
        {
            return ApiResponse<bool>.Ok(true, "O'quvchi allaqachon ushbu guruhda.");
        }

        if (group.GroupStudents.Count >= group.MaxStudents)
        {
            throw new ValidationException($"Guruh maksimal sig'imiga ({group.MaxStudents} nafar) yetgan.");
        }

        _context.GroupStudents.Add(new GroupStudent
        {
            GroupId = groupId,
            StudentId = studentId,
            JoinedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "O'quvchi guruhga qo'shildi.");
    }

    public async Task<ApiResponse<bool>> RemoveStudentFromGroupAsync(Guid groupId, Guid studentId)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue) throw new ForbiddenException();

        var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == groupId && g.OrganizationId == orgId.Value);
        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        var record = await _context.GroupStudents.FirstOrDefaultAsync(gs => gs.GroupId == groupId && gs.StudentId == studentId);
        if (record != null)
        {
            _context.GroupStudents.Remove(record);
            await _context.SaveChangesAsync();
        }
        return ApiResponse<bool>.Ok(true, "O'quvchi guruhdan chiqarildi.");
    }

    public async Task<List<StudentDto>> GetGroupStudentsAsync(Guid groupId)
    {
        var orgId = _currentUser.OrganizationId;
        var students = await _context.GroupStudents
            .Where(gs => gs.GroupId == groupId && (!orgId.HasValue || gs.Group.OrganizationId == orgId.Value))
            .Include(gs => gs.Student).ThenInclude(s => s.Parent)
            .Include(gs => gs.Student).ThenInclude(s => s.Attendances)
            .Include(gs => gs.Student).ThenInclude(s => s.Grades)
            .Include(gs => gs.Student).ThenInclude(s => s.Payments)
            .Select(gs => gs.Student)
            .ToListAsync();

        return _mapper.Map<List<StudentDto>>(students);
    }

    private async Task<ApiResponse<GroupDto>> GetGroupDtoByIdAsync(Guid id)
    {
        var group = await _context.Groups
            .Include(g => g.Teacher)
            .Include(g => g.Subject)
            .Include(g => g.GroupStudents)
            .FirstOrDefaultAsync(g => g.Id == id);

        return ApiResponse<GroupDto>.Ok(_mapper.Map<GroupDto>(group!));
    }
}
