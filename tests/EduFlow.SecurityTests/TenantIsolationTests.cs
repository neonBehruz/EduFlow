using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.DTOs;
using EduFlow.Application.Services;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Xunit;

namespace EduFlow.SecurityTests;

public class TenantIsolationTests
{
    [Fact]
    public async Task CenterAdmin_CannotAccessStudent_FromAnotherCenter()
    {
        // Arrange
        var centerA_Id = Guid.NewGuid();
        var centerB_Id = Guid.NewGuid();

        var currentUser = new TestCurrentUserService
        {
            OrganizationId = centerA_Id,
            Role = UserRole.CenterAdmin
        };

        var (context, mapper) = TestDbContextFactory.CreateContext(currentUser);
        var auditLog = new TestAuditLogService();
        var subService = new TestSubscriptionService();

        var studentInB = new Student
        {
            Id = Guid.NewGuid(),
            OrganizationId = centerB_Id,
            FirstName = "Ali",
            LastName = "Valiyev",
            PhoneNumber = "+998901234567"
        };
        context.Students.Add(studentInB);
        await context.SaveChangesAsync();

        var studentService = new StudentService(context, currentUser, subService, auditLog, mapper);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(async () =>
        {
            await studentService.GetStudentByIdAsync(studentInB.Id);
        });
    }

    [Fact]
    public async Task CenterAdmin_CannotAddCrossTenantStudent_ToOwnGroup()
    {
        // Arrange
        var centerA_Id = Guid.NewGuid();
        var centerB_Id = Guid.NewGuid();

        var currentUser = new TestCurrentUserService
        {
            OrganizationId = centerA_Id,
            Role = UserRole.CenterAdmin
        };

        var (context, mapper) = TestDbContextFactory.CreateContext(currentUser);
        var subService = new TestSubscriptionService();

        var groupInA = new Group
        {
            Id = Guid.NewGuid(),
            OrganizationId = centerA_Id,
            Name = "Math 101",
            MonthlyFee = 500_000,
            MaxStudents = 15
        };
        var studentInB = new Student
        {
            Id = Guid.NewGuid(),
            OrganizationId = centerB_Id,
            FirstName = "Bobur",
            LastName = "Karimov",
            PhoneNumber = "+998907654321"
        };

        context.Groups.Add(groupInA);
        context.Students.Add(studentInB);
        await context.SaveChangesAsync();

        var groupService = new GroupService(context, currentUser, subService, mapper);

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(async () =>
        {
            await groupService.AddStudentToGroupAsync(groupInA.Id, studentInB.Id);
        });
    }

    [Fact]
    public async Task CenterAdmin_CannotMarkAttendance_ForStudentInAnotherCenter()
    {
        // Arrange
        var centerA_Id = Guid.NewGuid();
        var centerB_Id = Guid.NewGuid();

        var currentUser = new TestCurrentUserService
        {
            OrganizationId = centerA_Id,
            Role = UserRole.CenterAdmin
        };

        var (context, mapper) = TestDbContextFactory.CreateContext(currentUser);
        var auditLog = new TestAuditLogService();
        var telegram = new TestTelegramService();
        var notification = new TestNotificationService();

        var groupInA = new Group
        {
            Id = Guid.NewGuid(),
            OrganizationId = centerA_Id,
            Name = "Physics 1",
            MonthlyFee = 300_000,
            MaxStudents = 10
        };
        var lessonInA = new Lesson
        {
            Id = Guid.NewGuid(),
            OrganizationId = centerA_Id,
            GroupId = groupInA.Id,
            Topic = "Newton Laws",
            StartTime = DateTime.UtcNow,
            EndTime = DateTime.UtcNow.AddHours(1.5)
        };
        var studentInB = new Student
        {
            Id = Guid.NewGuid(),
            OrganizationId = centerB_Id,
            FirstName = "StudentB",
            LastName = "Test",
            PhoneNumber = "+998911111111"
        };

        context.Groups.Add(groupInA);
        context.Lessons.Add(lessonInA);
        context.Students.Add(studentInB);
        await context.SaveChangesAsync();

        var attendanceService = new AttendanceService(context, currentUser, auditLog, telegram, notification, mapper);

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(async () =>
        {
            await attendanceService.MarkAttendanceAsync(new CreateAttendanceDto(
                lessonInA.Id,
                studentInB.Id,
                AttendanceStatus.Present,
                "Attended"
            ));
        });
    }

    [Fact]
    public async Task CenterAdmin_CannotModifyPayment_BelongingToAnotherCenter()
    {
        // Arrange
        var centerA_Id = Guid.NewGuid();
        var centerB_Id = Guid.NewGuid();

        var currentUser = new TestCurrentUserService
        {
            OrganizationId = centerA_Id,
            Role = UserRole.CenterAdmin
        };

        var (context, mapper) = TestDbContextFactory.CreateContext(currentUser);
        var auditLog = new TestAuditLogService();

        var studentInB = new Student
        {
            Id = Guid.NewGuid(),
            OrganizationId = centerB_Id,
            FirstName = "Olim",
            LastName = "Olimov",
            PhoneNumber = "+998933333333"
        };
        var paymentInB = new Payment
        {
            Id = Guid.NewGuid(),
            OrganizationId = centerB_Id,
            StudentId = studentInB.Id,
            Amount = 400_000,
            PaidAmount = 0,
            DueDate = DateTime.UtcNow.AddDays(5),
            Status = PaymentStatus.Pending
        };

        context.Students.Add(studentInB);
        context.Payments.Add(paymentInB);
        await context.SaveChangesAsync();

        var paymentService = new PaymentService(context, mapper, currentUser, auditLog);

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(async () =>
        {
            await paymentService.MarkAsPaidAsync(paymentInB.Id);
        });
    }
}
