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
                "UPDATE Users SET Role = 1 WHERE Email = 'admin@smartedu.uz';",
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
                var defaultAdminPass = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD") ?? "EduFlow2026!";
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

                // Unified Single Admin
                var admin = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == "admin@smartedu.uz");
                if (admin == null)
                {
                    admin = new User
                    {
                        OrganizationId = mainOrg.Id,
                        FirstName = "Admin",
                        LastName = "EduFlow",
                        Email = "admin@smartedu.uz",
                        PasswordHash = adminHash,
                        PhoneNumber = "+998901234567",
                        Role = UserRole.SuperAdmin,
                        IsActive = true
                    };
                    await context.Users.AddAsync(admin);
                }
                else
                {
                    admin.FirstName = "Admin";
                    admin.LastName = "EduFlow";
                    admin.Role = UserRole.SuperAdmin;
                    admin.PasswordHash = adminHash;
                    admin.IsActive = true;
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
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Ma'lumotlar bazasini initsializatsiya qilishda xatolik yuz berdi.");
        }
    }
}
