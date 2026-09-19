using AutoMapper;
using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class StudentService : IStudentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IAuditLogService _auditLogService;
    private readonly IMapper _mapper;

    public StudentService(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        ISubscriptionService subscriptionService,
        IAuditLogService auditLogService,
        IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _subscriptionService = subscriptionService;
        _auditLogService = auditLogService;
        _mapper = mapper;
    }

    public async Task<PagedResult<StudentDto>> GetStudentsAsync(string? search, Guid? groupId, bool? isActive, int page = 1, int pageSize = 10)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.Students
            .Include(s => s.Parent)
            .Include(s => s.GroupStudents).ThenInclude(gs => gs.Group)
            .Include(s => s.Attendances)
            .Include(s => s.Grades)
            .Include(s => s.Payments)
            .AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        if (groupId.HasValue)
        {
            query = query.Where(s => s.GroupStudents.Any(gs => gs.GroupId == groupId.Value));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x =>
                x.FirstName.ToLower().Contains(s) ||
                x.LastName.ToLower().Contains(s) ||
                x.PhoneNumber.Contains(s) ||
                (x.Parent != null && x.Parent.FullName.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();
        var students = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var studentDtos = _mapper.Map<List<StudentDto>>(students);

        return new PagedResult<StudentDto>(studentDtos, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<StudentDetailDto>> GetStudentByIdAsync(Guid id)
    {
        var student = await _context.Students
            .Include(s => s.Parent).ThenInclude(p => p!.TelegramAccount)
            .Include(s => s.GroupStudents).ThenInclude(gs => gs.Group).ThenInclude(g => g.Subject)
            .Include(s => s.GroupStudents).ThenInclude(gs => gs.Group).ThenInclude(g => g.Teacher)
            .Include(s => s.Attendances).ThenInclude(a => a.Lesson)
            .Include(s => s.Grades).ThenInclude(g => g.Lesson).ThenInclude(l => l.Group).ThenInclude(g => g.Subject)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null)
        {
            throw new NotFoundException("O'quvchi topilmadi.");
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && student.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        var parentDto = student.Parent != null ? _mapper.Map<ParentDto>(student.Parent) : null;
        var groups = student.GroupStudents.Select(gs => _mapper.Map<GroupSummaryDto>(gs.Group)).ToList();
        var recentAttendances = _mapper.Map<List<AttendanceDto>>(student.Attendances.OrderByDescending(a => a.CreatedAt).Take(20).ToList());
        var recentGrades = _mapper.Map<List<GradeDto>>(student.Grades.OrderByDescending(g => g.CreatedAt).Take(20).ToList());
        var recentPayments = _mapper.Map<List<PaymentDto>>(student.Payments.OrderByDescending(p => p.DueDate).Take(20).ToList());

        var avgGrade = student.Grades.Any() ? Math.Round(student.Grades.Average(g => g.Score), 1) : 0;
        var attPercentage = student.Attendances.Any()
            ? Math.Round((decimal)student.Attendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late) / student.Attendances.Count * 100, 0)
            : 100;
        var currentPaymentStatus = student.Payments.OrderByDescending(p => p.DueDate).Select(p => p.Status).FirstOrDefault();

        var detailDto = new StudentDetailDto(
            student.Id,
            student.OrganizationId,
            student.FirstName,
            student.LastName,
            $"{student.FirstName} {student.LastName}".Trim(),
            student.PhoneNumber,
            student.BirthDate,
            student.EnrollmentDate,
            student.IsActive,
            parentDto,
            groups,
            avgGrade,
            attPercentage,
            currentPaymentStatus,
            recentAttendances,
            recentGrades,
            recentPayments
        );

        return ApiResponse<StudentDetailDto>.Ok(detailDto);
    }

    public async Task<ApiResponse<StudentDto>> CreateStudentAsync(CreateStudentDto dto)
    {
        await _subscriptionService.ValidatePlanLimitAsync("student");

        if (!_currentUser.OrganizationId.HasValue)
        {
            throw new ForbiddenException();
        }

        var orgId = _currentUser.OrganizationId.Value;

        Parent? parent = null;
        if (!string.IsNullOrWhiteSpace(dto.ParentFullName) || !string.IsNullOrWhiteSpace(dto.ParentPhoneNumber))
        {
            parent = new Parent
            {
                OrganizationId = orgId,
                FullName = dto.ParentFullName ?? "Ota-ona",
                PhoneNumber = dto.ParentPhoneNumber ?? ""
            };
            _context.Parents.Add(parent);
        }

        Guid? userId = null;
        if (!string.IsNullOrWhiteSpace(dto.Login) && !string.IsNullOrWhiteSpace(dto.Password))
        {
            var loginStr = dto.Login.Trim().ToLower();
            if (dto.Password.Length < 4)
            {
                throw new ValidationException("Parol kamida 4 ta belgidan iborat bo'lishi kerak.");
            }

            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == loginStr))
            {
                throw new ValidationException($"\"{dto.Login}\" logini allaqachon band. Iltimos, boshqa login tanlang.");
            }

            var studentUser = new User
            {
                OrganizationId = orgId,
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = loginStr, // stores username or email
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Role = UserRole.Student,
                IsActive = true
            };
            _context.Users.Add(studentUser);
            userId = studentUser.Id;
        }

        var student = new Student
        {
            OrganizationId = orgId,
            UserId = userId,
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            BirthDate = dto.BirthDate,
            EnrollmentDate = DateTime.UtcNow,
            ParentId = parent?.Id,
            IsActive = true
        };
        _context.Students.Add(student);

        if (dto.GroupId.HasValue)
        {
            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == dto.GroupId.Value);
            if (group != null && group.OrganizationId == orgId)
            {
                _context.GroupStudents.Add(new GroupStudent
                {
                    GroupId = group.Id,
                    StudentId = student.Id,
                    JoinedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("CreateStudent", "Student", student.Id.ToString(), $"Created student: {student.FirstName} {student.LastName}");

        return await GetStudentSummaryDtoAsync(student.Id);
    }

    public async Task<ApiResponse<StudentDto>> UpdateStudentAsync(Guid id, UpdateStudentDto dto)
    {
        var student = await _context.Students
            .Include(s => s.Parent)
            .Include(s => s.GroupStudents)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null)
        {
            throw new NotFoundException("O'quvchi topilmadi.");
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && student.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        student.FirstName = dto.FirstName.Trim();
        student.LastName = dto.LastName.Trim();
        student.PhoneNumber = dto.PhoneNumber.Trim();
        student.BirthDate = dto.BirthDate;
        student.IsActive = dto.IsActive;
        student.UpdatedAt = DateTime.UtcNow;

        if (student.Parent != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.ParentFullName)) student.Parent.FullName = dto.ParentFullName.Trim();
            if (!string.IsNullOrWhiteSpace(dto.ParentPhoneNumber)) student.Parent.PhoneNumber = dto.ParentPhoneNumber.Trim();
            student.Parent.UpdatedAt = DateTime.UtcNow;
        }
        else if (!string.IsNullOrWhiteSpace(dto.ParentFullName))
        {
            var newParent = new Parent
            {
                OrganizationId = student.OrganizationId,
                FullName = dto.ParentFullName.Trim(),
                PhoneNumber = dto.ParentPhoneNumber ?? ""
            };
            _context.Parents.Add(newParent);
            student.ParentId = newParent.Id;
        }

        if (dto.GroupId.HasValue)
        {
            var targetGroupId = dto.GroupId.Value;
            var currentGs = student.GroupStudents.FirstOrDefault(gs => gs.GroupId == targetGroupId);
            if (currentGs == null)
            {
                var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == targetGroupId && g.OrganizationId == student.OrganizationId);
                if (group != null)
                {
                    _context.GroupStudents.Add(new GroupStudent
                    {
                        GroupId = targetGroupId,
                        StudentId = student.Id,
                        JoinedAt = DateTime.UtcNow
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("UpdateStudent", "Student", student.Id.ToString(), $"Updated student: {student.FirstName} {student.LastName}");

        return await GetStudentSummaryDtoAsync(student.Id);
    }

    public async Task<ApiResponse<bool>> DeleteStudentAsync(Guid id)
    {
        var student = await _context.Students
            .Include(s => s.GroupStudents)
            .Include(s => s.Attendances)
            .Include(s => s.Grades)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null)
        {
            throw new NotFoundException("O'quvchi topilmadi.");
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && student.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        if (student.GroupStudents.Any())
        {
            _context.GroupStudents.RemoveRange(student.GroupStudents);
        }

        if (student.Attendances.Any())
        {
            _context.Attendances.RemoveRange(student.Attendances);
        }

        if (student.Grades.Any())
        {
            _context.Grades.RemoveRange(student.Grades);
        }

        if (student.Payments.Any())
        {
            _context.Payments.RemoveRange(student.Payments);
        }

        var notifications = await _context.Notifications.Where(n => n.StudentId == id).ToListAsync();
        if (notifications.Any())
        {
            _context.Notifications.RemoveRange(notifications);
        }

        _context.Students.Remove(student);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("DeleteStudent", "Student", student.Id.ToString(), $"Hard-deleted student from database: {student.FirstName} {student.LastName}");

        return ApiResponse<bool>.Ok(true, "O'quvchi bazadan butunlay o'chirildi.");
    }

    private async Task<ApiResponse<StudentDto>> GetStudentSummaryDtoAsync(Guid studentId)
    {
        var updated = await _context.Students
            .Include(s => s.Parent)
            .Include(s => s.GroupStudents).ThenInclude(gs => gs.Group)
            .Include(s => s.Attendances)
            .Include(s => s.Grades)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == studentId);

        return ApiResponse<StudentDto>.Ok(_mapper.Map<StudentDto>(updated!));
    }
}
