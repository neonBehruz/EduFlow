using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class StudentPortalService : IStudentPortalService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStudentProgressService _progressService;

    public StudentPortalService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IStudentProgressService progressService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _progressService = progressService;
    }

    private async Task<Student> GetCurrentStudentAsync()
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            throw new UnauthorizedAccessException("Tizimga kiring.");
        }

        var student = await _context.Students
            .Include(s => s.GroupStudents)
            .ThenInclude(gs => gs.Group)
            .ThenInclude(g => g.Subject)
            .Include(s => s.GroupStudents)
            .ThenInclude(gs => gs.Group)
            .ThenInclude(g => g.Teacher)
            .Include(s => s.GroupStudents)
            .ThenInclude(gs => gs.Group)
            .ThenInclude(g => g.GroupStudents)
            .FirstOrDefaultAsync(s => s.UserId == userId.Value);

        if (student == null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user != null && user.Role == UserRole.Student)
            {
                student = await _context.Students
                    .Include(s => s.GroupStudents)
                    .ThenInclude(gs => gs.Group)
                    .ThenInclude(g => g.Subject)
                    .Include(s => s.GroupStudents)
                    .ThenInclude(gs => gs.Group)
                    .ThenInclude(g => g.Teacher)
                    .Include(s => s.GroupStudents)
                    .ThenInclude(gs => gs.Group)
                    .ThenInclude(g => g.GroupStudents)
                    .FirstOrDefaultAsync(s => s.PhoneNumber == user.PhoneNumber);
                if (student != null)
                {
                    student.UserId = user.Id;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Auto-create student profile if it does not exist
                    student = new Student
                    {
                        OrganizationId = user.OrganizationId,
                        UserId = user.Id,
                        FirstName = !string.IsNullOrWhiteSpace(user.FirstName) ? user.FirstName : "O'quvchi",
                        LastName = !string.IsNullOrWhiteSpace(user.LastName) ? user.LastName : "",
                        PhoneNumber = !string.IsNullOrWhiteSpace(user.PhoneNumber) ? user.PhoneNumber : "",
                        EnrollmentDate = DateTime.UtcNow,
                        IsActive = true
                    };
                    await _context.Students.AddAsync(student);
                    await _context.SaveChangesAsync();

                    student = await _context.Students
                        .Include(s => s.GroupStudents)
                        .ThenInclude(gs => gs.Group)
                        .ThenInclude(g => g.Subject)
                        .Include(s => s.GroupStudents)
                        .ThenInclude(gs => gs.Group)
                        .ThenInclude(g => g.Teacher)
                        .Include(s => s.GroupStudents)
                        .ThenInclude(gs => gs.Group)
                        .ThenInclude(g => g.GroupStudents)
                        .FirstOrDefaultAsync(s => s.Id == student.Id);
                }
            }
        }

        if (student == null)
        {
            throw new NotFoundException("O'quvchi profili topilmadi.");
        }

        return student;
    }

    public async Task<ApiResponse<StudentDashboardDto>> GetStudentDashboardAsync()
    {
        var student = await GetCurrentStudentAsync();
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1).AddTicks(-1);

        var groupIds = student.GroupStudents.Select(gs => gs.GroupId).ToList();

        // Today's lessons
        var todayLessons = await _context.Lessons
            .AsNoTracking()
            .Where(l => groupIds.Contains(l.GroupId) && l.StartTime >= todayStart && l.StartTime <= todayEnd)
            .Include(l => l.Group)
            .ThenInclude(g => g.Subject)
            .Include(l => l.Group)
            .ThenInclude(g => g.Teacher)
            .OrderBy(l => l.StartTime)
            .Select(l => new LessonDto
            {
                Id = l.Id,
                GroupId = l.GroupId,
                GroupName = l.Group.Name,
                SubjectName = l.Group.Subject != null ? l.Group.Subject.Name : null,
                TeacherName = l.Group.Teacher != null ? l.Group.Teacher.FullName : null,
                StartTime = l.StartTime,
                EndTime = l.EndTime,
                Topic = l.Topic,
                Status = l.Status
            })
            .ToListAsync();

        // Upcoming lessons
        var upcomingLessons = await _context.Lessons
            .AsNoTracking()
            .Where(l => groupIds.Contains(l.GroupId) && l.StartTime > todayEnd && l.StartTime <= now.AddDays(7))
            .Include(l => l.Group)
            .ThenInclude(g => g.Subject)
            .Include(l => l.Group)
            .ThenInclude(g => g.Teacher)
            .OrderBy(l => l.StartTime)
            .Take(10)
            .Select(l => new LessonDto
            {
                Id = l.Id,
                GroupId = l.GroupId,
                GroupName = l.Group.Name,
                SubjectName = l.Group.Subject != null ? l.Group.Subject.Name : null,
                TeacherName = l.Group.Teacher != null ? l.Group.Teacher.FullName : null,
                StartTime = l.StartTime,
                EndTime = l.EndTime,
                Topic = l.Topic,
                Status = l.Status
            })
            .ToListAsync();

        // Groups
        var groups = student.GroupStudents.Select(gs => new GroupDto
        {
            Id = gs.Group.Id,
            OrganizationId = gs.Group.OrganizationId,
            Name = gs.Group.Name,
            TeacherId = gs.Group.TeacherId,
            TeacherName = gs.Group.Teacher != null ? gs.Group.Teacher.FullName : null,
            SubjectId = gs.Group.SubjectId,
            SubjectName = gs.Group.Subject != null ? gs.Group.Subject.Name : null,
            MonthlyFee = gs.Group.MonthlyFee,
            MaxStudents = gs.Group.MaxStudents,
            EnrolledStudentsCount = gs.Group.GroupStudents != null ? gs.Group.GroupStudents.Count : 0,
            ScheduleDescription = gs.Group.ScheduleDescription,
            Room = gs.Group.Room,
            IsActive = gs.Group.IsActive
        }).ToList();

        // Courses / Subjects
        var courses = student.GroupStudents
            .Where(gs => gs.Group.Subject != null)
            .Select(gs => new SubjectDto
            {
                Id = gs.Group.Subject!.Id,
                OrganizationId = gs.Group.Subject.OrganizationId,
                Name = gs.Group.Subject.Name,
                GroupsCount = 1
            })
            .DistinctBy(s => s.Id)
            .ToList();

        // Attendance rate
        var totalAtt = await _context.Attendances.AsNoTracking().CountAsync(a => a.StudentId == student.Id);
        var presentAtt = await _context.Attendances.AsNoTracking().CountAsync(a => a.StudentId == student.Id && (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late));
        var attRate = totalAtt > 0 ? Math.Round((decimal)presentAtt / totalAtt * 100, 1) : 100m;

        // Recent Grades
        var grades = await _context.Grades
            .AsNoTracking()
            .Where(g => g.StudentId == student.Id)
            .Include(g => g.Lesson)
            .ThenInclude(l => l.Group)
            .ThenInclude(grp => grp.Subject)
            .OrderByDescending(g => g.CreatedAt)
            .Take(10)
            .Select(g => new GradeDto(
                g.Id,
                g.LessonId,
                g.StudentId,
                $"{student.FirstName} {student.LastName}",
                g.Lesson.Group.Subject != null ? g.Lesson.Group.Subject.Name : null,
                g.Score,
                g.Comment,
                g.CreatedAt
            ))
            .ToListAsync();

        // Pending Homework
        var pendingHomework = await _context.Homeworks
            .AsNoTracking()
            .Where(h => groupIds.Contains(h.GroupId) && h.DueDate >= now)
            .Include(h => h.Group)
            .Include(h => h.Teacher)
            .OrderBy(h => h.DueDate)
            .Take(5)
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

        // Certificates
        var certificates = await _context.Certificates
            .AsNoTracking()
            .Where(c => c.StudentId == student.Id)
            .Select(c => new CertificateDto(
                c.Id,
                c.CertificateNumber,
                c.VerificationCode,
                c.StudentId,
                $"{student.FirstName} {student.LastName}",
                c.SubjectId,
                c.Subject != null ? c.Subject.Name : null,
                c.GroupId,
                c.Group != null ? c.Group.Name : null,
                c.CourseName,
                c.LevelName,
                c.IssueDate,
                c.FinalGrade,
                c.QrCodeData,
                $"/verify/{c.VerificationCode}"
            ))
            .ToListAsync();

        // Notifications
        var notifications = await _context.Notifications
            .AsNoTracking()
            .Where(n => n.StudentId == student.Id)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .Select(n => new NotificationDto(
                n.Id,
                n.StudentId,
                $"{student.FirstName} {student.LastName}",
                n.ParentId,
                null,
                n.Message,
                n.Type,
                n.IsSent,
                n.SentAt,
                n.CreatedAt
            ))
            .ToListAsync();

        // Progress
        var progressRes = await _progressService.GetProgressAsync(student.Id);

        var dto = new StudentDashboardDto(
            student.Id,
            $"{student.FirstName} {student.LastName}",
            todayLessons,
            upcomingLessons,
            groups,
            courses,
            attRate,
            grades,
            pendingHomework,
            certificates,
            notifications,
            progressRes.Data!
        );

        return ApiResponse<StudentDashboardDto>.Ok(dto);
    }

    public async Task<ApiResponse<List<HomeworkDto>>> GetStudentHomeworkAsync()
    {
        var student = await GetCurrentStudentAsync();
        var groupIds = student.GroupStudents.Select(gs => gs.GroupId).ToList();

        var homeworks = await _context.Homeworks
            .AsNoTracking()
            .Where(h => groupIds.Contains(h.GroupId))
            .Include(h => h.Group)
            .Include(h => h.Teacher)
            .Include(h => h.Submissions.Where(s => s.StudentId == student.Id))
            .OrderByDescending(h => h.DueDate)
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

        return ApiResponse<List<HomeworkDto>>.Ok(homeworks);
    }

    public async Task<ApiResponse<HomeworkSubmissionDto>> SubmitHomeworkAsync(SubmitHomeworkDto dto)
    {
        var student = await GetCurrentStudentAsync();
        var homework = await _context.Homeworks.FirstOrDefaultAsync(h => h.Id == dto.HomeworkId);
        if (homework == null) throw new NotFoundException("Vazifa topilmadi.");

        var existing = await _context.HomeworkSubmissions
            .FirstOrDefaultAsync(s => s.HomeworkId == dto.HomeworkId && s.StudentId == student.Id);

        var now = DateTime.UtcNow;
        var status = now > homework.DueDate ? HomeworkStatus.Late : HomeworkStatus.Submitted;

        if (existing != null)
        {
            existing.Content = dto.Content;
            existing.AttachmentUrls = dto.AttachmentUrls;
            existing.SubmittedAt = now;
            existing.Status = status;
            await _context.SaveChangesAsync();

            return ApiResponse<HomeworkSubmissionDto>.Ok(new HomeworkSubmissionDto(
                existing.Id,
                homework.Id,
                homework.Title,
                student.Id,
                $"{student.FirstName} {student.LastName}",
                existing.SubmittedAt,
                existing.Content,
                existing.AttachmentUrls,
                existing.Score,
                existing.Feedback,
                existing.Status,
                existing.ReviewedAt
            ), "Vazifa qayta topshirildi.");
        }

        var submission = new HomeworkSubmission
        {
            Id = Guid.NewGuid(),
            OrganizationId = student.OrganizationId,
            HomeworkId = dto.HomeworkId,
            StudentId = student.Id,
            SubmittedAt = now,
            Content = dto.Content,
            AttachmentUrls = dto.AttachmentUrls,
            Status = status
        };

        _context.HomeworkSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return ApiResponse<HomeworkSubmissionDto>.Ok(new HomeworkSubmissionDto(
            submission.Id,
            homework.Id,
            homework.Title,
            student.Id,
            $"{student.FirstName} {student.LastName}",
            submission.SubmittedAt,
            submission.Content,
            submission.AttachmentUrls,
            null,
            null,
            submission.Status,
            null
        ), "Vazifa muvaffaqiyatli topshirildi.");
    }

    public async Task<ApiResponse<StudentProgressDto>> GetStudentProgressAsync()
    {
        var student = await GetCurrentStudentAsync();
        return await _progressService.GetProgressAsync(student.Id);
    }

    public async Task<ApiResponse<List<CertificateDto>>> GetStudentCertificatesAsync()
    {
        var student = await GetCurrentStudentAsync();
        var certs = await _context.Certificates
            .AsNoTracking()
            .Where(c => c.StudentId == student.Id)
            .Include(c => c.Subject)
            .Include(c => c.Group)
            .Select(c => new CertificateDto(
                c.Id,
                c.CertificateNumber,
                c.VerificationCode,
                c.StudentId,
                $"{student.FirstName} {student.LastName}",
                c.SubjectId,
                c.Subject != null ? c.Subject.Name : null,
                c.GroupId,
                c.Group != null ? c.Group.Name : null,
                c.CourseName,
                c.LevelName,
                c.IssueDate,
                c.FinalGrade,
                c.QrCodeData,
                $"/verify/{c.VerificationCode}"
            ))
            .ToListAsync();

        return ApiResponse<List<CertificateDto>>.Ok(certs);
    }

    public async Task<ApiResponse<List<AvailableTeacherDto>>> GetAvailableTeachersAsync()
    {
        var student = await GetCurrentStudentAsync();
        var orgId = student.OrganizationId;
        var studentGroupIds = student.GroupStudents.Select(gs => gs.GroupId).ToHashSet();

        var teachers = await _context.Teachers
            .Where(t => t.OrganizationId == orgId)
            .Include(t => t.Groups.Where(g => g.IsActive))
                .ThenInclude(g => g.Subject)
            .Include(t => t.Groups.Where(g => g.IsActive))
                .ThenInclude(g => g.GroupStudents)
            .OrderBy(t => t.FullName)
            .ToListAsync();

        var result = teachers.Select(t => new AvailableTeacherDto(
            t.Id,
            t.FullName,
            t.PhoneNumber,
            t.Specialization,
            t.Groups.Select(g => new AvailableGroupDto(
                g.Id,
                g.Name,
                g.SubjectId,
                g.Subject != null ? g.Subject.Name : null,
                g.MonthlyFee,
                g.MaxStudents,
                g.GroupStudents.Count,
                g.ScheduleDescription,
                g.Room,
                studentGroupIds.Contains(g.Id)
            )).ToList()
        )).ToList();

        return ApiResponse<List<AvailableTeacherDto>>.Ok(result);
    }

    public async Task<ApiResponse<bool>> EnrollInGroupAsync(Guid groupId)
    {
        var student = await GetCurrentStudentAsync();
        var group = await _context.Groups
            .Include(g => g.GroupStudents)
            .Include(g => g.Teacher)
            .FirstOrDefaultAsync(g => g.Id == groupId && g.OrganizationId == student.OrganizationId);

        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        if (group.GroupStudents.Any(gs => gs.StudentId == student.Id))
        {
            return ApiResponse<bool>.Ok(true, "Siz allaqachon ushbu guruhga a'zosiz.");
        }

        if (group.GroupStudents.Count >= group.MaxStudents)
        {
            throw new ValidationException($"Ushbu guruh to'lgan (Maksimal: {group.MaxStudents} nafar).");
        }

        _context.GroupStudents.Add(new GroupStudent
        {
            GroupId = groupId,
            StudentId = student.Id,
            JoinedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        var teacherName = group.Teacher != null ? group.Teacher.FullName : "O'qituvchi";
        return ApiResponse<bool>.Ok(true, $"Siz {teacherName}ning '{group.Name}' guruhiga muvaffaqiyatli biriktirildingiz!");
    }

    public async Task<ApiResponse<bool>> LeaveGroupAsync(Guid groupId)
    {
        var student = await GetCurrentStudentAsync();
        var record = await _context.GroupStudents
            .FirstOrDefaultAsync(gs => gs.GroupId == groupId && gs.StudentId == student.Id);

        if (record != null)
        {
            _context.GroupStudents.Remove(record);
            await _context.SaveChangesAsync();
        }

        return ApiResponse<bool>.Ok(true, "Guruhdan chiqildi.");
    }

    public async Task<ApiResponse<StudentAttendanceSummaryDto>> GetStudentAttendanceHistoryAsync()
    {
        var student = await GetCurrentStudentAsync();

        var attendances = await _context.Attendances
            .AsNoTracking()
            .Where(a => a.StudentId == student.Id)
            .Include(a => a.Lesson)
            .ThenInclude(l => l.Group)
            .ThenInclude(g => g.Subject)
            .Include(a => a.Lesson)
            .ThenInclude(l => l.Group)
            .ThenInclude(g => g.Teacher)
            .OrderByDescending(a => a.Lesson.StartTime)
            .ToListAsync();

        var lessonIds = attendances.Select(a => a.LessonId).Distinct().ToList();
        var grades = await _context.Grades
            .AsNoTracking()
            .Where(g => g.StudentId == student.Id && lessonIds.Contains(g.LessonId))
            .ToListAsync();

        var items = attendances.Select(a =>
        {
            var grade = grades.FirstOrDefault(g => g.LessonId == a.LessonId);
            return new StudentAttendanceHistoryItemDto(
                AttendanceId: a.Id,
                LessonId: a.LessonId,
                LessonTopic: a.Lesson?.Topic ?? "Dars",
                LessonStartTime: a.Lesson?.StartTime ?? a.CreatedAt,
                LessonEndTime: a.Lesson?.EndTime ?? a.CreatedAt.AddHours(2),
                GroupId: a.Lesson?.GroupId ?? Guid.Empty,
                GroupName: a.Lesson?.Group?.Name ?? "Guruh",
                SubjectName: a.Lesson?.Group?.Subject?.Name,
                TeacherName: a.Lesson?.Group?.Teacher?.FullName,
                Status: a.Status,
                Comment: a.Comment,
                GradeScore: grade?.Score
            );
        }).ToList();

        var total = items.Count;
        var present = items.Count(i => i.Status == AttendanceStatus.Present);
        var absent = items.Count(i => i.Status == AttendanceStatus.Absent);
        var late = items.Count(i => i.Status == AttendanceStatus.Late);
        var excused = items.Count(i => i.Status == AttendanceStatus.Excused);
        var percentage = total > 0 ? Math.Round((decimal)(present + late) / total * 100, 1) : 100m;

        var summary = new StudentAttendanceSummaryDto(
            TotalLessons: total,
            PresentCount: present,
            AbsentCount: absent,
            LateCount: late,
            ExcusedCount: excused,
            AttendancePercentage: percentage,
            Items: items
        );

        return ApiResponse<StudentAttendanceSummaryDto>.Ok(summary);
    }

    public async Task<ApiResponse<StudentFinanceDto>> GetStudentFinancesAsync()
    {
        var student = await GetCurrentStudentAsync();

        var payments = await _context.Payments
            .AsNoTracking()
            .Where(p => p.StudentId == student.Id)
            .Include(p => p.Group)
            .Include(p => p.Teacher)
            .Include(p => p.Transactions)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentDto(
                p.Id,
                p.StudentId,
                $"{student.FirstName} {student.LastName}",
                student.PhoneNumber,
                p.Amount,
                p.BasePrice,
                p.DiscountPercent,
                p.DiscountAmount,
                p.FinalAmount,
                p.PaidAmount,
                p.DebtAmount,
                p.TeacherSharePercent,
                p.TeacherShareAmount,
                p.CenterShareAmount,
                p.GroupId,
                p.Group != null ? p.Group.Name : null,
                p.TeacherId,
                p.Teacher != null ? p.Teacher.FullName : null,
                p.PaymentDate,
                p.DueDate,
                p.Status,
                p.Description,
                p.CreatedAt,
                p.Transactions.Select(t => new PaymentTransactionDto(
                    t.Id,
                    t.PaymentId,
                    t.Amount,
                    t.PaymentDate,
                    t.Method,
                    t.IdempotencyKey,
                    t.Notes
                )).ToList()
            ))
            .ToListAsync();

        var invoices = await _context.Invoices
            .AsNoTracking()
            .Where(inv => inv.StudentId == student.Id)
            .Include(inv => inv.Group)
            .Include(inv => inv.Parent)
            .OrderByDescending(inv => inv.CreatedAt)
            .Select(inv => new InvoiceDto(
                inv.Id,
                inv.InvoiceNumber,
                inv.StudentId,
                $"{student.FirstName} {student.LastName}",
                inv.ParentId,
                inv.Parent != null ? inv.Parent.FullName : null,
                inv.GroupId,
                inv.Group != null ? inv.Group.Name : null,
                inv.PaymentId,
                inv.BillingPeriod,
                inv.Amount,
                inv.IssueDate,
                inv.DueDate,
                inv.PaidDate,
                inv.Status,
                inv.Notes
            ))
            .ToListAsync();

        decimal totalPaid = payments.Sum(p => p.PaidAmount);
        decimal totalDebt = payments.Where(p => p.Status != PaymentStatus.Paid).Sum(p => p.DebtAmount);

        if (totalDebt == 0 && invoices.Any(i => i.Status != InvoiceStatus.Paid))
        {
            totalDebt = invoices.Where(i => i.Status != InvoiceStatus.Paid).Sum(i => i.Amount);
        }

        DateTime? nextDueDate = payments
            .Where(p => p.Status != PaymentStatus.Paid && p.DueDate >= DateTime.UtcNow)
            .OrderBy(p => p.DueDate)
            .Select(p => (DateTime?)p.DueDate)
            .FirstOrDefault()
            ?? invoices
                .Where(i => i.Status != InvoiceStatus.Paid && i.DueDate >= DateTime.UtcNow)
                .OrderBy(i => i.DueDate)
                .Select(i => (DateTime?)i.DueDate)
                .FirstOrDefault();

        var result = new StudentFinanceDto(
            StudentId: student.Id,
            StudentName: $"{student.FirstName} {student.LastName}",
            TotalPaid: totalPaid,
            TotalDebt: totalDebt,
            NextDueDate: nextDueDate,
            Invoices: invoices,
            Payments: payments
        );

        return ApiResponse<StudentFinanceDto>.Ok(result);
    }

    public async Task<ApiResponse<List<CalendarEventDto>>> GetStudentCalendarAsync(DateTime start, DateTime end)
    {
        var student = await GetCurrentStudentAsync();
        var groupIds = student.GroupStudents.Select(gs => gs.GroupId).ToList();

        if (!groupIds.Any())
        {
            return ApiResponse<List<CalendarEventDto>>.Ok(new List<CalendarEventDto>());
        }

        if (start == default) start = DateTime.UtcNow.AddDays(-14);
        if (end == default) end = DateTime.UtcNow.AddDays(30);

        var lessons = await _context.Lessons
            .AsNoTracking()
            .Where(l => groupIds.Contains(l.GroupId) && l.StartTime >= start && l.EndTime <= end && l.Status != LessonStatus.Cancelled)
            .Include(l => l.Group)
            .ThenInclude(g => g.Subject)
            .Include(l => l.Group)
            .ThenInclude(g => g.Teacher)
            .Include(l => l.Teacher)
            .Include(l => l.Room)
            .OrderBy(l => l.StartTime)
            .ToListAsync();

        var colors = new[] { "#0050cb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2" };

        var events = lessons.Select(l =>
        {
            var effectiveTeacher = l.Teacher ?? l.Group.Teacher;
            var colorIdx = Math.Abs(l.GroupId.GetHashCode()) % colors.Length;
            var color = colors[colorIdx];

            return new CalendarEventDto(
                Id: l.Id,
                GroupId: l.GroupId,
                GroupName: l.Group.Name,
                SubjectId: l.Group.SubjectId,
                SubjectName: l.Group.Subject?.Name,
                TeacherId: effectiveTeacher?.Id,
                TeacherName: effectiveTeacher?.FullName,
                RoomId: l.RoomId,
                RoomName: l.Room?.Name,
                RoomNumber: l.Room?.Number,
                StartTime: l.StartTime,
                EndTime: l.EndTime,
                Status: l.Status,
                Topic: l.Topic ?? string.Empty,
                Color: color
            );
        }).ToList();

        return ApiResponse<List<CalendarEventDto>>.Ok(events);
    }
}
