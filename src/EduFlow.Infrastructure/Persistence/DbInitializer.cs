using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EduFlow.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(EduFlowDbContext context, ILogger logger)
    {
        try
        {
            if (context.Database.IsSqlite())
            {
                await context.Database.EnsureCreatedAsync();
            }
            else
            {
                try
                {
                    await context.Database.MigrateAsync();
                }
                catch (Exception ex)
                {
                    logger.LogWarning("MigrateAsync xatolik berdi, EnsureCreatedAsync qo'llanilmoqda: {Msg}", ex.Message);
                    await context.Database.EnsureCreatedAsync();
                }
            }

            // Ensure tables and columns exist
            var createTableStatements = new[]
            {
                @"CREATE TABLE IF NOT EXISTS FinanceSettings (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    DefaultTeacherSharePercentage TEXT NOT NULL DEFAULT '20',
                    FamilyDiscount2ndStudent TEXT NOT NULL DEFAULT '10',
                    FamilyDiscount3rdStudent TEXT NOT NULL DEFAULT '15',
                    FamilyDiscount4thPlusStudent TEXT NOT NULL DEFAULT '20',
                    DiscountConflictRule INTEGER NOT NULL DEFAULT 1,
                    ExcusedAbsenceRefundEnabled INTEGER NOT NULL DEFAULT 1,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS StudentDiscounts (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    StudentId TEXT NOT NULL,
                    DiscountPercentage TEXT NOT NULL DEFAULT '0',
                    StartDate TEXT NOT NULL,
                    EndDate TEXT NULL,
                    Reason TEXT NOT NULL,
                    IsActive INTEGER NOT NULL DEFAULT 1,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS PaymentTransactions (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    PaymentId TEXT NOT NULL,
                    Amount TEXT NOT NULL DEFAULT '0',
                    PaymentDate TEXT NOT NULL,
                    Method INTEGER NOT NULL DEFAULT 1,
                    IdempotencyKey TEXT NULL,
                    Notes TEXT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS CenterExpenses (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    Category TEXT NOT NULL,
                    Amount TEXT NOT NULL DEFAULT '0',
                    ExpenseDate TEXT NOT NULL,
                    Description TEXT NOT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS AuditLogs (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NULL,
                    UserId TEXT NULL,
                    UserEmail TEXT NULL,
                    Action TEXT NOT NULL,
                    Resource TEXT NOT NULL,
                    ResourceId TEXT NULL,
                    Details TEXT NULL,
                    IpAddress TEXT NULL,
                    CreatedAt TEXT NOT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS Branches (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    Name TEXT NOT NULL,
                    Address TEXT NOT NULL,
                    Phone TEXT NULL,
                    PhoneNumber TEXT NULL,
                    IsActive INTEGER NOT NULL DEFAULT 1,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS Rooms (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    BranchId TEXT NULL,
                    Name TEXT NOT NULL,
                    Number TEXT NULL,
                    Capacity INTEGER NOT NULL DEFAULT 20,
                    Type INTEGER NOT NULL DEFAULT 1,
                    Status INTEGER NOT NULL DEFAULT 1,
                    EquipmentDescription TEXT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS Homeworks (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    GroupId TEXT NOT NULL,
                    LessonId TEXT NULL,
                    Title TEXT NOT NULL,
                    Description TEXT NOT NULL,
                    AttachmentUrl TEXT NULL,
                    DueDate TEXT NOT NULL,
                    MaxScore INTEGER NOT NULL DEFAULT 100,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS HomeworkSubmissions (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    HomeworkId TEXT NOT NULL,
                    StudentId TEXT NOT NULL,
                    SubmissionText TEXT NULL,
                    FileUrl TEXT NULL,
                    SubmittedAt TEXT NOT NULL,
                    Status INTEGER NOT NULL DEFAULT 1,
                    Score INTEGER NULL,
                    TeacherFeedback TEXT NULL,
                    GradedAt TEXT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS Leads (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    FullName TEXT NOT NULL,
                    PhoneNumber TEXT NOT NULL,
                    InterestedSubject TEXT NULL,
                    Status INTEGER NOT NULL DEFAULT 1,
                    Source INTEGER NOT NULL DEFAULT 6,
                    Notes TEXT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS TrialLessons (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    LeadId TEXT NOT NULL,
                    GroupId TEXT NULL,
                    TeacherId TEXT NULL,
                    ScheduledTime TEXT NOT NULL,
                    Status INTEGER NOT NULL DEFAULT 1,
                    Feedback TEXT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS Invoices (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    StudentId TEXT NOT NULL,
                    PaymentId TEXT NULL,
                    InvoiceNumber TEXT NOT NULL,
                    TotalAmount TEXT NOT NULL DEFAULT '0',
                    PaidAmount TEXT NOT NULL DEFAULT '0',
                    IssueDate TEXT NOT NULL,
                    DueDate TEXT NOT NULL,
                    Status INTEGER NOT NULL DEFAULT 1,
                    Notes TEXT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS TeacherPayrolls (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    TeacherId TEXT NOT NULL,
                    PeriodStart TEXT NOT NULL,
                    PeriodEnd TEXT NOT NULL,
                    BaseSalary TEXT NOT NULL DEFAULT '0',
                    CalculatedShare TEXT NOT NULL DEFAULT '0',
                    BonusAmount TEXT NOT NULL DEFAULT '0',
                    TotalPaid TEXT NOT NULL DEFAULT '0',
                    PaymentType INTEGER NOT NULL DEFAULT 1,
                    IsPaid INTEGER NOT NULL DEFAULT 0,
                    PaidDate TEXT NULL,
                    Notes TEXT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS Certificates (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    StudentId TEXT NOT NULL,
                    GroupId TEXT NULL,
                    CertificateNumber TEXT NOT NULL,
                    VerificationCode TEXT NOT NULL,
                    CourseName TEXT NOT NULL,
                    IssueDate TEXT NOT NULL,
                    PdfUrl TEXT NULL,
                    QrCodeData TEXT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS Feedbacks (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    StudentId TEXT NULL,
                    ParentId TEXT NULL,
                    TeacherId TEXT NULL,
                    Rating INTEGER NOT NULL DEFAULT 5,
                    Comment TEXT NOT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS ReferralCodes (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    StudentId TEXT NOT NULL,
                    Code TEXT NOT NULL,
                    DiscountPercent TEXT NOT NULL DEFAULT '10',
                    IsActive INTEGER NOT NULL DEFAULT 1,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );",
                @"CREATE TABLE IF NOT EXISTS Referrals (
                    Id TEXT PRIMARY KEY,
                    OrganizationId TEXT NOT NULL,
                    ReferralCodeId TEXT NOT NULL,
                    ReferredStudentId TEXT NOT NULL,
                    BonusApplied INTEGER NOT NULL DEFAULT 0,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CreatedBy TEXT NULL,
                    UpdatedBy TEXT NULL
                );"
            };

            foreach (var stmt in createTableStatements)
            {
                try
                {
                    await context.Database.ExecuteSqlRawAsync(stmt);
                }
                catch (Exception ex)
                {
                    logger.LogWarning("Table creation warning: {Msg}", ex.Message);
                }
            }

            var columns = new[] {
                "ALTER TABLE Teachers ADD COLUMN CustomSharePercentage TEXT NULL;",
                "ALTER TABLE Teachers ADD COLUMN SalaryModel INTEGER NOT NULL DEFAULT 2;",
                "ALTER TABLE Teachers ADD COLUMN FixedSalaryAmount TEXT NULL;",
                "ALTER TABLE Students ADD COLUMN IsPaymentBlocked INTEGER NOT NULL DEFAULT 0;",
                "ALTER TABLE Students ADD COLUMN PaidUntil TEXT NULL;",
                "ALTER TABLE Students ADD COLUMN PaymentBlockReason TEXT NULL;",
                "ALTER TABLE Students ADD COLUMN LastPaymentDate TEXT NULL;",
                "ALTER TABLE Payments ADD COLUMN OrganizationId TEXT NULL;",
                "ALTER TABLE Payments ADD COLUMN GroupId TEXT NULL;",
                "ALTER TABLE Payments ADD COLUMN BasePrice TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Payments ADD COLUMN DiscountPercent TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Payments ADD COLUMN DiscountAmount TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Payments ADD COLUMN FinalAmount TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Payments ADD COLUMN PaidAmount TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Payments ADD COLUMN DebtAmount TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Payments ADD COLUMN TeacherSharePercent TEXT NOT NULL DEFAULT '20';",
                "ALTER TABLE Payments ADD COLUMN TeacherShareAmount TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Payments ADD COLUMN CenterShareAmount TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Payments ADD COLUMN TeacherId TEXT NULL;",
                "ALTER TABLE Users ADD COLUMN RefreshToken TEXT NULL;",
                "ALTER TABLE Users ADD COLUMN RefreshTokenExpiryTime TEXT NULL;",
                "ALTER TABLE Parents ADD COLUMN OrganizationId TEXT NULL;",
                "ALTER TABLE Parents ADD COLUMN UserId TEXT NULL;",
                "ALTER TABLE Students ADD COLUMN UserId TEXT NULL;",
                "ALTER TABLE Groups ADD COLUMN RoomId TEXT NULL;",
                "ALTER TABLE Groups ADD COLUMN BranchId TEXT NULL;",
                "ALTER TABLE Lessons ADD COLUMN OrganizationId TEXT NULL;",
                "ALTER TABLE Lessons ADD COLUMN RoomId TEXT NULL;",
                "ALTER TABLE Lessons ADD COLUMN BranchId TEXT NULL;",
                "ALTER TABLE Lessons ADD COLUMN TeacherId TEXT NULL;",
                "ALTER TABLE Attendances ADD COLUMN OrganizationId TEXT NULL;",
                "ALTER TABLE Grades ADD COLUMN OrganizationId TEXT NULL;",
                "ALTER TABLE Notifications ADD COLUMN OrganizationId TEXT NULL;",
                "ALTER TABLE TelegramAccounts ADD COLUMN OrganizationId TEXT NULL;",
                "ALTER TABLE Branches ADD COLUMN Phone TEXT NULL;",
                "ALTER TABLE Rooms ADD COLUMN Number TEXT NULL;",
                "ALTER TABLE Rooms ADD COLUMN Equipment TEXT NULL;",
                "ALTER TABLE Rooms ADD COLUMN IsActive INTEGER NOT NULL DEFAULT 1;",
                "ALTER TABLE Homeworks ADD COLUMN TeacherId TEXT NULL;",
                "ALTER TABLE Homeworks ADD COLUMN AttachmentUrls TEXT NULL;",
                "ALTER TABLE HomeworkSubmissions ADD COLUMN Content TEXT NULL;",
                "ALTER TABLE HomeworkSubmissions ADD COLUMN AttachmentUrls TEXT NULL;",
                "ALTER TABLE HomeworkSubmissions ADD COLUMN Feedback TEXT NULL;",
                "ALTER TABLE HomeworkSubmissions ADD COLUMN ReviewedAt TEXT NULL;",
                "ALTER TABLE Leads ADD COLUMN Email TEXT NULL;",
                "ALTER TABLE Leads ADD COLUMN InterestedSubjectId TEXT NULL;",
                "ALTER TABLE Leads ADD COLUMN AssignedUserId TEXT NULL;",
                "ALTER TABLE Leads ADD COLUMN ConvertedStudentId TEXT NULL;",
                "ALTER TABLE TrialLessons ADD COLUMN SubjectId TEXT NULL;",
                "ALTER TABLE TrialLessons ADD COLUMN RoomId TEXT NULL;",
                "ALTER TABLE TrialLessons ADD COLUMN ScheduledDate TEXT NULL;",
                "ALTER TABLE TrialLessons ADD COLUMN StartTime TEXT NULL;",
                "ALTER TABLE TrialLessons ADD COLUMN EndTime TEXT NULL;",
                "ALTER TABLE TrialLessons ADD COLUMN Notes TEXT NULL;",
                "ALTER TABLE TeacherPayrolls ADD COLUMN Year INTEGER NOT NULL DEFAULT 2026;",
                "ALTER TABLE TeacherPayrolls ADD COLUMN Month INTEGER NOT NULL DEFAULT 1;",
                "ALTER TABLE TeacherPayrolls ADD COLUMN CalculationType INTEGER NOT NULL DEFAULT 1;",
                "ALTER TABLE TeacherPayrolls ADD COLUMN LessonsTaught INTEGER NOT NULL DEFAULT 0;",
                "ALTER TABLE TeacherPayrolls ADD COLUMN StudentsCount INTEGER NOT NULL DEFAULT 0;",
                "ALTER TABLE TeacherPayrolls ADD COLUMN TotalRevenue TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE TeacherPayrolls ADD COLUMN SharePercentage TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE TeacherPayrolls ADD COLUMN CalculatedSalary TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE TeacherPayrolls ADD COLUMN RemainingAmount TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Certificates ADD COLUMN SubjectId TEXT NULL;",
                "ALTER TABLE Certificates ADD COLUMN GroupId TEXT NULL;",
                "ALTER TABLE Certificates ADD COLUMN LevelName TEXT NOT NULL DEFAULT 'Boshlang''ich';",
                "ALTER TABLE Certificates ADD COLUMN FinalGrade TEXT NULL;",
                "ALTER TABLE Certificates ADD COLUMN QrCodeData TEXT NULL;",
                "ALTER TABLE Feedbacks ADD COLUMN SubjectId TEXT NULL;",
                "ALTER TABLE Feedbacks ADD COLUMN Category TEXT NOT NULL DEFAULT 'General';",
                "ALTER TABLE ReferralCodes ADD COLUMN RewardPercentage TEXT NOT NULL DEFAULT '10';",
                "ALTER TABLE Referrals ADD COLUMN ReferrerStudentId TEXT NULL;",
                "ALTER TABLE Referrals ADD COLUMN ReferredStudentId TEXT NULL;",
                "ALTER TABLE Referrals ADD COLUMN RewardAmount TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Referrals ADD COLUMN IsRewardApplied INTEGER NOT NULL DEFAULT 0;",
                "ALTER TABLE Referrals ADD COLUMN RewardAppliedAt TEXT NULL;",
                "ALTER TABLE Subjects ADD COLUMN Description TEXT NULL;",
                "ALTER TABLE Subjects ADD COLUMN Price TEXT NOT NULL DEFAULT '0';",
                "ALTER TABLE Subjects ADD COLUMN DurationWeeks INTEGER NOT NULL DEFAULT 12;",
                "ALTER TABLE Subjects ADD COLUMN IsActive INTEGER NOT NULL DEFAULT 1;"
            };
            foreach (var col in columns)
            {
                try { await context.Database.ExecuteSqlRawAsync(col); } catch { }
            }

            var backfillStatements = new[] {
                "UPDATE Parents SET OrganizationId = (SELECT OrganizationId FROM Students WHERE Students.ParentId = Parents.Id LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Lessons SET OrganizationId = (SELECT OrganizationId FROM Groups WHERE Groups.Id = Lessons.GroupId LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Attendances SET OrganizationId = (SELECT OrganizationId FROM Students WHERE Students.Id = Attendances.StudentId LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Grades SET OrganizationId = (SELECT OrganizationId FROM Students WHERE Students.Id = Grades.StudentId LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Notifications SET OrganizationId = (SELECT OrganizationId FROM Students WHERE Students.Id = Notifications.StudentId LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE TelegramAccounts SET OrganizationId = (SELECT OrganizationId FROM Parents WHERE Parents.Id = TelegramAccounts.ParentId LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Payments SET OrganizationId = (SELECT OrganizationId FROM Students WHERE Students.Id = Payments.StudentId LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Payments SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Parents SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Students SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Teachers SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Groups SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Lessons SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Attendances SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Grades SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Notifications SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Users SET OrganizationId = (SELECT Id FROM Organizations LIMIT 1) WHERE OrganizationId IS NULL;",
                "UPDATE Users SET IsActive = 1 WHERE IsActive = 0;",
                "UPDATE Organizations SET IsActive = 1 WHERE IsActive = 0;",
                "UPDATE Users SET Role = 2 WHERE Email = 'admin@smartedu.uz';",
                "UPDATE Users SET Role = 1 WHERE Email = 'superadmin@smartedu.uz';",
                "DELETE FROM Users WHERE Email IN ('admin@eduflow.uz', 'superadmin@eduflow.uz');"
            };
            foreach (var bf in backfillStatements)
            {
                try { await context.Database.ExecuteSqlRawAsync(bf); } catch { }
            }

            // 1. Seed Subscription Plans
            if (!await context.SubscriptionPlans.AnyAsync())
            {
                var plans = new List<SubscriptionPlan>
                {
                    new()
                    {
                        Name = "FREE",
                        MonthlyPrice = 0,
                        MaxStudents = 20,
                        MaxTeachers = 1,
                        MaxGroups = 2,
                        HasTelegram = false,
                        HasReports = false,
                        HasAdvancedAnalytics = false
                    },
                    new()
                    {
                        Name = "STARTER",
                        MonthlyPrice = 290000,
                        MaxStudents = 100,
                        MaxTeachers = 5,
                        MaxGroups = 10,
                        HasTelegram = true,
                        HasReports = true,
                        HasAdvancedAnalytics = false
                    },
                    new()
                    {
                        Name = "PRO",
                        MonthlyPrice = 590000,
                        MaxStudents = 10000,
                        MaxTeachers = 100,
                        MaxGroups = 500,
                        HasTelegram = true,
                        HasReports = true,
                        HasAdvancedAnalytics = true
                    }
                };

                await context.SubscriptionPlans.AddRangeAsync(plans);
                await context.SaveChangesAsync();
            }

            // 2. Seed Single Learning Center Organization "EduFlow O'quv Markazi"
            var mainOrg = await context.Organizations.IgnoreQueryFilters().FirstOrDefaultAsync(o => o.Email == "info@smartedu.uz" || o.Name == "EduFlow O'quv Markazi" || o.Name == "Smart Education");
            if (mainOrg == null)
            {
                mainOrg = new Organization
                {
                    Name = "EduFlow O'quv Markazi",
                    Phone = "+998901234567",
                    Email = "info@smartedu.uz",
                    Address = "Toshkent sh., Yunusobod tumani, 4-mavze, 12-uy",
                    IsActive = true
                };
                await context.Organizations.AddAsync(mainOrg);
                await context.SaveChangesAsync();
            }
            else
            {
                mainOrg.Name = "EduFlow O'quv Markazi";
            }

            try
            {
                var defaultAdminPass = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD") ?? "admin123";
                var adminHash = BCrypt.Net.BCrypt.HashPassword(defaultAdminPass);

                // Deactivate redundant admin accounts so there is strictly 1 primary Admin without causing FK violations
                var extraAdmins = await context.Users.IgnoreQueryFilters()
                    .Where(u => u.Email == "admin@eduflow.uz" || u.Email == "superadmin@eduflow.uz")
                    .ToListAsync();
                if (extraAdmins.Any())
                {
                    foreach (var extra in extraAdmins)
                    {
                        extra.IsActive = false;
                    }
                    await context.SaveChangesAsync();
                }

                // 1. Center Admin (Markaz Administratori - Role 2)
                var admin = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == "admin@smartedu.uz");
                if (admin == null)
                {
                    admin = new User
                    {
                        OrganizationId = mainOrg.Id,
                        FirstName = "Admin",
                        LastName = "SmartEdu",
                        Email = "admin@smartedu.uz",
                        PasswordHash = adminHash,
                        PhoneNumber = "+998901234567",
                        Role = UserRole.CenterAdmin,
                        IsActive = true
                    };
                    await context.Users.AddAsync(admin);
                }
                else
                {
                    admin.FirstName = "Admin";
                    admin.LastName = "SmartEdu";
                    admin.Role = UserRole.CenterAdmin;
                    admin.PasswordHash = adminHash;
                    admin.IsActive = true;
                }

                // 2. Platform SuperAdmin (Tizim Egasi - Role 1)
                var superAdmin = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == "superadmin@smartedu.uz");
                if (superAdmin == null)
                {
                    superAdmin = new User
                    {
                        OrganizationId = mainOrg.Id,
                        FirstName = "SuperAdmin",
                        LastName = "EduFlow",
                        Email = "superadmin@smartedu.uz",
                        PasswordHash = adminHash,
                        PhoneNumber = "+998909999999",
                        Role = UserRole.SuperAdmin,
                        IsActive = true
                    };
                    await context.Users.AddAsync(superAdmin);
                }
                else
                {
                    superAdmin.FirstName = "SuperAdmin";
                    superAdmin.LastName = "EduFlow";
                    superAdmin.Role = UserRole.SuperAdmin;
                    superAdmin.PasswordHash = adminHash;
                    superAdmin.IsActive = true;
                }

                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                context.ChangeTracker.Clear();
                logger.LogWarning("Admin seed check: {Msg}", ex.Message);
            }

            var smartOrg = mainOrg;
            var proPlan = await context.SubscriptionPlans.FirstAsync(p => p.Name == "PRO");

            var subscription = await context.Subscriptions.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.OrganizationId == smartOrg.Id);
            if (subscription == null)
            {
                subscription = new Subscription
                {
                    OrganizationId = smartOrg.Id,
                    SubscriptionPlanId = proPlan.Id,
                    StartDate = DateTime.UtcNow.AddMonths(-1),
                    EndDate = DateTime.UtcNow.AddMonths(11),
                    Status = SubscriptionStatus.Active,
                    AutoRenew = true
                };
                await context.Subscriptions.AddAsync(subscription);
                await context.SaveChangesAsync();
            }

            var centerOrgId = mainOrg.Id;
            try
            {
                if (!await context.FinanceSettings.IgnoreQueryFilters().AnyAsync(fs => fs.OrganizationId == centerOrgId))
                {
                    context.FinanceSettings.Add(new FinanceSetting
                    {
                        OrganizationId = centerOrgId,
                        DefaultTeacherSharePercentage = 20m,
                        FamilyDiscount2ndStudent = 10m,
                        FamilyDiscount3rdStudent = 15m,
                        FamilyDiscount4thPlusStudent = 20m,
                        DiscountConflictRule = DiscountConflictRule.HighestDiscount,
                        ExcusedAbsenceRefundEnabled = true
                    });
                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning("FinanceSettings tekshirish/qo'shishda e'tibor: {Message}", ex.Message);
            }

            // Populate snapshot fields for existing payments if unpopulated
            var existingPayments = await context.Payments.Where(p => p.FinalAmount == 0).ToListAsync();
            foreach (var p in existingPayments)
            {
                p.OrganizationId = centerOrgId;
                p.BasePrice = p.Amount > 0 ? p.Amount : 450000m;
                p.FinalAmount = p.BasePrice;
                p.PaidAmount = p.Status == PaymentStatus.Paid ? p.FinalAmount : 0m;
                p.DebtAmount = p.FinalAmount - p.PaidAmount;
                p.TeacherSharePercent = 20m;
                p.TeacherShareAmount = Math.Round(p.PaidAmount * 0.20m, 2, MidpointRounding.AwayFromZero);
                p.CenterShareAmount = p.PaidAmount - p.TeacherShareAmount;
            }
            if (existingPayments.Any())
            {
                await context.SaveChangesAsync();
            }

            var pWithGroup = await context.Payments.Include(p => p.Group).Where(p => p.TeacherId == null && p.GroupId != null).ToListAsync();
            foreach (var p in pWithGroup)
            {
                if (p.Group != null) p.TeacherId = p.Group.TeacherId;
            }
            if (pWithGroup.Any())
            {
                await context.SaveChangesAsync();
            }

            // 3. Seed Branches and Rooms if none exist
            var defaultOrg = await context.Organizations.IgnoreQueryFilters().FirstOrDefaultAsync();
            if (defaultOrg != null)
            {
                var branch1 = await context.Branches.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.OrganizationId == defaultOrg.Id && b.Name == "Bosh filial");
                if (branch1 == null)
                {
                    branch1 = new Branch
                    {
                        OrganizationId = defaultOrg.Id,
                        Name = "Bosh filial",
                        Address = "Toshkent sh., Yunusobod tumani, 4-mavze",
                        Phone = "+998712001122",
                        IsActive = true
                    };
                    await context.Branches.AddAsync(branch1);
                    await context.SaveChangesAsync();
                }

                var branch2 = await context.Branches.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.OrganizationId == defaultOrg.Id && b.Name == "Chilonzor filiali");
                if (branch2 == null)
                {
                    branch2 = new Branch
                    {
                        OrganizationId = defaultOrg.Id,
                        Name = "Chilonzor filiali",
                        Address = "Toshkent sh., Chilonzor tumani, 1-mavze",
                        Phone = "+998712003344",
                        IsActive = true
                    };
                    await context.Branches.AddAsync(branch2);
                    await context.SaveChangesAsync();
                }

                var room1 = await context.Rooms.IgnoreQueryFilters().FirstOrDefaultAsync(r => r.OrganizationId == defaultOrg.Id && r.Name == "Xona 101 - IT Lab");
                if (room1 == null)
                {
                    room1 = new Room
                    {
                        OrganizationId = defaultOrg.Id,
                        BranchId = branch1.Id,
                        Name = "Xona 101 - IT Lab",
                        Number = "101",
                        Capacity = 20,
                        Type = RoomType.Lab,
                        Status = RoomStatus.Available,
                        Equipment = "20 ta kompyuter, proyektor, Wi-Fi"
                    };
                    await context.Rooms.AddAsync(room1);
                }

                var room2 = await context.Rooms.IgnoreQueryFilters().FirstOrDefaultAsync(r => r.OrganizationId == defaultOrg.Id && r.Name == "Xona 102 - Til markazi");
                if (room2 == null)
                {
                    room2 = new Room
                    {
                        OrganizationId = defaultOrg.Id,
                        BranchId = branch1.Id,
                        Name = "Xona 102 - Til markazi",
                        Number = "102",
                        Capacity = 16,
                        Type = RoomType.Standard,
                        Status = RoomStatus.Available,
                        Equipment = "Smart doska, audio sistema"
                    };
                    await context.Rooms.AddAsync(room2);
                }

                var room3 = await context.Rooms.IgnoreQueryFilters().FirstOrDefaultAsync(r => r.OrganizationId == defaultOrg.Id && r.Name == "Xona 201 - Matematika");
                if (room3 == null)
                {
                    room3 = new Room
                    {
                        OrganizationId = defaultOrg.Id,
                        BranchId = branch2.Id,
                        Name = "Xona 201 - Matematika",
                        Number = "201",
                        Capacity = 25,
                        Type = RoomType.Standard,
                        Status = RoomStatus.Available,
                        Equipment = "Magnit doska, partalar"
                    };
                    await context.Rooms.AddAsync(room3);
                }
                await context.SaveChangesAsync();

                // Link existing groups and lessons to room and branch
                var groupsToUpdate = await context.Groups.IgnoreQueryFilters().Where(g => g.RoomId == null || g.BranchId == null).ToListAsync();
                foreach (var g in groupsToUpdate)
                {
                    g.BranchId = branch1.Id;
                    g.RoomId = room1.Id;
                }

                var lessonsToUpdate = await context.Lessons.IgnoreQueryFilters().Where(l => l.RoomId == null).ToListAsync();
                foreach (var l in lessonsToUpdate)
                {
                    l.RoomId = room1.Id;
                }
                await context.SaveChangesAsync();

                // 4. Initial purge of demo / operational data (students, groups, teachers, lessons, attendances, payments, homework, etc.)
                var cleanupMarker = await context.AuditLogs.IgnoreQueryFilters().FirstOrDefaultAsync(a => a.Action == "SYSTEM_CLEANUP_V1");
                if (cleanupMarker == null)
                {
                    var conn = context.Database.GetDbConnection();
                    if (conn.State != System.Data.ConnectionState.Open)
                    {
                        await conn.OpenAsync();
                    }
                    using (var cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = @"
                            PRAGMA foreign_keys = OFF;
                            DELETE FROM Attendances;
                            DELETE FROM Grades;
                            DELETE FROM HomeworkSubmissions;
                            DELETE FROM Homeworks;
                            DELETE FROM Lessons;
                            DELETE FROM GroupStudents;
                            DELETE FROM Certificates;
                            DELETE FROM Feedbacks;
                            DELETE FROM Referrals;
                            DELETE FROM ReferralCodes;
                            DELETE FROM StudentDiscounts;
                            DELETE FROM PaymentTransactions;
                            DELETE FROM Invoices;
                            DELETE FROM Payments;
                            DELETE FROM TrialLessons;
                            DELETE FROM Leads;
                            DELETE FROM Groups;
                            DELETE FROM TeacherPayrolls;
                            DELETE FROM Students;
                            DELETE FROM Teachers;
                            DELETE FROM TelegramAccounts;
                            DELETE FROM Parents;
                            DELETE FROM Notifications;
                            DELETE FROM Users WHERE Role IN (3, 4, 5);
                            UPDATE AuditLogs SET UserId = NULL WHERE UserId NOT IN (SELECT Id FROM Users);
                            PRAGMA foreign_keys = ON;
                        ";
                        await cmd.ExecuteNonQueryAsync();
                    }

                    context.AuditLogs.Add(new AuditLog
                    {
                        Action = "SYSTEM_CLEANUP_V1",
                        Resource = "Database",
                        Details = "All students, groups, teachers and operational records cleared upon request.",
                        CreatedAt = DateTime.UtcNow
                    });
                    await context.SaveChangesAsync();
                    logger.LogInformation("SYSTEM_CLEANUP_V1: Baza muvaffaqiyatli tozalandi.");
                }

                // 5. Comprehensive Demo Data Seeder (SYSTEM_DEMO_SEED_V2)
                var demoSeedMarker = await context.AuditLogs.IgnoreQueryFilters().FirstOrDefaultAsync(a => a.Action == "SYSTEM_DEMO_SEED_V2");
                var currentStudentsCount = await context.Students.IgnoreQueryFilters().CountAsync();
                if (demoSeedMarker == null || currentStudentsCount < 5)
                {
                    await SeedComprehensiveDemoDataAsync(context, defaultOrg, logger);
                    if (demoSeedMarker == null)
                    {
                        context.AuditLogs.Add(new AuditLog
                        {
                            Action = "SYSTEM_DEMO_SEED_V2",
                            Resource = "Database",
                            Details = "Comprehensive demo data seeded across all modules successfully.",
                            CreatedAt = DateTime.UtcNow
                        });
                        await context.SaveChangesAsync();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Ma'lumotlar bazasini initsializatsiya qilishda xatolik yuz berdi.");
        }
    }

    private static async Task SeedComprehensiveDemoDataAsync(EduFlowDbContext context, Organization mainOrg, ILogger logger)
    {
        logger.LogInformation("SYSTEM_DEMO_SEED_V2: To'liq demo ma'lumotlarni yaratish boshlandi...");
        var orgId = mainOrg.Id;
        var now = DateTime.UtcNow;
        var demoPassHash = BCrypt.Net.BCrypt.HashPassword("admin123");

        // Clean previous demo/operational data to ensure fresh relational integrity
        var conn = context.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
        {
            await conn.OpenAsync();
        }
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                PRAGMA foreign_keys = OFF;
                DELETE FROM Attendances;
                DELETE FROM Grades;
                DELETE FROM HomeworkSubmissions;
                DELETE FROM Homeworks;
                DELETE FROM Lessons;
                DELETE FROM GroupStudents;
                DELETE FROM Certificates;
                DELETE FROM Feedbacks;
                DELETE FROM Referrals;
                DELETE FROM ReferralCodes;
                DELETE FROM StudentDiscounts;
                DELETE FROM PaymentTransactions;
                DELETE FROM Invoices;
                DELETE FROM Payments;
                DELETE FROM TrialLessons;
                DELETE FROM Leads;
                DELETE FROM CenterExpenses;
                DELETE FROM TeacherPayrolls;
                DELETE FROM Groups;
                DELETE FROM Students;
                DELETE FROM Parents;
                DELETE FROM Teachers;
                DELETE FROM Rooms;
                DELETE FROM Branches;
                DELETE FROM Users WHERE Role IN (3, 4, 5);
                PRAGMA foreign_keys = ON;
            ";
            await cmd.ExecuteNonQueryAsync();
        }
        context.ChangeTracker.Clear();

        // 1. Branches
        var branch1 = new Branch { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Bosh filial (Yunusobod)", Address = "Toshkent sh., Yunusobod tumani, 4-mavze, 12-uy", Phone = "+998712001122", IsActive = true };
        var branch2 = new Branch { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Chilonzor filiali", Address = "Toshkent sh., Chilonzor tumani, 1-mavze, 5-uy", Phone = "+998712003344", IsActive = true };
        var branch3 = new Branch { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Mirzo Ulug'bek filiali", Address = "Toshkent sh., Buyuk Ipak Yo'li ko'chasi, 15-uy", Phone = "+998712005566", IsActive = true };
        await context.Branches.AddRangeAsync(branch1, branch2, branch3);

        // 2. Rooms
        var room1 = new Room { Id = Guid.NewGuid(), OrganizationId = orgId, BranchId = branch1.Id, Name = "101 - IT Lab", Number = "101", Capacity = 20, Type = RoomType.Lab, Status = RoomStatus.Available, Equipment = "20 ta iMac, Smart ekran, Yuqori tezlikdagi Wi-Fi", IsActive = true };
        var room2 = new Room { Id = Guid.NewGuid(), OrganizationId = orgId, BranchId = branch1.Id, Name = "102 - Til markazi", Number = "102", Capacity = 16, Type = RoomType.Standard, Status = RoomStatus.Available, Equipment = "Smart doska, Audio sistema", IsActive = true };
        var room3 = new Room { Id = Guid.NewGuid(), OrganizationId = orgId, BranchId = branch2.Id, Name = "201 - Matematika", Number = "201", Capacity = 24, Type = RoomType.Standard, Status = RoomStatus.Available, Equipment = "Magnit doska, Proyektor", IsActive = true };
        var room4 = new Room { Id = Guid.NewGuid(), OrganizationId = orgId, BranchId = branch1.Id, Name = "202 - Konferentsiya zali", Number = "202", Capacity = 40, Type = RoomType.Conference, Status = RoomStatus.Available, Equipment = "Katta ekran, Simsiz mikrofonlar", IsActive = true };
        var room5 = new Room { Id = Guid.NewGuid(), OrganizationId = orgId, BranchId = branch3.Id, Name = "301 - Robototexnika", Number = "301", Capacity = 18, Type = RoomType.Lab, Status = RoomStatus.Available, Equipment = "Arduino to'plamlari, 3D printer", IsActive = true };
        await context.Rooms.AddRangeAsync(room1, room2, room3, room4, room5);

        // 3. Subjects
        var subjIelts = await context.Subjects.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Name == "IELTS Intensive");
        if (subjIelts == null)
        {
            subjIelts = new Subject { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "IELTS Intensive", Description = "Band 7.5+ ball uchun intensiv tayyorgarlik kursi", Price = 650000m, DurationWeeks = 12, IsActive = true };
            await context.Subjects.AddAsync(subjIelts);
        }
        else
        {
            subjIelts.Price = 650000m;
            subjIelts.IsActive = true;
        }

        var subjEng = await context.Subjects.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Name == "General English (B1-B2)");
        if (subjEng == null)
        {
            subjEng = new Subject { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "General English (B1-B2)", Description = "Boshlang'ichdan mustaqil so'zlashuv darajasigacha", Price = 450000m, DurationWeeks = 24, IsActive = true };
            await context.Subjects.AddAsync(subjEng);
        }
        else
        {
            subjEng.Price = 450000m;
            subjEng.IsActive = true;
        }

        var subjReact = await context.Subjects.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Name == "Frontend Web Dasturlash (React & TS)");
        if (subjReact == null)
        {
            subjReact = new Subject { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Frontend Web Dasturlash (React & TS)", Description = "HTML5, CSS3, TailwindCSS, TypeScript, React 19, Next.js", Price = 800000m, DurationWeeks = 24, IsActive = true };
            await context.Subjects.AddAsync(subjReact);
        }
        else
        {
            subjReact.Price = 800000m;
            subjReact.IsActive = true;
        }

        var subjPy = await context.Subjects.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Name == "Python Backend & Django");
        if (subjPy == null)
        {
            subjPy = new Subject { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Python Backend & Django", Description = "Python asoslari, OOP, PostgreSQL, Django REST Framework, FastAPI", Price = 750000m, DurationWeeks = 24, IsActive = true };
            await context.Subjects.AddAsync(subjPy);
        }
        else
        {
            subjPy.Price = 750000m;
            subjPy.IsActive = true;
        }

        var subjMath = await context.Subjects.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Name == "Prezident Maktabi Matematika");
        if (subjMath == null)
        {
            subjMath = new Subject { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Prezident Maktabi Matematika", Description = "Mantiq, matematika va tanqidiy fikrlash tayyorlov kursi", Price = 400000m, DurationWeeks = 36, IsActive = true };
            await context.Subjects.AddAsync(subjMath);
        }
        else
        {
            subjMath.Price = 400000m;
            subjMath.IsActive = true;
        }

        var subjRus = await context.Subjects.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Name == "Rus tili (So'zlashuv kursi)");
        if (subjRus == null)
        {
            subjRus = new Subject { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Rus tili (So'zlashuv kursi)", Description = "Ravon so'zlashuv va amaliy biznes rus tili", Price = 380000m, DurationWeeks = 16, IsActive = true };
            await context.Subjects.AddAsync(subjRus);
        }
        else
        {
            subjRus.Price = 380000m;
            subjRus.IsActive = true;
        }

        // 4. Users (Teachers, Parents, Students)
        var userT1 = new User { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Rustam", LastName = "Ahmedov", Email = "teacher@smartedu.uz", PhoneNumber = "+998935554433", PasswordHash = demoPassHash, Role = UserRole.Teacher, IsActive = true };
        var userT2 = new User { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Dilshod", LastName = "Yusupov", Email = "dilshod@smartedu.uz", PhoneNumber = "+998901112233", PasswordHash = demoPassHash, Role = UserRole.Teacher, IsActive = true };
        var userT3 = new User { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Zarina", LastName = "Umarova", Email = "zarina@smartedu.uz", PhoneNumber = "+998912223344", PasswordHash = demoPassHash, Role = UserRole.Teacher, IsActive = true };
        var userT4 = new User { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Jasur", LastName = "Bekmurodov", Email = "jasurbek@smartedu.uz", PhoneNumber = "+998947778899", PasswordHash = demoPassHash, Role = UserRole.Teacher, IsActive = true };

        var userParent1 = new User { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Sobir", LastName = "Qodirov", Email = "parent@eduflow.uz", PhoneNumber = "+998909991122", PasswordHash = demoPassHash, Role = UserRole.Parent, IsActive = true };
        var userStudent1 = new User { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Alisher", LastName = "Qodirov", Email = "student@eduflow.uz", PhoneNumber = "+998977778899", PasswordHash = demoPassHash, Role = UserRole.Student, IsActive = true };

        await context.Users.AddRangeAsync(userT1, userT2, userT3, userT4, userParent1, userStudent1);

        // 5. Teachers
        var t1 = new Teacher { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Rustam Ahmedov", PhoneNumber = "+998935554433", Specialization = "IELTS Instructor (Band 8.5)", UserId = userT1.Id };
        var t2 = new Teacher { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Dilshod Yusupov", PhoneNumber = "+998901112233", Specialization = "Senior Frontend Developer", UserId = userT2.Id };
        var t3 = new Teacher { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Zarina Umarova", PhoneNumber = "+998912223344", Specialization = "Oliy toifali Matematika o'qituvchisi", UserId = userT3.Id };
        var t4 = new Teacher { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Jasur Bekmurodov", PhoneNumber = "+998947778899", Specialization = "Lead Python & Backend Engineer", UserId = userT4.Id };
        await context.Teachers.AddRangeAsync(t1, t2, t3, t4);

        // 6. Parents
        var p1 = new Parent { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Sobir Qodirov", PhoneNumber = "+998909991122", UserId = userParent1.Id };
        var p2 = new Parent { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Gulnora Karimova", PhoneNumber = "+998902345670" };
        var p3 = new Parent { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Anvar Mirzayev", PhoneNumber = "+998933456780" };
        var p4 = new Parent { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Nodir Rahimov", PhoneNumber = "+998944567800" };
        var p5 = new Parent { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Shahlo Saidova", PhoneNumber = "+998995678900" };
        var p6 = new Parent { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Botir Ergashev", PhoneNumber = "+998916789000" };
        var p7 = new Parent { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Dilnoza Ahmedova", PhoneNumber = "+998931234500" };
        await context.Parents.AddRangeAsync(p1, p2, p3, p4, p5, p6, p7);

        // 7. Students
        var s1 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Alisher", LastName = "Qodirov", PhoneNumber = "+998977778899", BirthDate = new DateTime(2008, 4, 12), EnrollmentDate = now.AddMonths(-6), ParentId = p1.Id, UserId = userStudent1.Id, IsActive = true };
        var s2 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Malika", LastName = "Karimova", PhoneNumber = "+998902345678", BirthDate = new DateTime(2007, 11, 20), EnrollmentDate = now.AddMonths(-5), ParentId = p2.Id, IsActive = true };
        var s3 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Bobur", LastName = "Mirzayev", PhoneNumber = "+998933456789", BirthDate = new DateTime(2009, 2, 5), EnrollmentDate = now.AddMonths(-4), ParentId = p3.Id, IsActive = true }; // High Risk
        var s4 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Jasur", LastName = "Rahimov", PhoneNumber = "+998944567890", BirthDate = new DateTime(2008, 7, 18), EnrollmentDate = now.AddMonths(-6), ParentId = p4.Id, IsActive = true };
        var s5 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Nilufar", LastName = "Saidova", PhoneNumber = "+998995678901", BirthDate = new DateTime(2009, 9, 30), EnrollmentDate = now.AddMonths(-3), ParentId = p5.Id, IsActive = true }; // Medium Risk
        var s6 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Sardor", LastName = "Ergashev", PhoneNumber = "+998916789012", BirthDate = new DateTime(2008, 1, 14), EnrollmentDate = now.AddMonths(-4), ParentId = p6.Id, IsActive = true };
        var s7 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Kamila", LastName = "Yusupova", PhoneNumber = "+998931234567", BirthDate = new DateTime(2009, 5, 22), EnrollmentDate = now.AddMonths(-2), ParentId = p7.Id, IsActive = true };
        var s8 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Azizbek", LastName = "Normatov", PhoneNumber = "+998905556677", BirthDate = new DateTime(2008, 10, 10), EnrollmentDate = now.AddMonths(-2), IsActive = true };
        var s9 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Fotima", LastName = "Toirova", PhoneNumber = "+998974443322", BirthDate = new DateTime(2007, 8, 15), EnrollmentDate = now.AddMonths(-3), IsActive = true };
        var s10 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Behruz", LastName = "Jalolov", PhoneNumber = "+998938889900", BirthDate = new DateTime(2008, 3, 3), EnrollmentDate = now.AddMonths(-5), IsActive = true }; // High Risk
        var s11 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Rayhona", LastName = "Oripova", PhoneNumber = "+998991234455", BirthDate = new DateTime(2009, 12, 1), EnrollmentDate = now.AddMonths(-1), IsActive = true };
        var s12 = new Student { Id = Guid.NewGuid(), OrganizationId = orgId, FirstName = "Diyorbek", LastName = "Rustamov", PhoneNumber = "+998913332211", BirthDate = new DateTime(2008, 6, 19), EnrollmentDate = now.AddMonths(-2), IsActive = true };

        await context.Students.AddRangeAsync(s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12);

        // 8. Groups
        var grp1 = new Group { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "IELTS Band 7.5+ Target", SubjectId = subjIelts.Id, TeacherId = t1.Id, RoomId = room2.Id, BranchId = branch1.Id, MonthlyFee = 650000m, MaxStudents = 15, ScheduleDescription = "Dush-Chor-Jum 14:00 - 16:00", Room = "102-xona", IsActive = true };
        var grp2 = new Group { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "General English B1 - Kunduzgi", SubjectId = subjEng.Id, TeacherId = t1.Id, RoomId = room2.Id, BranchId = branch1.Id, MonthlyFee = 450000m, MaxStudents = 16, ScheduleDescription = "Sesh-Pay-Shan 10:00 - 12:00", Room = "102-xona", IsActive = true };
        var grp3 = new Group { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "React & TypeScript Bootcamp", SubjectId = subjReact.Id, TeacherId = t2.Id, RoomId = room1.Id, BranchId = branch1.Id, MonthlyFee = 800000m, MaxStudents = 14, ScheduleDescription = "Dush-Chor-Jum 18:30 - 20:30", Room = "101 IT Lab", IsActive = true };
        var grp4 = new Group { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Python Backend & AI", SubjectId = subjPy.Id, TeacherId = t4.Id, RoomId = room1.Id, BranchId = branch1.Id, MonthlyFee = 750000m, MaxStudents = 14, ScheduleDescription = "Sesh-Pay-Shan 18:30 - 20:30", Room = "101 IT Lab", IsActive = true };
        var grp5 = new Group { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Prezident Maktabiga Tayyorlov", SubjectId = subjMath.Id, TeacherId = t3.Id, RoomId = room3.Id, BranchId = branch2.Id, MonthlyFee = 400000m, MaxStudents = 20, ScheduleDescription = "Dush-Chor-Jum 09:00 - 11:00", Room = "201-xona", IsActive = true };
        var grp6 = new Group { Id = Guid.NewGuid(), OrganizationId = orgId, Name = "Rus tili - Amaliy muloqot", SubjectId = subjRus.Id, TeacherId = t1.Id, RoomId = room2.Id, BranchId = branch1.Id, MonthlyFee = 380000m, MaxStudents = 15, ScheduleDescription = "Sesh-Pay-Shan 15:00 - 17:00", Room = "102-xona", IsActive = true };

        await context.Groups.AddRangeAsync(grp1, grp2, grp3, grp4, grp5, grp6);

        // 9. Group Students
        var gsList = new List<GroupStudent>
        {
            // IELTS
            new() { Id = Guid.NewGuid(), GroupId = grp1.Id, StudentId = s1.Id, JoinedAt = now.AddMonths(-4) },
            new() { Id = Guid.NewGuid(), GroupId = grp1.Id, StudentId = s4.Id, JoinedAt = now.AddMonths(-4) },
            new() { Id = Guid.NewGuid(), GroupId = grp1.Id, StudentId = s10.Id, JoinedAt = now.AddMonths(-3) },
            // General English
            new() { Id = Guid.NewGuid(), GroupId = grp2.Id, StudentId = s5.Id, JoinedAt = now.AddMonths(-3) },
            new() { Id = Guid.NewGuid(), GroupId = grp2.Id, StudentId = s8.Id, JoinedAt = now.AddMonths(-2) },
            new() { Id = Guid.NewGuid(), GroupId = grp2.Id, StudentId = s11.Id, JoinedAt = now.AddMonths(-1) },
            // React Bootcamp
            new() { Id = Guid.NewGuid(), GroupId = grp3.Id, StudentId = s2.Id, JoinedAt = now.AddMonths(-4) },
            new() { Id = Guid.NewGuid(), GroupId = grp3.Id, StudentId = s4.Id, JoinedAt = now.AddMonths(-4) },
            new() { Id = Guid.NewGuid(), GroupId = grp3.Id, StudentId = s9.Id, JoinedAt = now.AddMonths(-3) },
            // Python Backend
            new() { Id = Guid.NewGuid(), GroupId = grp4.Id, StudentId = s6.Id, JoinedAt = now.AddMonths(-3) },
            new() { Id = Guid.NewGuid(), GroupId = grp4.Id, StudentId = s8.Id, JoinedAt = now.AddMonths(-2) },
            new() { Id = Guid.NewGuid(), GroupId = grp4.Id, StudentId = s12.Id, JoinedAt = now.AddMonths(-2) },
            // Math
            new() { Id = Guid.NewGuid(), GroupId = grp5.Id, StudentId = s3.Id, JoinedAt = now.AddMonths(-4) },
            new() { Id = Guid.NewGuid(), GroupId = grp5.Id, StudentId = s7.Id, JoinedAt = now.AddMonths(-2) },
            // Rus tili
            new() { Id = Guid.NewGuid(), GroupId = grp6.Id, StudentId = s5.Id, JoinedAt = now.AddMonths(-2) },
            new() { Id = Guid.NewGuid(), GroupId = grp6.Id, StudentId = s11.Id, JoinedAt = now.AddMonths(-1) },
        };
        await context.GroupStudents.AddRangeAsync(gsList);

        await context.SaveChangesAsync();

        // 10. Lessons, Attendances and Grades
        var allGroups = new[] { grp1, grp2, grp3, grp4, grp5, grp6 };
        var lessons = new List<Lesson>();
        var attendances = new List<Attendance>();
        var grades = new List<Grade>();

        var topicsByGroup = new Dictionary<Guid, string[]>
        {
            [grp1.Id] = new[] { "Academic Writing Task 1 Overview", "Listening Section 3 & 4 Strategies", "Speaking Part 2 Cue Cards Practice", "Reading True/False/Not Given Mastery", "Writing Task 2 Essay Organization", "Full Mock Test Review & Feedback", "Advanced Vocabulary for Band 8", "Pronunciation & Fluency Coaching" },
            [grp2.Id] = new[] { "Present Perfect vs Past Simple", "Travel and Vacation Vocabulary", "Conditionals Type 1 and 2", "Listening & Daily Conversation", "Writing Informal Emails", "Modal Verbs of Obligation", "Reading Short Stories & Comprehension", "Speaking Club: Favorite Cities" },
            [grp3.Id] = new[] { "JavaScript ES6+ & TypeScript Fundamentals", "React Components, Props & State", "TailwindCSS 4 Responsive Layouts", "Custom Hooks & useEffect Lifecycle", "Zustand & React Query State Management", "Building REST API Clients with Axios", "Next.js App Router Architecture", "Full-Stack Project Deployment" },
            [grp4.Id] = new[] { "Python OOP: Classes, Inheritance & Polymorphism", "PostgreSQL Database Design & Indexes", "FastAPI Framework & Pydantic Validation", "Docker Containers & Microservices", "Celery & Redis Background Tasks", "JWT Authentication & Security Best Practices", "Unit Testing with PyTest", "System Design & Caching" },
            [grp5.Id] = new[] { "Kasrlar va foizlar hisob-kitobi", "Matematik mantiqiy masalalar", "Geometrik shakllar va yuzalar", "Tenglamalar va masalalar yechish", "Mantiqiy ketma-ketliklar va testlar", "Tezkor hisoblash texnikalari", "Olimpiada masalalari tahlili", "Yakuniy nazorat testi" },
            [grp6.Id] = new[] { "Знакомство и деловой этикет", "Глаголы движения в русском языке", "Разговорная практика: В банке и аэропорту", "Падежи и предлоги в реальной речи", "Деловая переписка и резюме", "Аудирование: Интервью и новости", "Обсуждение современных профессий", "Итоговая беседа и тестирование" }
        };

        foreach (var grp in allGroups)
        {
            var grpStudents = gsList.Where(gs => gs.GroupId == grp.Id).Select(gs => gs.StudentId).ToList();
            var topics = topicsByGroup[grp.Id];

            // 6 completed past lessons
            for (int i = 0; i < 6; i++)
            {
                var lessonDate = now.Date.AddDays(-((6 - i) * 3));
                var startHour = grp.Name.Contains("Kunduzgi") || grp.Name.Contains("Tayyorlov") ? 10 : 18;
                var lStartTime = lessonDate.AddHours(startHour);
                var lEndTime = lStartTime.AddHours(2);

                var lesson = new Lesson
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    GroupId = grp.Id,
                    TeacherId = grp.TeacherId,
                    RoomId = grp.RoomId,
                    StartTime = lStartTime,
                    EndTime = lEndTime,
                    Topic = topics[i % topics.Length],
                    Status = LessonStatus.Completed,
                    CreatedAt = lessonDate
                };
                lessons.Add(lesson);

                // Attendances and Grades
                foreach (var studentId in grpStudents)
                {
                    var attStatus = AttendanceStatus.Present;
                    string? attComment = null;
                    decimal score = 88m;

                    // Bobur Mirzayev (s3.Id) -> High Risk
                    if (studentId == s3.Id)
                    {
                        if (i >= 3)
                        {
                            attStatus = AttendanceStatus.Absent;
                            attComment = "Sababsiz qatnashmadi";
                            score = 45m;
                        }
                        else
                        {
                            attStatus = AttendanceStatus.Late;
                            score = 55m;
                        }
                    }
                    // Behruz Jalolov (s10.Id) -> High Risk
                    else if (studentId == s10.Id)
                    {
                        if (i >= 4)
                        {
                            attStatus = AttendanceStatus.Absent;
                            attComment = "Aloqa o'rnatilmadi";
                            score = 60m;
                        }
                        else
                        {
                            attStatus = AttendanceStatus.Present;
                            score = 65m;
                        }
                    }
                    // Nilufar Saidova (s5.Id) -> Medium Risk
                    else if (studentId == s5.Id)
                    {
                        if (i == 4)
                        {
                            attStatus = AttendanceStatus.Absent;
                            attComment = "Kasal bo'lganligi sababli";
                        }
                        else if (i == 5)
                        {
                            attStatus = AttendanceStatus.Late;
                        }
                        score = 75m;
                    }
                    else
                    {
                        if (i == 2 && (studentId == s2.Id || studentId == s8.Id))
                        {
                            attStatus = AttendanceStatus.Late;
                            attComment = "10 daqiqa kechikdi";
                        }
                        score = 85m + ((i + (studentId.GetHashCode() % 10)) % 15);
                    }

                    attendances.Add(new Attendance
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        LessonId = lesson.Id,
                        StudentId = studentId,
                        Status = attStatus,
                        Comment = attComment,
                        CreatedAt = lStartTime
                    });

                    grades.Add(new Grade
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        LessonId = lesson.Id,
                        StudentId = studentId,
                        Score = score,
                        Comment = score >= 85 ? "Faol ishtirok etdi" : score >= 70 ? "Yaxshi" : "Qo'shimcha tayyorgarlik talab etiladi",
                        CreatedAt = lStartTime
                    });
                }
            }

            // 4 scheduled upcoming lessons
            for (int i = 0; i < 4; i++)
            {
                var lessonDate = now.Date.AddDays((i + 1) * 3);
                var startHour = grp.Name.Contains("Kunduzgi") || grp.Name.Contains("Tayyorlov") ? 10 : 18;
                var lStartTime = lessonDate.AddHours(startHour);
                var lEndTime = lStartTime.AddHours(2);

                lessons.Add(new Lesson
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    GroupId = grp.Id,
                    TeacherId = grp.TeacherId,
                    RoomId = grp.RoomId,
                    StartTime = lStartTime,
                    EndTime = lEndTime,
                    Topic = topics[(i + 6) % topics.Length],
                    Status = LessonStatus.Scheduled,
                    CreatedAt = now
                });
            }
        }

        await context.Lessons.AddRangeAsync(lessons);
        await context.Attendances.AddRangeAsync(attendances);
        await context.Grades.AddRangeAsync(grades);

        // 11. Payments, Invoices and Transactions
        var payments = new List<Payment>();
        var invoices = new List<Invoice>();
        var transactions = new List<PaymentTransaction>();

        void AddPayment(Student st, Group grp, PaymentStatus status, decimal amount, DateTime dueDate, DateTime? paidDate, PaymentMethod method, string invNum, bool isOverdue)
        {
            var pay = new Payment
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                StudentId = st.Id,
                GroupId = grp.Id,
                TeacherId = grp.TeacherId,
                Amount = amount,
                BasePrice = amount,
                FinalAmount = amount,
                PaidAmount = status == PaymentStatus.Paid ? amount : 0m,
                DebtAmount = status == PaymentStatus.Paid ? 0m : amount,
                TeacherSharePercent = 25m,
                TeacherShareAmount = status == PaymentStatus.Paid ? Math.Round(amount * 0.25m, 2) : 0m,
                CenterShareAmount = status == PaymentStatus.Paid ? Math.Round(amount * 0.75m, 2) : 0m,
                Status = status,
                DueDate = dueDate,
                PaymentDate = paidDate,
                Description = $"{grp.Name} kursi uchun oylik to'lov ({dueDate:yyyy-MM})",
                CreatedAt = dueDate.AddDays(-15)
            };
            payments.Add(pay);

            invoices.Add(new Invoice
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                InvoiceNumber = invNum,
                StudentId = st.Id,
                ParentId = st.ParentId,
                GroupId = grp.Id,
                PaymentId = pay.Id,
                BillingPeriod = $"{dueDate:yyyy-MM}",
                Amount = amount,
                IssueDate = dueDate.AddDays(-15),
                DueDate = dueDate,
                PaidDate = paidDate,
                Status = status == PaymentStatus.Paid ? InvoiceStatus.Paid : isOverdue ? InvoiceStatus.Overdue : InvoiceStatus.Issued,
                CreatedAt = dueDate.AddDays(-15)
            });

            if (status == PaymentStatus.Paid && paidDate.HasValue)
            {
                transactions.Add(new PaymentTransaction
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    PaymentId = pay.Id,
                    Amount = amount,
                    PaymentDate = paidDate.Value,
                    Method = method,
                    Notes = $"{method} to'lov tizimi orqali to'landi. Tranzaksiya raqami: #TRX-{invNum}",
                    CreatedAt = paidDate.Value
                });
            }
        }

        AddPayment(s1, grp1, PaymentStatus.Paid, 650000m, now.AddDays(-5), now.AddDays(-10), PaymentMethod.Click, "INV-2026-001", false);
        AddPayment(s2, grp3, PaymentStatus.Paid, 800000m, now.AddDays(-5), now.AddDays(-12), PaymentMethod.Payme, "INV-2026-002", false);
        AddPayment(s4, grp1, PaymentStatus.Paid, 650000m, now.AddDays(-5), now.AddDays(-8), PaymentMethod.Uzum, "INV-2026-003", false);
        AddPayment(s6, grp4, PaymentStatus.Paid, 750000m, now.AddDays(-5), now.AddDays(-6), PaymentMethod.Cash, "INV-2026-004", false);
        AddPayment(s7, grp5, PaymentStatus.Paid, 400000m, now.AddDays(-5), now.AddDays(-7), PaymentMethod.Payme, "INV-2026-005", false);
        AddPayment(s9, grp3, PaymentStatus.Paid, 800000m, now.AddDays(-5), now.AddDays(-9), PaymentMethod.Click, "INV-2026-006", false);
        AddPayment(s11, grp2, PaymentStatus.Paid, 450000m, now.AddDays(-5), now.AddDays(-11), PaymentMethod.Cash, "INV-2026-007", false);

        // Pending Payments
        AddPayment(s5, grp2, PaymentStatus.Pending, 450000m, now.AddDays(5), null, PaymentMethod.Click, "INV-2026-008", false);
        AddPayment(s8, grp4, PaymentStatus.Pending, 750000m, now.AddDays(3), null, PaymentMethod.Payme, "INV-2026-009", false);

        // Overdue Payments (Risk triggers!)
        AddPayment(s3, grp5, PaymentStatus.Overdue, 400000m, now.AddDays(-14), null, PaymentMethod.Cash, "INV-2026-010", true);
        AddPayment(s10, grp1, PaymentStatus.Overdue, 650000m, now.AddDays(-7), null, PaymentMethod.Click, "INV-2026-011", true);

        await context.Payments.AddRangeAsync(payments);
        await context.Invoices.AddRangeAsync(invoices);
        await context.PaymentTransactions.AddRangeAsync(transactions);

        // 12. Center Expenses
        var expenses = new List<CenterExpense>
        {
            new() { Id = Guid.NewGuid(), OrganizationId = orgId, Category = "Bino ijarasi", Amount = 12000000m, ExpenseDate = new DateTime(now.Year, now.Month, 1), Description = "O'quv markazi binosi uchun oylik ijara to'lovi (Yunusobod 4-mavze)" },
            new() { Id = Guid.NewGuid(), OrganizationId = orgId, Category = "Kommunal va Internet", Amount = 650000m, ExpenseDate = now.AddDays(-18), Description = "Optik tolali yuqori tezlikdagi 500 Mbps internet xizmati to'lovi" },
            new() { Id = Guid.NewGuid(), OrganizationId = orgId, Category = "Marketing & Reklama", Amount = 3800000m, ExpenseDate = now.AddDays(-14), Description = "Instagram & Telegram target reklama kampaniyasi (Bahorgi qabul)" },
            new() { Id = Guid.NewGuid(), OrganizationId = orgId, Category = "Kanselyariya va jihozlar", Amount = 1450000m, ExpenseDate = now.AddDays(-10), Description = "O'quv qo'llanmalar, markerlar, partalar va smart doska aksessuarlari" },
            new() { Id = Guid.NewGuid(), OrganizationId = orgId, Category = "Xo'jalik xarajatlari", Amount = 480000m, ExpenseDate = now.AddDays(-5), Description = "O'quvchilar va ustozlar uchun qahva, choy va tozalash vositalari" },
        };
        await context.CenterExpenses.AddRangeAsync(expenses);

        // 13. CRM Leads & Trial Lessons
        var lead1 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Javohir Toshmatov", PhoneNumber = "+998901230011", Email = "javohir@gmail.com", InterestedSubjectId = subjIelts.Id, Source = LeadSource.Instagram, Status = LeadStatus.New, Notes = "Instagram reklama orqali murojaat qildi, kechki guruh qiziqtirmoqda", CreatedAt = now.AddDays(-1) };
        var lead2 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Shaxnoza Aliyeva", PhoneNumber = "+998934560022", Email = "shaxnoza@gmail.com", InterestedSubjectId = subjReact.Id, Source = LeadSource.Telegram, Status = LeadStatus.Trial, Notes = "Sinov darsiga yozildi, noutbuki bor", CreatedAt = now.AddDays(-3) };
        var lead3 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Kamron Usmonov", PhoneNumber = "+998977890033", Email = "kamron@mail.ru", InterestedSubjectId = subjEng.Id, Source = LeadSource.Referral, Status = LeadStatus.Contacted, Notes = "Do'sti Alisher tavsiyasi bilan kelgan, sinov darsi so'radi", CreatedAt = now.AddDays(-5) };
        var lead4 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Lola Karimova", PhoneNumber = "+998991112233", InterestedSubjectId = subjPy.Id, Source = LeadSource.Website, Status = LeadStatus.Enrolled, Notes = "Python guruhiga muvaffaqiyatli qabul qilindi", CreatedAt = now.AddDays(-10) };
        var lead5 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId, FullName = "Farrux Zokirov", PhoneNumber = "+998907774411", InterestedSubjectId = subjMath.Id, Source = LeadSource.WalkIn, Status = LeadStatus.Interested, Notes = "Ota-onasi bilan keldi, Prezident maktabiga tayyorlov qiziqtirmoqda", CreatedAt = now.AddDays(-7) };

        await context.Leads.AddRangeAsync(lead1, lead2, lead3, lead4, lead5);

        var trial1 = new TrialLesson { Id = Guid.NewGuid(), OrganizationId = orgId, LeadId = lead2.Id, SubjectId = subjReact.Id, TeacherId = t2.Id, RoomId = room1.Id, ScheduledDate = now.Date.AddDays(2), StartTime = new TimeSpan(18, 30, 0), EndTime = new TimeSpan(20, 0, 0), Status = TrialLessonStatus.Scheduled, Notes = "Frontend React bo'yicha bepul kirish sinov darsi", CreatedAt = now.AddDays(-1) };
        var trial2 = new TrialLesson { Id = Guid.NewGuid(), OrganizationId = orgId, LeadId = lead5.Id, SubjectId = subjMath.Id, TeacherId = t3.Id, RoomId = room3.Id, ScheduledDate = now.Date.AddDays(1), StartTime = new TimeSpan(15, 0, 0), EndTime = new TimeSpan(16, 30, 0), Status = TrialLessonStatus.Scheduled, Notes = "Matematika bo'yicha diagnostik test darsi", CreatedAt = now.AddDays(-2) };
        await context.TrialLessons.AddRangeAsync(trial1, trial2);

        // 14. Homeworks & Submissions
        var hw1 = new Homework { Id = Guid.NewGuid(), OrganizationId = orgId, GroupId = grp1.Id, TeacherId = t1.Id, Title = "IELTS Writing Task 2: Opinion Essay", Description = "Technological impact on modern education mavzusida 250+ so'zli insho yozing va rejasini tuzing.", DueDate = now.AddDays(3), MaxScore = 100m, CreatedAt = now.AddDays(-2) };
        var hw2 = new Homework { Id = Guid.NewGuid(), OrganizationId = orgId, GroupId = grp3.Id, TeacherId = t2.Id, Title = "React Custom Hooks & LocalStorage", Description = "useLocalStorage va useDebounce hooklarini yarating hamda qidiruv inputida qo'llang.", DueDate = now.AddDays(2), MaxScore = 100m, CreatedAt = now.AddDays(-3) };
        var hw3 = new Homework { Id = Guid.NewGuid(), OrganizationId = orgId, GroupId = grp4.Id, TeacherId = t4.Id, Title = "FastAPI CRUD & SQLite integratsiyasi", Description = "Pydantic modellari bilan to'liq CRUD endpointlarini yozing va Swaggerda test qiling.", DueDate = now.AddDays(4), MaxScore = 100m, CreatedAt = now.AddDays(-1) };
        await context.Homeworks.AddRangeAsync(hw1, hw2, hw3);

        var sub1 = new HomeworkSubmission { Id = Guid.NewGuid(), OrganizationId = orgId, HomeworkId = hw1.Id, StudentId = s1.Id, SubmittedAt = now.AddDays(-1), Content = "Insho tayyorlandi: Kirish, 2 ta asosiy xatboshi va xulosa to'liq yoritildi.", Feedback = "Ajoyib leksik boylik va kohesiya. Band 7.5 darajasida.", Score = 90m, Status = HomeworkStatus.Reviewed, ReviewedAt = now };
        var sub2 = new HomeworkSubmission { Id = Guid.NewGuid(), OrganizationId = orgId, HomeworkId = hw2.Id, StudentId = s2.Id, SubmittedAt = now.AddDays(-1), Content = "GitHub repository havolasi va demo test kodlari ilova qilindi.", Feedback = "Kod toza yozilgan, TypeScript typelari aniq belgilangan.", Score = 95m, Status = HomeworkStatus.Reviewed, ReviewedAt = now };
        var sub3 = new HomeworkSubmission { Id = Guid.NewGuid(), OrganizationId = orgId, HomeworkId = hw3.Id, StudentId = s6.Id, SubmittedAt = now.AddHours(-10), Content = "Barcha endpointlar va pytest test case'lari yozildi.", Feedback = "Ajoyib natija!", Score = 92m, Status = HomeworkStatus.Reviewed, ReviewedAt = now };
        await context.HomeworkSubmissions.AddRangeAsync(sub1, sub2, sub3);

        // 15. Teacher Payrolls
        var pr1 = new TeacherPayroll { Id = Guid.NewGuid(), OrganizationId = orgId, TeacherId = t1.Id, Year = 2026, Month = 2, CalculationType = PayrollType.Percentage, LessonsTaught = 24, StudentsCount = 22, TotalRevenue = 12500000m, SharePercentage = 25m, CalculatedSalary = 3125000m, PaidAmount = 3125000m, RemainingAmount = 0m, PaidDate = now.AddDays(-15), Notes = "Fevral oyi maoshi to'liq to'landi" };
        var pr2 = new TeacherPayroll { Id = Guid.NewGuid(), OrganizationId = orgId, TeacherId = t2.Id, Year = 2026, Month = 2, CalculationType = PayrollType.Percentage, LessonsTaught = 24, StudentsCount = 16, TotalRevenue = 12800000m, SharePercentage = 30m, CalculatedSalary = 3840000m, PaidAmount = 3840000m, RemainingAmount = 0m, PaidDate = now.AddDays(-15), Notes = "Fevral oyi maoshi to'liq to'landi" };
        var pr3 = new TeacherPayroll { Id = Guid.NewGuid(), OrganizationId = orgId, TeacherId = t3.Id, Year = 2026, Month = 2, CalculationType = PayrollType.Percentage, LessonsTaught = 24, StudentsCount = 18, TotalRevenue = 7800000m, SharePercentage = 25m, CalculatedSalary = 1950000m, PaidAmount = 1950000m, RemainingAmount = 0m, PaidDate = now.AddDays(-15), Notes = "Fevral oyi maoshi to'liq to'landi" };
        var pr4 = new TeacherPayroll { Id = Guid.NewGuid(), OrganizationId = orgId, TeacherId = t4.Id, Year = 2026, Month = 2, CalculationType = PayrollType.Percentage, LessonsTaught = 24, StudentsCount = 14, TotalRevenue = 10500000m, SharePercentage = 25m, CalculatedSalary = 2625000m, PaidAmount = 2625000m, RemainingAmount = 0m, PaidDate = now.AddDays(-15), Notes = "Fevral oyi maoshi to'liq to'landi" };
        await context.TeacherPayrolls.AddRangeAsync(pr1, pr2, pr3, pr4);

        // 16. Certificates
        var cert1 = new Certificate { Id = Guid.NewGuid(), OrganizationId = orgId, CertificateNumber = "EDU-2026-CERT-0101", VerificationCode = "VREF-98124", StudentId = s4.Id, SubjectId = subjReact.Id, GroupId = grp3.Id, CourseName = "Frontend Web Dasturlash (React & TS)", LevelName = "Professional (A+)", IssueDate = now.AddMonths(-1), FinalGrade = 95m, QrCodeData = "https://eduflow.uz/verify/EDU-2026-CERT-0101" };
        var cert2 = new Certificate { Id = Guid.NewGuid(), OrganizationId = orgId, CertificateNumber = "EDU-2026-CERT-0102", VerificationCode = "VREF-43912", StudentId = s2.Id, SubjectId = subjIelts.Id, GroupId = grp1.Id, CourseName = "IELTS Intensive", LevelName = "Band 7.5", IssueDate = now.AddMonths(-1), FinalGrade = 88m, QrCodeData = "https://eduflow.uz/verify/EDU-2026-CERT-0102" };
        await context.Certificates.AddRangeAsync(cert1, cert2);

        // 17. Feedbacks
        var fb1 = new Feedback { Id = Guid.NewGuid(), OrganizationId = orgId, StudentId = s1.Id, SubjectId = subjIelts.Id, TeacherId = t1.Id, Category = "Teacher", Rating = 5, Comment = "Rustam ustozning dars o'tish metodikasi a'lo darajada. Har bir mavzuni amaliyot bilan mustahkamlaymiz.", CreatedAt = now.AddDays(-12) };
        var fb2 = new Feedback { Id = Guid.NewGuid(), OrganizationId = orgId, ParentId = p1.Id, Category = "Center", Rating = 5, Comment = "Markazda barcha sharoitlar yaratilgan. Farzandimning davomati va to'lovlarini shaxsiy kabinetda ko'rish juda qulay.", CreatedAt = now.AddDays(-8) };
        var fb3 = new Feedback { Id = Guid.NewGuid(), OrganizationId = orgId, StudentId = s2.Id, SubjectId = subjReact.Id, TeacherId = t2.Id, Category = "Course", Rating = 5, Comment = "React Bootcamp kursi juda qiziqarli va zamonaviy kutubxonalar bilan o'rgatilmoqda. IT Lab xonasi qulay.", CreatedAt = now.AddDays(-5) };
        await context.Feedbacks.AddRangeAsync(fb1, fb2, fb3);

        // 18. Referral Code
        var refCode = new ReferralCode { Id = Guid.NewGuid(), OrganizationId = orgId, StudentId = s1.Id, Code = "ALISHER2026", RewardPercentage = 10m, IsActive = true };
        await context.ReferralCodes.AddAsync(refCode);

        await context.SaveChangesAsync();
        logger.LogInformation("SYSTEM_DEMO_SEED_V2: To'liq demo ma'lumotlar (12 talaba, 4 ustoz, 6 guruh, darslar, davomat, to'lovlar, lidlar va maoshlar) muvaffaqiyatli saqlandi!");
    }
}
