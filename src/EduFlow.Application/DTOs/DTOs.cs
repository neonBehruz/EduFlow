using EduFlow.Domain.Enums;

namespace EduFlow.Application.DTOs;

#region Auth DTOs
public record RegisterDto(
    string? OrganizationName,
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string PhoneNumber,
    string? Address
);

public record LoginDto(
    string Email,
    string Password,
    int? ExpectedRole = null
);

public record AuthResponseDto(
    string Token,
    string RefreshToken,
    UserDto User,
    OrganizationDto Organization
);

public record UserDto(
    Guid Id,
    Guid OrganizationId,
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    UserRole Role,
    bool IsActive
);

public record UpdateProfileDto(
    string FirstName,
    string LastName,
    string PhoneNumber,
    string? Specialization = null,
    string? Password = null
);

public record CreateUserRequestDto(
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    string Password,
    UserRole Role,
    bool IsActive = true
);

public record UpdateUserRequestDto(
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    UserRole Role,
    bool IsActive,
    string? NewPassword = null
);

public record RefreshTokenDto(
    string Token,
    string RefreshToken
);

public record RevokeTokenDto(
    string? RefreshToken
);
#endregion

#region Organization & Subscriptions
public record OrganizationDto(
    Guid Id,
    string Name,
    string Phone,
    string Email,
    string Address,
    string? LogoUrl,
    bool IsActive,
    DateTime CreatedAt
);

public record UpdateOrganizationDto(
    string Name,
    string Phone,
    string Email,
    string Address,
    string? LogoUrl
);

public record SubscriptionPlanDto(
    Guid Id,
    string Name,
    decimal MonthlyPrice,
    int MaxStudents,
    int MaxTeachers,
    int MaxGroups,
    bool HasTelegram,
    bool HasReports,
    bool HasAdvancedAnalytics
);

public record SubscriptionDto(
    Guid Id,
    Guid OrganizationId,
    Guid SubscriptionPlanId,
    string PlanName,
    DateTime StartDate,
    DateTime EndDate,
    SubscriptionStatus Status,
    bool AutoRenew,
    int CurrentStudentsCount,
    int CurrentTeachersCount,
    int CurrentGroupsCount,
    SubscriptionPlanDto Plan
)
{
    public SubscriptionDto() : this(default, default, default, string.Empty, default, default, default, false, 0, 0, 0, null!) { }
}
#endregion

#region Student DTOs
public record StudentDto(
    Guid Id,
    Guid OrganizationId,
    string FirstName,
    string LastName,
    string FullName,
    string PhoneNumber,
    DateTime? BirthDate,
    DateTime EnrollmentDate,
    Guid? ParentId,
    string? ParentName,
    string? ParentPhone,
    bool IsActive,
    decimal AverageGrade,
    decimal AttendancePercentage,
    PaymentStatus CurrentPaymentStatus,
    List<string> GroupNames,
    bool IsPaymentBlocked = false,
    DateTime? PaidUntil = null,
    string? PaymentBlockReason = null,
    DateTime? LastPaymentDate = null
)
{
    public StudentDto() : this(default, default, string.Empty, string.Empty, string.Empty, string.Empty, null, default, null, null, null, true, 0, 0, default, new List<string>(), false, null, null, null) { }
}

public record CreateStudentDto(
    string FirstName,
    string LastName,
    string PhoneNumber,
    DateTime? BirthDate,
    string? ParentFullName,
    string? ParentPhoneNumber,
    Guid? GroupId,
    string? Login = null,
    string? Password = null
);

public record UpdateStudentDto(
    string FirstName,
    string LastName,
    string PhoneNumber,
    DateTime? BirthDate,
    bool IsActive,
    string? ParentFullName,
    string? ParentPhoneNumber,
    Guid? GroupId = null
);

public record ToggleStudentBlockDto(
    bool IsBlocked,
    string? Reason = null
);

public record StudentDetailDto(
    Guid Id,
    Guid OrganizationId,
    string FirstName,
    string LastName,
    string FullName,
    string PhoneNumber,
    DateTime? BirthDate,
    DateTime EnrollmentDate,
    bool IsActive,
    ParentDto? Parent,
    List<GroupSummaryDto> Groups,
    decimal AverageGrade,
    decimal AttendancePercentage,
    PaymentStatus CurrentPaymentStatus,
    List<AttendanceDto> RecentAttendances,
    List<GradeDto> RecentGrades,
    List<PaymentDto> RecentPayments,
    bool IsPaymentBlocked = false,
    DateTime? PaidUntil = null,
    string? PaymentBlockReason = null,
    DateTime? LastPaymentDate = null
);
#endregion

#region Parent DTOs
public record ParentDto(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string? TelegramChatId,
    bool IsTelegramConnected
)
{
    public ParentDto() : this(default, string.Empty, string.Empty, null, false) { }
}

public record CreateParentDto(
    string FullName,
    string PhoneNumber,
    string? TelegramChatId
);
#endregion

#region Teacher DTOs
public record TeacherDto(
    Guid Id,
    Guid OrganizationId,
    Guid? UserId,
    string FullName,
    string PhoneNumber,
    string? Specialization,
    int GroupsCount,
    PayrollType SalaryModel = PayrollType.Percentage,
    decimal? FixedSalaryAmount = null,
    decimal? CustomSharePercentage = null
)
{
    public TeacherDto() : this(default, default, null, string.Empty, string.Empty, null, 0, PayrollType.Percentage, null, null) { }
}

public record CreateTeacherDto(
    string FullName,
    string PhoneNumber,
    string? Specialization,
    string? Email,
    string? Password,
    PayrollType? SalaryModel = null,
    decimal? FixedSalaryAmount = null,
    decimal? CustomSharePercentage = null
);

public record UpdateTeacherDto(
    string FullName,
    string PhoneNumber,
    string? Specialization,
    PayrollType? SalaryModel = null,
    decimal? FixedSalaryAmount = null,
    decimal? CustomSharePercentage = null
);
#endregion

#region Subject DTOs
public record SubjectDto(
    Guid Id,
    Guid OrganizationId,
    string Name,
    string? Description,
    decimal Price,
    int DurationWeeks,
    bool IsActive,
    int GroupsCount
)
{
    public SubjectDto() : this(default, default, string.Empty, null, 0, 12, true, 0) { }
}

public record CreateSubjectDto(
    string Name,
    string? Description = null,
    decimal Price = 0,
    int DurationWeeks = 12,
    bool IsActive = true
);

public record UpdateSubjectDto(
    string Name,
    string? Description = null,
    decimal Price = 0,
    int DurationWeeks = 12,
    bool IsActive = true
);
#endregion

#region Group DTOs
public record GroupDto(
    Guid Id,
    Guid OrganizationId,
    string Name,
    Guid? TeacherId,
    string? TeacherName,
    Guid? SubjectId,
    string? SubjectName,
    decimal MonthlyFee,
    int MaxStudents,
    int EnrolledStudentsCount,
    string? ScheduleDescription,
    string? Room,
    bool IsActive
)
{
    public GroupDto() : this(default, default, string.Empty, null, null, null, null, 0, 0, 0, null, null, true) { }
}

public record GroupSummaryDto(
    Guid Id,
    string Name,
    string? SubjectName,
    string? TeacherName
)
{
    public GroupSummaryDto() : this(default, string.Empty, null, null) { }
}

public record CreateGroupDto(
    string Name,
    Guid? TeacherId,
    Guid? SubjectId,
    decimal MonthlyFee,
    int MaxStudents,
    string? ScheduleDescription,
    string? Room,
    List<Guid>? StudentIds = null
);

public record UpdateGroupDto(
    string Name,
    Guid? TeacherId,
    Guid? SubjectId,
    decimal MonthlyFee,
    int MaxStudents,
    string? ScheduleDescription,
    string? Room,
    bool IsActive,
    List<Guid>? StudentIds = null
);

public record GroupDetailDto(
    Guid Id,
    Guid OrganizationId,
    string Name,
    Guid? TeacherId,
    string? TeacherName,
    Guid? SubjectId,
    string? SubjectName,
    decimal MonthlyFee,
    int MaxStudents,
    string? ScheduleDescription,
    string? Room,
    bool IsActive,
    List<StudentDto> Students,
    List<LessonDto> RecentLessons
);

public record AddStudentToGroupDto(
    Guid StudentId
);
#endregion

#region Lesson DTOs
public record LessonDto(
    Guid Id,
    Guid GroupId,
    string GroupName,
    string? SubjectName,
    string? TeacherName,
    DateTime StartTime,
    DateTime EndTime,
    string Topic,
    LessonStatus Status,
    int TotalStudents,
    int PresentCount,
    int AbsentCount
)
{
    public LessonDto() : this(default, default, string.Empty, null, null, default, default, string.Empty, default, 0, 0, 0) { }
}

public record CreateLessonDto(
    Guid GroupId,
    DateTime StartTime,
    DateTime EndTime,
    string Topic
);

public record UpdateLessonDto(
    DateTime StartTime,
    DateTime EndTime,
    string Topic,
    LessonStatus Status
);
#endregion

#region Attendance DTOs
public record AttendanceDto(
    Guid Id,
    Guid LessonId,
    Guid StudentId,
    string StudentName,
    AttendanceStatus Status,
    string? Comment,
    DateTime LessonDate
)
{
    public AttendanceDto() : this(default, default, default, string.Empty, default, null, default) { }
}

public record CreateAttendanceDto(
    Guid LessonId,
    Guid StudentId,
    AttendanceStatus Status,
    string? Comment
);

public record UpdateAttendanceDto(
    AttendanceStatus Status,
    string? Comment
);

public record BulkAttendanceItemDto(
    Guid StudentId,
    AttendanceStatus Status,
    string? Comment
);

public record BulkAttendanceDto(
    Guid LessonId,
    List<BulkAttendanceItemDto> Items
);

public record StudentAttendanceHistoryItemDto(
    Guid AttendanceId,
    Guid LessonId,
    string LessonTopic,
    DateTime LessonStartTime,
    DateTime LessonEndTime,
    Guid GroupId,
    string GroupName,
    string? SubjectName,
    string? TeacherName,
    AttendanceStatus Status,
    string? Comment,
    decimal? GradeScore
);

public record StudentAttendanceSummaryDto(
    int TotalLessons,
    int PresentCount,
    int AbsentCount,
    int LateCount,
    int ExcusedCount,
    decimal AttendancePercentage,
    List<StudentAttendanceHistoryItemDto> Items
);
#endregion

#region Grade DTOs
public record GradeDto(
    Guid Id,
    Guid LessonId,
    Guid StudentId,
    string StudentName,
    string? SubjectName,
    decimal Score,
    string? Comment,
    DateTime CreatedAt
);

public record CreateGradeDto(
    Guid LessonId,
    Guid StudentId,
    decimal Score,
    string? Comment
);

public record UpdateGradeDto(
    decimal Score,
    string? Comment
);

public record BulkGradeItemDto(
    Guid StudentId,
    decimal Score,
    string? Comment
);

public record BulkGradeDto(
    Guid LessonId,
    List<BulkGradeItemDto> Items
);
#endregion

#region Payment & Finance DTOs
public record PaymentDto(
    Guid Id,
    Guid StudentId,
    string StudentName,
    string? StudentPhone,
    decimal Amount,
    decimal BasePrice,
    decimal DiscountPercent,
    decimal DiscountAmount,
    decimal FinalAmount,
    decimal PaidAmount,
    decimal DebtAmount,
    decimal TeacherSharePercent,
    decimal TeacherShareAmount,
    decimal CenterShareAmount,
    Guid? GroupId,
    string? GroupName,
    Guid? TeacherId,
    string? TeacherName,
    DateTime? PaymentDate,
    DateTime DueDate,
    PaymentStatus Status,
    string? Description,
    DateTime CreatedAt,
    List<PaymentTransactionDto>? Transactions
)
{
    public PaymentDto() : this(default, default, string.Empty, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, null, null, null, null, default, default, null, default, new List<PaymentTransactionDto>()) { }
}

public record PaymentTransactionDto(
    Guid Id,
    Guid PaymentId,
    decimal Amount,
    DateTime PaymentDate,
    PaymentMethod Method,
    string? IdempotencyKey,
    string? Notes
);

public record CreatePaymentTransactionDto(
    Guid PaymentId,
    decimal Amount,
    PaymentMethod Method,
    string? IdempotencyKey,
    string? Notes
);

public record CreatePaymentDto(
    Guid StudentId,
    Guid? GroupId,
    Guid? TeacherId,
    decimal? Amount,
    decimal? CustomDiscountPercent,
    DateTime DueDate,
    DateTime? PaymentDate,
    PaymentStatus Status,
    string? Description,
    decimal? InitialPaidAmount,
    PaymentMethod? InitialMethod
);

public record UpdatePaymentDto(
    decimal Amount,
    DateTime? PaymentDate,
    DateTime DueDate,
    PaymentStatus Status,
    string? Description
);

public record UpdatePromiseDateDto(
    DateTime NewDueDate,
    string? Note
);

public record FinanceSettingDto(
    Guid Id,
    Guid OrganizationId,
    decimal DefaultTeacherSharePercentage,
    decimal FamilyDiscount2ndStudent,
    decimal FamilyDiscount3rdStudent,
    decimal FamilyDiscount4thPlusStudent,
    DiscountConflictRule DiscountConflictRule,
    bool ExcusedAbsenceRefundEnabled
);

public record UpdateFinanceSettingDto(
    decimal DefaultTeacherSharePercentage,
    decimal FamilyDiscount2ndStudent,
    decimal FamilyDiscount3rdStudent,
    decimal FamilyDiscount4thPlusStudent,
    DiscountConflictRule DiscountConflictRule,
    bool ExcusedAbsenceRefundEnabled
);

public record StudentDiscountDto(
    Guid Id,
    Guid StudentId,
    string StudentName,
    decimal DiscountPercentage,
    DateTime StartDate,
    DateTime? EndDate,
    string Reason,
    bool IsActive
);

public record CreateStudentDiscountDto(
    Guid StudentId,
    decimal DiscountPercentage,
    DateTime StartDate,
    DateTime? EndDate,
    string Reason
);

public record CenterExpenseDto(
    Guid Id,
    Guid OrganizationId,
    string Category,
    decimal Amount,
    DateTime ExpenseDate,
    string Description
);

public record CreateCenterExpenseDto(
    string Category,
    decimal Amount,
    DateTime ExpenseDate,
    string Description
);

public record PaymentCalculationPreviewDto(
    Guid StudentId,
    string StudentName,
    Guid? GroupId,
    string? GroupName,
    Guid? TeacherId,
    string? TeacherName,
    decimal BasePrice,
    int FamilyStudentOrder,
    decimal FamilyDiscountPercent,
    decimal IndividualDiscountPercent,
    decimal AppliedDiscountPercent,
    string DiscountType,
    decimal DiscountAmount,
    decimal FinalAmount,
    decimal TeacherSharePercent,
    decimal EstimatedTeacherShare,
    decimal EstimatedCenterShare
);

public record TeacherSalaryReportItemDto(
    Guid TeacherId,
    string TeacherName,
    string? PhoneNumber,
    decimal SharePercentage,
    int ActiveGroupsCount,
    int TotalStudentsCount,
    decimal TotalCourseFees,
    decimal TotalCollectedFromStudents,
    decimal TeacherSalaryAmount,
    decimal CenterRetainedAmount,
    PayrollType SalaryModel = PayrollType.Percentage,
    decimal? FixedSalaryAmount = null,
    int ExcusedAbsenceDeductions = 0
);

public record FinanceSummaryReportDto(
    decimal TotalExpectedRevenue,
    decimal TotalCollectedRevenue,
    decimal TotalDebtAmount,
    decimal TotalTeacherShares,
    decimal CenterGrossMargin,
    decimal TotalCenterExpenses,
    decimal NetProfit,
    List<TeacherSalaryReportItemDto> TeacherSalaries,
    List<CenterExpenseDto> RecentExpenses
);
#endregion

#region Notification & Telegram DTOs
public record NotificationDto(
    Guid Id,
    Guid? StudentId,
    string? StudentName,
    Guid? ParentId,
    string? ParentName,
    string Message,
    NotificationType Type,
    bool IsSent,
    DateTime? SentAt,
    DateTime CreatedAt
);

public record TelegramConnectDto(
    Guid ParentId,
    string ChatId,
    string? Username
);

public record TelegramSendDto(
    Guid ParentId,
    string Message
);

public record TelegramStatusDto(
    bool IsConnected,
    string? ChatId,
    string? Username
);
#endregion

#region Dashboard & Reports DTOs
public record DashboardStatsDto(
    int StudentsCount,
    int TeachersCount,
    int GroupsCount,
    int TodayLessonsCount,
    int PresentToday,
    int AbsentToday,
    int LateToday,
    int PendingPaymentsCount,
    int OverduePaymentsCount,
    decimal MonthlyRevenue,
    decimal AttendanceRate,
    List<LessonDto> TodayLessons,
    List<PaymentDto> RecentPayments,
    List<PaymentDto> OverduePayments,
    List<MonthlyRevenueItemDto> MonthlyRevenueChart,
    List<StudentGrowthItemDto> StudentGrowthChart
);

public record MonthlyRevenueItemDto(
    string Month,
    decimal Amount
);

public record StudentGrowthItemDto(
    string Month,
    int Count
);

public record AttendanceReportDto(
    int TotalLessons,
    int TotalPresent,
    int TotalAbsent,
    int TotalLate,
    int TotalExcused,
    decimal AttendancePercentage,
    List<GroupAttendanceSummaryDto> GroupSummaries
);

public record GroupAttendanceSummaryDto(
    Guid GroupId,
    string GroupName,
    int TotalRecords,
    int PresentCount,
    decimal Percentage
);

public record PaymentReportDto(
    decimal TotalPaid,
    decimal TotalPending,
    decimal TotalOverdue,
    int PaidTransactionsCount,
    int PendingTransactionsCount,
    int OverdueTransactionsCount,
    List<MonthlyRevenueItemDto> MonthlyTrend
);

public record StudentReportDto(
    int TotalStudents,
    int ActiveStudents,
    int InactiveStudents,
    decimal AverageOverallGrade,
    decimal AverageOverallAttendance,
    List<StudentDto> Students
);
#endregion

#region SuperAdmin DTOs
public record SuperAdminStatsDto(
    int TotalOrganizations,
    int ActiveOrganizations,
    int TrialOrganizations,
    int TotalStudents,
    decimal TotalMonthlyRevenue,
    List<OrganizationSummaryDto> RecentOrganizations
);

public record OrganizationSummaryDto(
    Guid Id,
    string Name,
    string Email,
    string Phone,
    bool IsActive,
    string PlanName,
    SubscriptionStatus SubscriptionStatus,
    DateTime CreatedAt
);
#endregion

#region Extended Dashboard DTOs
public record ExtendedDashboardStatsDto(
    int StudentsCount,
    int ActiveStudentsCount,
    int InactiveStudentsCount,
    int TeachersCount,
    int GroupsCount,
    int TodayLessonsCount,
    int TodayPresent,
    int TodayAbsent,
    int TodayLate,
    int TodayExcused,
    decimal MonthlyRevenue,
    decimal MonthlyExpenses,
    decimal NetProfit,
    decimal OutstandingPayments,
    int NewLeadsCount,
    int TrialLessonsCount,
    decimal AttendanceRate,
    decimal StudentRetentionRate,
    int AtRiskStudentsCount,
    List<MonthlyRevenueItemDto> PeriodRevenueChart,
    List<MonthlyRevenueItemDto> PeriodExpensesChart,
    List<MonthlyRevenueItemDto> NetProfitChart,
    List<LessonDto> TodayLessons,
    List<PaymentDto> RecentPayments,
    List<PaymentDto> OverduePayments
);

public record DashboardFilterRequestDto(
    string? Range, // today, 7d, 30d, 3m, 6m, 1y, custom
    DateTime? StartDate,
    DateTime? EndDate
);
#endregion

#region Parent & Student Portal DTOs
public record ParentDashboardDto(
    Guid ParentId,
    string ParentName,
    List<StudentDto> Children,
    List<LessonDto> TodayLessons,
    List<LessonDto> UpcomingLessons,
    List<AttendanceDto> RecentAttendance,
    List<GradeDto> RecentGrades,
    List<HomeworkDto> PendingHomework,
    List<InvoiceDto> Invoices,
    List<NotificationDto> Notifications
);

public record ParentChildProfileDto(
    StudentDetailDto StudentInfo,
    List<GroupDto> CurrentGroups,
    List<LessonDto> Schedule,
    decimal AttendancePercentage,
    List<GradeDto> Grades,
    List<HomeworkSubmissionDto> HomeworkSubmissions,
    StudentProgressDto Progress,
    List<PaymentDto> PaymentHistory,
    List<InvoiceDto> Invoices
);

public record StudentDashboardDto(
    Guid StudentId,
    string StudentName,
    List<LessonDto> TodayLessons,
    List<LessonDto> UpcomingLessons,
    List<GroupDto> Groups,
    List<SubjectDto> Courses,
    decimal AttendanceRate,
    List<GradeDto> Grades,
    List<HomeworkDto> PendingHomework,
    List<CertificateDto> Certificates,
    List<NotificationDto> Notifications,
    StudentProgressDto Progress
);

public record StudentFinanceDto(
    Guid StudentId,
    string StudentName,
    decimal TotalPaid,
    decimal TotalDebt,
    DateTime? NextDueDate,
    List<InvoiceDto> Invoices,
    List<PaymentDto> Payments
);
#endregion

#region Calendar & Room DTOs
public record CalendarEventDto(
    Guid Id,
    Guid GroupId,
    string GroupName,
    Guid? SubjectId,
    string? SubjectName,
    Guid? TeacherId,
    string? TeacherName,
    Guid? RoomId,
    string? RoomName,
    string? RoomNumber,
    DateTime StartTime,
    DateTime EndTime,
    LessonStatus Status,
    string Topic,
    string Color
);

public record RoomDto(
    Guid Id,
    Guid OrganizationId,
    Guid? BranchId,
    string? BranchName,
    string Name,
    string Number,
    int Capacity,
    RoomType Type,
    string? Equipment,
    RoomStatus Status,
    bool IsActive,
    int CurrentOccupancy
);

public record CreateRoomDto(
    Guid? BranchId,
    string Name,
    string Number,
    int Capacity,
    RoomType Type,
    string? Equipment,
    RoomStatus Status
);

public record UpdateRoomDto(
    Guid? BranchId,
    string Name,
    string Number,
    int Capacity,
    RoomType Type,
    string? Equipment,
    RoomStatus Status,
    bool IsActive
);

public record ScheduleConflictCheckDto(
    Guid? LessonId,
    Guid? TeacherId,
    Guid? RoomId,
    Guid? GroupId,
    DateTime StartTime,
    DateTime EndTime
);

public record ScheduleConflictResultDto(
    bool HasConflict,
    string? ConflictType, // Teacher, Room, Group
    string? ConflictMessage,
    Guid? ConflictingLessonId
);
#endregion

#region Homework DTOs
public record HomeworkDto(
    Guid Id,
    Guid GroupId,
    string GroupName,
    Guid? LessonId,
    Guid TeacherId,
    string TeacherName,
    string Title,
    string Description,
    DateTime DueDate,
    decimal MaxScore,
    string? AttachmentUrls,
    int SubmissionsCount,
    int ReviewedCount,
    DateTime CreatedAt
);

public record CreateHomeworkDto(
    Guid GroupId,
    Guid? LessonId,
    string Title,
    string Description,
    DateTime DueDate,
    decimal MaxScore,
    string? AttachmentUrls
);

public record UpdateHomeworkDto(
    string Title,
    string Description,
    DateTime DueDate,
    decimal MaxScore,
    string? AttachmentUrls
);

public record HomeworkSubmissionDto(
    Guid Id,
    Guid HomeworkId,
    string HomeworkTitle,
    Guid StudentId,
    string StudentName,
    DateTime SubmittedAt,
    string? Content,
    string? AttachmentUrls,
    decimal? Score,
    string? Feedback,
    HomeworkStatus Status,
    DateTime? ReviewedAt
);

public record SubmitHomeworkDto(
    Guid HomeworkId,
    string? Content,
    string? AttachmentUrls
);

public record GradeHomeworkSubmissionDto(
    decimal Score,
    string? Feedback
);
#endregion

#region Student Progress DTOs
public record SkillProgressItemDto(
    string SkillName,
    decimal ScorePercent,
    string Level
);

public record ProgressHistoryPointDto(
    string Date,
    decimal Score
);

public record StudentProgressDto(
    Guid StudentId,
    string StudentName,
    decimal OverallProgressPercent,
    decimal AttendanceRate,
    decimal AverageGrade,
    decimal HomeworkCompletionRate,
    decimal CourseProgressPercent,
    List<SkillProgressItemDto> SkillProgress,
    List<ProgressHistoryPointDto> ProgressOverTime
);
#endregion

#region CRM & Trial Lessons DTOs
public record LeadDto(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string? Email,
    Guid? InterestedSubjectId,
    string? InterestedSubjectName,
    LeadSource Source,
    Guid? AssignedUserId,
    string? AssignedUserName,
    string? Notes,
    LeadStatus Status,
    Guid? ConvertedStudentId,
    DateTime CreatedAt
);

public record CreateLeadDto(
    string FullName,
    string PhoneNumber,
    string? Email,
    Guid? InterestedSubjectId,
    LeadSource Source,
    Guid? AssignedUserId,
    string? Notes
);

public record UpdateLeadDto(
    string FullName,
    string PhoneNumber,
    string? Email,
    Guid? InterestedSubjectId,
    LeadSource Source,
    Guid? AssignedUserId,
    string? Notes,
    LeadStatus Status
);

public record TrialLessonDto(
    Guid Id,
    Guid LeadId,
    string LeadName,
    string LeadPhone,
    Guid? SubjectId,
    string? SubjectName,
    Guid? TeacherId,
    string? TeacherName,
    Guid? RoomId,
    string? RoomName,
    DateTime ScheduledDate,
    string StartTime,
    string EndTime,
    TrialLessonStatus Status,
    string? Notes
);

public record CreateTrialLessonDto(
    Guid LeadId,
    Guid? SubjectId,
    Guid? TeacherId,
    Guid? RoomId,
    DateTime ScheduledDate,
    TimeSpan StartTime,
    TimeSpan EndTime,
    string? Notes
);

public record UpdateTrialLessonDto(
    Guid? TeacherId,
    Guid? RoomId,
    DateTime ScheduledDate,
    TimeSpan StartTime,
    TimeSpan EndTime,
    TrialLessonStatus Status,
    string? Notes
);

public record EnrollLeadDto(
    Guid LeadId,
    Guid GroupId,
    decimal MonthlyFee,
    string? ParentName,
    string? ParentPhone
);
#endregion

#region Invoices & Receipts DTOs
public record InvoiceDto(
    Guid Id,
    string InvoiceNumber,
    Guid StudentId,
    string StudentName,
    Guid? ParentId,
    string? ParentName,
    Guid? GroupId,
    string? GroupName,
    Guid? PaymentId,
    string BillingPeriod,
    decimal Amount,
    DateTime IssueDate,
    DateTime DueDate,
    DateTime? PaidDate,
    InvoiceStatus Status,
    string? Notes
);

public record CreateInvoiceDto(
    Guid StudentId,
    Guid? GroupId,
    decimal Amount,
    string BillingPeriod,
    DateTime DueDate,
    string? Notes
);

public record ReceiptDto(
    string ReceiptNumber,
    string OrganizationName,
    string? OrganizationPhone,
    string? OrganizationAddress,
    string StudentName,
    string? GroupName,
    decimal Amount,
    DateTime PaidAt,
    PaymentMethod Method,
    string? TransactionId,
    string VerificationCode
);
#endregion

#region Teacher Payroll DTOs
public record TeacherPayrollDto(
    Guid Id,
    Guid TeacherId,
    string TeacherName,
    int Year,
    int Month,
    PayrollType CalculationType,
    int LessonsTaught,
    int StudentsCount,
    decimal TotalRevenue,
    decimal SharePercentage,
    decimal CalculatedSalary,
    decimal PaidAmount,
    decimal RemainingAmount,
    DateTime? PaidDate,
    string? Notes
);

public record CalculatePayrollDto(
    Guid TeacherId,
    int Year,
    int Month,
    PayrollType CalculationType,
    decimal? CustomSharePercentage,
    decimal? FixedBaseSalary
);

public record PayTeacherPayrollDto(
    decimal Amount,
    string? Notes
);
#endregion

#region Student Risk Analysis DTOs
public record StudentRiskDto(
    Guid StudentId,
    string StudentName,
    string? PhoneNumber,
    List<string> GroupNames,
    StudentRiskLevel RiskLevel,
    int RiskScore,
    List<string> Reasons,
    decimal AttendanceRate,
    decimal AverageGrade,
    decimal HomeworkRate,
    decimal OverdueDebtAmount,
    int InactiveDays
);
#endregion

#region Certificates DTOs
public record CertificateDto(
    Guid Id,
    string CertificateNumber,
    string VerificationCode,
    Guid StudentId,
    string StudentName,
    Guid? SubjectId,
    string? SubjectName,
    Guid? GroupId,
    string? GroupName,
    string CourseName,
    string LevelName,
    DateTime IssueDate,
    decimal? FinalGrade,
    string? QrCodeData,
    string VerificationUrl
);

public record CreateCertificateDto(
    Guid StudentId,
    Guid? SubjectId,
    Guid? GroupId,
    string CourseName,
    string LevelName,
    decimal? FinalGrade
);

public record CertificateVerificationResultDto(
    bool IsValid,
    string? CertificateNumber,
    string? StudentName,
    string? CourseName,
    string? LevelName,
    string? OrganizationName,
    DateTime? IssueDate,
    decimal? FinalGrade,
    string? Message
);
#endregion

#region Global Search DTOs
public record SearchResultItemDto(
    string Category, // Student, Teacher, Group, Course, Lesson, Payment, Invoice, Lead
    string Title,
    string Subtitle,
    Guid Id,
    string RouteUrl,
    string? Meta
);

public record GlobalSearchResultDto(
    string Query,
    List<SearchResultItemDto> Results
);
#endregion

#region Branches, Feedback, Referral & Entitlement DTOs
public record BranchDto(
    Guid Id,
    string Name,
    string Address,
    string Phone,
    bool IsActive,
    int RoomsCount,
    int GroupsCount
);

public record CreateBranchDto(
    string Name,
    string Address,
    string Phone
);

public record UpdateBranchDto(
    string Name,
    string Address,
    string Phone,
    bool IsActive
);

public record FeedbackDto(
    Guid Id,
    Guid? StudentId,
    string? StudentName,
    Guid? ParentId,
    string? ParentName,
    Guid? TeacherId,
    string? TeacherName,
    Guid? SubjectId,
    string? SubjectName,
    int Rating,
    string? Comment,
    string Category,
    DateTime CreatedAt
);

public record CreateFeedbackDto(
    Guid? TeacherId,
    Guid? SubjectId,
    int Rating,
    string? Comment,
    string Category
);

public record ReferralCodeDto(
    Guid Id,
    Guid StudentId,
    string StudentName,
    string Code,
    decimal RewardPercentage,
    bool IsActive,
    int SuccessfulReferralsCount,
    decimal TotalEarnedRewards
);

public record ReferralDto(
    Guid Id,
    Guid ReferrerStudentId,
    string ReferrerStudentName,
    Guid ReferredStudentId,
    string ReferredStudentName,
    string ReferralCode,
    decimal RewardAmount,
    bool IsRewardApplied,
    DateTime? RewardAppliedAt,
    DateTime CreatedAt
);

public record FeatureEntitlementDto(
    bool CanUseCRM,
    bool CanUseSMS,
    bool CanUseTelegram,
    bool CanUseAnalytics,
    bool CanUseBranches,
    bool CanUseOnlinePayments,
    bool CanUsePayroll,
    int MaxStudents,
    int MaxTeachers,
    int MaxGroups,
    int CurrentStudents,
    int CurrentTeachers,
    int CurrentGroups
);
#endregion

#region Student Teacher & Group Enrollment DTOs
public record AvailableGroupDto(
    Guid Id,
    string Name,
    Guid? SubjectId,
    string? SubjectName,
    decimal MonthlyFee,
    int MaxStudents,
    int EnrolledCount,
    string? ScheduleDescription,
    string? Room,
    bool IsEnrolled
);

public record AvailableTeacherDto(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string? Specialization,
    List<AvailableGroupDto> Groups
);

public record EnrollInGroupRequestDto(
    Guid GroupId
);
#endregion


