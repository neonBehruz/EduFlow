namespace EduFlow.Domain.Enums;

public enum UserRole
{
    SuperAdmin = 1,
    CenterAdmin = 2,
    Teacher = 3,
    Parent = 4,
    Student = 5
}

public enum AttendanceStatus
{
    Present = 1,
    Absent = 2,
    Late = 3,
    Excused = 4
}

public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    Overdue = 3,
    Cancelled = 4,
    Partial = 5,
    Refunded = 6,
    Failed = 7
}

public enum PaymentMethod
{
    Cash = 1,
    Payme = 2,
    Click = 3,
    BankTransfer = 4,
    Uzum = 5
}

public enum DiscountConflictRule
{
    HighestDiscount = 1,
    IndividualPriority = 2
}

public enum LessonStatus
{
    Scheduled = 1,
    Completed = 2,
    Cancelled = 3
}

public enum SubscriptionStatus
{
    Trial = 1,
    Active = 2,
    Expired = 3,
    Cancelled = 4
}

public enum NotificationType
{
    Attendance = 1,
    Payment = 2,
    Grade = 3,
    General = 4,
    Homework = 5,
    Schedule = 6,
    Certificate = 7,
    RiskAlert = 8
}

public enum RoomType
{
    Standard = 1,
    Lab = 2,
    Conference = 3,
    Online = 4
}

public enum RoomStatus
{
    Available = 1,
    Occupied = 2,
    Maintenance = 3
}

public enum HomeworkStatus
{
    Assigned = 1,
    Submitted = 2,
    Late = 3,
    Reviewed = 4
}

public enum LeadStatus
{
    New = 1,
    Contacted = 2,
    Trial = 3,
    Interested = 4,
    Enrolled = 5,
    Lost = 6
}

public enum LeadSource
{
    Instagram = 1,
    Telegram = 2,
    Website = 3,
    Referral = 4,
    WalkIn = 5,
    Other = 6
}

public enum TrialLessonStatus
{
    Scheduled = 1,
    Completed = 2,
    Cancelled = 3,
    Interested = 4,
    Enrolled = 5,
    NotInterested = 6,
    FollowUp = 7
}

public enum StudentRiskLevel
{
    Low = 1,
    Medium = 2,
    High = 3
}

public enum PayrollType
{
    FixedSalary = 1,
    Percentage = 2,
    PerLesson = 3,
    Combined = 4
}

public enum InvoiceStatus
{
    Draft = 1,
    Issued = 2,
    Paid = 3,
    Overdue = 4,
    Cancelled = 5
}


