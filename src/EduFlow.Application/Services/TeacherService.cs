using AutoMapper;
using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class TeacherService : ITeacherService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IAuditLogService _auditLogService;
    private readonly IMapper _mapper;

    public TeacherService(
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

    public async Task<PagedResult<TeacherDto>> GetTeachersAsync(string? search, int page = 1, int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.Teachers
            .Include(t => t.Groups)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(t => t.FullName.ToLower().Contains(s) || t.PhoneNumber.Contains(s));
        }

        var totalCount = await query.CountAsync();
        var teachers = await query
            .OrderBy(t => t.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<TeacherDto>(_mapper.Map<List<TeacherDto>>(teachers), totalCount, page, pageSize);
    }

    public async Task<ApiResponse<TeacherDto>> GetTeacherByIdAsync(Guid id)
    {
        var teacher = await _context.Teachers
            .Include(t => t.Groups)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (teacher == null)
        {
            throw new NotFoundException("O'qituvchi topilmadi.");
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && teacher.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        return ApiResponse<TeacherDto>.Ok(_mapper.Map<TeacherDto>(teacher));
    }

    public async Task<ApiResponse<TeacherDto>> CreateTeacherAsync(CreateTeacherDto dto)
    {
        await _subscriptionService.ValidatePlanLimitAsync("teacher");

        if (!_currentUser.OrganizationId.HasValue)
        {
            throw new ForbiddenException();
        }

        var orgId = _currentUser.OrganizationId.Value;

        Guid? userId = null;
        if (!string.IsNullOrWhiteSpace(dto.Email) && !string.IsNullOrWhiteSpace(dto.Password))
        {
            var loginStr = dto.Email.Trim().ToLower();
            if (dto.Password.Length < 4)
            {
                throw new ValidationException("Parol kamida 4 ta belgidan iborat bo'lishi kerak.");
            }

            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == loginStr))
            {
                throw new ValidationException($"\"{dto.Email}\" logini allaqachon band. Iltimos, boshqa login tanlang.");
            }

            var user = new User
            {
                OrganizationId = orgId,
                FirstName = dto.FullName.Split(' ').FirstOrDefault() ?? dto.FullName,
                LastName = dto.FullName.Split(' ').Skip(1).FirstOrDefault() ?? "",
                Email = loginStr,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                PhoneNumber = dto.PhoneNumber,
                Role = UserRole.Teacher,
                IsActive = true
            };
            _context.Users.Add(user);
            userId = user.Id;
        }

        var teacher = new Teacher
        {
            OrganizationId = orgId,
            UserId = userId,
            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Specialization = dto.Specialization,
            SalaryModel = dto.SalaryModel ?? PayrollType.Percentage,
            FixedSalaryAmount = dto.FixedSalaryAmount,
            CustomSharePercentage = dto.CustomSharePercentage
        };
        _context.Teachers.Add(teacher);

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("CreateTeacher", "Teacher", teacher.Id.ToString(), $"Created teacher: {teacher.FullName}");

        return ApiResponse<TeacherDto>.Ok(_mapper.Map<TeacherDto>(teacher), "O'qituvchi muvaffaqiyatli qo'shildi.");
    }

    public async Task<ApiResponse<TeacherDto>> UpdateTeacherAsync(Guid id, UpdateTeacherDto dto)
    {
        var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == id);
        if (teacher == null)
        {
            throw new NotFoundException("O'qituvchi topilmadi.");
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && teacher.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        teacher.FullName = dto.FullName.Trim();
        teacher.PhoneNumber = dto.PhoneNumber.Trim();
        teacher.Specialization = dto.Specialization;
        if (dto.SalaryModel.HasValue) teacher.SalaryModel = dto.SalaryModel.Value;
        if (dto.FixedSalaryAmount.HasValue) teacher.FixedSalaryAmount = dto.FixedSalaryAmount.Value;
        if (dto.CustomSharePercentage.HasValue) teacher.CustomSharePercentage = dto.CustomSharePercentage.Value;
        teacher.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("UpdateTeacher", "Teacher", teacher.Id.ToString(), $"Updated teacher: {teacher.FullName}");

        return ApiResponse<TeacherDto>.Ok(_mapper.Map<TeacherDto>(teacher), "O'qituvchi ma'lumotlari yangilandi.");
    }

    public async Task<ApiResponse<bool>> DeleteTeacherAsync(Guid id)
    {
        var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == id);
        if (teacher == null)
        {
            throw new NotFoundException("O'qituvchi topilmadi.");
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && teacher.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        if (teacher.UserId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == teacher.UserId.Value);
            if (user != null)
            {
                user.IsActive = false;
            }
        }

        _context.Teachers.Remove(teacher);
        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("DeleteTeacher", "Teacher", teacher.Id.ToString(), $"Deleted teacher: {teacher.FullName}");

        return ApiResponse<bool>.Ok(true, "O'qituvchi o'chirildi.");
    }
}
