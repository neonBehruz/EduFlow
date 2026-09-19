using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class RoomService : IRoomService
{
    private readonly IApplicationDbContext _context;

    public RoomService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<RoomDto>> GetRoomsAsync(string? search, Guid? branchId, int page = 1, int pageSize = 20)
    {
        var query = _context.Rooms
            .AsNoTracking()
            .Include(r => r.Branch)
            .Include(r => r.Lessons)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower().Trim();
            query = query.Where(r => r.Name.ToLower().Contains(s) || r.Number.ToLower().Contains(s));
        }

        if (branchId.HasValue && branchId != Guid.Empty)
        {
            query = query.Where(r => r.BranchId == branchId);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(r => r.Number)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoomDto(
                r.Id,
                r.OrganizationId,
                r.BranchId,
                r.Branch != null ? r.Branch.Name : null,
                r.Name,
                r.Number,
                r.Capacity,
                r.Type,
                r.Equipment,
                r.Status,
                r.IsActive,
                r.Lessons.Count(l => l.StartTime <= DateTime.UtcNow && l.EndTime >= DateTime.UtcNow)
            ))
            .ToListAsync();

        return new PagedResult<RoomDto>(items, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<RoomDto>> GetRoomByIdAsync(Guid id)
    {
        var r = await _context.Rooms
            .AsNoTracking()
            .Include(r => r.Branch)
            .Include(r => r.Lessons)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (r == null) throw new NotFoundException("Xona topilmadi.");

        var dto = new RoomDto(
            r.Id,
            r.OrganizationId,
            r.BranchId,
            r.Branch != null ? r.Branch.Name : null,
            r.Name,
            r.Number,
            r.Capacity,
            r.Type,
            r.Equipment,
            r.Status,
            r.IsActive,
            r.Lessons.Count(l => l.StartTime <= DateTime.UtcNow && l.EndTime >= DateTime.UtcNow)
        );

        return ApiResponse<RoomDto>.Ok(dto);
    }

    public async Task<ApiResponse<RoomDto>> CreateRoomAsync(CreateRoomDto dto)
    {
        var room = new Room
        {
            Id = Guid.NewGuid(),
            BranchId = dto.BranchId,
            Name = dto.Name,
            Number = dto.Number,
            Capacity = dto.Capacity,
            Type = dto.Type,
            Equipment = dto.Equipment,
            Status = dto.Status,
            IsActive = true
        };

        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();

        return await GetRoomByIdAsync(room.Id);
    }

    public async Task<ApiResponse<RoomDto>> UpdateRoomAsync(Guid id, UpdateRoomDto dto)
    {
        var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) throw new NotFoundException("Xona topilmadi.");

        room.BranchId = dto.BranchId;
        room.Name = dto.Name;
        room.Number = dto.Number;
        room.Capacity = dto.Capacity;
        room.Type = dto.Type;
        room.Equipment = dto.Equipment;
        room.Status = dto.Status;
        room.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return await GetRoomByIdAsync(room.Id);
    }

    public async Task<ApiResponse<bool>> DeleteRoomAsync(Guid id)
    {
        var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) throw new NotFoundException("Xona topilmadi.");

        _context.Rooms.Remove(room);
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Xona muvaffaqiyatli o'chirildi.");
    }
}
