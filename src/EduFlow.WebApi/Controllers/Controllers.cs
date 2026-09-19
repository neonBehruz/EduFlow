using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EduFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
}

[EnableRateLimiting("auth-policy")]
[Route("api/auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        // Xavfsizlik qoidasi: Ommaviy ro'yxatdan o'tish taqiqlangan. Foydalanuvchilarni faqat Admin qo'sha oladi.
        if (User.Identity == null || !User.Identity.IsAuthenticated || (!User.IsInRole("Admin") && !User.IsInRole("SuperAdmin")))
        {
            return StatusCode(403, ApiResponse<AuthResponseDto>.Fail("Ommaviy ro'yxatdan o'tish yopilgan. O'quvchi va o'qituvchilarni faqat o'quv markazi administratori qo'shishi mumkin."));
        }

        var result = await _authService.RegisterAsync(dto);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        var result = await _authService.RefreshTokenAsync(dto);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("revoke")]
    public async Task<ActionResult<ApiResponse<bool>>> RevokeToken([FromBody] RevokeTokenDto dto)
    {
        var result = await _authService.RevokeTokenAsync(dto);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<bool>>> Logout()
    {
        var result = await _authService.LogoutAsync();
        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetMe()
    {
        var result = await _authService.GetCurrentUserProfileAsync();
        return Ok(result);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var result = await _authService.UpdateProfileAsync(dto);
        return Ok(result);
    }
}

[Authorize]
[Route("api/students")]
public class StudentsController : BaseApiController
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<StudentDto>>> GetStudents(
        [FromQuery] string? search,
        [FromQuery] Guid? groupId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await _studentService.GetStudentsAsync(search, groupId, isActive, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StudentDetailDto>>> GetStudentById(Guid id)
    {
        var result = await _studentService.GetStudentByIdAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<StudentDto>>> CreateStudent([FromBody] CreateStudentDto dto)
    {
        var result = await _studentService.CreateStudentAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> UpdateStudent(Guid id, [FromBody] UpdateStudentDto dto)
    {
        var result = await _studentService.UpdateStudentAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteStudent(Guid id)
    {
        var result = await _studentService.DeleteStudentAsync(id);
        return Ok(result);
    }
}

[Authorize]
[Route("api/teachers")]
public class TeachersController : BaseApiController
{
    private readonly ITeacherService _teacherService;

    public TeachersController(ITeacherService teacherService)
    {
        _teacherService = teacherService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TeacherDto>>> GetTeachers(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await _teacherService.GetTeachersAsync(search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<TeacherDto>>> GetTeacherById(Guid id)
    {
        var result = await _teacherService.GetTeacherByIdAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<TeacherDto>>> CreateTeacher([FromBody] CreateTeacherDto dto)
    {
        var result = await _teacherService.CreateTeacherAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<TeacherDto>>> UpdateTeacher(Guid id, [FromBody] UpdateTeacherDto dto)
    {
        var result = await _teacherService.UpdateTeacherAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteTeacher(Guid id)
    {
        var result = await _teacherService.DeleteTeacherAsync(id);
        return Ok(result);
    }
}

[Authorize]
[Route("api/groups")]
public class GroupsController : BaseApiController
{
    private readonly IGroupService _groupService;

    public GroupsController(IGroupService groupService)
    {
        _groupService = groupService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<GroupDto>>> GetGroups(
        [FromQuery] string? search,
        [FromQuery] Guid? subjectId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await _groupService.GetGroupsAsync(search, subjectId, isActive, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<GroupDetailDto>>> GetGroupById(Guid id)
    {
        var result = await _groupService.GetGroupByIdAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<GroupDto>>> CreateGroup([FromBody] CreateGroupDto dto)
    {
        var result = await _groupService.CreateGroupAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<GroupDto>>> UpdateGroup(Guid id, [FromBody] UpdateGroupDto dto)
    {
        var result = await _groupService.UpdateGroupAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteGroup(Guid id)
    {
        var result = await _groupService.DeleteGroupAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost("{id:guid}/students")]
    public async Task<ActionResult<ApiResponse<bool>>> AddStudentToGroup(Guid id, [FromBody] AddStudentToGroupDto dto)
    {
        var result = await _groupService.AddStudentToGroupAsync(id, dto.StudentId);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}/students/{studentId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveStudentFromGroup(Guid id, Guid studentId)
    {
        var result = await _groupService.RemoveStudentFromGroupAsync(id, studentId);
        return Ok(result);
    }

    [HttpGet("{id:guid}/students")]
    public async Task<ActionResult<List<StudentDto>>> GetGroupStudents(Guid id)
    {
        var result = await _groupService.GetGroupStudentsAsync(id);
        return Ok(result);
    }
}

[Authorize]
[Route("api/subjects")]
[Route("api/courses")]
public class SubjectsController : BaseApiController
{
    private readonly ISubjectService _subjectService;

    public SubjectsController(ISubjectService subjectService)
    {
        _subjectService = subjectService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubjectDto>>> GetSubjects()
    {
        var result = await _subjectService.GetSubjectsAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<SubjectDto>>> GetSubjectById(Guid id)
    {
        var result = await _subjectService.GetSubjectByIdAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<SubjectDto>>> CreateSubject([FromBody] CreateSubjectDto dto)
    {
        var result = await _subjectService.CreateSubjectAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<SubjectDto>>> UpdateSubject(Guid id, [FromBody] UpdateSubjectDto dto)
    {
        var result = await _subjectService.UpdateSubjectAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSubject(Guid id)
    {
        var result = await _subjectService.DeleteSubjectAsync(id);
        return Ok(result);
    }
}

[Authorize]
[Route("api/lessons")]
public class LessonsController : BaseApiController
{
    private readonly ILessonService _lessonService;

    public LessonsController(ILessonService lessonService)
    {
        _lessonService = lessonService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<LessonDto>>> GetLessons(
        [FromQuery] Guid? groupId,
        [FromQuery] DateTime? date,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await _lessonService.GetLessonsAsync(groupId, date, page, pageSize);
        return Ok(result);
    }

    [HttpGet("today")]
    public async Task<ActionResult<List<LessonDto>>> GetTodayLessons()
    {
        var result = await _lessonService.GetTodayLessonsAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<LessonDto>>> GetLessonById(Guid id)
    {
        var result = await _lessonService.GetLessonByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LessonDto>>> CreateLesson([FromBody] CreateLessonDto dto)
    {
        var result = await _lessonService.CreateLessonAsync(dto);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<LessonDto>>> UpdateLesson(Guid id, [FromBody] UpdateLessonDto dto)
    {
        var result = await _lessonService.UpdateLessonAsync(id, dto);
        return Ok(result);
    }

    [HttpPost("get-or-create-today/{groupId:guid}")]
    public async Task<ActionResult<ApiResponse<LessonDto>>> GetOrCreateTodayLesson(Guid groupId)
    {
        var result = await _lessonService.GetOrCreateTodayLessonAsync(groupId);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteLesson(Guid id)
    {
        var result = await _lessonService.DeleteLessonAsync(id);
        return Ok(result);
    }
}

[Authorize]
[Route("api/attendance")]
public class AttendanceController : BaseApiController
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    [HttpGet("lesson/{lessonId:guid}")]
    public async Task<ActionResult<List<AttendanceDto>>> GetLessonAttendance(Guid lessonId)
    {
        var result = await _attendanceService.GetLessonAttendanceAsync(lessonId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AttendanceDto>>> MarkAttendance([FromBody] CreateAttendanceDto dto)
    {
        var result = await _attendanceService.MarkAttendanceAsync(dto);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<AttendanceDto>>> UpdateAttendance(Guid id, [FromBody] UpdateAttendanceDto dto)
    {
        var result = await _attendanceService.UpdateAttendanceAsync(id, dto);
        return Ok(result);
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveBulkAttendance([FromBody] BulkAttendanceDto dto)
    {
        var result = await _attendanceService.SaveBulkAttendanceAsync(dto);
        return Ok(result);
    }
}

[Authorize]
[Route("api/grades")]
public class GradesController : BaseApiController
{
    private readonly IGradeService _gradeService;

    public GradesController(IGradeService gradeService)
    {
        _gradeService = gradeService;
    }

    [HttpGet("student/{studentId:guid}")]
    public async Task<ActionResult<List<GradeDto>>> GetStudentGrades(Guid studentId)
    {
        var result = await _gradeService.GetStudentGradesAsync(studentId);
        return Ok(result);
    }

    [HttpGet("lesson/{lessonId:guid}")]
    public async Task<ActionResult<List<GradeDto>>> GetLessonGrades(Guid lessonId)
    {
        var result = await _gradeService.GetLessonGradesAsync(lessonId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<GradeDto>>> AddGrade([FromBody] CreateGradeDto dto)
    {
        var result = await _gradeService.AddGradeAsync(dto);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<GradeDto>>> UpdateGrade(Guid id, [FromBody] UpdateGradeDto dto)
    {
        var result = await _gradeService.UpdateGradeAsync(id, dto);
        return Ok(result);
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveBulkGrades([FromBody] BulkGradeDto dto)
    {
        var result = await _gradeService.SaveBulkGradesAsync(dto);
        return Ok(result);
    }
}

[Authorize]
[Route("api/payments")]
public class PaymentsController : BaseApiController
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<PaymentDto>>> GetPayments(
        [FromQuery] PaymentStatus? status,
        [FromQuery] Guid? studentId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await _paymentService.GetPaymentsAsync(status, studentId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("overdue")]
    public async Task<ActionResult<List<PaymentDto>>> GetOverduePayments()
    {
        var result = await _paymentService.GetOverduePaymentsAsync();
        return Ok(result);
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<List<PaymentDto>>> GetUpcomingPayments()
    {
        var result = await _paymentService.GetUpcomingPaymentsAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> GetPaymentById(Guid id)
    {
        var result = await _paymentService.GetPaymentByIdAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> CreatePayment([FromBody] CreatePaymentDto dto)
    {
        var result = await _paymentService.CreatePaymentAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> UpdatePayment(Guid id, [FromBody] UpdatePaymentDto dto)
    {
        var result = await _paymentService.UpdatePaymentAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost("{id:guid}/mark-paid")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsPaid(Guid id)
    {
        var result = await _paymentService.MarkAsPaidAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePayment(Guid id)
    {
        var result = await _paymentService.DeletePaymentAsync(id);
        return Ok(result);
    }
}

[Authorize]
[Route("api/dashboard")]
public class DashboardController : BaseApiController
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats()
    {
        var result = await _dashboardService.GetDashboardStatsAsync();
        return Ok(result);
    }
}

[Authorize]
[Route("api/reports")]
public class ReportsController : BaseApiController
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("attendance")]
    public async Task<ActionResult<ApiResponse<AttendanceReportDto>>> GetAttendanceReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] Guid? groupId)
    {
        var result = await _reportService.GetAttendanceReportAsync(startDate, endDate, groupId);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<PaymentReportDto>>> GetPaymentReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var result = await _reportService.GetPaymentReportAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("students")]
    public async Task<ActionResult<ApiResponse<StudentReportDto>>> GetStudentReport()
    {
        var result = await _reportService.GetStudentReportAsync();
        return Ok(result);
    }
}

[Authorize]
[Route("api/settings")]
public class SettingsController : BaseApiController
{
    private readonly IOrganizationService _orgService;
    private readonly ISubscriptionService _subService;

    public SettingsController(IOrganizationService orgService, ISubscriptionService subService)
    {
        _orgService = orgService;
        _subService = subService;
    }

    [HttpGet("organization")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> GetOrganization()
    {
        var result = await _orgService.GetOrganizationDetailsAsync();
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPut("organization")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> UpdateOrganization([FromBody] UpdateOrganizationDto dto)
    {
        var result = await _orgService.UpdateOrganizationDetailsAsync(dto);
        return Ok(result);
    }

    [HttpGet("subscription")]
    public async Task<ActionResult<ApiResponse<SubscriptionDto>>> GetSubscription()
    {
        var result = await _subService.GetCurrentSubscriptionAsync();
        return Ok(result);
    }

    [HttpGet("plans")]
    public async Task<ActionResult<List<SubscriptionPlanDto>>> GetPlans()
    {
        var result = await _subService.GetPlansAsync();
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost("upgrade/{planId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpgradePlan(Guid planId)
    {
        var result = await _subService.UpgradePlanAsync(planId);
        return Ok(result);
    }
}

[Authorize(Roles = "SuperAdmin")]
[Route("api/admin")]
public class SuperAdminController : BaseApiController
{
    private readonly ISuperAdminService _adminService;

    public SuperAdminController(ISuperAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<SuperAdminStatsDto>>> GetPlatformStats()
    {
        var result = await _adminService.GetPlatformStatsAsync();
        return Ok(result);
    }

    [HttpGet("organizations")]
    public async Task<ActionResult<List<OrganizationSummaryDto>>> GetOrganizations()
    {
        var result = await _adminService.GetAllOrganizationsAsync();
        return Ok(result);
    }

    [HttpPost("organizations/{id:guid}/toggle")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleOrganizationStatus(Guid id)
    {
        var result = await _adminService.ToggleOrganizationStatusAsync(id);
        return Ok(result);
    }

    [HttpPost("organizations/{id:guid}/plan/{planId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> ChangeOrganizationPlan(Guid id, Guid planId)
    {
        var result = await _adminService.ChangeOrganizationPlanAsync(id, planId);
        return Ok(result);
    }
}
