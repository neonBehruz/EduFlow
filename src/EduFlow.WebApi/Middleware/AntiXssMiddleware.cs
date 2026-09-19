using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.RegularExpressions;
using EduFlow.Application.Common.Models;

namespace EduFlow.WebApi.Middleware;

public class AntiXssMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AntiXssMiddleware> _logger;

    // High-risk XSS patterns
    private static readonly Regex XssPattern = new(
        @"<script[^>]*>|javascript:|vbscript:|onload\s*=|onerror\s*=|onclick\s*=|onmouseover\s*=|eval\(|<iframe|<embed|<object",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public AntiXssMiddleware(RequestDelegate next, ILogger<AntiXssMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only inspect mutating requests
        if (HttpMethods.IsPost(context.Request.Method) ||
            HttpMethods.IsPut(context.Request.Method) ||
            HttpMethods.IsPatch(context.Request.Method))
        {
            if (context.Request.ContentType != null &&
                context.Request.ContentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
            {
                context.Request.EnableBuffering();

                using (var reader = new StreamReader(
                    context.Request.Body,
                    Encoding.UTF8,
                    detectEncodingFromByteOrderMarks: false,
                    bufferSize: 1024 * 4,
                    leaveOpen: true))
                {
                    var body = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;

                    if (!string.IsNullOrEmpty(body) && XssPattern.IsMatch(body))
                    {
                        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                        _logger.LogWarning("Xavfsizlik xuruji to'xtatildi (XSS Injection Blocked)! IP: {Ip}, Path: {Path}", ip, context.Request.Path);

                        context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        context.Response.ContentType = "application/json";

                        var response = ApiResponse<object>.Fail("Xavfsizlik ogohlantirishi: Kiruvchi ma'lumotlarda zararli skript yoki ruxsat etilmagan HTML teglari aniqlandi.");
                        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                        await context.Response.WriteAsync(json);
                        return;
                    }
                }
            }
        }

        await _next(context);
    }
}
