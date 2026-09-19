namespace EduFlow.Application.Interfaces;

public interface ISmsService
{
    Task<bool> SendSmsAsync(string phoneNumber, string message);
    Task<bool> SendPaymentReminderSmsAsync(Guid paymentId);
}
