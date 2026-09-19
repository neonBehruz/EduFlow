using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduFlow.WebApi.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".webp", ".zip"
    };

    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/zip",
        "application/x-zip-compressed"
    };

    private const long MaxFileSizeBytes = 15 * 1024 * 1024; // 15 MB
    private readonly IWebHostEnvironment _env;

    public FilesController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Hech qanday fayl tanlanmadi." });
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest(new { message = "Fayl hajmi 15 MB dan oshmasligi kerak." });
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = $"Ruxsat etilmagan fayl turi: {extension}. Ruxsat etilganlar: pdf, doc, docx, xls, xlsx, ppt, pptx, jpg, png, webp, zip." });
        }

        if (!AllowedMimeTypes.Contains(file.ContentType))
        {
            return BadRequest(new { message = $"Ruxsat etilmagan MIME turi: {file.ContentType}" });
        }

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads");
        if (!Directory.Exists(uploadsDir))
        {
            Directory.CreateDirectory(uploadsDir);
        }

        var safeFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var fullPath = Path.Combine(uploadsDir, safeFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/{safeFileName}";
        return Ok(new
        {
            fileUrl,
            originalName = file.FileName,
            size = file.Length,
            contentType = file.ContentType
        });
    }
}
