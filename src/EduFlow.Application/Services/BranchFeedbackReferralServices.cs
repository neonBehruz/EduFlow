using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class BranchService : IBranchService
{
    private readonly IApplicationDbContext _context;

    public BranchService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<BranchDto>> GetBranchesAsync()
    {
        return await _context.Branches
            .AsNoTracking()
            .Include(b => b.Rooms)
            .Include(b => b.Groups)
            .OrderBy(b => b.Name)
            .Select(b => new BranchDto(
                b.Id,
                b.Name,
                b.Address,
                b.Phone,
                b.IsActive,
                b.Rooms.Count,
                b.Groups.Count
            ))
            .ToListAsync();
    }

    public async Task<ApiResponse<BranchDto>> CreateBranchAsync(CreateBranchDto dto)
    {
        var branch = new Branch
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Address = dto.Address,
            Phone = dto.Phone,
            IsActive = true
        };

        _context.Branches.Add(branch);
        await _context.SaveChangesAsync();

        return ApiResponse<BranchDto>.Ok(new BranchDto(branch.Id, branch.Name, branch.Address, branch.Phone, true, 0, 0), "Filial muvaffaqiyatli yaratildi.");
    }

    public async Task<ApiResponse<BranchDto>> UpdateBranchAsync(Guid id, UpdateBranchDto dto)
    {
        var branch = await _context.Branches.Include(b => b.Rooms).Include(b => b.Groups).FirstOrDefaultAsync(b => b.Id == id);
        if (branch == null) throw new NotFoundException("Filial topilmadi.");

        branch.Name = dto.Name;
        branch.Address = dto.Address;
        branch.Phone = dto.Phone;
        branch.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return ApiResponse<BranchDto>.Ok(new BranchDto(branch.Id, branch.Name, branch.Address, branch.Phone, branch.IsActive, branch.Rooms.Count, branch.Groups.Count));
    }

    public async Task<ApiResponse<bool>> DeleteBranchAsync(Guid id)
    {
        var branch = await _context.Branches.FirstOrDefaultAsync(b => b.Id == id);
        if (branch == null) throw new NotFoundException("Filial topilmadi.");

        _context.Branches.Remove(branch);
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Filial o'chirildi.");
    }
}

public class FeedbackService : IFeedbackService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public FeedbackService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<FeedbackDto>> GetFeedbacksAsync(string? category, Guid? teacherId)
    {
        var query = _context.Feedbacks
            .AsNoTracking()
            .Include(f => f.Student)
            .Include(f => f.Parent)
            .Include(f => f.Teacher)
            .Include(f => f.Subject)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(f => f.Category.ToLower() == category.ToLower());
        }

        if (teacherId.HasValue && teacherId != Guid.Empty)
        {
            query = query.Where(f => f.TeacherId == teacherId.Value);
        }

        return await query
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FeedbackDto(
                f.Id,
                f.StudentId,
                f.Student != null ? $"{f.Student.FirstName} {f.Student.LastName}" : null,
                f.ParentId,
                f.Parent != null ? f.Parent.FullName : null,
                f.TeacherId,
                f.Teacher != null ? f.Teacher.FullName : null,
                f.SubjectId,
                f.Subject != null ? f.Subject.Name : null,
                f.Rating,
                f.Comment,
                f.Category,
                f.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<ApiResponse<FeedbackDto>> SubmitFeedbackAsync(CreateFeedbackDto dto)
    {
        var rating = Math.Clamp(dto.Rating, 1, 5);

        Guid? studentId = null;
        Guid? parentId = null;

        Guid organizationId = Guid.Empty;
        if (_currentUserService.UserId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == _currentUserService.UserId.Value);
            if (user != null) organizationId = user.OrganizationId;

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == _currentUserService.UserId.Value);
            if (student != null)
            {
                studentId = student.Id;
                if (organizationId == Guid.Empty) organizationId = student.OrganizationId;
            }

            var parent = await _context.Parents.FirstOrDefaultAsync(p => p.UserId == _currentUserService.UserId.Value);
            if (parent != null)
            {
                parentId = parent.Id;
                if (organizationId == Guid.Empty) organizationId = parent.OrganizationId;
            }
        }
        if (organizationId == Guid.Empty)
        {
            var defaultOrg = await _context.Organizations.FirstOrDefaultAsync();
            if (defaultOrg != null) organizationId = defaultOrg.Id;
        }

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            StudentId = studentId,
            ParentId = parentId,
            TeacherId = dto.TeacherId,
            SubjectId = dto.SubjectId,
            Rating = rating,
            Comment = dto.Comment,
            Category = dto.Category
        };

        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        return ApiResponse<FeedbackDto>.Ok(new FeedbackDto(
            feedback.Id,
            studentId,
            null,
            parentId,
            null,
            dto.TeacherId,
            null,
            dto.SubjectId,
            null,
            rating,
            dto.Comment,
            dto.Category,
            DateTime.UtcNow
        ), "Fikr-mulohazangiz uchun tashakkur!");
    }
}

public class ReferralService : IReferralService
{
    private readonly IApplicationDbContext _context;

    public ReferralService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<ReferralCodeDto>> GetMyReferralCodeAsync(Guid studentId)
    {
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == studentId);
        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        var refCode = await _context.ReferralCodes
            .Include(rc => rc.Referrals)
            .FirstOrDefaultAsync(rc => rc.StudentId == studentId);

        if (refCode == null)
        {
            var code = $"{student.FirstName[..Math.Min(3, student.FirstName.Length)].ToUpper()}{Random.Shared.Next(1000, 9999)}";
            refCode = new ReferralCode
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                Code = code,
                RewardPercentage = 10m,
                IsActive = true
            };
            _context.ReferralCodes.Add(refCode);
            await _context.SaveChangesAsync();
        }

        var totalEarned = refCode.Referrals.Where(r => r.IsRewardApplied).Sum(r => r.RewardAmount);

        return ApiResponse<ReferralCodeDto>.Ok(new ReferralCodeDto(
            refCode.Id,
            student.Id,
            $"{student.FirstName} {student.LastName}",
            refCode.Code,
            refCode.RewardPercentage,
            refCode.IsActive,
            refCode.Referrals.Count,
            totalEarned
        ));
    }

    public async Task<ApiResponse<ReferralDto>> TrackReferralAsync(string code, Guid referredStudentId, decimal rewardAmount)
    {
        var refCode = await _context.ReferralCodes
            .Include(rc => rc.Student)
            .FirstOrDefaultAsync(rc => rc.Code.ToUpper() == code.Trim().ToUpper() && rc.IsActive);

        if (refCode == null) throw new BadRequestException("Noto'g'ri referral kodi.");

        if (refCode.StudentId == referredStudentId)
        {
            throw new BadRequestException("O'z-o'zini referral qilish mumkin emas.");
        }

        var alreadyReferred = await _context.Referrals.AnyAsync(r => r.ReferredStudentId == referredStudentId);
        if (alreadyReferred)
        {
            throw new BadRequestException("Ushbu o'quvchi allaqachon referral orqali ro'yxatdan o'tgan.");
        }

        var referral = new Referral
        {
            Id = Guid.NewGuid(),
            ReferralCodeId = refCode.Id,
            ReferrerStudentId = refCode.StudentId,
            ReferredStudentId = referredStudentId,
            RewardAmount = rewardAmount,
            IsRewardApplied = true,
            RewardAppliedAt = DateTime.UtcNow
        };

        _context.Referrals.Add(referral);
        await _context.SaveChangesAsync();

        var created = await _context.Referrals
            .Include(r => r.ReferrerStudent)
            .Include(r => r.ReferredStudent)
            .FirstAsync(r => r.Id == referral.Id);

        return ApiResponse<ReferralDto>.Ok(new ReferralDto(
            created.Id,
            created.ReferrerStudentId,
            $"{created.ReferrerStudent.FirstName} {created.ReferrerStudent.LastName}",
            created.ReferredStudentId,
            $"{created.ReferredStudent.FirstName} {created.ReferredStudent.LastName}",
            refCode.Code,
            created.RewardAmount,
            created.IsRewardApplied,
            created.RewardAppliedAt,
            created.CreatedAt
        ), "Referral muvaffaqiyatli qayd etildi va bonus biriktirildi.");
    }

    public async Task<List<ReferralDto>> GetReferralsAsync()
    {
        return await _context.Referrals
            .AsNoTracking()
            .Include(r => r.ReferralCode)
            .Include(r => r.ReferrerStudent)
            .Include(r => r.ReferredStudent)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReferralDto(
                r.Id,
                r.ReferrerStudentId,
                $"{r.ReferrerStudent.FirstName} {r.ReferrerStudent.LastName}",
                r.ReferredStudentId,
                $"{r.ReferredStudent.FirstName} {r.ReferredStudent.LastName}",
                r.ReferralCode.Code,
                r.RewardAmount,
                r.IsRewardApplied,
                r.RewardAppliedAt,
                r.CreatedAt
            ))
            .ToListAsync();
    }
}
