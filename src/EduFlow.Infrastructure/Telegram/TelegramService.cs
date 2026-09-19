using System.Text;
using System.Text.Json;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EduFlow.Infrastructure.Telegram;

public class TelegramService : ITelegramService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<TelegramService> _logger;

    public TelegramService(
        HttpClient httpClient,
        IConfiguration configuration,
        IApplicationDbContext context,
        INotificationService notificationService,
        ILogger<TelegramService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<bool> SendMessageAsync(string chatId, string message)
    {
        var botToken = _configuration["Telegram:BotToken"];
        if (string.IsNullOrWhiteSpace(botToken) || botToken.Contains("YOUR_BOT_TOKEN") || botToken.Contains("CHANGE_ME"))
        {
            _logger.LogWarning("Telegram bot tokeni sozlanmagan. Xabar yuborilmadi (Mock rejimda saqlandi): {Message}", message);
            return true;
        }

        try
        {
            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
            var payload = new
            {
                chat_id = chatId,
                text = message,
                parse_mode = "HTML"
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telegram xabari yuborishda xatolik yuz berdi.");
            return false;
        }
    }

    public async Task<bool> SendStudentAttendanceAlertAsync(Guid studentId, string lessonTopic, AttendanceStatus status)
    {
        var student = await _context.Students
            .Include(s => s.Parent).ThenInclude(p => p!.TelegramAccount)
            .Include(s => s.Organization)
            .FirstOrDefaultAsync(s => s.Id == studentId);

        if (student == null || student.Parent == null) return false;

        string statusUz = status switch
        {
            AttendanceStatus.Absent => "❌ Darsga kelmadi",
            AttendanceStatus.Late => "⏳ Darsga kechikib keldi",
            AttendanceStatus.Excused => "📋 Sababli qatnashmadi",
            _ => "✅ Darsda qatnashdi"
        };

        var message = $"<b>🏛 {student.Organization.Name}</b>\n\n" +
                      $"Hurmatli {student.Parent.FullName},\n" +
                      $"Farzandingiz <b>{student.FirstName} {student.LastName}</b> bugungi darsda:\n" +
                      $"<b>Mavzu:</b> {lessonTopic}\n" +
                      $"<b>Holat:</b> {statusUz}\n\n" +
                      $"<i>Sana: {DateTime.Now:dd.MM.yyyy HH:mm}</i>";

        await _notificationService.CreateNotificationAsync(student.Id, student.Parent.Id, message, NotificationType.Attendance);

        if (student.Parent.TelegramAccount != null && !string.IsNullOrEmpty(student.Parent.TelegramAccount.ChatId))
        {
            return await SendMessageAsync(student.Parent.TelegramAccount.ChatId, message);
        }

        return true;
    }

    public async Task<bool> SendPaymentReminderAsync(Guid paymentId)
    {
        var payment = await _context.Payments
            .Include(p => p.Student).ThenInclude(s => s.Parent).ThenInclude(p => p!.TelegramAccount)
            .Include(p => p.Student).ThenInclude(s => s.Organization)
            .FirstOrDefaultAsync(p => p.Id == paymentId);

        if (payment == null || payment.Student.Parent == null) return false;

        var daysLeft = (payment.DueDate.Date - DateTime.UtcNow.Date).Days;
        string timingText = daysLeft switch
        {
            < 0 => $"⚠️ To'lov muddati {Math.Abs(daysLeft)} kun oldin o'tgan!",
            0 => "⚠️ To'lov muddati BUGUN tugaydi!",
            _ => $"To'lov muddati tugashiga {daysLeft} kun qoldi."
        };

        var message = $"<b>🏛 {payment.Student.Organization.Name} — To'lov Eslatmasi</b>\n\n" +
                      $"Hurmatli {payment.Student.Parent.FullName},\n" +
                      $"Farzandingiz <b>{payment.Student.FirstName} {payment.Student.LastName}</b> uchun oylik to'lov:\n" +
                      $"<b>Summa:</b> {payment.Amount:N0} UZS\n" +
                      $"<b>To'lov muddati:</b> {payment.DueDate:dd.MM.yyyy}\n" +
                      $"<b>Holat:</b> {timingText}\n\n" +
                      $"Iltimos, o'z vaqtida to'lovni amalga oshirishingizni so'raymiz.";

        await _notificationService.CreateNotificationAsync(payment.Student.Id, payment.Student.Parent.Id, message, NotificationType.Payment);

        if (payment.Student.Parent.TelegramAccount != null && !string.IsNullOrEmpty(payment.Student.Parent.TelegramAccount.ChatId))
        {
            return await SendMessageAsync(payment.Student.Parent.TelegramAccount.ChatId, message);
        }

        return true;
    }

    public async Task<bool> SendGradeAlertAsync(Guid gradeId)
    {
        var grade = await _context.Grades
            .Include(g => g.Student).ThenInclude(s => s.Parent).ThenInclude(p => p!.TelegramAccount)
            .Include(g => g.Student).ThenInclude(s => s.Organization)
            .Include(g => g.Lesson).ThenInclude(l => l.Group).ThenInclude(g => g.Subject)
            .FirstOrDefaultAsync(g => g.Id == gradeId);

        if (grade == null || grade.Student.Parent == null) return false;

        var message = $"<b>🏛 {grade.Student.Organization.Name} — Yangi Baho</b>\n\n" +
                      $"Hurmatli {grade.Student.Parent.FullName},\n" +
                      $"Farzandingiz <b>{grade.Student.FirstName} {grade.Student.LastName}</b> darsda baholandi:\n" +
                      $"<b>Fan:</b> {grade.Lesson.Group.Subject?.Name ?? "Dars"}\n" +
                      $"<b>Baho/Ball:</b> ⭐️ {grade.Score} ball\n" +
                      (!string.IsNullOrEmpty(grade.Comment) ? $"<b>Izoh:</b> {grade.Comment}\n" : "") +
                      $"\n<i>Sana: {DateTime.Now:dd.MM.yyyy}</i>";

        await _notificationService.CreateNotificationAsync(grade.Student.Id, grade.Student.Parent.Id, message, NotificationType.Grade);

        if (grade.Student.Parent.TelegramAccount != null && !string.IsNullOrEmpty(grade.Student.Parent.TelegramAccount.ChatId))
        {
            return await SendMessageAsync(grade.Student.Parent.TelegramAccount.ChatId, message);
        }

        return true;
    }
}
