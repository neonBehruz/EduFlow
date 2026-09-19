using System.Text;
using System.Text.Json;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EduFlow.Infrastructure.Sms;

public class EskizSmsService : ISmsService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<EskizSmsService> _logger;

    public EskizSmsService(
        HttpClient httpClient,
        IConfiguration configuration,
        IApplicationDbContext context,
        INotificationService notificationService,
        ILogger<EskizSmsService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<bool> SendSmsAsync(string phoneNumber, string message)
    {
        var cleanPhone = new string(phoneNumber.Where(char.IsDigit).ToArray());
        if (cleanPhone.Length == 9) cleanPhone = "998" + cleanPhone;

        var email = _configuration["Eskiz:Email"];
        var password = _configuration["Eskiz:Password"];

        // If credentials are not set or in test mode, safely log simulation
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password) || email.Contains("example.com"))
        {
            _logger.LogInformation("📲 [SMS Yuborildi - Test/Simulyatsiya]: Telefon: +{Phone} | Xabar: \"{Message}\"", cleanPhone, message);
            return true;
        }

        try
        {
            // 1. Authenticate with Eskiz.uz
            var loginPayload = new { email, password };
            var loginContent = new StringContent(JsonSerializer.Serialize(loginPayload), Encoding.UTF8, "application/json");
            var loginResp = await _httpClient.PostAsync("https://notify.eskiz.uz/api/auth/login", loginContent);

            if (!loginResp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Eskiz avtorizatsiya muvaffaqiyatsiz bo'ldi: {Code}", loginResp.StatusCode);
                return false;
            }

            var loginJson = await loginResp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(loginJson);
            var token = doc.RootElement.GetProperty("data").GetProperty("token").GetString();

            // 2. Send SMS
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://notify.eskiz.uz/api/message/sms/send");
            req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var formData = new MultipartFormDataContent
            {
                { new StringContent(cleanPhone), "mobile_phone" },
                { new StringContent(message), "message" },
                { new StringContent("4546"), "from" } // Default Eskiz sender code or center sender
            };
            req.Content = formData;

            var sendResp = await _httpClient.SendAsync(req);
            _logger.LogInformation("Eskiz SMS javobi: {Code}", sendResp.StatusCode);
            return sendResp.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS yuborishda xatolik yuz berdi: +{Phone}", cleanPhone);
            return false;
        }
    }

    public async Task<bool> SendPaymentReminderSmsAsync(Guid paymentId)
    {
        var payment = await _context.Payments
            .Include(p => p.Student).ThenInclude(s => s.Parent)
            .Include(p => p.Group)
            .Include(p => p.Organization)
            .FirstOrDefaultAsync(p => p.Id == paymentId);

        if (payment == null) return false;

        decimal debt = payment.DebtAmount > 0 ? payment.DebtAmount : (payment.FinalAmount > 0 ? payment.FinalAmount : payment.Amount) - payment.PaidAmount;
        if (debt <= 0 && payment.Status == PaymentStatus.Paid) return true;

        var orgName = payment.Organization?.Name ?? "EduFlow O'quv Markazi";
        var groupName = payment.Group?.Name ?? "Kurs";
        var studentName = $"{payment.Student.FirstName} {payment.Student.LastName}".Trim();

        var daysOverdue = (DateTime.UtcNow.Date - payment.DueDate.Date).Days;
        string overdueText = daysOverdue > 0 
            ? $"{daysOverdue} kun oldin ({payment.DueDate:dd.MM.yyyy}) o'tgan"
            : $"bugun ({payment.DueDate:dd.MM.yyyy}) tugaydi";

        var smsMessage = $"{orgName}: Hurmatli {studentName}, {groupName} guruhi uchun {debt:N0} UZS to'lov muddati {overdueText}. Iltimos, qarzdorlikni to'lashingizni so'raymiz.";

        bool success = true;

        // 1. Send SMS to student
        if (!string.IsNullOrWhiteSpace(payment.Student.PhoneNumber))
        {
            success &= await SendSmsAsync(payment.Student.PhoneNumber, smsMessage);
        }

        // 2. Send SMS to parent if available
        if (payment.Student.Parent != null && !string.IsNullOrWhiteSpace(payment.Student.Parent.PhoneNumber))
        {
            var parentMsg = $"{orgName}: Farzandingiz {studentName}ning {groupName} kursi uchun {debt:N0} UZS to'lov muddati {overdueText}. Iltimos, to'lovni amalga oshiring.";
            await SendSmsAsync(payment.Student.Parent.PhoneNumber, parentMsg);
        }

        // 3. Record in Notification history
        await _notificationService.CreateNotificationAsync(
            payment.StudentId,
            payment.Student.ParentId,
            smsMessage,
            NotificationType.Payment);

        return success;
    }
}
