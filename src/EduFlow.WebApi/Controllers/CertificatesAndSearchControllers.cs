using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduFlow.WebApi.Controllers;

[Authorize]
[Route("api/certificates")]
public class CertificatesController : BaseApiController
{
    private readonly ICertificateService _certificateService;

    public CertificatesController(ICertificateService certificateService)
    {
        _certificateService = certificateService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<CertificateDto>>> GetCertificates(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _certificateService.GetCertificatesAsync(search, page, pageSize);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CertificateDto>>> CreateCertificate([FromBody] CreateCertificateDto dto)
    {
        var result = await _certificateService.CreateCertificateAsync(dto);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("verify/{code}")]
    public async Task<ActionResult<ApiResponse<CertificateVerificationResultDto>>> VerifyCertificate(string code)
    {
        var result = await _certificateService.VerifyCertificateAsync(code);
        return Ok(result);
    }
}

[Authorize]
[Route("api/search")]
public class SearchController : BaseApiController
{
    private readonly IGlobalSearchService _searchService;

    public SearchController(IGlobalSearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<GlobalSearchResultDto>>> Search([FromQuery] string q)
    {
        var result = await _searchService.SearchAsync(q);
        return Ok(result);
    }
}

[Authorize]
[Route("api/branches")]
public class BranchesController : BaseApiController
{
    private readonly IBranchService _branchService;

    public BranchesController(IBranchService branchService)
    {
        _branchService = branchService;
    }

    [HttpGet]
    public async Task<ActionResult<List<BranchDto>>> GetBranches()
    {
        var result = await _branchService.GetBranchesAsync();
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<BranchDto>>> CreateBranch([FromBody] CreateBranchDto dto)
    {
        var result = await _branchService.CreateBranchAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<BranchDto>>> UpdateBranch(Guid id, [FromBody] UpdateBranchDto dto)
    {
        var result = await _branchService.UpdateBranchAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteBranch(Guid id)
    {
        var result = await _branchService.DeleteBranchAsync(id);
        return Ok(result);
    }
}

[Authorize]
[Route("api/feedback")]
public class FeedbackController : BaseApiController
{
    private readonly IFeedbackService _feedbackService;

    public FeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    [HttpGet]
    public async Task<ActionResult<List<FeedbackDto>>> GetFeedbacks([FromQuery] string? category, [FromQuery] Guid? teacherId)
    {
        var result = await _feedbackService.GetFeedbacksAsync(category, teacherId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<FeedbackDto>>> SubmitFeedback([FromBody] CreateFeedbackDto dto)
    {
        var result = await _feedbackService.SubmitFeedbackAsync(dto);
        return Ok(result);
    }
}

[Authorize]
[Route("api/referrals")]
public class ReferralsController : BaseApiController
{
    private readonly IReferralService _referralService;

    public ReferralsController(IReferralService referralService)
    {
        _referralService = referralService;
    }

    [HttpGet("my-code/{studentId:guid}")]
    public async Task<ActionResult<ApiResponse<ReferralCodeDto>>> GetMyCode(Guid studentId)
    {
        var result = await _referralService.GetMyReferralCodeAsync(studentId);
        return Ok(result);
    }

    [HttpPost("track")]
    public async Task<ActionResult<ApiResponse<ReferralDto>>> Track([FromQuery] string code, [FromQuery] Guid studentId, [FromQuery] decimal reward)
    {
        var result = await _referralService.TrackReferralAsync(code, studentId, reward);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpGet]
    public async Task<ActionResult<List<ReferralDto>>> GetReferrals()
    {
        var result = await _referralService.GetReferralsAsync();
        return Ok(result);
    }
}

[Authorize]
[Route("api/entitlements")]
public class EntitlementsController : BaseApiController
{
    private readonly IFeatureEntitlementService _entitlementService;

    public EntitlementsController(IFeatureEntitlementService entitlementService)
    {
        _entitlementService = entitlementService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<FeatureEntitlementDto>>> GetEntitlements()
    {
        var result = await _entitlementService.GetEntitlementsAsync();
        return Ok(result);
    }
}
