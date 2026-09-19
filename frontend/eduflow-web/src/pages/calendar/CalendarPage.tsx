import React, { useEffect, useState } from 'react';
import { calendarApi, teacherApi, groupApi, roomApi } from '../../services/api';
import { CalendarEventDto, Teacher, Group, RoomDto, ConflictCheckResultDto } from '../../types';
import { LoadingSpinner, Badge, Modal } from '../../components/common/UIComponents';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Conflict Check Modal
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [checkStartTime, setCheckStartTime] = useState('');
  const [checkEndTime, setCheckEndTime] = useState('');
  const [checkTeacherId, setCheckTeacherId] = useState('');
  const [checkRoomId, setCheckRoomId] = useState('');
  const [checkGroupId, setCheckGroupId] = useState('');
  const [conflictResult, setConflictResult] = useState<ConflictCheckResultDto | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [currentDate, viewMode, selectedTeacher, selectedRoom, selectedGroup]);

  const loadFilters = async () => {
    try {
      const [tRes, gRes, rRes] = await Promise.all([
        teacherApi.getAll({ pageSize: 100 }),
        groupApi.getAll({ pageSize: 100 }),
        roomApi.getAll(),
      ]);
      if (tRes.items) setTeachers(tRes.items);
      if (gRes.items) setGroups(gRes.items);
      if (rRes.success && rRes.data) setRooms(rRes.data);
    } catch (err) {
      console.error('Filter load error', err);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Determine date range based on viewMode
      const start = new Date(currentDate);
      const end = new Date(currentDate);

      if (viewMode === 'month') {
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
      } else if (viewMode === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end.setDate(start.getDate() + 6);
      } else {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      const res = await calendarApi.getEvents({
        start: start.toISOString(),
        end: end.toISOString(),
        teacherId: selectedTeacher || undefined,
        roomId: selectedRoom || undefined,
        groupId: selectedGroup || undefined,
      });

      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error('Events load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleCheckConflict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkStartTime || !checkEndTime) return;

    try {
      setCheckingConflict(true);
      const res = await calendarApi.checkConflict({
        startTime: new Date(checkStartTime).toISOString(),
        endTime: new Date(checkEndTime).toISOString(),
        teacherId: checkTeacherId || undefined,
        roomId: checkRoomId || undefined,
        groupId: checkGroupId || undefined,
      });
      if (res.success && res.data) {
        setConflictResult(res.data);
      }
    } catch (err) {
      console.error('Conflict check error', err);
    } finally {
      setCheckingConflict(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('calendar.title', 'Dars Jadvali & Kalendar')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('calendar.subtitle', "O'qituvchilar, guruhlar va xonalar bandligi")}
            </p>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setConflictModalOpen(true);
              setConflictResult(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{t('calendar.check_conflict', 'Konfliktni tekshirish')}</span>
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-900 text-[#0050cb] dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode === 'month' ? t('calendar.month', 'Oy') : mode === 'week' ? t('calendar.week', 'Hafta') : t('calendar.day', 'Kun')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
            >
              {t('calendar.today', 'Bugun')}
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="">{t('calendar.all_teachers', "Barcha o'qituvchilar")}</option>
          {teachers.map((tItem) => (
            <option key={tItem.id} value={tItem.id}>
              {tItem.fullName}
            </option>
          ))}
        </select>

        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="">{t('calendar.all_groups', "Barcha guruhlar")}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="">{t('calendar.all_rooms', "Barcha xonalar")}</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.number})
            </option>
          ))}
        </select>
      </div>

      {/* Events Timeline / Grid */}
      {loading ? (
        <LoadingSpinner text={t('action.loading', 'Jadval yuklanmoqda...')} />
      ) : (
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
              {currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </h3>
            <span className="text-xs text-slate-400">
              {events.length} {t('dash.scheduled_lessons', 'dars')}
            </span>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-4 rounded-2xl border transition-all hover:shadow-md ${
                    evt.eventType === 'triallesson'
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                      : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        evt.eventType === 'triallesson'
                          ? 'bg-amber-200/70 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                          : 'bg-blue-200/70 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}
                    >
                      {evt.eventType === 'triallesson' 
                        ? (language === 'RU' ? 'Пробный урок' : language === 'EN' ? 'Trial Lesson' : 'Sinov darsi') 
                        : (language === 'RU' ? 'Урок группы' : language === 'EN' ? 'Group Lesson' : 'Guruh darsi')}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(evt.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{evt.title}</h4>

                  <div className="space-y-1 mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {evt.teacherName && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{t('table.teacher', 'O\'qituvchi')}: {evt.teacherName}</span>
                      </p>
                    )}
                    {evt.roomName && (
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{t('table.room', 'Xona')}: {evt.roomName}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              {t('calendar.no_events', 'Ushbu davrda darslar mavjud emas')}
            </div>
          )}
        </div>
      )}

      {/* Conflict Prevention Checker Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title={t('calendar.modal_title', 'Dars Jadvali Konfliktini Tekshirish')}
      >
        <form onSubmit={handleCheckConflict} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            {t('calendar.modal_desc', "Dars qo'yishdan oldin xona yoki o'qituvchining boshqa darsi bilan to'qnashuvini aniqlang.")}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('calendar.start_time', 'Boshlanish vaqti')}
              </label>
              <input
                type="datetime-local"
                value={checkStartTime}
                onChange={(e) => setCheckStartTime(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('calendar.end_time', 'Tugash vaqti')}
              </label>
              <input
                type="datetime-local"
                value={checkEndTime}
                onChange={(e) => setCheckEndTime(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('calendar.teacher_optional', "O'qituvchi (ixtiyoriy)")}
            </label>
            <select
              value={checkTeacherId}
              onChange={(e) => setCheckTeacherId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="">{t('calendar.select_teacher', "O'qituvchini tanlang")}</option>
              {teachers.map((tItem) => (
                <option key={tItem.id} value={tItem.id}>
                  {tItem.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('calendar.room_optional', 'Xona (ixtiyoriy)')}
            </label>
            <select
              value={checkRoomId}
              onChange={(e) => setCheckRoomId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="">{t('calendar.select_room', 'Xonani tanlang')}</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('calendar.group_optional', 'Guruh (ixtiyoriy)')}
            </label>
            <select
              value={checkGroupId}
              onChange={(e) => setCheckGroupId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="">{t('calendar.select_group', 'Guruhni tanlang')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {conflictResult && (
            <div
              className={`p-4 rounded-2xl border ${
                conflictResult.hasConflict
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {conflictResult.hasConflict ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <span className="text-xs font-bold">
                  {conflictResult.hasConflict 
                    ? t('calendar.conflict_found', 'Konflikt mavjud!') 
                    : t('calendar.no_conflict', "Konflikt aniqlanmadi! Belgilangan vaqt bo'sh.")}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed">{conflictResult.message}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConflictModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t('action.cancel', 'Bekor qilish')}
            </button>
            <button
              type="submit"
              disabled={checkingConflict}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer disabled:opacity-50"
            >
              {checkingConflict ? t('calendar.checking', 'Tekshirilmoqda...') : t('calendar.check_btn', 'Tekshirish')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
