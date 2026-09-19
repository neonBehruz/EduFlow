using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduFlow.WebApi.Controllers;

[Authorize(Roles = "Parent,CenterAdmin,SuperAdmin")]
[Route("api/parent-portal")]
[Route("api/portal/parent")]
public class ParentPortalController : BaseApiController
{
    private readonly IParentPortalService _parentPortalService;

    public ParentPortalController(IParentPortalService parentPortalService)
    {
        _parentPortalService = parentPortalService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<ParentDashboardDto>>> GetDashboard()
    {
        var result = await _parentPortalService.GetParentDashboardAsync();
        return Ok(result);
    }

    [HttpGet("children/{studentId:guid}")]
    [HttpGet("children/{studentId:guid}/progress")]
    public async Task<ActionResult<ApiResponse<ParentChildProfileDto>>> GetChildProfile(Guid studentId)
    {
        var result = await _parentPortalService.GetChildProfileAsync(studentId);
        return Ok(result);
    }

    [HttpGet("children/{studentId:guid}/invoices")]
    public async Task<ActionResult<ApiResponse<List<InvoiceDto>>>> GetChildInvoices(Guid studentId)
    {
        var result = await _parentPortalService.GetChildInvoicesAsync(studentId);
        return Ok(result);
    }
}

[Authorize(Roles = "Student,CenterAdmin,SuperAdmin")]
[Route("api/student-portal")]
[Route("api/portal/student")]
public class StudentPortalController : BaseApiController
{
    private readonly IStudentPortalService _studentPortalService;

    public StudentPortalController(IStudentPortalService studentPortalService)
    {
        _studentPortalService = studentPortalService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<StudentDashboardDto>>> GetDashboard()
    {
        var result = await _studentPortalService.GetStudentDashboardAsync();
        return Ok(result);
    }

    [HttpGet("homework")]
    public async Task<ActionResult<ApiResponse<List<HomeworkDto>>>> GetHomework()
    {
        var result = await _studentPortalService.GetStudentHomeworkAsync();
        return Ok(result);
    }

    [HttpPost("homework/submit")]
    public async Task<ActionResult<ApiResponse<HomeworkSubmissionDto>>> SubmitHomework([FromBody] SubmitHomeworkDto dto)
    {
        var result = await _studentPortalService.SubmitHomeworkAsync(dto);
        return Ok(result);
    }

    [HttpGet("progress")]
    public async Task<ActionResult<ApiResponse<StudentProgressDto>>> GetProgress()
    {
        var result = await _studentPortalService.GetStudentProgressAsync();
        return Ok(result);
    }

    [HttpGet("certificates")]
    public async Task<ActionResult<ApiResponse<List<CertificateDto>>>> GetCertificates()
    {
        var result = await _studentPortalService.GetStudentCertificatesAsync();
        return Ok(result);
    }

    [HttpGet("available-teachers")]
    public async Task<ActionResult<ApiResponse<List<AvailableTeacherDto>>>> GetAvailableTeachers()
    {
        var result = await _studentPortalService.GetAvailableTeachersAsync();
        return Ok(result);
    }

    [HttpPost("enroll")]
    public async Task<ActionResult<ApiResponse<bool>>> EnrollInGroup([FromBody] EnrollInGroupRequestDto dto)
    {
        // Xavfsizlik qoidasi: O'quvchilar o'zlarini guruhga qo'sha olmaydi. Faqat Administrator biriktiradi.
        return StatusCode(403, ApiResponse<bool>.Fail("O'quvchini guruhga faqat o'quv markazi administratori biriktirishi mumkin."));
    }

    [HttpGet("attendance")]
    public async Task<ActionResult<ApiResponse<StudentAttendanceSummaryDto>>> GetAttendanceHistory()
    {
        var result = await _studentPortalService.GetStudentAttendanceHistoryAsync();
        return Ok(result);
    }

    [HttpGet("finances")]
    public async Task<ActionResult<ApiResponse<StudentFinanceDto>>> GetFinances()
    {
        var result = await _studentPortalService.GetStudentFinancesAsync();
        return Ok(result);
    }

    [HttpGet("calendar")]
    public async Task<ActionResult<ApiResponse<List<CalendarEventDto>>>> GetCalendar([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var result = await _studentPortalService.GetStudentCalendarAsync(start, end);
        return Ok(result);
    }

    [HttpPost("leave")]
    public async Task<ActionResult<ApiResponse<bool>>> LeaveGroup([FromBody] EnrollInGroupRequestDto dto)
    {
        return StatusCode(403, ApiResponse<bool>.Fail("Guruh tarkibini faqat o'quv markazi administratori o'zgartirishi mumkin."));
    }
}
