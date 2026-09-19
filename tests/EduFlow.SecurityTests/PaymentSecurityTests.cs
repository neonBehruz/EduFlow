using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.DTOs;
using EduFlow.Application.Services;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EduFlow.SecurityTests;

public class PaymentSecurityTests
{
    [Fact]
    public async Task AddTransaction_NegativeAmount_ThrowsValidationException()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var currentUser = new TestCurrentUserService
        {
            OrganizationId = orgId,
            Role = UserRole.CenterAdmin
        };

        var (context, _) = TestDbContextFactory.CreateContext(currentUser);
        var auditLog = new TestAuditLogService();

        var financeService = new FinanceService(context, currentUser, auditLog);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await financeService.AddPaymentTransactionAsync(new CreatePaymentTransactionDto(
                Guid.NewGuid(),
                -100_000,
                PaymentMethod.Cash,
                "KEY-1",
                "Negative payment test"
            ));
        });
    }

    [Fact]
    public async Task AddTransaction_DuplicateIdempotencyKey_ReturnsExistingWithoutDuplicate()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var currentUser = new TestCurrentUserService
        {
            OrganizationId = orgId,
            Role = UserRole.CenterAdmin
        };

        var (context, _) = TestDbContextFactory.CreateContext(currentUser);
        var auditLog = new TestAuditLogService();

        var org = new Organization
        {
            Id = orgId,
            Name = "Payment Test Center",
            Phone = "+998901112233",
            IsActive = true
        };

        var student = new Student
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            FirstName = "Jasur",
            LastName = "Tursunov",
            PhoneNumber = "+998901112233"
        };
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            StudentId = student.Id,
            Amount = 500_000,
            FinalAmount = 500_000,
            PaidAmount = 0,
            DueDate = DateTime.UtcNow.AddDays(10),
            Status = PaymentStatus.Pending
        };

        context.Organizations.Add(org);
        context.Students.Add(student);
        context.Payments.Add(payment);
        await context.SaveChangesAsync();

        var financeService = new FinanceService(context, currentUser, auditLog);

        var idempotencyKey = "TX-KEY-" + Guid.NewGuid().ToString("N");
        var dto = new CreatePaymentTransactionDto(
            payment.Id,
            200_000,
            PaymentMethod.Payme,
            idempotencyKey,
            "Partial fee payment"
        );

        // Act - First request
        var result1 = await financeService.AddPaymentTransactionAsync(dto);
        // Act - Second identical request (retry/replay)
        var result2 = await financeService.AddPaymentTransactionAsync(dto);

        // Assert
        Assert.True(result1.Success);
        Assert.True(result2.Success);
        Assert.Equal(result1.Data!.Id, result2.Data!.Id);

        // Only 1 transaction should exist in database for this idempotency key
        var txList = await context.PaymentTransactions.Where(t => t.IdempotencyKey == idempotencyKey).ToListAsync();
        Assert.Single(txList);

        // PaidAmount on payment should only have been updated once (200,000, not 400,000)
        var updatedPayment = await context.Payments.FindAsync(payment.Id);
        Assert.Equal(200_000, updatedPayment!.PaidAmount);
    }

    [Fact]
    public async Task AddTransaction_CrossTenantPayment_ThrowsException()
    {
        // Arrange
        var orgA = Guid.NewGuid();
        var orgB = Guid.NewGuid();

        var currentUser = new TestCurrentUserService
        {
            OrganizationId = orgA,
            Role = UserRole.CenterAdmin
        };

        var (context, _) = TestDbContextFactory.CreateContext(currentUser);
        var auditLog = new TestAuditLogService();

        var studentB = new Student
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgB,
            FirstName = "StudentB",
            LastName = "Test",
            PhoneNumber = "+998990001122"
        };
        var paymentB = new Payment
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgB,
            StudentId = studentB.Id,
            Amount = 300_000,
            FinalAmount = 300_000,
            PaidAmount = 0,
            DueDate = DateTime.UtcNow.AddDays(5),
            Status = PaymentStatus.Pending
        };

        context.Students.Add(studentB);
        context.Payments.Add(paymentB);
        await context.SaveChangesAsync();

        var financeService = new FinanceService(context, currentUser, auditLog);

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(async () =>
        {
            await financeService.AddPaymentTransactionAsync(new CreatePaymentTransactionDto(
                paymentB.Id,
                100_000,
                PaymentMethod.Cash,
                "KEY-CROSS",
                "Cross tenant attempt"
            ));
        });
    }
}
