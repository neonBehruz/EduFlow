using System.Linq.Expressions;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Common;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Infrastructure.Persistence;

public class EduFlowDbContext : DbContext, IApplicationDbContext
{
    private readonly ITenantService _tenantService;
    private readonly ICurrentUserService _currentUserService;

    public EduFlowDbContext(
        DbContextOptions<EduFlowDbContext> options,
        ITenantService tenantService,
        ICurrentUserService currentUserService) : base(options)
    {
        _tenantService = tenantService;
        _currentUserService = currentUserService;
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Parent> Parents => Set<Parent>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupStudent> GroupStudents => Set<GroupStudent>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Grade> Grades => Set<Grade>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<TelegramAccount> TelegramAccounts => Set<TelegramAccount>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<FinanceSetting> FinanceSettings => Set<FinanceSetting>();
    public DbSet<StudentDiscount> StudentDiscounts => Set<StudentDiscount>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<CenterExpense> CenterExpenses => Set<CenterExpense>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Homework> Homeworks => Set<Homework>();
    public DbSet<HomeworkSubmission> HomeworkSubmissions => Set<HomeworkSubmission>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<TrialLesson> TrialLessons => Set<TrialLesson>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<TeacherPayroll> TeacherPayrolls => Set<TeacherPayroll>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<ReferralCode> ReferralCodes => Set<ReferralCode>();
    public DbSet<Referral> Referrals => Set<Referral>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global Multi-Tenancy Filter
        var filterMethod = typeof(EduFlowDbContext).GetMethod(nameof(ConfigureTenantFilter), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        foreach (var entityType in modelBuilder.Model.GetEntityTypes().ToList())
        {
            if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                filterMethod!.MakeGenericMethod(entityType.ClrType).Invoke(this, new object[] { modelBuilder });
            }
        }

        // Entity Configurations
        modelBuilder.Entity<Organization>(b =>
        {
            b.HasKey(o => o.Id);
            b.Property(o => o.Name).HasMaxLength(150).IsRequired();
            b.Property(o => o.Email).HasMaxLength(150).IsRequired();
            b.Property(o => o.Phone).HasMaxLength(50).IsRequired();
            b.HasIndex(o => o.Email);
        });

        modelBuilder.Entity<User>(b =>
        {
            b.HasKey(u => u.Id);
            b.Property(u => u.Email).HasMaxLength(150).IsRequired();
            b.HasIndex(u => u.Email).IsUnique();
            b.HasOne(u => u.Organization)
                .WithMany(o => o.Users)
                .HasForeignKey(u => u.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Teacher>(b =>
        {
            b.HasKey(t => t.Id);
            b.HasOne(t => t.Organization)
                .WithMany(o => o.Teachers)
                .HasForeignKey(t => t.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(t => t.User)
                .WithOne(u => u.Teacher)
                .HasForeignKey<Teacher>(t => t.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Parent>(b =>
        {
            b.HasKey(p => p.Id);
            b.Property(p => p.FullName).HasMaxLength(150).IsRequired();
            b.Property(p => p.PhoneNumber).HasMaxLength(50).IsRequired();
            b.HasOne(p => p.User)
                .WithOne(u => u.Parent)
                .HasForeignKey<Parent>(p => p.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Student>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.FirstName).HasMaxLength(100).IsRequired();
            b.Property(s => s.LastName).HasMaxLength(100).IsRequired();
            b.HasOne(s => s.User)
                .WithOne(u => u.Student)
                .HasForeignKey<Student>(s => s.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(s => s.Organization)
                .WithMany(o => o.Students)
                .HasForeignKey(s => s.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(s => s.Parent)
                .WithMany(p => p.Students)
                .HasForeignKey(s => s.ParentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Subject>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.Name).HasMaxLength(100).IsRequired();
            b.HasOne(s => s.Organization)
                .WithMany(o => o.Subjects)
                .HasForeignKey(s => s.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Group>(b =>
        {
            b.HasKey(g => g.Id);
            b.Property(g => g.Name).HasMaxLength(150).IsRequired();
            b.HasOne(g => g.Organization)
                .WithMany(o => o.Groups)
                .HasForeignKey(g => g.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(g => g.Teacher)
                .WithMany(t => t.Groups)
                .HasForeignKey(g => g.TeacherId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(g => g.Subject)
                .WithMany(s => s.Groups)
                .HasForeignKey(g => g.SubjectId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<GroupStudent>(b =>
        {
            b.HasKey(gs => gs.Id);
            b.HasIndex(gs => new { gs.GroupId, gs.StudentId }).IsUnique();

            b.HasOne(gs => gs.Group)
                .WithMany(g => g.GroupStudents)
                .HasForeignKey(gs => gs.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(gs => gs.Student)
                .WithMany(s => s.GroupStudents)
                .HasForeignKey(gs => gs.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Lesson>(b =>
        {
            b.HasKey(l => l.Id);
            b.HasOne(l => l.Group)
                .WithMany(g => g.Lessons)
                .HasForeignKey(l => l.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Attendance>(b =>
        {
            b.HasKey(a => a.Id);
            b.HasIndex(a => new { a.LessonId, a.StudentId }).IsUnique();

            b.HasOne(a => a.Lesson)
                .WithMany(l => l.Attendances)
                .HasForeignKey(a => a.LessonId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(a => a.Student)
                .WithMany(s => s.Attendances)
                .HasForeignKey(a => a.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Grade>(b =>
        {
            b.HasKey(g => g.Id);
            b.HasIndex(g => new { g.LessonId, g.StudentId }).IsUnique();

            b.HasOne(g => g.Lesson)
                .WithMany(l => l.Grades)
                .HasForeignKey(g => g.LessonId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(g => g.Student)
                .WithMany(s => s.Grades)
                .HasForeignKey(g => g.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Payment>(b =>
        {
            b.HasKey(p => p.Id);
            b.HasOne(p => p.Student)
                .WithMany(s => s.Payments)
                .HasForeignKey(p => p.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(p => p.Group)
                .WithMany()
                .HasForeignKey(p => p.GroupId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(p => p.Teacher)
                .WithMany()
                .HasForeignKey(p => p.TeacherId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(p => p.Organization)
                .WithMany()
                .HasForeignKey(p => p.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PaymentTransaction>(b =>
        {
            b.HasKey(pt => pt.Id);
            b.HasIndex(pt => new { pt.OrganizationId, pt.IdempotencyKey });
            b.HasOne(pt => pt.Payment)
                .WithMany(p => p.Transactions)
                .HasForeignKey(pt => pt.PaymentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditLog>(b =>
        {
            b.HasKey(a => a.Id);
            b.Property(a => a.Action).HasMaxLength(100).IsRequired();
            b.Property(a => a.Resource).HasMaxLength(100).IsRequired();
            b.HasIndex(a => a.OrganizationId);
            b.HasIndex(a => a.CreatedAt);
        });

        modelBuilder.Entity<FinanceSetting>(b =>
        {
            b.HasKey(fs => fs.Id);
            b.HasIndex(fs => fs.OrganizationId).IsUnique();
            b.HasOne(fs => fs.Organization)
                .WithMany()
                .HasForeignKey(fs => fs.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StudentDiscount>(b =>
        {
            b.HasKey(sd => sd.Id);
            b.HasOne(sd => sd.Student)
                .WithMany()
                .HasForeignKey(sd => sd.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CenterExpense>(b =>
        {
            b.HasKey(ce => ce.Id);
            b.HasOne(ce => ce.Organization)
                .WithMany()
                .HasForeignKey(ce => ce.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TelegramAccount>(b =>
        {
            b.HasKey(t => t.Id);
            b.HasOne(t => t.Parent)
                .WithOne(p => p.TelegramAccount)
                .HasForeignKey<TelegramAccount>(t => t.ParentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Subscription>(b =>
        {
            b.HasKey(s => s.Id);
            b.HasOne(s => s.Organization)
                .WithMany(o => o.Subscriptions)
                .HasForeignKey(s => s.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(s => s.SubscriptionPlan)
                .WithMany(p => p.Subscriptions)
                .HasForeignKey(s => s.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Branch>(b =>
        {
            b.HasKey(br => br.Id);
            b.Property(br => br.Name).HasMaxLength(150).IsRequired();
            b.HasOne(br => br.Organization)
                .WithMany(o => o.Branches)
                .HasForeignKey(br => br.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Room>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.Name).HasMaxLength(100).IsRequired();
            b.HasOne(r => r.Organization)
                .WithMany(o => o.Rooms)
                .HasForeignKey(r => r.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(r => r.Branch)
                .WithMany(br => br.Rooms)
                .HasForeignKey(r => r.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Homework>(b =>
        {
            b.HasKey(h => h.Id);
            b.Property(h => h.Title).HasMaxLength(200).IsRequired();
            b.HasOne(h => h.Group)
                .WithMany(g => g.Homeworks)
                .HasForeignKey(h => h.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(h => h.Lesson)
                .WithMany(l => l.Homeworks)
                .HasForeignKey(h => h.LessonId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(h => h.Teacher)
                .WithMany()
                .HasForeignKey(h => h.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HomeworkSubmission>(b =>
        {
            b.HasKey(hs => hs.Id);
            b.HasIndex(hs => new { hs.HomeworkId, hs.StudentId }).IsUnique();
            b.HasOne(hs => hs.Homework)
                .WithMany(h => h.Submissions)
                .HasForeignKey(hs => hs.HomeworkId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(hs => hs.Student)
                .WithMany()
                .HasForeignKey(hs => hs.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Lead>(b =>
        {
            b.HasKey(l => l.Id);
            b.Property(l => l.FullName).HasMaxLength(150).IsRequired();
            b.Property(l => l.PhoneNumber).HasMaxLength(50).IsRequired();
            b.HasOne(l => l.Organization)
                .WithMany()
                .HasForeignKey(l => l.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(l => l.InterestedSubject)
                .WithMany()
                .HasForeignKey(l => l.InterestedSubjectId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(l => l.AssignedUser)
                .WithMany()
                .HasForeignKey(l => l.AssignedUserId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(l => l.ConvertedStudent)
                .WithMany()
                .HasForeignKey(l => l.ConvertedStudentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TrialLesson>(b =>
        {
            b.HasKey(tl => tl.Id);
            b.HasOne(tl => tl.Lead)
                .WithMany(l => l.TrialLessons)
                .HasForeignKey(tl => tl.LeadId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(tl => tl.Subject)
                .WithMany()
                .HasForeignKey(tl => tl.SubjectId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(tl => tl.Teacher)
                .WithMany()
                .HasForeignKey(tl => tl.TeacherId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(tl => tl.Room)
                .WithMany()
                .HasForeignKey(tl => tl.RoomId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Invoice>(b =>
        {
            b.HasKey(inv => inv.Id);
            b.Property(inv => inv.InvoiceNumber).HasMaxLength(50).IsRequired();
            b.HasIndex(inv => new { inv.OrganizationId, inv.InvoiceNumber }).IsUnique();
            b.HasOne(inv => inv.Student)
                .WithMany()
                .HasForeignKey(inv => inv.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(inv => inv.Parent)
                .WithMany()
                .HasForeignKey(inv => inv.ParentId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(inv => inv.Group)
                .WithMany()
                .HasForeignKey(inv => inv.GroupId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TeacherPayroll>(b =>
        {
            b.HasKey(tp => tp.Id);
            b.HasIndex(tp => new { tp.OrganizationId, tp.TeacherId, tp.Year, tp.Month }).IsUnique();
            b.HasOne(tp => tp.Teacher)
                .WithMany()
                .HasForeignKey(tp => tp.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Certificate>(b =>
        {
            b.HasKey(c => c.Id);
            b.Property(c => c.CertificateNumber).HasMaxLength(50).IsRequired();
            b.Property(c => c.VerificationCode).HasMaxLength(100).IsRequired();
            b.HasIndex(c => c.VerificationCode).IsUnique();
            b.HasOne(c => c.Student)
                .WithMany()
                .HasForeignKey(c => c.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Feedback>(b =>
        {
            b.HasKey(f => f.Id);
            b.HasOne(f => f.Student)
                .WithMany()
                .HasForeignKey(f => f.StudentId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(f => f.Parent)
                .WithMany()
                .HasForeignKey(f => f.ParentId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(f => f.Teacher)
                .WithMany()
                .HasForeignKey(f => f.TeacherId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ReferralCode>(b =>
        {
            b.HasKey(rc => rc.Id);
            b.HasIndex(rc => rc.Code).IsUnique();
            b.HasOne(rc => rc.Student)
                .WithMany()
                .HasForeignKey(rc => rc.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Referral>(b =>
        {
            b.HasKey(r => r.Id);
            b.HasOne(r => r.ReferralCode)
                .WithMany(rc => rc.Referrals)
                .HasForeignKey(r => r.ReferralCodeId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(r => r.ReferrerStudent)
                .WithMany()
                .HasForeignKey(r => r.ReferrerStudentId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(r => r.ReferredStudent)
                .WithMany()
                .HasForeignKey(r => r.ReferredStudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private void ConfigureTenantFilter<T>(ModelBuilder modelBuilder) where T : class, ITenantEntity
    {
        modelBuilder.Entity<T>().HasQueryFilter(e =>
            IsSuperAdmin || (CurrentTenantId != Guid.Empty && e.OrganizationId == CurrentTenantId));
    }

    public bool IsSuperAdmin => _currentUserService.Role == UserRole.SuperAdmin;
    public Guid CurrentTenantId => _tenantService.CurrentOrganizationId ?? Guid.Empty;

    public Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return Database.BeginTransactionAsync(cancellationToken);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<AuditableEntity>();
        var now = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }

        // Automatic OrganizationId assignment for newly created tenant entities
        if (CurrentTenantId != Guid.Empty)
        {
            foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
            {
                if (entry.State == EntityState.Added && entry.Entity.OrganizationId == Guid.Empty)
                {
                    entry.Entity.OrganizationId = CurrentTenantId;
                }
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
