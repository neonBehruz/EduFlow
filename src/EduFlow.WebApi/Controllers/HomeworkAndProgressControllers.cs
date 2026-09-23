using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduFlow.WebApi.Controllers;

[Authorize]
[Route("api/homework")]
[Route("api/assignments")]
public class HomeworkController : BaseApiController
{
    private readonly IHomeworkService _homeworkService;

    public HomeworkController(IHomeworkService homeworkService)
    {
        _homeworkService = homeworkService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<HomeworkDto>>> GetHomeworks(
        [FromQuery] Guid? groupId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _homeworkService.GetHomeworksAsync(groupId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("group/{groupId:guid}")]
    public async Task<ActionResult<ApiResponse<List<HomeworkDto>>>> GetHomeworksByGroup(Guid groupId)
    {
        var result = await _homeworkService.GetHomeworksAsync(groupId, 1, 100);
        return Ok(ApiResponse<List<HomeworkDto>>.Ok(result.Items.ToList()));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<HomeworkDto>>> GetHomeworkById(Guid id)
    {
        var result = await _homeworkService.GetHomeworkByIdAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "Teacher,CenterAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<HomeworkDto>>> CreateHomework([FromBody] CreateHomeworkDto dto)
    {
        var result = await _homeworkService.CreateHomeworkAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "Teacher,CenterAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<HomeworkDto>>> UpdateHomework(Guid id, [FromBody] UpdateHomeworkDto dto)
    {
        var result = await _homeworkService.UpdateHomeworkAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "Teacher,CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteHomework(Guid id)
    {
        var result = await _homeworkService.DeleteHomeworkAsync(id);
        return Ok(result);
    }

    [HttpGet("{id:guid}/submissions")]
    public async Task<ActionResult<ApiResponse<List<HomeworkSubmissionDto>>>> GetSubmissions(Guid id)
    {
        var result = await _homeworkService.GetSubmissionsAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "Teacher,CenterAdmin,SuperAdmin")]
    [HttpPost("submissions/{submissionId:guid}/grade")]
    public async Task<ActionResult<ApiResponse<HomeworkSubmissionDto>>> GradeSubmission(
        Guid submissionId,
        [FromBody] GradeHomeworkSubmissionDto dto)
    {
        var result = await _homeworkService.GradeSubmissionAsync(submissionId, dto);
        return Ok(result);
    }
}

[Authorize]
[Route("api/progress")]
public class StudentProgressController : BaseApiController
{
    private readonly IStudentProgressService _progressService;

    public StudentProgressController(IStudentProgressService progressService)
    {
        _progressService = progressService;
    }

    [HttpGet("{studentId:guid}")]
    [HttpGet("student/{studentId:guid}")]
    public async Task<ActionResult<ApiResponse<StudentProgressDto>>> GetProgress(Guid studentId)
    {
        var result = await _progressService.GetProgressAsync(studentId);
        return Ok(result);
    }
}
