using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduFlow.WebApi.Controllers;

[Authorize(Roles = "CenterAdmin,SuperAdmin")]
[Route("api/invoices")]
public class InvoicesController : BaseApiController
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<InvoiceDto>>> GetInvoices(
        [FromQuery] InvoiceStatus? status,
        [FromQuery] Guid? studentId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _invoiceService.GetInvoicesAsync(status, studentId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> GetInvoiceById(Guid id)
    {
        var result = await _invoiceService.GetInvoiceByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> CreateInvoice([FromBody] CreateInvoiceDto dto)
    {
        var result = await _invoiceService.CreateInvoiceAsync(dto);
        return Ok(result);
    }

    [HttpGet("{id:guid}/receipt")]
    public async Task<ActionResult<ApiResponse<ReceiptDto>>> GetReceipt(Guid id)
    {
        var result = await _invoiceService.GenerateReceiptAsync(id);
        return Ok(result);
    }

    [HttpPost("{id:guid}/mark-paid")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsPaid(Guid id)
    {
        var result = await _invoiceService.MarkInvoiceAsPaidAsync(id);
        return Ok(result);
    }
}

[Authorize]
[Route("api/payroll")]
public class PayrollController : BaseApiController
{
    private readonly ITeacherPayrollService _payrollService;

    public PayrollController(ITeacherPayrollService payrollService)
    {
        _payrollService = payrollService;
    }

    [HttpGet]
    [HttpGet("history")]
    public async Task<ActionResult<ApiResponse<List<TeacherPayrollDto>>>> GetPayrollHistory(
        [FromQuery] Guid? teacherId,
        [FromQuery] int? year,
        [FromQuery] int? month)
    {
        var result = await _payrollService.GetPayrollHistoryAsync(teacherId, year, month);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost("calculate")]
    public async Task<ActionResult<ApiResponse<TeacherPayrollDto>>> CalculatePayroll([FromBody] CalculatePayrollDto dto)
    {
        var result = await _payrollService.CalculatePayrollAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost("{id:guid}/pay")]
    public async Task<ActionResult<ApiResponse<TeacherPayrollDto>>> PayTeacher(Guid id, [FromBody] PayTeacherPayrollDto dto)
    {
        var result = await _payrollService.PayTeacherPayrollAsync(id, dto);
        return Ok(result);
    }
}
