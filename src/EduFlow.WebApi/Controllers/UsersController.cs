using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.WebApi.Controllers;

[Authorize(Roles = "CenterAdmin,SuperAdmin")]
[Route("api/users")]
public class UsersController : BaseApiController
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _auditLogService;

    public UsersController(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAuditLogService auditLogService)
    {
        _context = context;
        _currentUser = currentUser;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<UserDto>>> GetUsers(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Users.AsNoTracking();

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue)
        {
            query = query.Where(u => u.OrganizationId == _currentUser.OrganizationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s) ||
                u.Email.ToLower().Contains(s) ||
                u.PhoneNumber.Contains(s));
        }

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto(
                u.Id,
                u.OrganizationId,
                u.FirstName,
                u.LastName,
                u.Email,
                u.PhoneNumber,
                u.Role,
                u.IsActive
            ))
            .ToListAsync();

        return Ok(new PagedResult<UserDto>(users, totalCount, page, pageSize));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(Guid id)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) throw new NotFoundException("Foydalanuvchi topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && user.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        var dto = new UserDto(
            user.Id,
            user.OrganizationId,
            user.FirstName,
            user.LastName,
            user.Email,
            user.PhoneNumber,
            user.Role,
            user.IsActive
        );

        return Ok(ApiResponse<UserDto>.Ok(dto));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser([FromBody] CreateUserRequestDto dto)
    {
        var orgId = _currentUser.OrganizationId;
        if (!orgId.HasValue && _currentUser.Role != UserRole.SuperAdmin)
        {
            throw new ForbiddenException("Tashkilot aniqlanmadi.");
        }

        var emailNormalized = dto.Email.Trim().ToLower();
        var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == emailNormalized);
        if (exists)
        {
            throw new ValidationException("Ushbu email bilan foydalanuvchi allaqachon mavjud.");
        }

        var user = new User
        {
            OrganizationId = orgId ?? Guid.Empty,
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = emailNormalized,
            PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            IsActive = dto.IsActive
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("CreateUser", "User", user.Id.ToString(), $"Created user: {user.Email} (Role: {user.Role})");

        var resultDto = new UserDto(
            user.Id,
            user.OrganizationId,
            user.FirstName,
            user.LastName,
            user.Email,
            user.PhoneNumber,
            user.Role,
            user.IsActive
        );

        return Ok(ApiResponse<UserDto>.Ok(resultDto, "Foydalanuvchi muvaffaqiyatli yaratildi."));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(Guid id, [FromBody] UpdateUserRequestDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) throw new NotFoundException("Foydalanuvchi topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && user.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        var emailNormalized = dto.Email.Trim().ToLower();
        if (user.Email.ToLower() != emailNormalized)
        {
            var emailExists = await _context.Users.AnyAsync(u => u.Id != id && u.Email.ToLower() == emailNormalized);
            if (emailExists)
            {
                throw new ValidationException("Ushbu email bilan boshqa foydalanuvchi mavjud.");
            }
            user.Email = emailNormalized;
        }

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty;
        user.Role = dto.Role;
        user.IsActive = dto.IsActive;

        if (!string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("UpdateUser", "User", user.Id.ToString(), $"Updated user: {user.Email}");

        var resultDto = new UserDto(
            user.Id,
            user.OrganizationId,
            user.FirstName,
            user.LastName,
            user.Email,
            user.PhoneNumber,
            user.Role,
            user.IsActive
        );

        return Ok(ApiResponse<UserDto>.Ok(resultDto, "Foydalanuvchi ma'lumotlari yangilandi."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteUser(Guid id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) throw new NotFoundException("Foydalanuvchi topilmadi.");

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && user.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        // Avoid deleting self
        if (_currentUser.UserId.HasValue && _currentUser.UserId.Value == user.Id)
        {
            throw new ValidationException("O'zingizning hisobingizni o'chira olmaysiz.");
        }

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("DeactivateUser", "User", user.Id.ToString(), $"Deactivated user: {user.Email}");

        return Ok(ApiResponse<bool>.Ok(true, "Foydalanuvchi muvaffaqiyatli nofaol qilindi."));
    }
}
