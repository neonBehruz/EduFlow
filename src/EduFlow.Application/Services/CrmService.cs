using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class CrmService : ICrmService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CrmService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<LeadDto>> GetLeadsAsync(
        LeadStatus? status,
        LeadSource? source,
        string? search,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.Leads
            .AsNoTracking()
            .Include(l => l.InterestedSubject)
            .Include(l => l.AssignedUser)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(l => l.Status == status.Value);
        }

        if (source.HasValue)
        {
            query = query.Where(l => l.Source == source.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower().Trim();
            query = query.Where(l => l.FullName.ToLower().Contains(s) || l.PhoneNumber.Contains(s));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new LeadDto(
                l.Id,
                l.FullName,
                l.PhoneNumber,
                l.Email,
                l.InterestedSubjectId,
                l.InterestedSubject != null ? l.InterestedSubject.Name : null,
                l.Source,
                l.AssignedUserId,
                l.AssignedUser != null ? $"{l.AssignedUser.FirstName} {l.AssignedUser.LastName}" : null,
                l.Notes,
                l.Status,
                l.ConvertedStudentId,
                l.CreatedAt
            ))
            .ToListAsync();

        return new PagedResult<LeadDto>(items, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<LeadDto>> GetLeadByIdAsync(Guid id)
    {
        var l = await _context.Leads
            .AsNoTracking()
            .Include(l => l.InterestedSubject)
            .Include(l => l.AssignedUser)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (l == null) throw new NotFoundException("Lid topilmadi.");

        var dto = new LeadDto(
            l.Id,
            l.FullName,
            l.PhoneNumber,
            l.Email,
            l.InterestedSubjectId,
            l.InterestedSubject != null ? l.InterestedSubject.Name : null,
            l.Source,
            l.AssignedUserId,
            l.AssignedUser != null ? $"{l.AssignedUser.FirstName} {l.AssignedUser.LastName}" : null,
            l.Notes,
            l.Status,
            l.ConvertedStudentId,
            l.CreatedAt
        );

        return ApiResponse<LeadDto>.Ok(dto);
    }

    public async Task<ApiResponse<LeadDto>> CreateLeadAsync(CreateLeadDto dto)
    {
        var existing = await _context.Leads
            .FirstOrDefaultAsync(l => l.PhoneNumber == dto.PhoneNumber && l.Status != LeadStatus.Lost && l.Status != LeadStatus.Enrolled);

        if (existing != null)
        {
            // Update existing lead note instead of creating duplicate
            existing.Notes = (existing.Notes + $"\n[Yangi so'rov]: {dto.Notes}").Trim();
            if (dto.InterestedSubjectId.HasValue) existing.InterestedSubjectId = dto.InterestedSubjectId;
            await _context.SaveChangesAsync();
            return await GetLeadByIdAsync(existing.Id);
        }

        var lead = new Lead
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName,
            PhoneNumber = dto.PhoneNumber,
            Email = dto.Email,
            InterestedSubjectId = dto.InterestedSubjectId,
            Source = dto.Source,
            AssignedUserId = dto.AssignedUserId ?? _currentUserService.UserId,
            Notes = dto.Notes,
            Status = LeadStatus.New
        };

        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        return await GetLeadByIdAsync(lead.Id);
    }

    public async Task<ApiResponse<LeadDto>> UpdateLeadAsync(Guid id, UpdateLeadDto dto)
    {
        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) throw new NotFoundException("Lid topilmadi.");

        lead.FullName = dto.FullName;
        lead.PhoneNumber = dto.PhoneNumber;
        lead.Email = dto.Email;
        lead.InterestedSubjectId = dto.InterestedSubjectId;
        lead.Source = dto.Source;
        lead.AssignedUserId = dto.AssignedUserId;
        lead.Notes = dto.Notes;
        lead.Status = dto.Status;

        await _context.SaveChangesAsync();
        return await GetLeadByIdAsync(lead.Id);
    }

    public async Task<ApiResponse<bool>> DeleteLeadAsync(Guid id)
    {
        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) throw new NotFoundException("Lid topilmadi.");

        _context.Leads.Remove(lead);
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Lid o'chirildi.");
    }

    public async Task<ApiResponse<StudentDto>> EnrollLeadAsync(EnrollLeadDto dto)
    {
        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == dto.LeadId);
        if (lead == null) throw new NotFoundException("Lid topilmadi.");

        var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == dto.GroupId);
        if (group == null) throw new NotFoundException("Guruh topilmadi.");

        // Check if student already exists with this phone number to avoid duplicates
        var existingStudent = await _context.Students.FirstOrDefaultAsync(s => s.PhoneNumber == lead.PhoneNumber);
        Student student;

        if (existingStudent != null)
        {
            student = existingStudent;
        }
        else
        {
            // Split name into First & Last
            var names = lead.FullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            var firstName = names.Length > 0 ? names[0] : lead.FullName;
            var lastName = names.Length > 1 ? names[1] : "";

            Parent? parent = null;
            if (!string.IsNullOrWhiteSpace(dto.ParentName))
            {
                parent = new Parent
                {
                    Id = Guid.NewGuid(),
                    FullName = dto.ParentName,
                    PhoneNumber = dto.ParentPhone ?? lead.PhoneNumber
                };
                _context.Parents.Add(parent);
            }

            student = new Student
            {
                Id = Guid.NewGuid(),
                FirstName = firstName,
                LastName = lastName,
                PhoneNumber = lead.PhoneNumber,
                ParentId = parent?.Id,
                EnrollmentDate = DateTime.UtcNow,
                IsActive = true
            };
            _context.Students.Add(student);
        }

        // Add to group if not already in group
        var alreadyInGroup = await _context.GroupStudents.AnyAsync(gs => gs.GroupId == dto.GroupId && gs.StudentId == student.Id);
        if (!alreadyInGroup)
        {
            _context.GroupStudents.Add(new GroupStudent
            {
                Id = Guid.NewGuid(),
                GroupId = dto.GroupId,
                StudentId = student.Id,
                JoinedAt = DateTime.UtcNow
            });
        }

        // Update Lead status to Enrolled
        lead.Status = LeadStatus.Enrolled;
        lead.ConvertedStudentId = student.Id;

        // Auto-create initial monthly payment record
        var monthlyFee = dto.MonthlyFee > 0 ? dto.MonthlyFee : group.MonthlyFee;
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            GroupId = group.Id,
            TeacherId = group.TeacherId,
            BasePrice = monthlyFee,
            Amount = monthlyFee,
            FinalAmount = monthlyFee,
            PaidAmount = 0,
            DebtAmount = monthlyFee,
            DueDate = DateTime.UtcNow.AddDays(7),
            Status = PaymentStatus.Pending,
            Description = $"{group.Name} kursi uchun oylik to'lov"
        };
        _context.Payments.Add(payment);

        await _context.SaveChangesAsync();

        var studentDto = new StudentDto
        {
            Id = student.Id,
            OrganizationId = student.OrganizationId,
            FirstName = student.FirstName,
            LastName = student.LastName,
            FullName = $"{student.FirstName} {student.LastName}",
            PhoneNumber = student.PhoneNumber,
            BirthDate = student.BirthDate,
            EnrollmentDate = student.EnrollmentDate,
            ParentId = student.ParentId,
            IsActive = student.IsActive
        };

        return ApiResponse<StudentDto>.Ok(studentDto, "Lid muvaffaqiyatli o'quvchiga aylantirildi va guruhga biriktirildi.");
    }

    public async Task<List<TrialLessonDto>> GetTrialLessonsAsync(DateTime? date, TrialLessonStatus? status)
    {
        var query = _context.TrialLessons
            .AsNoTracking()
            .Include(tl => tl.Lead)
            .Include(tl => tl.Subject)
            .Include(tl => tl.Teacher)
            .Include(tl => tl.Room)
            .AsQueryable();

        if (date.HasValue)
        {
            var dStart = date.Value.Date;
            var dEnd = dStart.AddDays(1).AddTicks(-1);
            query = query.Where(tl => tl.ScheduledDate >= dStart && tl.ScheduledDate <= dEnd);
        }

        if (status.HasValue)
        {
            query = query.Where(tl => tl.Status == status.Value);
        }

        var items = await query
            .OrderBy(tl => tl.ScheduledDate)
            .ToListAsync();

        return items
            .OrderBy(tl => tl.ScheduledDate)
            .ThenBy(tl => tl.StartTime)
            .Select(tl => new TrialLessonDto(
            tl.Id,
            tl.LeadId,
            tl.Lead?.FullName ?? "",
            tl.Lead?.PhoneNumber ?? "",
            tl.SubjectId,
            tl.Subject != null ? tl.Subject.Name : null,
            tl.TeacherId,
            tl.Teacher != null ? tl.Teacher.FullName : null,
            tl.RoomId,
            tl.Room != null ? tl.Room.Name : null,
            tl.ScheduledDate,
            tl.StartTime.ToString(@"hh\:mm"),
            tl.EndTime.ToString(@"hh\:mm"),
            tl.Status,
            tl.Notes
        )).ToList();
    }

    public async Task<ApiResponse<TrialLessonDto>> ScheduleTrialLessonAsync(CreateTrialLessonDto dto)
    {
        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == dto.LeadId);
        if (lead == null) throw new NotFoundException("Lid topilmadi.");

        var trial = new TrialLesson
        {
            Id = Guid.NewGuid(),
            LeadId = dto.LeadId,
            SubjectId = dto.SubjectId,
            TeacherId = dto.TeacherId,
            RoomId = dto.RoomId,
            ScheduledDate = dto.ScheduledDate.Date,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Status = TrialLessonStatus.Scheduled,
            Notes = dto.Notes
        };

        // Transition lead to Trial stage
        lead.Status = LeadStatus.Trial;

        _context.TrialLessons.Add(trial);
        await _context.SaveChangesAsync();

        var created = await _context.TrialLessons
            .Include(tl => tl.Lead)
            .Include(tl => tl.Subject)
            .Include(tl => tl.Teacher)
            .Include(tl => tl.Room)
            .FirstAsync(tl => tl.Id == trial.Id);

        return ApiResponse<TrialLessonDto>.Ok(new TrialLessonDto(
            created.Id,
            created.LeadId,
            created.Lead.FullName,
            created.Lead.PhoneNumber,
            created.SubjectId,
            created.Subject?.Name,
            created.TeacherId,
            created.Teacher?.FullName,
            created.RoomId,
            created.Room?.Name,
            created.ScheduledDate,
            created.StartTime.ToString(@"hh\:mm"),
            created.EndTime.ToString(@"hh\:mm"),
            created.Status,
            created.Notes
        ), "Sinov darsi muvaffaqiyatli belgilandi.");
    }

    public async Task<ApiResponse<TrialLessonDto>> UpdateTrialLessonAsync(Guid id, UpdateTrialLessonDto dto)
    {
        var trial = await _context.TrialLessons
            .Include(tl => tl.Lead)
            .FirstOrDefaultAsync(tl => tl.Id == id);

        if (trial == null) throw new NotFoundException("Sinov darsi topilmadi.");

        trial.TeacherId = dto.TeacherId;
        trial.RoomId = dto.RoomId;
        trial.ScheduledDate = dto.ScheduledDate.Date;
        trial.StartTime = dto.StartTime;
        trial.EndTime = dto.EndTime;
        trial.Status = dto.Status;
        trial.Notes = dto.Notes;

        if (dto.Status == TrialLessonStatus.Interested)
        {
            trial.Lead.Status = LeadStatus.Interested;
        }
        else if (dto.Status == TrialLessonStatus.NotInterested)
        {
            trial.Lead.Status = LeadStatus.Lost;
        }

        await _context.SaveChangesAsync();

        var updated = await _context.TrialLessons
            .Include(tl => tl.Lead)
            .Include(tl => tl.Subject)
            .Include(tl => tl.Teacher)
            .Include(tl => tl.Room)
            .FirstAsync(tl => tl.Id == trial.Id);

        return ApiResponse<TrialLessonDto>.Ok(new TrialLessonDto(
            updated.Id,
            updated.LeadId,
            updated.Lead.FullName,
            updated.Lead.PhoneNumber,
            updated.SubjectId,
            updated.Subject?.Name,
            updated.TeacherId,
            updated.Teacher?.FullName,
            updated.RoomId,
            updated.Room?.Name,
            updated.ScheduledDate,
            updated.StartTime.ToString(@"hh\:mm"),
            updated.EndTime.ToString(@"hh\:mm"),
            updated.Status,
            updated.Notes
        ));
    }
}
