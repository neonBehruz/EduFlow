using System.Security.Cryptography;
using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class CertificateService : ICertificateService
{
    private readonly IApplicationDbContext _context;

    public CertificateService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<CertificateDto>> GetCertificatesAsync(string? search, int page = 1, int pageSize = 20)
    {
        var query = _context.Certificates
            .AsNoTracking()
            .Include(c => c.Student)
            .Include(c => c.Subject)
            .Include(c => c.Group)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower().Trim();
            query = query.Where(c => c.CertificateNumber.ToLower().Contains(s) ||
                                     c.Student.FirstName.ToLower().Contains(s) ||
                                     c.Student.LastName.ToLower().Contains(s) ||
                                     c.CourseName.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.IssueDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CertificateDto(
                c.Id,
                c.CertificateNumber,
                c.VerificationCode,
                c.StudentId,
                $"{c.Student.FirstName} {c.Student.LastName}",
                c.SubjectId,
                c.Subject != null ? c.Subject.Name : null,
                c.GroupId,
                c.Group != null ? c.Group.Name : null,
                c.CourseName,
                c.LevelName,
                c.IssueDate,
                c.FinalGrade,
                c.QrCodeData,
                $"/verify/{c.VerificationCode}"
            ))
            .ToListAsync();

        return new PagedResult<CertificateDto>(items, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<CertificateDto>> CreateCertificateAsync(CreateCertificateDto dto)
    {
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == dto.StudentId);
        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        var count = await _context.Certificates.CountAsync();
        var certNum = $"EDF-{DateTime.UtcNow.Year}-{(count + 1):D5}";
        var verificationCode = Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLower();

        var cert = new Certificate
        {
            Id = Guid.NewGuid(),
            CertificateNumber = certNum,
            VerificationCode = verificationCode,
            StudentId = dto.StudentId,
            SubjectId = dto.SubjectId,
            GroupId = dto.GroupId,
            CourseName = dto.CourseName,
            LevelName = dto.LevelName,
            IssueDate = DateTime.UtcNow,
            FinalGrade = dto.FinalGrade,
            QrCodeData = $"https://eduflow.uz/verify/{verificationCode}"
        };

        _context.Certificates.Add(cert);
        await _context.SaveChangesAsync();

        var createdDto = new CertificateDto(
            cert.Id,
            cert.CertificateNumber,
            cert.VerificationCode,
            cert.StudentId,
            $"{student.FirstName} {student.LastName}",
            cert.SubjectId,
            null,
            cert.GroupId,
            null,
            cert.CourseName,
            cert.LevelName,
            cert.IssueDate,
            cert.FinalGrade,
            cert.QrCodeData,
            $"/verify/{cert.VerificationCode}"
        );

        return ApiResponse<CertificateDto>.Ok(createdDto, "Sertifikat muvaffaqiyatli yaratildi.");
    }

    public async Task<ApiResponse<CertificateVerificationResultDto>> VerifyCertificateAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return ApiResponse<CertificateVerificationResultDto>.Ok(new CertificateVerificationResultDto(
                false, null, null, null, null, null, null, null, "Sertifikat kodi kiritilmadi."));
        }

        var normalizedCode = code.Trim().ToLower();

        // Check without tenant filter since this is a public verification endpoint
        var cert = await _context.Certificates
            .IgnoreQueryFilters()
            .Include(c => c.Student)
            .Include(c => c.Organization)
            .FirstOrDefaultAsync(c => c.VerificationCode.ToLower() == normalizedCode || c.CertificateNumber.ToLower() == normalizedCode);

        if (cert == null)
        {
            return ApiResponse<CertificateVerificationResultDto>.Ok(new CertificateVerificationResultDto(
                IsValid: false,
                CertificateNumber: null,
                StudentName: null,
                CourseName: null,
                LevelName: null,
                OrganizationName: null,
                IssueDate: null,
                FinalGrade: null,
                Message: "Bunday sertifikat bazada topilmadi. Sertifikat qalbakilashtirilgan bo'lishi mumkin."
            ));
        }

        return ApiResponse<CertificateVerificationResultDto>.Ok(new CertificateVerificationResultDto(
            IsValid: true,
            CertificateNumber: cert.CertificateNumber,
            StudentName: $"{cert.Student.FirstName} {cert.Student.LastName}",
            CourseName: cert.CourseName,
            LevelName: cert.LevelName,
            OrganizationName: cert.Organization?.Name ?? "EduFlow Ta'lim Markazi",
            IssueDate: cert.IssueDate,
            FinalGrade: cert.FinalGrade,
            Message: "Sertifikat haqiqiy va EduFlow bazasida rasmiy tasdiqlangan!"
        ));
    }
}
