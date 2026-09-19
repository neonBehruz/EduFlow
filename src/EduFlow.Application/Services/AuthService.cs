using System.Security.Claims;
using AutoMapper;
using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtGenerator;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _auditLogService;
    private readonly ISecurityLockoutService _lockoutService;

    public AuthService(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtGenerator,
        ICurrentUserService currentUser,
        IMapper mapper,
        IAuditLogService auditLogService,
        ISecurityLockoutService lockoutService)
    {
        _context = context;
        _jwtGenerator = jwtGenerator;
        _currentUser = currentUser;
        _mapper = mapper;
        _auditLogService = auditLogService;
        _lockoutService = lockoutService;
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto)
    {
        // Check if user email already exists
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower()))
        {
            throw new ValidationException("Ushbu email manziliga ega foydalanuvchi allaqachon mavjud.");
        }

        // 1. Create Organization
        var orgName = !string.IsNullOrWhiteSpace(dto.OrganizationName)
            ? dto.OrganizationName.Trim()
            : $"{dto.FirstName.Trim()} {dto.LastName.Trim()} O'quv Markazi";

        var organization = new Organization
        {
            Name = orgName,
            Phone = dto.PhoneNumber.Trim(),
            Email = dto.Email.Trim().ToLower(),
            Address = dto.Address ?? "Toshkent shahri",
            IsActive = true
        };
        _context.Organizations.Add(organization);

        var initialRefreshToken = _jwtGenerator.GenerateRefreshToken();

        // 2. Create CenterAdmin User
        var user = new User
        {
            OrganizationId = organization.Id,
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Role = UserRole.CenterAdmin,
            IsActive = true,
            RefreshToken = initialRefreshToken,
            RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7)
        };
        _context.Users.Add(user);

        // 3. Find or Create Default Trial Plan and Subscription
        var trialPlan = await _context.SubscriptionPlans.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Name == "TRIAL" || p.Name == "FREE");
        if (trialPlan == null)
        {
            trialPlan = new SubscriptionPlan
            {
                Name = "TRIAL",
                MonthlyPrice = 0,
                MaxStudents = 50,
                MaxTeachers = 5,
                MaxGroups = 10,
                HasTelegram = true,
                HasReports = true,
                HasAdvancedAnalytics = true
            };
            _context.SubscriptionPlans.Add(trialPlan);
        }

        var subscription = new Subscription
        {
            OrganizationId = organization.Id,
            SubscriptionPlanId = trialPlan.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = SubscriptionStatus.Trial,
            AutoRenew = true
        };
        _context.Subscriptions.Add(subscription);

        await _context.SaveChangesAsync();

        var token = _jwtGenerator.GenerateToken(user);

        await _auditLogService.LogAsync(
            action: "REGISTER",
            resource: "User",
            resourceId: user.Id.ToString(),
            details: $"Tashkilot '{organization.Name}' va administrator '{user.Email}' muvaffaqiyatli ro'yxatdan o'tdi.",
            organizationId: organization.Id,
            userId: user.Id,
            userEmail: user.Email
        );

        var userDto = _mapper.Map<UserDto>(user);
        var orgDto = _mapper.Map<OrganizationDto>(organization);

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto(token, initialRefreshToken, userDto, orgDto), "Muvaffaqiyatli ro'yxatdan o'tildi!");
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var identifier = dto.Email.Trim().ToLower();

        // 1. Account Lockout & Brute-Force Check
        if (await _lockoutService.IsLockedOutAsync(identifier))
        {
            var remaining = await _lockoutService.GetRemainingLockoutTimeAsync(identifier);
            var minutes = remaining.HasValue ? Math.Max(1, (int)Math.Ceiling(remaining.Value.TotalMinutes)) : 15;
            throw new ValidationException($"Ko'p martalik xato urinishlar tufayli hisobingiz xavfsizlik maqsadida vaqtincha bloklangan. Iltimos, {minutes} daqiqadan so'ng qayta urinib ko'ring.");
        }

        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == identifier ||
                                      u.Email.ToLower() == identifier + "@smartedu.uz" ||
                                      u.Email.ToLower() == identifier + "@eduflow.uz" ||
                                      u.PhoneNumber == identifier);

        // 2. Timing Attack Prevention (CWE-208): Always run BCrypt verification
        const string dummyHash = "$2a$11$e87dY6VqfJ8t5vY8V6n1m.QZ9x8h3vP7p2r7q1w2e3r4t5y6u7i8o";
        bool isPasswordValid;
        if (user != null)
        {
            isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            // Allow both standard demo passwords (admin123 and EduFlow2026!) interchangeably for demo/seed accounts
            if (!isPasswordValid && (dto.Password == "admin123" || dto.Password == "EduFlow2026!"))
            {
                if (BCrypt.Net.BCrypt.Verify("admin123", user.PasswordHash) || BCrypt.Net.BCrypt.Verify("EduFlow2026!", user.PasswordHash))
                {
                    isPasswordValid = true;
                }
            }
        }
        else
        {
            // Execute dummy computation to prevent timing attacks and user enumeration
            BCrypt.Net.BCrypt.Verify(dto.Password, dummyHash);
            isPasswordValid = false;
        }

        if (user == null || !isPasswordValid)
        {
            await _lockoutService.RecordFailedAttemptAsync(identifier);
            await _auditLogService.LogAsync(
                action: "LOGIN_FAILED",
                resource: "User",
                resourceId: user?.Id.ToString(),
                details: $"Noto'g'ri login yoki parol kiritildi: {identifier}",
                organizationId: user?.OrganizationId,
                userId: user?.Id,
                userEmail: identifier
            );

            if (await _lockoutService.IsLockedOutAsync(identifier))
            {
                throw new ValidationException("Ketma-ket 5 marta xato parol kiritilgani sababli ushbu hisob 15 daqiqaga bloklandi!");
            }

            throw new ValidationException("Login yoki parol noto'g'ri kiritildi.");
        }

        // Reset failed attempts on successful login
        await _lockoutService.ResetFailedAttemptsAsync(identifier);

        // Validate Expected Role if requested by client
        if (dto.ExpectedRole.HasValue)
        {
            bool roleMatches = dto.ExpectedRole.Value switch
            {
                1 or 2 => user.Role == UserRole.SuperAdmin || user.Role == UserRole.CenterAdmin,
                3 => user.Role == UserRole.Teacher,
                4 => user.Role == UserRole.Parent,
                5 => user.Role == UserRole.Student,
                _ => (int)user.Role == dto.ExpectedRole.Value
            };

            if (!roleMatches)
            {
                var expectedName = dto.ExpectedRole.Value switch
                {
                    1 or 2 => "Admin",
                    3 => "O'qituvchi",
                    4 => "Ota-ona",
                    5 => "O'quvchi",
                    _ => "Tanlangan rol"
                };
                var actualName = user.Role switch
                {
                    UserRole.SuperAdmin or UserRole.CenterAdmin => "Admin",
                    UserRole.Teacher => "O'qituvchi",
                    UserRole.Parent => "Ota-ona",
                    UserRole.Student => "O'quvchi",
                    _ => "boshqa rol"
                };

                await _auditLogService.LogAsync(
                    action: "LOGIN_ROLE_MISMATCH",
                    resource: "User",
                    resourceId: user.Id.ToString(),
                    details: $"Rol mos kelmadi: Tanlangan ({expectedName}), hisob roli ({actualName})",
                    organizationId: user.OrganizationId,
                    userId: user.Id,
                    userEmail: user.Email
                );

                throw new ValidationException($"Siz \"{expectedName}\" rolini tanladingiz, biroq kiritilgan hisob \"{actualName}\" roliga tegishli! Iltimos, to'g'ri rolni tanlang yoki mos hisob ma'lumotlarini kiriting.");
            }
        }

        // Active checks
        if (!user.IsActive || (user.Role != UserRole.SuperAdmin && user.Organization != null && !user.Organization.IsActive))
        {
            await _auditLogService.LogAsync(
                action: "LOGIN_BLOCKED",
                resource: "User",
                resourceId: user.Id.ToString(),
                details: "Nofaol hisob yoki nofaol markaz orqali kirish bloklandi.",
                organizationId: user.OrganizationId,
                userId: user.Id,
                userEmail: user.Email
            );

            throw new ForbiddenException("Hisobingiz yoki o'quv markazingiz faol emas. Administratorga murojaat qiling.");
        }

        var token = _jwtGenerator.GenerateToken(user);
        var refreshToken = _jwtGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "LOGIN_SUCCESS",
            resource: "User",
            resourceId: user.Id.ToString(),
            details: $"Foydalanuvchi tizimga kirdi (Role: {user.Role}).",
            organizationId: user.OrganizationId,
            userId: user.Id,
            userEmail: user.Email
        );

        var userDto = _mapper.Map<UserDto>(user);
        var orgDto = _mapper.Map<OrganizationDto>(user.Organization);

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto(token, refreshToken, userDto, orgDto), "Tizimga muvaffaqiyatli kirildi!");
    }

    public async Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(RefreshTokenDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            throw new ValidationException("Token yoki RefreshToken taqdim etilmadi.");
        }

        var principal = _jwtGenerator.GetPrincipalFromExpiredToken(dto.Token);
        if (principal == null)
        {
            throw new ValidationException("Yaroqsiz token formati.");
        }

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new ValidationException("Token ichidan foydalanuvchi identifikatori topilmadi.");
        }

        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.RefreshToken != dto.RefreshToken || !user.RefreshTokenExpiryTime.HasValue || user.RefreshTokenExpiryTime.Value <= DateTime.UtcNow)
        {
            await _auditLogService.LogAsync(
                action: "TOKEN_REFRESH_FAILED",
                resource: "User",
                resourceId: userId.ToString(),
                details: "Yaroqsiz yoki muddati o'tgan refresh token orqali yangilash urinishi.",
                organizationId: user?.OrganizationId,
                userId: user?.Id,
                userEmail: user?.Email
            );

            throw new ValidationException("Yaroqsiz yoki muddati o'tgan refresh token.");
        }

        if (!user.IsActive || (user.Role != UserRole.SuperAdmin && !user.Organization.IsActive))
        {
            throw new ForbiddenException("Hisobingiz yoki o'quv markazingiz faol emas.");
        }

        // Rotate tokens
        var newAccessToken = _jwtGenerator.GenerateToken(user);
        var newRefreshToken = _jwtGenerator.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "TOKEN_REFRESH_SUCCESS",
            resource: "User",
            resourceId: user.Id.ToString(),
            details: "Tokenlar muvaffaqiyatli yangilandi va rotatsiya qilindi.",
            organizationId: user.OrganizationId,
            userId: user.Id,
            userEmail: user.Email
        );

        var userDto = _mapper.Map<UserDto>(user);
        var orgDto = _mapper.Map<OrganizationDto>(user.Organization);

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto(newAccessToken, newRefreshToken, userDto, orgDto), "Token yangilandi.");
    }

    public async Task<ApiResponse<bool>> RevokeTokenAsync(RevokeTokenDto dto)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue)
        {
            throw new ForbiddenException();
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                action: "TOKEN_REVOKED",
                resource: "User",
                resourceId: user.Id.ToString(),
                details: "Foydalanuvchining refresh tokeni bekor qilindi.",
                organizationId: user.OrganizationId,
                userId: user.Id,
                userEmail: user.Email
            );
        }

        return ApiResponse<bool>.Ok(true, "Token bekor qilindi.");
    }

    public async Task<ApiResponse<bool>> LogoutAsync()
    {
        var userId = _currentUser.UserId;
        if (userId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                await _context.SaveChangesAsync();

                await _auditLogService.LogAsync(
                    action: "LOGOUT",
                    resource: "User",
                    resourceId: user.Id.ToString(),
                    details: "Foydalanuvchi tizimdan chiqdi.",
                    organizationId: user.OrganizationId,
                    userId: user.Id,
                    userEmail: user.Email
                );
            }
        }

        return ApiResponse<bool>.Ok(true, "Tizimdan muvaffaqiyatli chiqildi.");
    }

    public async Task<ApiResponse<UserDto>> GetCurrentUserProfileAsync()
    {
        if (!_currentUser.UserId.HasValue)
        {
            throw new ForbiddenException();
        }

        var user = await _context.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId.Value);

        if (user == null)
        {
            throw new NotFoundException("Foydalanuvchi topilmadi.");
        }

        return ApiResponse<UserDto>.Ok(_mapper.Map<UserDto>(user));
    }

    public async Task<ApiResponse<UserDto>> UpdateProfileAsync(UpdateProfileDto dto)
    {
        if (!_currentUser.UserId.HasValue)
        {
            throw new ForbiddenException();
        }

        var user = await _context.Users
            .Include(u => u.Organization)
            .Include(u => u.Teacher)
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId.Value);

        if (user == null)
        {
            throw new NotFoundException("Foydalanuvchi topilmadi.");
        }

        if (!string.IsNullOrWhiteSpace(dto.FirstName)) user.FirstName = dto.FirstName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.LastName)) user.LastName = dto.LastName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber)) user.PhoneNumber = dto.PhoneNumber.Trim();

        if (user.Teacher != null)
        {
            user.Teacher.FullName = $"{user.FirstName} {user.LastName}".Trim();
            user.Teacher.PhoneNumber = user.PhoneNumber;
            if (!string.IsNullOrWhiteSpace(dto.Specialization))
            {
                user.Teacher.Specialization = dto.Specialization.Trim();
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        await _context.SaveChangesAsync();

        return ApiResponse<UserDto>.Ok(_mapper.Map<UserDto>(user), "Profil ma'lumotlari muvaffaqiyatli yangilandi.");
    }
}
