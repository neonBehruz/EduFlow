using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace EduFlow.Infrastructure.PaymentProviders;

public record PaymentProviderInitResult(
    bool Success,
    string? PaymentUrl,
    string? TransactionId,
    string? Message
);

public record PaymentProviderCallbackResult(
    bool Success,
    Guid? PaymentId,
    decimal Amount,
    string? ExternalTransactionId,
    PaymentStatus Status,
    string? Message,
    object? ResponseData
);

public interface IPaymentProvider
{
    PaymentMethod Method { get; }
    Task<PaymentProviderInitResult> InitializePaymentAsync(Payment payment, decimal amount, string? returnUrl = null);
    Task<PaymentProviderCallbackResult> ProcessCallbackAsync(string payload, string? signature, HttpRequest request);
}
