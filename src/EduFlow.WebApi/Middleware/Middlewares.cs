using System.Net;
using System.Security.Claims;
using System.Text.Json;
using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.Interfaces;

namespace EduFlow.WebApi.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var orgClaim = context.User.FindFirst("OrganizationId")?.Value;
            if (Guid.TryParse(orgClaim, out var organizationId))
            {
                tenantService.SetTenant(organizationId);
            }
        }

        await _next(context);
    }
}

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHostEnvironment _env;

    public SecurityHeadersMiddleware(RequestDelegate next, IHostEnvironment env)
    {
        _next = next;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            // 1. Anti-MIME Sniffing
            headers["X-Content-Type-Options"] = "nosniff";

            // 2. Anti-Clickjacking
            headers["X-Frame-Options"] = "DENY";

            // 3. Modern Content-Security-Policy (CSP)
            headers["Content-Security-Policy"] = 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com data:; " +
                "img-src 'self' data: https: blob:; " +
                "connect-src 'self' ws: wss: http: https:; " +
                "frame-ancestors 'none'; " +
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self';";

            // 4. Privacy & API restrictions
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
            headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups";
            headers["Cross-Origin-Resource-Policy"] = "cross-origin";

            // 5. HSTS in Production
            if (!_env.IsDevelopment())
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
            }

            // 6. Strip fingerprinting headers (Information Disclosure)
            headers.Remove("Server");
            headers.Remove("X-Powered-By");
            headers.Remove("X-AspNet-Version");
            headers.Remove("X-AspNetMvc-Version");

            return Task.CompletedTask;
        });

        await _next(context);
    }
}

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API so'rovini bajarishda kutilmagan xatolik yuz berdi: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            ValidationException valEx => new
            {
                StatusCode = (int)HttpStatusCode.BadRequest,
                Result = ApiResponse<object>.Fail(
                    valEx.Message,
                    valEx.Errors.SelectMany(e => e.Value).ToList()
                )
            },
            NotFoundException notFoundEx => new
            {
                StatusCode = (int)HttpStatusCode.NotFound,
                Result = ApiResponse<object>.Fail(notFoundEx.Message)
            },
            ForbiddenException forbiddenEx => new
            {
                StatusCode = (int)HttpStatusCode.Forbidden,
                Result = ApiResponse<object>.Fail(forbiddenEx.Message)
            },
            PlanLimitExceededException limitEx => new
            {
                StatusCode = (int)HttpStatusCode.PaymentRequired,
                Result = ApiResponse<object>.Fail(limitEx.Message)
            },
            _ => new
            {
                StatusCode = (int)HttpStatusCode.InternalServerError,
                Result = ApiResponse<object>.Fail("Serverda kutilmagan ichki xatolik yuz berdi.")
            }
        };

        context.Response.StatusCode = response.StatusCode;
        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(response.Result, jsonOptions));
    }
}
