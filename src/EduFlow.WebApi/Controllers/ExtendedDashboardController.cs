using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduFlow.WebApi.Controllers;

[Authorize]
[Route("api/dashboard/extended")]
[Route("api/extended-dashboard")]
public class ExtendedDashboardController : BaseApiController
{
    private readonly IExtendedDashboardService _extendedDashboardService;

    public ExtendedDashboardController(IExtendedDashboardService extendedDashboardService)
    {
        _extendedDashboardService = extendedDashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<ExtendedDashboardStatsDto>>> GetExtendedStats([FromQuery] DashboardFilterRequestDto request)
    {
        var result = await _extendedDashboardService.GetExtendedDashboardStatsAsync(request);
        return Ok(result);
    }
}
