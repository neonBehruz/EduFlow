using System.Text;
using System.Text.Json;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using EduFlow.Infrastructure.PaymentProviders;
using EduFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.WebApi.Controllers;

[ApiController]
[Route("api/webhooks")]
[AllowAnonymous]
public class PaymentWebhooksController : ControllerBase
{
    private readonly IPaymentProviderFactory _paymentProviderFactory;
    private readonly EduFlowDbContext _context;
    private readonly ILogger<PaymentWebhooksController> _logger;

    public PaymentWebhooksController(
        IPaymentProviderFactory paymentProviderFactory,
        EduFlowDbContext context,
        ILogger<PaymentWebhooksController> logger)
    {
        _paymentProviderFactory = paymentProviderFactory;
        _context = context;
        _logger = logger;
    }

    [HttpPost("payme")]
    public async Task<IActionResult> HandlePaymeWebhook()
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var body = await reader.ReadToEndAsync();
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();

        _logger.LogInformation("Payme webhook qabul qilindi: {Body}", body);

        var provider = _paymentProviderFactory.GetProvider(PaymentMethod.Payme);
        var result = await provider.ProcessCallbackAsync(body, authHeader, Request);

        if (result.PaymentId.HasValue && result.Success && result.Status == PaymentStatus.Paid)
        {
            var payment = await _context.Payments
                .IgnoreQueryFilters()
                .Include(p => p.Group)
                .FirstOrDefaultAsync(p => p.Id == result.PaymentId.Value);

            if (payment != null)
            {
                payment.Status = PaymentStatus.Paid;
                payment.PaidAmount = result.Amount > 0 ? result.Amount : payment.FinalAmount;
                payment.DebtAmount = Math.Max(0, payment.FinalAmount - payment.PaidAmount);
                payment.PaymentDate = DateTime.UtcNow;

                // Add payment transaction if not exists
                var existingTx = await _context.PaymentTransactions
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(t => t.IdempotencyKey == result.ExternalTransactionId);

                if (existingTx == null)
                {
                    _context.PaymentTransactions.Add(new PaymentTransaction
                    {
                        OrganizationId = payment.OrganizationId,
                        PaymentId = payment.Id,
                        Amount = payment.PaidAmount,
                        PaymentDate = DateTime.UtcNow,
                        Method = PaymentMethod.Payme,
                        IdempotencyKey = result.ExternalTransactionId,
                        Notes = "Payme webhook orqali muvaffaqiyatli to'landi"
                    });
                }

                await _context.SaveChangesAsync();
            }
        }

        return result.ResponseData != null ? Ok(result.ResponseData) : Ok(new { result = new { state = 1 } });
    }

    [HttpPost("click")]
    public async Task<IActionResult> HandleClickWebhook()
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var body = await reader.ReadToEndAsync();

        _logger.LogInformation("Click webhook qabul qilindi: {Body}", body);

        var provider = _paymentProviderFactory.GetProvider(PaymentMethod.Click);
        var result = await provider.ProcessCallbackAsync(body, null, Request);

        if (result.PaymentId.HasValue && result.Success && result.Status == PaymentStatus.Paid)
        {
            var payment = await _context.Payments
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == result.PaymentId.Value);

            if (payment != null)
            {
                payment.Status = PaymentStatus.Paid;
                payment.PaidAmount = result.Amount > 0 ? result.Amount : payment.FinalAmount;
                payment.DebtAmount = Math.Max(0, payment.FinalAmount - payment.PaidAmount);
                payment.PaymentDate = DateTime.UtcNow;

                var existingTx = await _context.PaymentTransactions
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(t => t.IdempotencyKey == result.ExternalTransactionId);

                if (existingTx == null)
                {
                    _context.PaymentTransactions.Add(new PaymentTransaction
                    {
                        OrganizationId = payment.OrganizationId,
                        PaymentId = payment.Id,
                        Amount = payment.PaidAmount,
                        PaymentDate = DateTime.UtcNow,
                        Method = PaymentMethod.Click,
                        IdempotencyKey = result.ExternalTransactionId,
                        Notes = "Click webhook orqali muvaffaqiyatli to'landi"
                    });
                }

                await _context.SaveChangesAsync();
            }
        }

        return result.ResponseData != null ? Ok(result.ResponseData) : Ok(new { error = 0, error_note = "Success" });
    }
}
