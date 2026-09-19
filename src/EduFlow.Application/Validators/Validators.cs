using EduFlow.Application.DTOs;
using FluentValidation;

namespace EduFlow.Application.Validators;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        When(x => !string.IsNullOrWhiteSpace(x.OrganizationName), () =>
        {
            RuleFor(x => x.OrganizationName!)
                .MaximumLength(150).WithMessage("O'quv markazi nomi 150 belgidan oshmasligi kerak.");
        });

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Ism kiritilishi shart.")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Familiya kiritilishi shart.")
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email kiritilishi shart.")
            .EmailAddress().WithMessage("To'g'ri email formatini kiriting.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Parol kiritilishi shart.")
            .MinimumLength(8).WithMessage("Parol kamida 8 belgidan iborat bo'lishi kerak.")
            .Matches(@"[a-zA-Z]").WithMessage("Parolda kamida bitta harf bo'lishi kerak.")
            .Matches(@"[0-9]").WithMessage("Parolda kamida bitta raqam bo'lishi kerak.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Telefon raqami kiritilishi shart.");
    }
}

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email kiritilishi shart.")
            .EmailAddress().WithMessage("To'g'ri email formatini kiriting.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Parol kiritilishi shart.");
    }
}

public class RefreshTokenDtoValidator : AbstractValidator<RefreshTokenDto>
{
    public RefreshTokenDtoValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Token kiritilishi shart.");

        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token kiritilishi shart.");
    }
}

public class CreateStudentDtoValidator : AbstractValidator<CreateStudentDto>
{
    public CreateStudentDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("O'quvchi ismi kiritilishi shart.")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("O'quvchi familiyasi kiritilishi shart.")
            .MaximumLength(100);

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Telefon raqami kiritilishi shart.");
    }
}

public class CreateGroupDtoValidator : AbstractValidator<CreateGroupDto>
{
    public CreateGroupDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Guruh nomi kiritilishi shart.")
            .MaximumLength(150);

        RuleFor(x => x.MonthlyFee)
            .GreaterThanOrEqualTo(0).WithMessage("Oylik to'lov musbat bo'lishi kerak.")
            .LessThanOrEqualTo(1_000_000_000).WithMessage("Oylik to'lov 1 milliarddan oshmasligi kerak.");

        RuleFor(x => x.MaxStudents)
            .GreaterThan(0).WithMessage("Maksimal o'quvchilar soni 0 dan katta bo'lishi kerak.")
            .LessThanOrEqualTo(500).WithMessage("Maksimal o'quvchilar soni 500 dan oshmasligi kerak.");
    }
}

public class CreateSubjectDtoValidator : AbstractValidator<CreateSubjectDto>
{
    public CreateSubjectDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Fan nomi kiritilishi shart.")
            .MaximumLength(100);
    }
}

public class CreatePaymentDtoValidator : AbstractValidator<CreatePaymentDto>
{
    public CreatePaymentDtoValidator()
    {
        RuleFor(x => x.StudentId)
            .NotEmpty().WithMessage("O'quvchi tanlanishi shart.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("To'lov summasi 0 dan katta bo'lishi kerak.")
            .LessThanOrEqualTo(1_000_000_000).WithMessage("To'lov summasi 1 milliard so'mdan oshmasligi kerak.");

        RuleFor(x => x.InitialPaidAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Dastlabki to'lov manfiy bo'lishi mumkin emas.")
            .LessThanOrEqualTo(x => x.Amount).WithMessage("Dastlabki to'lov umumiy summadan oshmasligi kerak.");

        RuleFor(x => x.DueDate)
            .NotEmpty().WithMessage("To'lov muddati kiritilishi shart.");
    }
}

public class CreatePaymentTransactionDtoValidator : AbstractValidator<CreatePaymentTransactionDto>
{
    public CreatePaymentTransactionDtoValidator()
    {
        RuleFor(x => x.PaymentId)
            .NotEmpty().WithMessage("To'lov tanlanishi shart.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("To'lov summasi 0 dan katta bo'lishi kerak.")
            .LessThanOrEqualTo(1_000_000_000).WithMessage("To'lov summasi 1 milliard so'mdan oshmasligi kerak.");
    }
}

public class CreateStudentDiscountDtoValidator : AbstractValidator<CreateStudentDiscountDto>
{
    public CreateStudentDiscountDtoValidator()
    {
        RuleFor(x => x.StudentId)
            .NotEmpty().WithMessage("O'quvchi tanlanishi shart.");

        RuleFor(x => x.DiscountPercentage)
            .GreaterThan(0).WithMessage("Chegirma foizi 0 dan katta bo'lishi kerak.")
            .LessThanOrEqualTo(100).WithMessage("Chegirma foizi 100% dan oshmasligi kerak.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Sabab kiritilishi shart.")
            .MaximumLength(200);
    }
}

public class CreateCenterExpenseDtoValidator : AbstractValidator<CreateCenterExpenseDto>
{
    public CreateCenterExpenseDtoValidator()
    {
        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Xarajat toifasi kiritilishi shart.")
            .MaximumLength(100);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Xarajat summasi 0 dan katta bo'lishi kerak.")
            .LessThanOrEqualTo(1_000_000_000).WithMessage("Xarajat summasi 1 milliarddan oshmasligi kerak.");

        RuleFor(x => x.Description)
            .MaximumLength(500);
    }
}

public class BulkAttendanceDtoValidator : AbstractValidator<BulkAttendanceDto>
{
    public BulkAttendanceDtoValidator()
    {
        RuleFor(x => x.LessonId)
            .NotEmpty().WithMessage("Dars ID kiritilishi shart.");

        RuleFor(x => x.Items)
            .NotNull().WithMessage("Davomat ro'yxati bo'sh bo'lmasligi kerak.");
    }
}

public class BulkGradeDtoValidator : AbstractValidator<BulkGradeDto>
{
    public BulkGradeDtoValidator()
    {
        RuleFor(x => x.LessonId)
            .NotEmpty().WithMessage("Dars ID kiritilishi shart.");

        RuleFor(x => x.Items)
            .NotNull().WithMessage("Baholar ro'yxati bo'sh bo'lmasligi kerak.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.Score)
                .InclusiveBetween(0, 100).WithMessage("Baho 0 va 100 oralig'ida bo'lishi kerak.");
        });
    }
}
