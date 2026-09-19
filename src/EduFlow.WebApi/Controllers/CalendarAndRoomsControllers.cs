using EduFlow.Application.Common.Models;
using EduFlow.Application.DTOs;
using EduFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduFlow.WebApi.Controllers;

[Authorize]
[Route("api/calendar")]
public class CalendarController : BaseApiController
{
    private readonly ICalendarService _calendarService;

    public CalendarController(ICalendarService calendarService)
    {
        _calendarService = calendarService;
    }

    [HttpGet("events")]
    public async Task<ActionResult<ApiResponse<List<CalendarEventDto>>>> GetEvents(
        [FromQuery] DateTime start,
        [FromQuery] DateTime end,
        [FromQuery] Guid? teacherId,
        [FromQuery] Guid? roomId,
        [FromQuery] Guid? groupId)
    {
        if (start == default) start = DateTime.UtcNow.AddDays(-7);
        if (end == default) end = DateTime.UtcNow.AddDays(30);

        var result = await _calendarService.GetCalendarEventsAsync(start, end, teacherId, roomId, groupId);
        return Ok(result);
    }

    [HttpPost("check-conflict")]
    public async Task<ActionResult<ScheduleConflictResultDto>> CheckConflict([FromBody] ScheduleConflictCheckDto dto)
    {
        var result = await _calendarService.CheckConflictAsync(dto);
        return Ok(result);
    }
}

[Authorize]
[Route("api/rooms")]
public class RoomsController : BaseApiController
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<RoomDto>>> GetRooms(
        [FromQuery] string? search,
        [FromQuery] Guid? branchId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _roomService.GetRoomsAsync(search, branchId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<RoomDto>>> GetRoomById(Guid id)
    {
        var result = await _roomService.GetRoomByIdAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<RoomDto>>> CreateRoom([FromBody] CreateRoomDto dto)
    {
        var result = await _roomService.CreateRoomAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<RoomDto>>> UpdateRoom(Guid id, [FromBody] UpdateRoomDto dto)
    {
        var result = await _roomService.UpdateRoomAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "CenterAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteRoom(Guid id)
    {
        var result = await _roomService.DeleteRoomAsync(id);
        return Ok(result);
    }
}
