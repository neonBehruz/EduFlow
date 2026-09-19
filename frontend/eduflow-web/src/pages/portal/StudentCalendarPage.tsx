import React, { useEffect, useState } from 'react';
import { studentPortalApi } from '../../services/api';
import { CalendarEventDto } from '../../types';
import { LoadingSpinner, Badge, Modal } from '../../components/common/UIComponents';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  GraduationCap,
  BookOpen,
  Filter,
  Layers,
  Sparkles,
  Info,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';

export const StudentCalendarPage: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week');
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDto | null>(null);

  useEffect(() => {
    loadEvents();
  }, [currentDate, viewMode]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Determine date range
      const start = new Date(currentDate);
      const end = new Date(currentDate);

      if (viewMode === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
      } else if (viewMode === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      const res = await studentPortalApi.getCalendar({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error('Student calendar load error', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigate dates
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Extract distinct groups for filter
  const groupOptions = Array.from(
    new Set(events.filter((e) => e.groupName).map((e) => e.groupName!))
  );

  const filteredEvents = selectedGroup === 'all'
    ? events
    : events.filter((e) => e.groupName === selectedGroup);

  // Generate the 7 days of current week (Mon-Sun)
  const getWeekDays = () => {
    const monday = new Date(currentDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Helper to format date range label
  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0050cb] via-[#0066ff] to-[#4d8eff] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Interaktiv Dars Jadvali
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Mening Dars Jadvalim
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Faqat siz a'zo bo'lgan guruhlarning darslari, xonalari, vaqtlari va ustozlari haqida to'liq ma'lumot.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-2xl backdrop-blur-md shadow-sm transition-all cursor-pointer"
            >
              Bugun
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Navigation, View Switcher & Group Filter */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={handlePrev}
              title="Oldingi"
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              title="Keyingi"
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* View Mode & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          {groupOptions.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#0050cb]"
              >
                <option value="all">Barcha Guruhlarim</option>
                {groupOptions.map((gn) => (
                  <option key={gn} value={gn}>
                    {gn}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {(['week', 'day', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-700 text-[#0050cb] dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode === 'week' ? 'Haftalik' : mode === 'day' ? 'Kunlik' : 'Oylik'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Timetable Content */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner text="Dars jadvali yuklanmoqda..." />
        </div>
      ) : viewMode === 'week' ? (
        /* Weekly Timetable View (Mon-Sun columns) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {weekDays.map((dayDate, idx) => {
            const dayEvents = filteredEvents.filter((ev) => {
              const evDate = new Date(ev.startTime || ev.start || '');
              return (
                evDate.getDate() === dayDate.getDate() &&
                evDate.getMonth() === dayDate.getMonth() &&
                evDate.getFullYear() === dayDate.getFullYear()
              );
            });

            const dayName = dayDate.toLocaleDateString(locale, { weekday: 'short' });
            const dayNumber = dayDate.getDate();
            const today = isToday(dayDate);

            return (
              <div
                key={idx}
                className={`rounded-3xl border transition-all flex flex-col min-h-[320px] ${
                  today
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 shadow-md'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 shadow-xs'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 text-center border-b rounded-t-3xl ${
                    today
                      ? 'bg-gradient-to-r from-[#0050cb] to-[#0066ff] text-white border-transparent'
                      : 'border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    {dayName}
                  </p>
                  <p className="text-xl font-black mt-0.5">{dayNumber}</p>
                </div>

                {/* Day Events List */}
                <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[500px]">
                  {dayEvents.length > 0 ? (
                    dayEvents.map((ev) => {
                      const startTimeStr = ev.startTime || ev.start;
                      const endTimeStr = ev.endTime || ev.end;
                      const startFmt = startTimeStr
                        ? new Date(startTimeStr).toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '';
                      const endFmt = endTimeStr
                        ? new Date(endTimeStr).toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '';

                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:shadow-md hover:border-[#0050cb] dark:hover:border-blue-500 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0050cb] dark:text-blue-300 truncate max-w-[120px]">
                              {ev.groupName}
                            </span>
                            {ev.subjectName && (
                              <span className="text-[9px] font-semibold text-slate-400 truncate">
                                {ev.subjectName}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#0050cb] dark:group-hover:text-blue-400 transition-colors">
                            {ev.topic || ev.title || 'Dars mashg‘uloti'}
                          </h4>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1 font-bold text-blue-700 dark:text-blue-300">
                              <Clock className="w-3 h-3 text-[#0050cb] shrink-0" />
                              <span>{startFmt} - {endFmt}</span>
                            </div>

                            {ev.teacherName && (
                              <div className="flex items-center gap-1 truncate">
                                <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{ev.teacherName}</span>
                              </div>
                            )}

                            {(ev.roomName || ev.roomNumber) && (
                              <div className="flex items-center gap-1 text-[10px]">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{ev.roomName || `Xona ${ev.roomNumber}`}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      Dars yo‘q
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Day / Month View */
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((ev) => {
                const startTimeStr = ev.startTime || ev.start;
                const endTimeStr = ev.endTime || ev.end;
                const dateObj = startTimeStr ? new Date(startTimeStr) : new Date();
                const dateFmt = dateObj.toLocaleDateString(locale, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });
                const startFmt = startTimeStr
                  ? new Date(startTimeStr).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                  : '';
                const endFmt = endTimeStr
                  ? new Date(endTimeStr).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:border-[#0050cb] dark:hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-[#0050cb] dark:text-blue-300">
                          {ev.groupName}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {dateFmt}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        {ev.topic || ev.title || 'Dars mashg‘uloti'}
                      </h4>

                      {ev.subjectName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Fan: {ev.subjectName}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-bold text-[#0050cb] dark:text-blue-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{startFmt} - {endFmt}</span>
                      </div>

                      {ev.teacherName && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ustoz: {ev.teacherName}</span>
                        </div>
                      )}

                      {(ev.roomName || ev.roomNumber) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Xona: {ev.roomName || ev.roomNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Ushbu vaqt oralig‘ida rejalashtirilgan darslar topilmadi.
            </div>
          )}
        </div>
      )}

      {/* Lesson Details Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Dars Tafsilotlari"
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black text-[#0050cb] dark:text-blue-300">
                  {selectedEvent.groupName}
                </span>
                {selectedEvent.subjectName && (
                  <Badge variant="info">{selectedEvent.subjectName}</Badge>
                )}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {selectedEvent.topic || selectedEvent.title || 'Dars mashg‘uloti'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">
                  SANA VA VAQT
                </span>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0050cb]" />
                  <span>
                    {new Date(selectedEvent.startTime || selectedEvent.start || '').toLocaleDateString(locale, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                  {new Date(selectedEvent.startTime || selectedEvent.start || '').toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(selectedEvent.endTime || selectedEvent.end || '').toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">
                  O‘QITUVCHI & XONA
                </span>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedEvent.teacherName || 'Biriktirilmagan'}</span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{selectedEvent.roomName || selectedEvent.roomNumber || 'Asosiy bino'}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
