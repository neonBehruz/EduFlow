using EduFlow.Application.DTOs;
using EduFlow.Application.Validators;
using EduFlow.Domain.Enums;
using Xunit;

namespace EduFlow.SecurityTests;

public class InputValidationTests
{
    [Fact]
    public void CreateStudentDiscount_Over100Percent_FailsValidation()
    {
        var validator = new CreateStudentDiscountDtoValidator();
        var dto = new CreateStudentDiscountDto(
            Guid.NewGuid(),
            105,
            DateTime.UtcNow,
            DateTime.UtcNow.AddMonths(1),
            "Too much discount"
        );
        var result = validator.Validate(dto);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateStudentDiscountDto.DiscountPercentage));
    }

    [Fact]
    public void CreateStudentDiscount_NegativePercent_FailsValidation()
    {
        var validator = new CreateStudentDiscountDtoValidator();
        var dto = new CreateStudentDiscountDto(
            Guid.NewGuid(),
            -10,
            DateTime.UtcNow,
            DateTime.UtcNow.AddMonths(1),
            "Negative discount"
        );
        var result = validator.Validate(dto);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void CreatePayment_InitialPaidMoreThanTotal_FailsValidation()
    {
        var validator = new CreatePaymentDtoValidator();
        var dto = new CreatePaymentDto(
            Guid.NewGuid(),
            null,
            null,
            500_000,
            null,
            DateTime.UtcNow.AddDays(7),
            null,
            PaymentStatus.Pending,
            "Overpayment attempt",
            600_000, // InitialPaidAmount > Amount
            PaymentMethod.Cash
        );
        var result = validator.Validate(dto);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreatePaymentDto.InitialPaidAmount));
    }

    [Fact]
    public void BulkGrade_ScoreOver100_FailsValidation()
    {
        var validator = new BulkGradeDtoValidator();
        var dto = new BulkGradeDto(
            Guid.NewGuid(),
            new List<BulkGradeItemDto>
            {
                new BulkGradeItemDto(Guid.NewGuid(), 150, "Impossible score")
            }
        );
        var result = validator.Validate(dto);

        Assert.False(result.IsValid);
    }
}
