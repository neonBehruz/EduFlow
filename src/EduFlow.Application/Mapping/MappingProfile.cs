using AutoMapper;
using EduFlow.Application.DTOs;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;

namespace EduFlow.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User & Organization
        CreateMap<User, UserDto>();
        CreateMap<Organization, OrganizationDto>();
        CreateMap<SubscriptionPlan, SubscriptionPlanDto>();
        CreateMap<Subscription, SubscriptionDto>()
            .ForMember(d => d.PlanName, opt => opt.MapFrom(s => s.SubscriptionPlan.Name))
            .ForMember(d => d.Plan, opt => opt.MapFrom(s => s.SubscriptionPlan));

        // Teacher
        CreateMap<Teacher, TeacherDto>()
            .ForMember(d => d.GroupsCount, opt => opt.MapFrom(s => s.Groups.Count));

        // Parent
        CreateMap<Parent, ParentDto>()
            .ForMember(d => d.IsTelegramConnected, opt => opt.MapFrom(s => s.TelegramAccount != null && s.TelegramAccount.IsConnected));

        // Student
        CreateMap<Student, StudentDto>()
            .ForMember(d => d.FullName, opt => opt.MapFrom(s => $"{s.FirstName} {s.LastName}".Trim()))
            .ForMember(d => d.ParentName, opt => opt.MapFrom(s => s.Parent != null ? s.Parent.FullName : null))
            .ForMember(d => d.ParentPhone, opt => opt.MapFrom(s => s.Parent != null ? s.Parent.PhoneNumber : null))
            .ForMember(d => d.GroupNames, opt => opt.MapFrom(s => s.GroupStudents.Select(gs => gs.Group.Name).ToList()))
            .ForMember(d => d.AverageGrade, opt => opt.MapFrom(s => s.Grades.Any() ? Math.Round(s.Grades.Average(g => g.Score), 1) : 0))
            .ForMember(d => d.AttendancePercentage, opt => opt.MapFrom(s => s.Attendances.Any() ? Math.Round((decimal)s.Attendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late) / s.Attendances.Count * 100, 0) : 100))
            .ForMember(d => d.CurrentPaymentStatus, opt => opt.MapFrom(s => s.Payments.OrderByDescending(p => p.DueDate).Select(p => p.Status).FirstOrDefault()));

        // Subject
        CreateMap<Subject, SubjectDto>()
            .ForMember(d => d.GroupsCount, opt => opt.MapFrom(s => s.Groups.Count));

        // Group
        CreateMap<Group, GroupDto>()
            .ForMember(d => d.TeacherName, opt => opt.MapFrom(s => s.Teacher != null ? s.Teacher.FullName : null))
            .ForMember(d => d.SubjectName, opt => opt.MapFrom(s => s.Subject != null ? s.Subject.Name : null))
            .ForMember(d => d.EnrolledStudentsCount, opt => opt.MapFrom(s => s.GroupStudents.Count));

        CreateMap<Group, GroupSummaryDto>()
            .ForMember(d => d.TeacherName, opt => opt.MapFrom(s => s.Teacher != null ? s.Teacher.FullName : null))
            .ForMember(d => d.SubjectName, opt => opt.MapFrom(s => s.Subject != null ? s.Subject.Name : null));

        // Lesson
        CreateMap<Lesson, LessonDto>()
            .ForMember(d => d.GroupName, opt => opt.MapFrom(s => s.Group.Name))
            .ForMember(d => d.SubjectName, opt => opt.MapFrom(s => s.Group.Subject != null ? s.Group.Subject.Name : null))
            .ForMember(d => d.TeacherName, opt => opt.MapFrom(s => s.Group.Teacher != null ? s.Group.Teacher.FullName : null))
            .ForMember(d => d.TotalStudents, opt => opt.MapFrom(s => s.Group.GroupStudents.Count))
            .ForMember(d => d.PresentCount, opt => opt.MapFrom(s => s.Attendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late)))
            .ForMember(d => d.AbsentCount, opt => opt.MapFrom(s => s.Attendances.Count(a => a.Status == AttendanceStatus.Absent)));

        // Attendance
        CreateMap<Attendance, AttendanceDto>()
            .ForMember(d => d.StudentName, opt => opt.MapFrom(s => $"{s.Student.FirstName} {s.Student.LastName}".Trim()))
            .ForMember(d => d.LessonDate, opt => opt.MapFrom(s => s.Lesson.StartTime));

        // Grade
        CreateMap<Grade, GradeDto>()
            .ForMember(d => d.StudentName, opt => opt.MapFrom(s => $"{s.Student.FirstName} {s.Student.LastName}".Trim()))
            .ForMember(d => d.SubjectName, opt => opt.MapFrom(s => s.Lesson.Group.Subject != null ? s.Lesson.Group.Subject.Name : null));

        // Payment
        CreateMap<Payment, PaymentDto>()
            .ForMember(d => d.StudentName, opt => opt.MapFrom(s => $"{s.Student.FirstName} {s.Student.LastName}".Trim()))
            .ForMember(d => d.StudentPhone, opt => opt.MapFrom(s => s.Student.PhoneNumber))
            .ForMember(d => d.GroupName, opt => opt.MapFrom(s => s.Group != null ? s.Group.Name : null))
            .ForMember(d => d.TeacherId, opt => opt.MapFrom(s => s.TeacherId))
            .ForMember(d => d.TeacherName, opt => opt.MapFrom(s => s.Teacher != null ? s.Teacher.FullName : (s.Group != null && s.Group.Teacher != null ? s.Group.Teacher.FullName : null)))
            .ForMember(d => d.Transactions, opt => opt.MapFrom(s => s.Transactions));

        CreateMap<PaymentTransaction, PaymentTransactionDto>();

        // Notification
        CreateMap<Notification, NotificationDto>()
            .ForMember(d => d.StudentName, opt => opt.MapFrom(s => s.Student != null ? $"{s.Student.FirstName} {s.Student.LastName}".Trim() : null))
            .ForMember(d => d.ParentName, opt => opt.MapFrom(s => s.Parent != null ? s.Parent.FullName : null));
    }
}
