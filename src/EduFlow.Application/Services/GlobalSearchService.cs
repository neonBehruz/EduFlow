using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class GlobalSearchService : IGlobalSearchService
{
    private readonly IApplicationDbContext _context;

    public GlobalSearchService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<GlobalSearchResultDto>> SearchAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
        {
            return ApiResponse<GlobalSearchResultDto>.Ok(new GlobalSearchResultDto(query ?? "", new List<SearchResultItemDto>()));
        }

        var s = query.ToLower().Trim();
        var results = new List<SearchResultItemDto>();

        // 1. Students
        var students = await _context.Students
            .AsNoTracking()
            .Where(st => st.FirstName.ToLower().Contains(s) || st.LastName.ToLower().Contains(s) || st.PhoneNumber.Contains(s))
            .Take(5)
            .ToListAsync();

        results.AddRange(students.Select(st => new SearchResultItemDto(
            Category: "O'quvchi",
            Title: $"{st.FirstName} {st.LastName}",
            Subtitle: $"Tel: {st.PhoneNumber}",
            Id: st.Id,
            RouteUrl: $"/students/{st.Id}",
            Meta: st.IsActive ? "Faol" : "Nofaol"
        )));

        // 2. Teachers
        var teachers = await _context.Teachers
            .AsNoTracking()
            .Where(t => t.FullName.ToLower().Contains(s) || t.PhoneNumber.Contains(s))
            .Take(5)
            .ToListAsync();

        results.AddRange(teachers.Select(t => new SearchResultItemDto(
            Category: "O'qituvchi",
            Title: t.FullName,
            Subtitle: t.Specialization ?? t.PhoneNumber,
            Id: t.Id,
            RouteUrl: "/teachers",
            Meta: t.PhoneNumber
        )));

        // 3. Groups
        var groups = await _context.Groups
            .AsNoTracking()
            .Where(g => g.Name.ToLower().Contains(s))
            .Include(g => g.Subject)
            .Take(5)
            .ToListAsync();

        results.AddRange(groups.Select(g => new SearchResultItemDto(
            Category: "Guruh",
            Title: g.Name,
            Subtitle: g.Subject?.Name ?? "Kurs",
            Id: g.Id,
            RouteUrl: $"/groups/{g.Id}",
            Meta: $"{g.MonthlyFee:N0} so'm"
        )));

        // 4. Subjects / Courses
        var subjects = await _context.Subjects
            .AsNoTracking()
            .Where(sub => sub.Name.ToLower().Contains(s))
            .Take(5)
            .ToListAsync();

        results.AddRange(subjects.Select(sub => new SearchResultItemDto(
            Category: "Fan / Kurs",
            Title: sub.Name,
            Subtitle: "O'quv kursi",
            Id: sub.Id,
            RouteUrl: "/subjects",
            Meta: null
        )));

        // 5. CRM Leads
        var leads = await _context.Leads
            .AsNoTracking()
            .Where(l => l.FullName.ToLower().Contains(s) || l.PhoneNumber.Contains(s))
            .Take(5)
            .ToListAsync();

        results.AddRange(leads.Select(l => new SearchResultItemDto(
            Category: "Lid (CRM)",
            Title: l.FullName,
            Subtitle: $"Tel: {l.PhoneNumber} | Holat: {l.Status}",
            Id: l.Id,
            RouteUrl: "/crm",
            Meta: l.Source.ToString()
        )));

        // 6. Invoices
        var invoices = await _context.Invoices
            .AsNoTracking()
            .Where(inv => inv.InvoiceNumber.ToLower().Contains(s))
            .Include(inv => inv.Student)
            .Take(5)
            .ToListAsync();

        results.AddRange(invoices.Select(inv => new SearchResultItemDto(
            Category: "Hisob-faktura",
            Title: inv.InvoiceNumber,
            Subtitle: $"{inv.Student.FirstName} {inv.Student.LastName} ({inv.Amount:N0} so'm)",
            Id: inv.Id,
            RouteUrl: "/invoices",
            Meta: inv.Status.ToString()
        )));

        // 7. Certificates
        var certs = await _context.Certificates
            .AsNoTracking()
            .Where(c => c.CertificateNumber.ToLower().Contains(s) || c.VerificationCode.ToLower().Contains(s))
            .Include(c => c.Student)
            .Take(5)
            .ToListAsync();

        results.AddRange(certs.Select(c => new SearchResultItemDto(
            Category: "Sertifikat",
            Title: $"{c.CertificateNumber} - {c.CourseName}",
            Subtitle: $"{c.Student.FirstName} {c.Student.LastName}",
            Id: c.Id,
            RouteUrl: $"/verify/{c.VerificationCode}",
            Meta: c.LevelName
        )));

        return ApiResponse<GlobalSearchResultDto>.Ok(new GlobalSearchResultDto(query, results));
    }
}
