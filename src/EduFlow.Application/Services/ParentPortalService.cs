using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class ParentPortalService : IParentPortalService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStudentProgressService _progressService;

    public ParentPortalService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IStudentProgressService progressService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _progressService = progressService;
    }

    private async Task<Domain.Entities.Parent> GetCurrentParentAsync()
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            throw new UnauthorizedAccessException("Tizimga kiring.");
        }

        var parent = await _context.Parents
            .Include(p => p.Students)
            .FirstOrDefaultAsync(p => p.UserId == userId.Value);

        if (parent == null)
        {
            // Fallback: check by email or create profile link if missing
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user != null)
            {
                parent = await _context.Parents
                    .Include(p => p.Students)
                    .FirstOrDefaultAsync(p => p.PhoneNumber == user.PhoneNumber);
                if (parent != null)
                {
                    parent.UserId = user.Id;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    parent = new Domain.Entities.Parent
                    {
                        OrganizationId = user.OrganizationId,
                        UserId = user.Id,
                        FullName = $"{user.FirstName} {user.LastName}".Trim(),
                        PhoneNumber = user.PhoneNumber ?? "+998900000000"
                    };
                    await _context.Parents.AddAsync(parent);
                    await _context.SaveChangesAsync();
                }
            }
        }

        if (parent == null)
        {
            throw new NotFoundException("Ota-ona profili topilmadi.");
        }

        return parent;
    }

    public async Task<ApiResponse<ParentDashboardDto>> GetParentDashboardAsync()
    {
        var parent = await GetCurrentParentAsync();
        var studentIds = parent.Students.Select(s => s.Id).ToList();

        var childrenDto = parent.Students.Select(s => new StudentDto
        {
            Id = s.Id,
            OrganizationId = s.OrganizationId,
            FirstName = s.FirstName,
            LastName = s.LastName,
            FullName = $"{s.FirstName} {s.LastName}",
            PhoneNumber = s.PhoneNumber,
            BirthDate = s.BirthDate,
            EnrollmentDate = s.EnrollmentDate,
            ParentId = s.ParentId,
            ParentName = parent.FullName,
            IsActive = s.IsActive
        }).ToList();

        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1).AddTicks(-1);

        // Children's groups
        var groupIds = await _context.GroupStudents
            .Where(gs => studentIds.Contains(gs.StudentId))
            .Select(gs => gs.GroupId)
            .Distinct()
            .ToListAsync();

        // Today's lessons for children
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

        // Upcoming lessons (next 7 days)
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

        // Recent attendance for children
        var recentAttendance = await _context.Attendances
            .AsNoTracking()
            .Where(a => studentIds.Contains(a.StudentId))
            .Include(a => a.Lesson)
            .Include(a => a.Student)
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .Select(a => new AttendanceDto
            {
                Id = a.Id,
                LessonId = a.LessonId,
                StudentId = a.StudentId,
                StudentName = $"{a.Student.FirstName} {a.Student.LastName}",
                Status = a.Status,
                Comment = a.Comment,
                LessonDate = a.Lesson != null ? a.Lesson.StartTime : a.CreatedAt
            })
            .ToListAsync();

        // Recent grades
        var recentGrades = await _context.Grades
            .AsNoTracking()
            .Where(g => studentIds.Contains(g.StudentId))
            .Include(g => g.Lesson)
            .ThenInclude(l => l.Group)
            .ThenInclude(grp => grp.Subject)
            .Include(g => g.Student)
            .OrderByDescending(g => g.CreatedAt)
            .Take(10)
            .Select(g => new GradeDto(
                g.Id,
                g.LessonId,
                g.StudentId,
                $"{g.Student.FirstName} {g.Student.LastName}",
                g.Lesson.Group.Subject != null ? g.Lesson.Group.Subject.Name : null,
                g.Score,
                g.Comment,
                g.CreatedAt
            ))
            .ToListAsync();

        // Pending homework
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

        // Invoices for children
        var invoices = await _context.Invoices
            .AsNoTracking()
            .Where(inv => studentIds.Contains(inv.StudentId) || inv.ParentId == parent.Id)
            .Include(inv => inv.Student)
            .Include(inv => inv.Group)
            .OrderByDescending(inv => inv.CreatedAt)
            .Take(10)
            .Select(inv => new InvoiceDto(
                inv.Id,
                inv.InvoiceNumber,
                inv.StudentId,
                $"{inv.Student.FirstName} {inv.Student.LastName}",
                inv.ParentId,
                parent.FullName,
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

        // Notifications
        var notifications = await _context.Notifications
            .AsNoTracking()
            .Where(n => n.ParentId == parent.Id || (n.StudentId.HasValue && studentIds.Contains(n.StudentId.Value)))
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .Select(n => new NotificationDto(
                n.Id,
                n.StudentId,
                n.Student != null ? $"{n.Student.FirstName} {n.Student.LastName}" : null,
                n.ParentId,
                parent.FullName,
                n.Message,
                n.Type,
                n.IsSent,
                n.SentAt,
                n.CreatedAt
            ))
            .ToListAsync();

        var dashboard = new ParentDashboardDto(
            parent.Id,
            parent.FullName,
            childrenDto,
            todayLessons,
            upcomingLessons,
            recentAttendance,
            recentGrades,
            pendingHomework,
            invoices,
            notifications
        );

        return ApiResponse<ParentDashboardDto>.Ok(dashboard);
    }

    public async Task<ApiResponse<ParentChildProfileDto>> GetChildProfileAsync(Guid studentId)
    {
        var parent = await GetCurrentParentAsync();
        var child = parent.Students.FirstOrDefault(s => s.Id == studentId);

        // Security check: strictly forbidden to inspect other students
        if (child == null)
        {
            throw new UnauthorizedAccessException("Siz ushbu o'quvchi ma'lumotlarini ko'rish huquqiga ega emassiz.");
        }

        var student = await _context.Students
            .AsNoTracking()
            .Include(s => s.GroupStudents)
            .ThenInclude(gs => gs.Group)
            .ThenInclude(g => g.Subject)
            .Include(s => s.GroupStudents)
            .ThenInclude(gs => gs.Group)
            .ThenInclude(g => g.Teacher)
            .FirstOrDefaultAsync(s => s.Id == studentId);

        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        var currentGroups = student.GroupStudents.Select(gs => new GroupDto
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
            EnrolledStudentsCount = 0,
            ScheduleDescription = gs.Group.ScheduleDescription,
            Room = gs.Group.Room,
            IsActive = gs.Group.IsActive
        }).ToList();

        var groupIds = student.GroupStudents.Select(gs => gs.GroupId).ToList();

        // Schedule
        var schedule = await _context.Lessons
            .AsNoTracking()
            .Where(l => groupIds.Contains(l.GroupId))
            .Include(l => l.Group)
            .ThenInclude(g => g.Subject)
            .Include(l => l.Group)
            .ThenInclude(g => g.Teacher)
            .OrderBy(l => l.StartTime)
            .Take(15)
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

        // Attendance Percentage
        var totalAtt = await _context.Attendances.AsNoTracking().CountAsync(a => a.StudentId == studentId);
        var presentAtt = await _context.Attendances.AsNoTracking().CountAsync(a => a.StudentId == studentId && (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late));
        var attPercentage = totalAtt > 0 ? Math.Round((decimal)presentAtt / totalAtt * 100, 1) : 100m;

        // Grades
        var grades = await _context.Grades
            .AsNoTracking()
            .Where(g => g.StudentId == studentId)
            .Include(g => g.Lesson)
            .ThenInclude(l => l.Group)
            .ThenInclude(grp => grp.Subject)
            .OrderByDescending(g => g.CreatedAt)
            .Take(20)
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

        // Homework submissions
        var submissions = await _context.HomeworkSubmissions
            .AsNoTracking()
            .Where(hs => hs.StudentId == studentId)
            .Include(hs => hs.Homework)
            .OrderByDescending(hs => hs.SubmittedAt)
            .Take(15)
            .Select(hs => new HomeworkSubmissionDto(
                hs.Id,
                hs.HomeworkId,
                hs.Homework.Title,
                studentId,
                $"{student.FirstName} {student.LastName}",
                hs.SubmittedAt,
                hs.Content,
                hs.AttachmentUrls,
                hs.Score,
                hs.Feedback,
                hs.Status,
                hs.ReviewedAt
            ))
            .ToListAsync();

        // Real Progress
        var progressRes = await _progressService.GetProgressAsync(studentId);

        // Payments
        var payments = await _context.Payments
            .AsNoTracking()
            .Where(p => p.StudentId == studentId)
            .Include(p => p.Group)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentDto
            {
                Id = p.Id,
                StudentId = p.StudentId,
                StudentName = $"{student.FirstName} {student.LastName}",
                StudentPhone = student.PhoneNumber,
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
                GroupName = p.Group != null ? p.Group.Name : null,
                PaymentDate = p.PaymentDate,
                DueDate = p.DueDate,
                Status = p.Status,
                Description = p.Description,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        // Invoices
        var invoices = await _context.Invoices
            .AsNoTracking()
            .Where(inv => inv.StudentId == studentId)
            .Include(inv => inv.Group)
            .OrderByDescending(inv => inv.CreatedAt)
            .Select(inv => new InvoiceDto(
                inv.Id,
                inv.InvoiceNumber,
                inv.StudentId,
                $"{student.FirstName} {student.LastName}",
                inv.ParentId,
                parent.FullName,
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

        var studentInfo = new StudentDetailDto(
            student.Id,
            student.OrganizationId,
            student.FirstName,
            student.LastName,
            $"{student.FirstName} {student.LastName}",
            student.PhoneNumber,
            student.BirthDate,
            student.EnrollmentDate,
            student.IsActive,
            new ParentDto(parent.Id, parent.FullName, parent.PhoneNumber, parent.TelegramChatId, parent.TelegramAccount != null),
            currentGroups.Select(g => new GroupSummaryDto(g.Id, g.Name, g.SubjectName, g.TeacherName)).ToList(),
            0,
            attPercentage,
            PaymentStatus.Paid,
            new List<AttendanceDto>(),
            grades,
            payments
        );

        var profile = new ParentChildProfileDto(
            studentInfo,
            currentGroups,
            schedule,
            attPercentage,
            grades,
            submissions,
            progressRes.Data,
            payments,
            invoices
        );

        return ApiResponse<ParentChildProfileDto>.Ok(profile);
    }

    public async Task<ApiResponse<List<InvoiceDto>>> GetChildInvoicesAsync(Guid studentId)
    {
        var parent = await GetCurrentParentAsync();
        if (!parent.Students.Any(s => s.Id == studentId))
        {
            throw new UnauthorizedAccessException("Ruxsat berilmagan.");
        }

        var invoices = await _context.Invoices
            .AsNoTracking()
            .Where(inv => inv.StudentId == studentId)
            .Include(inv => inv.Student)
            .Include(inv => inv.Group)
            .OrderByDescending(inv => inv.CreatedAt)
            .Select(inv => new InvoiceDto(
                inv.Id,
                inv.InvoiceNumber,
                inv.StudentId,
                $"{inv.Student.FirstName} {inv.Student.LastName}",
                inv.ParentId,
                parent.FullName,
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

        return ApiResponse<List<InvoiceDto>>.Ok(invoices);
    }
}
