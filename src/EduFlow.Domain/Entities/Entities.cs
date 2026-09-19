using EduFlow.Domain.Common;
using EduFlow.Domain.Enums;

namespace EduFlow.Domain.Entities;

public class Organization : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Teacher> Teachers { get; set; } = new List<Teacher>();
    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<Group> Groups { get; set; } = new List<Group>();
    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}

public class User : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.CenterAdmin;
    public bool IsActive { get; set; } = true;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Teacher? Teacher { get; set; }
    public Parent? Parent { get; set; }
    public Student? Student { get; set; }
}

public class Teacher : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Specialization { get; set; }
    public decimal? CustomSharePercentage { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public User? User { get; set; }
    public ICollection<Group> Groups { get; set; } = new List<Group>();
}

public class Parent : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? TelegramChatId { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public User? User { get; set; }
    public ICollection<Student> Students { get; set; } = new List<Student>();
    public TelegramAccount? TelegramAccount { get; set; }
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

public class Student : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid? UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
    public Guid? ParentId { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public User? User { get; set; }
    public Parent? Parent { get; set; }
    public ICollection<GroupStudent> GroupStudents { get; set; } = new List<GroupStudent>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<Grade> Grades { get; set; } = new List<Grade>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

public class Subject : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int DurationWeeks { get; set; } = 12;
    public bool IsActive { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public ICollection<Group> Groups { get; set; } = new List<Group>();
}

public class Group : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? TeacherId { get; set; }
    public Guid? SubjectId { get; set; }
    public Guid? RoomId { get; set; }
    public Guid? BranchId { get; set; }
    public decimal MonthlyFee { get; set; }
    public int MaxStudents { get; set; } = 15;
    public string? ScheduleDescription { get; set; }
    public string? Room { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Teacher? Teacher { get; set; }
    public Subject? Subject { get; set; }
    public Room? RoomEntity { get; set; }
    public Branch? Branch { get; set; }
    public ICollection<GroupStudent> GroupStudents { get; set; } = new List<GroupStudent>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Homework> Homeworks { get; set; } = new List<Homework>();
}

public class GroupStudent : BaseEntity
{
    public Guid GroupId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Group Group { get; set; } = null!;
    public Student Student { get; set; } = null!;
}

public class Lesson : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid GroupId { get; set; }
    public Guid? TeacherId { get; set; }
    public Guid? RoomId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Topic { get; set; } = string.Empty;
    public LessonStatus Status { get; set; } = LessonStatus.Scheduled;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Group Group { get; set; } = null!;
    public Teacher? Teacher { get; set; }
    public Room? Room { get; set; }
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<Grade> Grades { get; set; } = new List<Grade>();
    public ICollection<Homework> Homeworks { get; set; } = new List<Homework>();
}

public class Attendance : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid LessonId { get; set; }
    public Guid StudentId { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public string? Comment { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Lesson Lesson { get; set; } = null!;
    public Student Student { get; set; } = null!;
}

public class Grade : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid LessonId { get; set; }
    public Guid StudentId { get; set; }
    public decimal Score { get; set; }
    public string? Comment { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Lesson Lesson { get; set; } = null!;
    public Student Student { get; set; } = null!;
}

public class Payment : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid StudentId { get; set; }
    public Guid? GroupId { get; set; }
    public Guid? TeacherId { get; set; }

    public decimal Amount { get; set; } // Historical/Current total due (FinalAmount)
    public decimal BasePrice { get; set; } // Course/Group monthly fee snapshot
    public decimal DiscountPercent { get; set; } // Applied discount percentage snapshot
    public decimal DiscountAmount { get; set; } // Discount amount snapshot
    public decimal FinalAmount { get; set; } // BasePrice - DiscountAmount
    public decimal PaidAmount { get; set; } // Total sum paid so far
    public decimal DebtAmount { get; set; } // Remaining debt: FinalAmount - PaidAmount

    // Teacher & Center Share snapshot
    public decimal TeacherSharePercent { get; set; } // e.g. 20% or 25% snapshot
    public decimal TeacherShareAmount { get; set; } // Calculated from paid amount
    public decimal CenterShareAmount { get; set; } // Calculated from paid amount

    public DateTime? PaymentDate { get; set; }
    public DateTime DueDate { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? Description { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Group? Group { get; set; }
    public Teacher? Teacher { get; set; }
    public ICollection<PaymentTransaction> Transactions { get; set; } = new List<PaymentTransaction>();
}

public class Notification : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid? StudentId { get; set; }
    public Guid? ParentId { get; set; }
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.General;
    public bool IsSent { get; set; } = false;
    public DateTime? SentAt { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Student? Student { get; set; }
    public Parent? Parent { get; set; }
}

public class TelegramAccount : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid ParentId { get; set; }
    public string ChatId { get; set; } = string.Empty;
    public string? Username { get; set; }
    public bool IsConnected { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Parent Parent { get; set; } = null!;
}

public class SubscriptionPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public int MaxStudents { get; set; } = 20;
    public int MaxTeachers { get; set; } = 2;
    public int MaxGroups { get; set; } = 3;
    public bool HasTelegram { get; set; } = true;
    public bool HasReports { get; set; } = true;
    public bool HasAdvancedAnalytics { get; set; } = false;

    // Navigation
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}

public class Subscription : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid SubscriptionPlanId { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; } = DateTime.UtcNow.AddMonths(1);
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Trial;
    public bool AutoRenew { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public SubscriptionPlan SubscriptionPlan { get; set; } = null!;
}

public class PaymentTransaction : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid PaymentId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;
    public string? IdempotencyKey { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Payment Payment { get; set; } = null!;
}

public class FinanceSetting : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public decimal DefaultTeacherSharePercentage { get; set; } = 20m;
    public decimal FamilyDiscount2ndStudent { get; set; } = 10m;
    public decimal FamilyDiscount3rdStudent { get; set; } = 15m;
    public decimal FamilyDiscount4thPlusStudent { get; set; } = 20m;
    public DiscountConflictRule DiscountConflictRule { get; set; } = DiscountConflictRule.HighestDiscount;
    public bool ExcusedAbsenceRefundEnabled { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
}

public class StudentDiscount : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid StudentId { get; set; }
    public decimal DiscountPercentage { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Student Student { get; set; } = null!;
}

public class CenterExpense : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public string Category { get; set; } = "Boshqa"; // Ijara, Kommunal, Internet, Reklama, Boshqa
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
    public string Description { get; set; } = string.Empty;

    // Navigation
    public Organization Organization { get; set; } = null!;
}

public class AuditLog : BaseEntity
{
    public Guid? OrganizationId { get; set; }
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string? ResourceId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Organization? Organization { get; set; }
    public User? User { get; set; }
}

public class Branch : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
    public ICollection<Group> Groups { get; set; } = new List<Group>();
}

public class Room : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid? BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public int Capacity { get; set; } = 20;
    public RoomType Type { get; set; } = RoomType.Standard;
    public string? Equipment { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Available;
    public bool IsActive { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Branch? Branch { get; set; }
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}

public class Homework : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid GroupId { get; set; }
    public Guid? LessonId { get; set; }
    public Guid TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public decimal MaxScore { get; set; } = 100m;
    public string? AttachmentUrls { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Group Group { get; set; } = null!;
    public Lesson? Lesson { get; set; }
    public Teacher Teacher { get; set; } = null!;
    public ICollection<HomeworkSubmission> Submissions { get; set; } = new List<HomeworkSubmission>();
}

public class HomeworkSubmission : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid HomeworkId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public string? Content { get; set; }
    public string? AttachmentUrls { get; set; }
    public decimal? Score { get; set; }
    public string? Feedback { get; set; }
    public HomeworkStatus Status { get; set; } = HomeworkStatus.Submitted;
    public DateTime? ReviewedAt { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Homework Homework { get; set; } = null!;
    public Student Student { get; set; } = null!;
}

public class Lead : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public Guid? InterestedSubjectId { get; set; }
    public LeadSource Source { get; set; } = LeadSource.Other;
    public Guid? AssignedUserId { get; set; }
    public string? Notes { get; set; }
    public LeadStatus Status { get; set; } = LeadStatus.New;
    public Guid? ConvertedStudentId { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Subject? InterestedSubject { get; set; }
    public User? AssignedUser { get; set; }
    public Student? ConvertedStudent { get; set; }
    public ICollection<TrialLesson> TrialLessons { get; set; } = new List<TrialLesson>();
}

public class TrialLesson : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid LeadId { get; set; }
    public Guid? SubjectId { get; set; }
    public Guid? TeacherId { get; set; }
    public Guid? RoomId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public TrialLessonStatus Status { get; set; } = TrialLessonStatus.Scheduled;
    public string? Notes { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Lead Lead { get; set; } = null!;
    public Subject? Subject { get; set; }
    public Teacher? Teacher { get; set; }
    public Room? Room { get; set; }
}

public class Invoice : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public Guid? ParentId { get; set; }
    public Guid? GroupId { get; set; }
    public Guid? PaymentId { get; set; }
    public string BillingPeriod { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Issued;
    public string? Notes { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Parent? Parent { get; set; }
    public Group? Group { get; set; }
    public Payment? Payment { get; set; }
}

public class TeacherPayroll : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid TeacherId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public PayrollType CalculationType { get; set; } = PayrollType.Percentage;
    public int LessonsTaught { get; set; }
    public int StudentsCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal SharePercentage { get; set; }
    public decimal CalculatedSalary { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public DateTime? PaidDate { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
}

public class Certificate : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public string VerificationCode { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public Guid? SubjectId { get; set; }
    public Guid? GroupId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string LevelName { get; set; } = "Boshlang'ich";
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public decimal? FinalGrade { get; set; }
    public string? QrCodeData { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Subject? Subject { get; set; }
    public Group? Group { get; set; }
}

public class Feedback : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid? StudentId { get; set; }
    public Guid? ParentId { get; set; }
    public Guid? TeacherId { get; set; }
    public Guid? SubjectId { get; set; }
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
    public string Category { get; set; } = "General"; // Teacher, Course, Center

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Student? Student { get; set; }
    public Parent? Parent { get; set; }
    public Teacher? Teacher { get; set; }
    public Subject? Subject { get; set; }
}

public class ReferralCode : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid StudentId { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal RewardPercentage { get; set; } = 10m;
    public bool IsActive { get; set; } = true;

    // Navigation
    public Organization Organization { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public ICollection<Referral> Referrals { get; set; } = new List<Referral>();
}

public class Referral : AuditableEntity, ITenantEntity
{
    public Guid OrganizationId { get; set; }
    public Guid ReferralCodeId { get; set; }
    public Guid ReferrerStudentId { get; set; }
    public Guid ReferredStudentId { get; set; }
    public decimal RewardAmount { get; set; }
    public bool IsRewardApplied { get; set; } = false;
    public DateTime? RewardAppliedAt { get; set; }

    // Navigation
    public Organization Organization { get; set; } = null!;
    public ReferralCode ReferralCode { get; set; } = null!;
    public Student ReferrerStudent { get; set; } = null!;
    public Student ReferredStudent { get; set; } = null!;
}


