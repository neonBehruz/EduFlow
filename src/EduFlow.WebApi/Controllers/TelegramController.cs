using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using EduFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.WebApi.Controllers;

[Authorize]
[Route("api/telegram")]
public class TelegramController : BaseApiController
{
    private readonly ITelegramService _telegramService;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public TelegramController(
        ITelegramService telegramService,
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _telegramService = telegramService;
        _context = context;
        _currentUser = currentUser;
    }

    [HttpPost("connect")]
    public async Task<ActionResult<ApiResponse<bool>>> ConnectTelegram([FromBody] TelegramConnectDto dto)
    {
        var parent = await _context.Parents.FirstOrDefaultAsync(p => p.Id == dto.ParentId);
        if (parent == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Ota-ona topilmadi."));
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && parent.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        var existing = await _context.TelegramAccounts.FirstOrDefaultAsync(t => t.ParentId == dto.ParentId);
        if (existing != null)
        {
            existing.ChatId = dto.ChatId;
            existing.Username = dto.Username;
            existing.IsConnected = true;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.TelegramAccounts.Add(new TelegramAccount
            {
                OrganizationId = parent.OrganizationId,
                ParentId = dto.ParentId,
                ChatId = dto.ChatId,
                Username = dto.Username,
                IsConnected = true
            });
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Telegram akkaunti muvaffaqiyatli ulandi."));
    }

    [EnableRateLimiting("sms-policy")]
    [HttpPost("send")]
    public async Task<ActionResult<ApiResponse<bool>>> SendTelegramMessage([FromBody] TelegramSendDto dto)
    {
        var parent = await _context.Parents.FirstOrDefaultAsync(p => p.Id == dto.ParentId);
        if (parent == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Ota-ona topilmadi."));
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && parent.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        var account = await _context.TelegramAccounts.FirstOrDefaultAsync(t => t.ParentId == dto.ParentId && t.IsConnected);
        if (account == null || string.IsNullOrEmpty(account.ChatId))
        {
            return Ok(ApiResponse<bool>.Fail("Ushbu ota-ona uchun Telegram ulanmagan."));
        }

        var sent = await _telegramService.SendMessageAsync(account.ChatId, dto.Message);
        return Ok(ApiResponse<bool>.Ok(sent, sent ? "Xabar yuborildi." : "Xabar yuborishda xatolik."));
    }

    [HttpGet("status/{parentId:guid}")]
    public async Task<ActionResult<ApiResponse<TelegramStatusDto>>> GetTelegramStatus(Guid parentId)
    {
        var parent = await _context.Parents.FirstOrDefaultAsync(p => p.Id == parentId);
        if (parent == null)
        {
            return NotFound(ApiResponse<TelegramStatusDto>.Fail("Ota-ona topilmadi."));
        }

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.OrganizationId.HasValue && parent.OrganizationId != _currentUser.OrganizationId.Value)
        {
            throw new ForbiddenException();
        }

        var account = await _context.TelegramAccounts.FirstOrDefaultAsync(t => t.ParentId == parentId);
        var status = new TelegramStatusDto(
            account?.IsConnected ?? false,
            account?.ChatId,
            account?.Username
        );
        return Ok(ApiResponse<TelegramStatusDto>.Ok(status));
    }
}
