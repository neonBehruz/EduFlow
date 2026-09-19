using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.DTOs;
using EduFlow.Application.Services;
using EduFlow.Application.Validators;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using EduFlow.Infrastructure.Authentication;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace EduFlow.SecurityTests;

public class AuthenticationSecurityTests
{
    private readonly IConfiguration _config;
    private readonly JwtTokenGenerator _jwtGenerator;

    public AuthenticationSecurityTests()
    {
        var settings = new Dictionary<string, string?>
        {
            { "Jwt:Secret", "TestSuperSecretKeyForUnitTestsOnlyMin64CharactersLongMustBeLongEnough12345" },
            { "Jwt:Issuer", "EduFlowTest" },
            { "Jwt:Audience", "EduFlowTestClient" },
            { "Jwt:ExpiryMinutes", "60" }
        };
        _config = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        _jwtGenerator = new JwtTokenGenerator(_config);
    }

    [Fact]
    public async Task SuperAdmin_Login_MaintainsSuperAdminRole_NeverDemoted()
    {
        // Arrange
        var currentUser = new TestCurrentUserService { Role = UserRole.SuperAdmin };
        var (context, mapper) = TestDbContextFactory.CreateContext(currentUser);
        var auditLog = new TestAuditLogService();

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Platform Org",
            Phone = "+998901112233",
            IsActive = true
        };
        context.Organizations.Add(org);

        var superAdmin = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            FirstName = "Super",
            LastName = "Admin",
            Email = "superadmin@eduflow.uz",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperAdminPass123!"),
            Role = UserRole.SuperAdmin,
            IsActive = true
        };
        context.Users.Add(superAdmin);
        await context.SaveChangesAsync();

        var lockout = new TestSecurityLockoutService();
        var authService = new AuthService(context, _jwtGenerator, currentUser, mapper, auditLog, lockout);

        // Act
        var result = await authService.LoginAsync(new LoginDto("superadmin@eduflow.uz", "SuperAdminPass123!"));

        // Assert
        Assert.True(result.Success);
        Assert.Equal(UserRole.SuperAdmin, result.Data!.User.Role);

        // Verify DB record was NOT mutated to CenterAdmin
        var dbUser = await context.Users.FindAsync(superAdmin.Id);
        Assert.Equal(UserRole.SuperAdmin, dbUser!.Role);
    }

    [Fact]
    public async Task RefreshToken_WithValidToken_RotatesRefreshToken()
    {
        // Arrange
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Center",
            Phone = "+998901112233",
            IsActive = true
        };

        var currentUser = new TestCurrentUserService { OrganizationId = org.Id };
        var (context, mapper) = TestDbContextFactory.CreateContext(currentUser);
        var auditLog = new TestAuditLogService();

        context.Organizations.Add(org);

        var user = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            FirstName = "Center",
            LastName = "Admin",
            Email = "admin@center.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("AdminPass123!"),
            Role = UserRole.CenterAdmin,
            IsActive = true,
            RefreshToken = "valid-initial-refresh-token",
            RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7)
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var lockout = new TestSecurityLockoutService();
        var authService = new AuthService(context, _jwtGenerator, currentUser, mapper, auditLog, lockout);
        var jwt = _jwtGenerator.GenerateToken(user);

        // Act
        var result = await authService.RefreshTokenAsync(new RefreshTokenDto(jwt, "valid-initial-refresh-token"));

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data!.Token);
        Assert.NotNull(result.Data!.RefreshToken);
        // Token must have rotated to a new string
        Assert.NotEqual("valid-initial-refresh-token", result.Data!.RefreshToken);

        // DB record should store new rotated refresh token
        var dbUser = await context.Users.FindAsync(user.Id);
        Assert.Equal(result.Data!.RefreshToken, dbUser!.RefreshToken);
    }

    [Fact]
    public async Task RefreshToken_ExpiredRefreshToken_ThrowsUnauthorized()
    {
        // Arrange
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Center",
            Phone = "+998901112233",
            IsActive = true
        };

        var currentUser = new TestCurrentUserService { OrganizationId = org.Id };
        var (context, mapper) = TestDbContextFactory.CreateContext(currentUser);
        var auditLog = new TestAuditLogService();

        context.Organizations.Add(org);

        var user = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            FirstName = "Expired",
            LastName = "User",
            Email = "expired@center.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"),
            Role = UserRole.CenterAdmin,
            IsActive = true,
            RefreshToken = "expired-token",
            RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(-1)
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var lockout = new TestSecurityLockoutService();
        var authService = new AuthService(context, _jwtGenerator, currentUser, mapper, auditLog, lockout);
        var jwt = _jwtGenerator.GenerateToken(user);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await authService.RefreshTokenAsync(new RefreshTokenDto(jwt, "expired-token"));
        });
    }

    [Fact]
    public void PasswordValidation_RejectsWeakPasswords()
    {
        var validator = new RegisterDtoValidator();

        // Too short (< 8)
        var res1 = validator.Validate(new RegisterDto("Org", "First", "Last", "test@test.com", "short1", "+998901234567", null));
        Assert.False(res1.IsValid);

        // No digits
        var res2 = validator.Validate(new RegisterDto("Org", "First", "Last", "test@test.com", "onlylettershere", "+998901234567", null));
        Assert.False(res2.IsValid);

        // No letters
        var res3 = validator.Validate(new RegisterDto("Org", "First", "Last", "test@test.com", "1234567890", "+998901234567", null));
        Assert.False(res3.IsValid);

        // Strong password (>=8 with letters and numbers)
        var res4 = validator.Validate(new RegisterDto("Org", "First", "Last", "test@test.com", "StrongPassword123", "+998901234567", null));
        Assert.True(res4.IsValid);
    }
}
