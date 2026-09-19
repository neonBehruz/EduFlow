using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduFlow.WebApi.Controllers;

[Authorize(Roles = "CenterAdmin,SuperAdmin")]
[Route("api/crm")]
public class CrmController : BaseApiController
{
    private readonly ICrmService _crmService;

    public CrmController(ICrmService crmService)
    {
        _crmService = crmService;
    }

    [HttpGet("leads")]
    public async Task<ActionResult<PagedResult<LeadDto>>> GetLeads(
        [FromQuery] LeadStatus? status,
        [FromQuery] LeadSource? source,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _crmService.GetLeadsAsync(status, source, search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("leads/{id:guid}")]
    public async Task<ActionResult<ApiResponse<LeadDto>>> GetLeadById(Guid id)
    {
        var result = await _crmService.GetLeadByIdAsync(id);
        return Ok(result);
    }

    [HttpPost("leads")]
    public async Task<ActionResult<ApiResponse<LeadDto>>> CreateLead([FromBody] CreateLeadDto dto)
    {
        var result = await _crmService.CreateLeadAsync(dto);
        return Ok(result);
    }

    [HttpPut("leads/{id:guid}")]
    public async Task<ActionResult<ApiResponse<LeadDto>>> UpdateLead(Guid id, [FromBody] UpdateLeadDto dto)
    {
        var result = await _crmService.UpdateLeadAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("leads/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteLead(Guid id)
    {
        var result = await _crmService.DeleteLeadAsync(id);
        return Ok(result);
    }

    [HttpPost("leads/enroll")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> EnrollLead([FromBody] EnrollLeadDto dto)
    {
        var result = await _crmService.EnrollLeadAsync(dto);
        return Ok(result);
    }

    [HttpGet("trial-lessons")]
    public async Task<ActionResult<List<TrialLessonDto>>> GetTrialLessons(
        [FromQuery] DateTime? date,
        [FromQuery] TrialLessonStatus? status)
    {
        var result = await _crmService.GetTrialLessonsAsync(date, status);
        return Ok(result);
    }

    [HttpPost("trial-lessons")]
    public async Task<ActionResult<ApiResponse<TrialLessonDto>>> ScheduleTrialLesson([FromBody] CreateTrialLessonDto dto)
    {
        var result = await _crmService.ScheduleTrialLessonAsync(dto);
        return Ok(result);
    }

    [HttpPut("trial-lessons/{id:guid}")]
    public async Task<ActionResult<ApiResponse<TrialLessonDto>>> UpdateTrialLesson(Guid id, [FromBody] UpdateTrialLessonDto dto)
    {
        var result = await _crmService.UpdateTrialLessonAsync(id, dto);
        return Ok(result);
    }
}

[Authorize(Roles = "CenterAdmin,SuperAdmin")]
[Route("api/risk-analysis")]
public class RiskAnalysisController : BaseApiController
{
    private readonly IStudentRiskService _riskService;

    public RiskAnalysisController(IStudentRiskService riskService)
    {
        _riskService = riskService;
    }

    [HttpGet("students")]
    public async Task<ActionResult<ApiResponse<List<StudentRiskDto>>>> GetAtRiskStudents()
    {
        var result = await _riskService.GetAtRiskStudentsAsync();
        return Ok(result);
    }
}
