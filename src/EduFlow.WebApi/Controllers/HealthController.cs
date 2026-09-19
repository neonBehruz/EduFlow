using EduFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.WebApi.Controllers;

[ApiController]
[Route("health")]
[AllowAnonymous]
public class HealthController : ControllerBase
{
    private readonly EduFlowDbContext _context;

    public HealthController(EduFlowDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        bool dbHealthy = false;
        string? dbError = null;

        try
        {
            dbHealthy = await _context.Organizations.AnyAsync();
        }
        catch (Exception ex)
        {
            dbHealthy = false;
            dbError = ex.Message;
        }

        var status = new
        {
            status = dbHealthy ? "Healthy" : "Degraded",
            timestamp = DateTime.UtcNow,
            database = new
            {
                status = dbHealthy ? "Connected" : "Disconnected",
                error = dbError
            },
            version = "1.0.0-production",
            framework = ".NET 10"
        };

        return dbHealthy ? Ok(status) : StatusCode(503, status);
    }
}
