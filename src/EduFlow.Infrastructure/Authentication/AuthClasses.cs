using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace EduFlow.Infrastructure.Authentication;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var idClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(idClaim, out var id) ? id : null;
        }
    }

    public Guid? OrganizationId
    {
        get
        {
            var orgClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("OrganizationId")?.Value;
            return Guid.TryParse(orgClaim, out var id) ? id : null;
        }
    }

    public UserRole? Role
    {
        get
        {
            var roleClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;
            return Enum.TryParse<UserRole>(roleClaim, out var role) ? role : null;
        }
    }

    public string? Email => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value;

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}

public class TenantService : ITenantService
{
    private Guid? _currentOrganizationId;

    public Guid? CurrentOrganizationId => _currentOrganizationId;

    public void SetTenant(Guid organizationId)
    {
        _currentOrganizationId = organizationId;
    }
}

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET") 
            ?? _configuration["Jwt:Secret"] 
            ?? "EduFlowSuperSecretKeyForSaaSApplication2026!DefaultKey12345";
        var issuer = _configuration["Jwt:Issuer"] ?? "EduFlowApi";
        var audience = _configuration["Jwt:Audience"] ?? "EduFlowClient";
        var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var exp) ? exp : 120; // 2 hours default for access token

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("OrganizationId", user.OrganizationId.ToString()),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET") 
            ?? _configuration["Jwt:Secret"] 
            ?? "EduFlowSuperSecretKeyForSaaSApplication2026!DefaultKey12345";
        var issuer = _configuration["Jwt:Issuer"] ?? "EduFlowApi";
        var audience = _configuration["Jwt:Audience"] ?? "EduFlowClient";

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = false, // We check expired token here
            ClockSkew = TimeSpan.Zero
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
