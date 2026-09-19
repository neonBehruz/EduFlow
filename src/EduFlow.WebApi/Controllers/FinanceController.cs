using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EduFlow.WebApi.Controllers;

[Authorize(Roles = "CenterAdmin,SuperAdmin")]
[Route("api/finance")]
public class FinanceController : BaseApiController
{
    private readonly IFinanceService _financeService;

    public FinanceController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    [HttpGet("settings")]
    public async Task<ActionResult<ApiResponse<FinanceSettingDto>>> GetSettings()
    {
        var result = await _financeService.GetFinanceSettingsAsync();
        return Ok(result);
    }

    [HttpPut("settings")]
    public async Task<ActionResult<ApiResponse<FinanceSettingDto>>> UpdateSettings([FromBody] UpdateFinanceSettingDto dto)
    {
        var result = await _financeService.UpdateFinanceSettingsAsync(dto);
        return Ok(result);
    }

    [HttpGet("preview")]
    public async Task<ActionResult<ApiResponse<PaymentCalculationPreviewDto>>> PreviewCalculation(
        [FromQuery] Guid studentId,
        [FromQuery] Guid? groupId,
        [FromQuery] decimal? customDiscountPercent)
    {
        var result = await _financeService.PreviewPaymentCalculationAsync(studentId, groupId, customDiscountPercent);
        return Ok(result);
    }

    [HttpPost("transactions")]
    public async Task<ActionResult<ApiResponse<PaymentTransactionDto>>> AddTransaction([FromBody] CreatePaymentTransactionDto dto)
    {
        var result = await _financeService.AddPaymentTransactionAsync(dto);
        return Ok(result);
    }

    [HttpGet("payments/{paymentId:guid}/transactions")]
    public async Task<ActionResult<ApiResponse<List<PaymentTransactionDto>>>> GetPaymentTransactions(Guid paymentId)
    {
        var result = await _financeService.GetPaymentTransactionsAsync(paymentId);
        return Ok(result);
    }

    [HttpGet("discounts")]
    public async Task<ActionResult<ApiResponse<List<StudentDiscountDto>>>> GetStudentDiscounts([FromQuery] Guid? studentId)
    {
        var result = await _financeService.GetStudentDiscountsAsync(studentId);
        return Ok(result);
    }

    [HttpPost("discounts")]
    public async Task<ActionResult<ApiResponse<StudentDiscountDto>>> CreateStudentDiscount([FromBody] CreateStudentDiscountDto dto)
    {
        var result = await _financeService.CreateStudentDiscountAsync(dto);
        return Ok(result);
    }

    [HttpDelete("discounts/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteStudentDiscount(Guid id)
    {
        var result = await _financeService.DeleteStudentDiscountAsync(id);
        return Ok(result);
    }

    [HttpGet("expenses")]
    public async Task<ActionResult<ApiResponse<List<CenterExpenseDto>>>> GetCenterExpenses(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var result = await _financeService.GetCenterExpensesAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpPost("expenses")]
    public async Task<ActionResult<ApiResponse<CenterExpenseDto>>> CreateCenterExpense([FromBody] CreateCenterExpenseDto dto)
    {
        var result = await _financeService.CreateCenterExpenseAsync(dto);
        return Ok(result);
    }

    [HttpDelete("expenses/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCenterExpense(Guid id)
    {
        var result = await _financeService.DeleteCenterExpenseAsync(id);
        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<FinanceSummaryReportDto>>> GetFinanceSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var result = await _financeService.GetFinanceSummaryReportAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("teachers-salary")]
    public async Task<ActionResult<ApiResponse<List<TeacherSalaryReportItemDto>>>> GetTeacherSalaryReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var result = await _financeService.GetTeacherSalaryReportAsync(startDate, endDate);
        return Ok(result);
    }

    [EnableRateLimiting("sms-policy")]
    [HttpPost("payments/{id:guid}/send-reminder-sms")]
    public async Task<ActionResult<ApiResponse<bool>>> SendPaymentReminderSms(Guid id, [FromServices] ISmsService smsService)
    {
        var sent = await smsService.SendPaymentReminderSmsAsync(id);
        return Ok(ApiResponse<bool>.Ok(sent, "SMS eslatma o'quvchi va ota-onaga muvaffaqiyatli yuborildi."));
    }

    [HttpPut("payments/{id:guid}/promise-date")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> UpdatePromiseDate(
        Guid id,
        [FromBody] UpdatePromiseDateDto dto,
        [FromServices] IPaymentService paymentService)
    {
        var result = await paymentService.UpdatePromiseDueDateAsync(id, dto.NewDueDate, dto.Note);
        return Ok(result);
    }
}
