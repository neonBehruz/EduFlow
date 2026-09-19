using System.Reflection;
using EduFlow.Application.Interfaces;
using EduFlow.Application.Mapping;
using EduFlow.Application.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace EduFlow.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddAutoMapper(cfg =>
        {
            cfg.AddProfile<MappingProfile>();
        });
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        // Application Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IStudentService, StudentService>();
        services.AddScoped<ITeacherService, TeacherService>();
        services.AddScoped<IGroupService, GroupService>();
        services.AddScoped<ISubjectService, SubjectService>();
        services.AddScoped<ILessonService, LessonService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<IGradeService, GradeService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IOrganizationService, OrganizationService>();
        services.AddScoped<ISuperAdminService, SuperAdminService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IFinanceService, FinanceService>();

        // Production Extended Services
        services.AddScoped<IExtendedDashboardService, ExtendedDashboardService>();
        services.AddScoped<IParentPortalService, ParentPortalService>();
        services.AddScoped<IStudentPortalService, StudentPortalService>();
        services.AddScoped<ICalendarService, CalendarService>();
        services.AddScoped<IRoomService, RoomService>();
        services.AddScoped<IHomeworkService, HomeworkService>();
        services.AddScoped<IStudentProgressService, StudentProgressService>();
        services.AddScoped<ICrmService, CrmService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<ITeacherPayrollService, TeacherPayrollService>();
        services.AddScoped<IStudentRiskService, StudentRiskService>();
        services.AddScoped<IGlobalSearchService, GlobalSearchService>();
        services.AddScoped<ICertificateService, CertificateService>();
        services.AddScoped<IFeatureEntitlementService, FeatureEntitlementService>();
        services.AddScoped<IBranchService, BranchService>();
        services.AddScoped<IFeedbackService, FeedbackService>();
        services.AddScoped<IReferralService, ReferralService>();

        return services;
    }
}
