using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EduFlow.Infrastructure.PaymentProviders;

public class PaymePaymentProvider : IPaymentProvider
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymePaymentProvider> _logger;

    public PaymePaymentProvider(IConfiguration configuration, ILogger<PaymePaymentProvider> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public PaymentMethod Method => PaymentMethod.Payme;

    public Task<PaymentProviderInitResult> InitializePaymentAsync(Payment payment, decimal amount, string? returnUrl = null)
    {
        var merchantId = _configuration["Payme:MerchantId"] ?? "test_payme_merchant";
        var amountInTiyin = (long)(amount * 100);
        var base64Params = Convert.ToBase64String(Encoding.UTF8.GetBytes($"m={merchantId};ac.payment_id={payment.Id};a={amountInTiyin};c={returnUrl ?? "http://localhost:3000/payments"}"));
        var checkoutUrl = $"https://checkout.paycom.uz/{base64Params}";

        return Task.FromResult(new PaymentProviderInitResult(
            Success: true,
            PaymentUrl: checkoutUrl,
            TransactionId: Guid.NewGuid().ToString("N"),
            Message: "Payme to'lov havolasi muvaffaqiyatli shakllantirildi."
        ));
    }

    public Task<PaymentProviderCallbackResult> ProcessCallbackAsync(string payload, string? signature, HttpRequest request)
    {
        try
        {
            using var doc = JsonDocument.Parse(payload);
            var root = doc.RootElement;
            var method = root.GetProperty("method").GetString();

            if (method == "PerformTransaction" || method == "CheckPerformTransaction")
            {
                var paramsElem = root.GetProperty("params");
                var account = paramsElem.GetProperty("account");
                var paymentIdStr = account.GetProperty("payment_id").GetString();
                var amountInTiyin = paramsElem.GetProperty("amount").GetInt64();
                var amount = (decimal)amountInTiyin / 100m;

                if (Guid.TryParse(paymentIdStr, out var paymentId))
                {
                    return Task.FromResult(new PaymentProviderCallbackResult(
                        Success: true,
                        PaymentId: paymentId,
                        Amount: amount,
                        ExternalTransactionId: paramsElem.TryGetProperty("id", out var idElem) ? idElem.GetString() : null,
                        Status: PaymentStatus.Paid,
                        Message: "Payme tranzaksiyasi muvaffaqiyatli qabul qilindi.",
                        ResponseData: new { result = new { allow = true } }
                    ));
                }
            }

            return Task.FromResult(new PaymentProviderCallbackResult(
                Success: true,
                PaymentId: null,
                Amount: 0,
                ExternalTransactionId: null,
                Status: PaymentStatus.Pending,
                Message: "Payme callback qabul qilindi.",
                ResponseData: new { result = new { allow = true } }
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Payme callback error");
            return Task.FromResult(new PaymentProviderCallbackResult(
                Success: false,
                PaymentId: null,
                Amount: 0,
                ExternalTransactionId: null,
                Status: PaymentStatus.Failed,
                Message: ex.Message,
                ResponseData: new { error = new { code = -32400, message = "System error" } }
            ));
        }
    }
}

public class ClickPaymentProvider : IPaymentProvider
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ClickPaymentProvider> _logger;

    public ClickPaymentProvider(IConfiguration configuration, ILogger<ClickPaymentProvider> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public PaymentMethod Method => PaymentMethod.Click;

    public Task<PaymentProviderInitResult> InitializePaymentAsync(Payment payment, decimal amount, string? returnUrl = null)
    {
        var serviceId = _configuration["Click:ServiceId"] ?? "test_service_id";
        var merchantId = _configuration["Click:MerchantId"] ?? "test_merchant_id";
        var checkoutUrl = $"https://my.click.uz/services/pay?service_id={serviceId}&merchant_id={merchantId}&amount={amount}&transaction_param={payment.Id}&return_url={returnUrl ?? "http://localhost:3000/payments"}";

        return Task.FromResult(new PaymentProviderInitResult(
            Success: true,
            PaymentUrl: checkoutUrl,
            TransactionId: Guid.NewGuid().ToString("N"),
            Message: "Click to'lov havolasi shakllantirildi."
        ));
    }

    public Task<PaymentProviderCallbackResult> ProcessCallbackAsync(string payload, string? signature, HttpRequest request)
    {
        try
        {
            var form = request.Form;
            var clickTransId = form["click_trans_id"].ToString();
            var serviceId = form["service_id"].ToString();
            var merchantTransId = form["merchant_trans_id"].ToString(); // payment.Id
            var amountStr = form["amount"].ToString();
            var action = form["action"].ToString();
            var error = form["error"].ToString();

            decimal.TryParse(amountStr, out var amount);

            if (Guid.TryParse(merchantTransId, out var paymentId) && error == "0")
            {
                return Task.FromResult(new PaymentProviderCallbackResult(
                    Success: true,
                    PaymentId: paymentId,
                    Amount: amount,
                    ExternalTransactionId: clickTransId,
                    Status: action == "1" ? PaymentStatus.Paid : PaymentStatus.Pending,
                    Message: "Click to'lovi muvaffaqiyatli qabul qilindi.",
                    ResponseData: new { error = 0, error_note = "Success" }
                ));
            }

            return Task.FromResult(new PaymentProviderCallbackResult(
                Success: false,
                PaymentId: null,
                Amount: 0,
                ExternalTransactionId: clickTransId,
                Status: PaymentStatus.Failed,
                Message: "Click to'lov xatosi.",
                ResponseData: new { error = -1, error_note = "Invalid request" }
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Click callback error");
            return Task.FromResult(new PaymentProviderCallbackResult(
                Success: false,
                PaymentId: null,
                Amount: 0,
                ExternalTransactionId: null,
                Status: PaymentStatus.Failed,
                Message: ex.Message,
                ResponseData: new { error = -8, error_note = "Internal error" }
            ));
        }
    }
}

public class UzumPaymentProvider : IPaymentProvider
{
    private readonly IConfiguration _configuration;

    public UzumPaymentProvider(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public PaymentMethod Method => PaymentMethod.Uzum;

    public Task<PaymentProviderInitResult> InitializePaymentAsync(Payment payment, decimal amount, string? returnUrl = null)
    {
        var checkoutUrl = $"https://www.uzumbank.uz/pay?orderId={payment.Id}&amount={amount}&callbackUrl={returnUrl ?? "http://localhost:3000/payments"}";

        return Task.FromResult(new PaymentProviderInitResult(
            Success: true,
            PaymentUrl: checkoutUrl,
            TransactionId: Guid.NewGuid().ToString("N"),
            Message: "Uzum Bank to'lov havolasi yaratildi."
        ));
    }

    public Task<PaymentProviderCallbackResult> ProcessCallbackAsync(string payload, string? signature, HttpRequest request)
    {
        return Task.FromResult(new PaymentProviderCallbackResult(
            Success: true,
            PaymentId: null,
            Amount: 0,
            ExternalTransactionId: null,
            Status: PaymentStatus.Paid,
            Message: "Uzum webhook tasdiqlandi.",
            ResponseData: new { status = "OK" }
        ));
    }
}

public class BankTransferPaymentProvider : IPaymentProvider
{
    public PaymentMethod Method => PaymentMethod.BankTransfer;

    public Task<PaymentProviderInitResult> InitializePaymentAsync(Payment payment, decimal amount, string? returnUrl = null)
    {
        return Task.FromResult(new PaymentProviderInitResult(
            Success: true,
            PaymentUrl: null,
            TransactionId: $"BANK-{payment.Id.ToString()[..8].ToUpper()}",
            Message: "Bank rekvizitlari orqali to'lov uchun hisob raqam tayyorlandi."
        ));
    }

    public Task<PaymentProviderCallbackResult> ProcessCallbackAsync(string payload, string? signature, HttpRequest request)
    {
        return Task.FromResult(new PaymentProviderCallbackResult(
            Success: true,
            PaymentId: null,
            Amount: 0,
            ExternalTransactionId: null,
            Status: PaymentStatus.Paid,
            Message: "Bank to'lovi qayd etildi.",
            ResponseData: null
        ));
    }
}

public class CashPaymentProvider : IPaymentProvider
{
    public PaymentMethod Method => PaymentMethod.Cash;

    public Task<PaymentProviderInitResult> InitializePaymentAsync(Payment payment, decimal amount, string? returnUrl = null)
    {
        return Task.FromResult(new PaymentProviderInitResult(
            Success: true,
            PaymentUrl: null,
            TransactionId: $"CASH-{payment.Id.ToString()[..8].ToUpper()}",
            Message: "Naqd to'lov qabul qilish uchun kassa kvitansiyasi tayyorlandi."
        ));
    }

    public Task<PaymentProviderCallbackResult> ProcessCallbackAsync(string payload, string? signature, HttpRequest request)
    {
        return Task.FromResult(new PaymentProviderCallbackResult(
            Success: true,
            PaymentId: null,
            Amount: 0,
            ExternalTransactionId: null,
            Status: PaymentStatus.Paid,
            Message: "Naqd kassa operatsiyasi yakunlandi.",
            ResponseData: null
        ));
    }
}

public interface IPaymentProviderFactory
{
    IPaymentProvider GetProvider(PaymentMethod method);
    IEnumerable<IPaymentProvider> GetAllProviders();
}

public class PaymentProviderFactory : IPaymentProviderFactory
{
    private readonly IEnumerable<IPaymentProvider> _providers;

    public PaymentProviderFactory(IEnumerable<IPaymentProvider> providers)
    {
        _providers = providers;
    }

    public IPaymentProvider GetProvider(PaymentMethod method)
    {
        var provider = _providers.FirstOrDefault(p => p.Method == method);
        if (provider == null)
        {
            throw new NotSupportedException($"To'lov usuli qo'llab-quvvatlanmaydi: {method}");
        }
        return provider;
    }

    public IEnumerable<IPaymentProvider> GetAllProviders() => _providers;
}
