using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;

namespace EduFlow.Application.Common.Finance;

public static class FinancialCalculator
{
    /// <summary>
    /// Calculates discount, final amount, and breakdown deterministically using decimal rounding.
    /// </summary>
    public static DiscountResult CalculateDiscount(
        decimal basePrice,
        decimal? individualDiscountPercent,
        int familyStudentOrder,
        FinanceSetting? setting)
    {
        if (basePrice < 0) basePrice = 0;

        decimal familyDiscountPercent = 0m;
        if (setting != null)
        {
            if (familyStudentOrder == 2) familyDiscountPercent = setting.FamilyDiscount2ndStudent;
            else if (familyStudentOrder == 3) familyDiscountPercent = setting.FamilyDiscount3rdStudent;
            else if (familyStudentOrder >= 4) familyDiscountPercent = setting.FamilyDiscount4thPlusStudent;
        }

        decimal validIndivPercent = (individualDiscountPercent.HasValue && individualDiscountPercent.Value > 0)
            ? Math.Clamp(individualDiscountPercent.Value, 0m, 100m)
            : 0m;

        decimal appliedPercent;
        string discountType;

        var rule = setting?.DiscountConflictRule ?? DiscountConflictRule.HighestDiscount;
        if (rule == DiscountConflictRule.IndividualPriority && validIndivPercent > 0)
        {
            appliedPercent = validIndivPercent;
            discountType = $"Individual ({validIndivPercent}%)";
        }
        else
        {
            if (validIndivPercent >= familyDiscountPercent && validIndivPercent > 0)
            {
                appliedPercent = validIndivPercent;
                discountType = $"Individual ({validIndivPercent}%)";
            }
            else if (familyDiscountPercent > 0)
            {
                appliedPercent = familyDiscountPercent;
                discountType = $"Oilaviy ({familyStudentOrder}-farzand: {familyDiscountPercent}%)";
            }
            else
            {
                appliedPercent = 0m;
                discountType = "Chegirmasiz";
            }
        }

        decimal discountAmount = Math.Round(basePrice * (appliedPercent / 100m), 2, MidpointRounding.AwayFromZero);
        decimal finalAmount = Math.Max(0m, basePrice - discountAmount);

        return new DiscountResult(
            BasePrice: basePrice,
            FamilyDiscountPercent: familyDiscountPercent,
            IndividualDiscountPercent: validIndivPercent,
            AppliedDiscountPercent: appliedPercent,
            DiscountAmount: discountAmount,
            FinalAmount: finalAmount,
            DiscountType: discountType
        );
    }

    /// <summary>
    /// Calculates teacher share and center remaining share from actual paid amount.
    /// </summary>
    public static ShareResult CalculateShares(decimal paidAmount, decimal teacherSharePercent)
    {
        if (paidAmount < 0) paidAmount = 0m;
        teacherSharePercent = Math.Clamp(teacherSharePercent, 0m, 100m);

        decimal teacherShare = Math.Round(paidAmount * (teacherSharePercent / 100m), 2, MidpointRounding.AwayFromZero);
        decimal centerShare = Math.Max(0m, paidAmount - teacherShare);

        return new ShareResult(
            PaidAmount: paidAmount,
            TeacherSharePercent: teacherSharePercent,
            TeacherShareAmount: teacherShare,
            CenterShareAmount: centerShare
        );
    }

    /// <summary>
    /// Calculates remaining debt and updated payment status.
    /// </summary>
    public static DebtResult CalculateDebtAndStatus(decimal finalAmount, decimal paidAmount, DateTime dueDate)
    {
        if (finalAmount < 0) finalAmount = 0m;
        if (paidAmount < 0) paidAmount = 0m;

        decimal debtAmount = Math.Max(0m, finalAmount - paidAmount);
        PaymentStatus status;

        if (paidAmount >= finalAmount && finalAmount > 0)
        {
            status = PaymentStatus.Paid;
        }
        else if (paidAmount > 0)
        {
            status = PaymentStatus.Partial;
        }
        else
        {
            status = DateTime.UtcNow > dueDate ? PaymentStatus.Overdue : PaymentStatus.Pending;
        }

        return new DebtResult(
            FinalAmount: finalAmount,
            PaidAmount: paidAmount,
            DebtAmount: debtAmount,
            Status: status
        );
    }

    /// <summary>
    /// Pro-rates group fee when student transfers between groups mid-month.
    /// </summary>
    public static decimal CalculateProRatedTransferFee(
        decimal group1MonthlyFee,
        int group1AttendedLessons,
        int group1TotalLessons,
        decimal group2MonthlyFee,
        int group2RemainingLessons,
        int group2TotalLessons)
    {
        decimal group1Cost = 0m;
        if (group1TotalLessons > 0 && group1AttendedLessons > 0)
        {
            decimal perLesson = group1MonthlyFee / group1TotalLessons;
            group1Cost = Math.Round(perLesson * group1AttendedLessons, 2, MidpointRounding.AwayFromZero);
        }

        decimal group2Cost = 0m;
        if (group2TotalLessons > 0 && group2RemainingLessons > 0)
        {
            decimal perLesson = group2MonthlyFee / group2TotalLessons;
            group2Cost = Math.Round(perLesson * group2RemainingLessons, 2, MidpointRounding.AwayFromZero);
        }

        return group1Cost + group2Cost;
    }

    /// <summary>
    /// Computes credit/deduction for excused absences.
    /// </summary>
    public static decimal CalculateExcusedAbsenceCredit(decimal monthlyFee, int totalLessons, int excusedCount)
    {
        if (totalLessons <= 0 || excusedCount <= 0) return 0m;
        decimal perLesson = monthlyFee / totalLessons;
        return Math.Round(perLesson * excusedCount, 2, MidpointRounding.AwayFromZero);
    }
}

public record DiscountResult(
    decimal BasePrice,
    decimal FamilyDiscountPercent,
    decimal IndividualDiscountPercent,
    decimal AppliedDiscountPercent,
    decimal DiscountAmount,
    decimal FinalAmount,
    string DiscountType
);

public record ShareResult(
    decimal PaidAmount,
    decimal TeacherSharePercent,
    decimal TeacherShareAmount,
    decimal CenterShareAmount
);

public record DebtResult(
    decimal FinalAmount,
    decimal PaidAmount,
    decimal DebtAmount,
    PaymentStatus Status
);
