using EduFlow.Application.Common.Exceptions;
using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using EduFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Application.Services;

public class CalendarService : ICalendarService
{
    private readonly IApplicationDbContext _context;

    public CalendarService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<CalendarEventDto>>> GetCalendarEventsAsync(
        DateTime start,
        DateTime end,
        Guid? teacherId = null,
        Guid? roomId = null,
        Guid? groupId = null)
    {
        var query = _context.Lessons
            .AsNoTracking()
            .Where(l => l.StartTime >= start && l.EndTime <= end && l.Status != LessonStatus.Cancelled)
            .Include(l => l.Group)
            .ThenInclude(g => g.Subject)
            .Include(l => l.Group)
            .ThenInclude(g => g.Teacher)
            .Include(l => l.Teacher)
            .Include(l => l.Room)
            .AsQueryable();

        if (groupId.HasValue && groupId != Guid.Empty)
        {
            query = query.Where(l => l.GroupId == groupId.Value);
        }

        if (teacherId.HasValue && teacherId != Guid.Empty)
        {
            query = query.Where(l => l.TeacherId == teacherId.Value || (l.Group != null && l.Group.TeacherId == teacherId.Value));
        }

        if (roomId.HasValue && roomId != Guid.Empty)
        {
            query = query.Where(l => l.RoomId == roomId.Value);
        }

        var lessons = await query.OrderBy(l => l.StartTime).ToListAsync();

        var colors = new[] { "#0050cb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2" };

        var events = lessons.Select(l =>
        {
            var effectiveTeacher = l.Teacher ?? l.Group.Teacher;
            var colorIdx = Math.Abs(l.GroupId.GetHashCode()) % colors.Length;
            var color = colors[colorIdx];

            return new CalendarEventDto(
                Id: l.Id,
                GroupId: l.GroupId,
                GroupName: l.Group.Name,
                SubjectId: l.Group.SubjectId,
                SubjectName: l.Group.Subject?.Name,
                TeacherId: effectiveTeacher?.Id,
                TeacherName: effectiveTeacher?.FullName,
                RoomId: l.RoomId,
                RoomName: l.Room?.Name,
                RoomNumber: l.Room?.Number,
                StartTime: l.StartTime,
                EndTime: l.EndTime,
                Status: l.Status,
                Topic: l.Topic,
                Color: color
            );
        }).ToList();

        return ApiResponse<List<CalendarEventDto>>.Ok(events);
    }

    public async Task<ScheduleConflictResultDto> CheckConflictAsync(ScheduleConflictCheckDto dto)
    {
        if (dto.EndTime <= dto.StartTime)
        {
            return new ScheduleConflictResultDto(true, "Validation", "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak.", null);
        }

        // 1. Group conflict check
        if (dto.GroupId.HasValue && dto.GroupId != Guid.Empty)
        {
            var groupConflict = await _context.Lessons
                .AsNoTracking()
                .Where(l => l.GroupId == dto.GroupId.Value &&
                            l.Status != LessonStatus.Cancelled &&
                            (!dto.LessonId.HasValue || l.Id != dto.LessonId.Value) &&
                            dto.StartTime < l.EndTime && dto.EndTime > l.StartTime)
                .Include(l => l.Group)
                .FirstOrDefaultAsync();

            if (groupConflict != null)
            {
                var msg = $"Guruh to'qnashuvi: '{groupConflict.Group.Name}' guruhi uchun allaqachon {groupConflict.StartTime:HH:mm} dan {groupConflict.EndTime:HH:mm} gacha dars belgilangan.";
                return new ScheduleConflictResultDto(true, "Group", msg, groupConflict.Id);
            }
        }

        // 2. Teacher conflict check
        if (dto.TeacherId.HasValue && dto.TeacherId != Guid.Empty)
        {
            var teacherConflict = await _context.Lessons
                .AsNoTracking()
                .Where(l => (l.TeacherId == dto.TeacherId.Value || (l.Group != null && l.Group.TeacherId == dto.TeacherId.Value)) &&
                            l.Status != LessonStatus.Cancelled &&
                            (!dto.LessonId.HasValue || l.Id != dto.LessonId.Value) &&
                            dto.StartTime < l.EndTime && dto.EndTime > l.StartTime)
                .Include(l => l.Group)
                .FirstOrDefaultAsync();

            if (teacherConflict != null)
            {
                var msg = $"O'qituvchi band: Ushbu o'qituvchi {teacherConflict.StartTime:HH:mm} dan {teacherConflict.EndTime:HH:mm} gacha '{teacherConflict.Group.Name}' guruhida dars o'tadi.";
                return new ScheduleConflictResultDto(true, "Teacher", msg, teacherConflict.Id);
            }
        }

        // 3. Room conflict check
        if (dto.RoomId.HasValue && dto.RoomId != Guid.Empty)
        {
            var roomConflict = await _context.Lessons
                .AsNoTracking()
                .Where(l => l.RoomId == dto.RoomId.Value &&
                            l.Status != LessonStatus.Cancelled &&
                            (!dto.LessonId.HasValue || l.Id != dto.LessonId.Value) &&
                            dto.StartTime < l.EndTime && dto.EndTime > l.StartTime)
                .Include(l => l.Room)
                .Include(l => l.Group)
                .FirstOrDefaultAsync();

            if (roomConflict != null)
            {
                var roomName = roomConflict.Room != null ? $"{roomConflict.Room.Name} ({roomConflict.Room.Number}-xona)" : "Tanlangan xona";
                var msg = $"Xona band: {roomName} allaqachon {roomConflict.StartTime:HH:mm} dan {roomConflict.EndTime:HH:mm} gacha '{roomConflict.Group.Name}' guruhi tomonidan band qilingan.";
                return new ScheduleConflictResultDto(true, "Room", msg, roomConflict.Id);
            }
        }

        return new ScheduleConflictResultDto(false, null, null, null);
    }
}
