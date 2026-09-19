using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IApplicationDbContext _context;

    public InvoiceService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<InvoiceDto>> GetInvoicesAsync(InvoiceStatus? status, Guid? studentId, int page = 1, int pageSize = 20)
    {
        var query = _context.Invoices
            .AsNoTracking()
            .Include(i => i.Student)
            .Include(i => i.Parent)
            .Include(i => i.Group)
            .AsQueryable();

        if (status.HasValue) query = query.Where(i => i.Status == status.Value);
        if (studentId.HasValue && studentId != Guid.Empty) query = query.Where(i => i.StudentId == studentId.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new InvoiceDto(
                i.Id,
                i.InvoiceNumber,
                i.StudentId,
                $"{i.Student.FirstName} {i.Student.LastName}",
                i.ParentId,
                i.Parent != null ? i.Parent.FullName : null,
                i.GroupId,
                i.Group != null ? i.Group.Name : null,
                i.PaymentId,
                i.BillingPeriod,
                i.Amount,
                i.IssueDate,
                i.DueDate,
                i.PaidDate,
                i.Status,
                i.Notes
            ))
            .ToListAsync();

        return new PagedResult<InvoiceDto>(items, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<InvoiceDto>> GetInvoiceByIdAsync(Guid id)
    {
        var i = await _context.Invoices
            .AsNoTracking()
            .Include(inv => inv.Student)
            .Include(inv => inv.Parent)
            .Include(inv => inv.Group)
            .FirstOrDefaultAsync(inv => inv.Id == id);

        if (i == null) throw new NotFoundException("Hisob-faktura topilmadi.");

        var dto = new InvoiceDto(
            i.Id,
            i.InvoiceNumber,
            i.StudentId,
            $"{i.Student.FirstName} {i.Student.LastName}",
            i.ParentId,
            i.Parent != null ? i.Parent.FullName : null,
            i.GroupId,
            i.Group != null ? i.Group.Name : null,
            i.PaymentId,
            i.BillingPeriod,
            i.Amount,
            i.IssueDate,
            i.DueDate,
            i.PaidDate,
            i.Status,
            i.Notes
        );

        return ApiResponse<InvoiceDto>.Ok(dto);
    }

    public async Task<ApiResponse<InvoiceDto>> CreateInvoiceAsync(CreateInvoiceDto dto)
    {
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == dto.StudentId);
        if (student == null) throw new NotFoundException("O'quvchi topilmadi.");

        var invoiceCount = await _context.Invoices.CountAsync();
        var invNumber = $"INV-{DateTime.UtcNow:yyyyMM}-{(invoiceCount + 1):D4}";

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = invNumber,
            StudentId = dto.StudentId,
            ParentId = student.ParentId,
            GroupId = dto.GroupId,
            Amount = dto.Amount,
            BillingPeriod = dto.BillingPeriod,
            IssueDate = DateTime.UtcNow,
            DueDate = dto.DueDate,
            Status = InvoiceStatus.Issued,
            Notes = dto.Notes
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return await GetInvoiceByIdAsync(invoice.Id);
    }

    public async Task<ApiResponse<ReceiptDto>> GenerateReceiptAsync(Guid invoiceId)
    {
        var inv = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Student)
            .Include(i => i.Group)
            .Include(i => i.Organization)
            .Include(i => i.Payment)
            .ThenInclude(p => p!.Transactions)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (inv == null) throw new NotFoundException("Hisob-faktura topilmadi.");

        var org = await _context.Organizations.FirstOrDefaultAsync();
        var lastTx = inv.Payment?.Transactions.OrderByDescending(t => t.PaymentDate).FirstOrDefault();

        var receiptNumber = $"RCP-{inv.InvoiceNumber.Replace("INV-", "")}";
        var verification = $"VER-{inv.Id.ToString()[..8].ToUpper()}";

        var receipt = new ReceiptDto(
            ReceiptNumber: receiptNumber,
            OrganizationName: org?.Name ?? "EduFlow Learning Center",
            OrganizationPhone: org?.Phone ?? "+998 71 200 00 00",
            OrganizationAddress: org?.Address ?? "Toshkent shahri",
            StudentName: $"{inv.Student.FirstName} {inv.Student.LastName}",
            GroupName: inv.Group?.Name ?? "Kurs to'lovi",
            Amount: inv.Amount,
            PaidAt: inv.PaidDate ?? DateTime.UtcNow,
            Method: lastTx?.Method ?? PaymentMethod.Cash,
            TransactionId: lastTx?.Id.ToString() ?? inv.Id.ToString(),
            VerificationCode: verification
        );

        return ApiResponse<ReceiptDto>.Ok(receipt);
    }

    public async Task<ApiResponse<bool>> MarkInvoiceAsPaidAsync(Guid invoiceId)
    {
        var inv = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId);
        if (inv == null) throw new NotFoundException("Hisob-faktura topilmadi.");

        inv.Status = InvoiceStatus.Paid;
        inv.PaidDate = DateTime.UtcNow;

        // If connected to a Payment record, update it too
        if (inv.PaymentId.HasValue)
        {
            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == inv.PaymentId.Value);
            if (payment != null)
            {
                payment.PaidAmount = payment.FinalAmount;
                payment.DebtAmount = 0;
                payment.Status = PaymentStatus.Paid;
                payment.PaymentDate = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Hisob-faktura to'langan deb belgilandi.");
    }
}
