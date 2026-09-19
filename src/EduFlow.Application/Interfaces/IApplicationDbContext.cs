using EduFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Organization> Organizations { get; }
    DbSet<User> Users { get; }
    DbSet<Teacher> Teachers { get; }
    DbSet<Parent> Parents { get; }
    DbSet<Student> Students { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<Group> Groups { get; }
    DbSet<GroupStudent> GroupStudents { get; }
    DbSet<Lesson> Lessons { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<Grade> Grades { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<TelegramAccount> TelegramAccounts { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }
    DbSet<Subscription> Subscriptions { get; }
    DbSet<FinanceSetting> FinanceSettings { get; }
    DbSet<StudentDiscount> StudentDiscounts { get; }
    DbSet<PaymentTransaction> PaymentTransactions { get; }
    DbSet<CenterExpense> CenterExpenses { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Branch> Branches { get; }
    DbSet<Room> Rooms { get; }
    DbSet<Homework> Homeworks { get; }
    DbSet<HomeworkSubmission> HomeworkSubmissions { get; }
    DbSet<Lead> Leads { get; }
    DbSet<TrialLesson> TrialLessons { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<TeacherPayroll> TeacherPayrolls { get; }
    DbSet<Certificate> Certificates { get; }
    DbSet<Feedback> Feedbacks { get; }
    DbSet<ReferralCode> ReferralCodes { get; }
    DbSet<Referral> Referrals { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
