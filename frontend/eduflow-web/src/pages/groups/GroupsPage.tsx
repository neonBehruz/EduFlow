import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupApi, teacherApi, subjectApi, studentApi } from '../../services/api';
import { Group, Teacher, Subject, Student } from '../../types';
import { Modal, ConfirmModal, Badge, LoadingSpinner } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { StartupEmptyState } from '../../components/common/StartupEmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Users, Clock, MapPin, Edit2, Trash2, ArrowRight, GraduationCap, Calendar, Check, Search } from 'lucide-react';

export const GroupsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const langPrefix = '/' + language.toLowerCase();
  const canManage = user?.role === 1 || user?.role === 2;

  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
    subjectId: '',
    monthlyFee: 400000,
    maxStudents: 15,
    scheduleDescription: '',
    room: '',
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [formError, setFormError] = useState('');

  // Schedule Constructor State
  const [selectedDays, setSelectedDays] = useState<string[]>(['Dush', 'Chor', 'Juma']);
  const [startTime, setStartTime] = useState('14:00');
  const [durationHours, setDurationHours] = useState(2.0);

  const ALL_DAYS = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shanba', 'Yakshanba'];

  const computeScheduleText = (days: string[], start: string, duration: number) => {
    if (!days || days.length === 0) return '';
    const [hStr, mStr] = (start || '14:00').split(':');
    const h = parseInt(hStr || '14', 10);
    const m = parseInt(mStr || '0', 10);
    const totalMinutes = h * 60 + m + Math.round(duration * 60);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    const durText = duration === 1 ? '1 soat' : duration === 1.5 ? '1.5 soat (90 daqiqa)' : `${duration} soat`;
    return `${days.join(', ')} | ${start} - ${endFormatted} (${durText})`;
  };

  const handleDayToggle = (day: string) => {
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(nextDays);
    const updated = computeScheduleText(nextDays, startTime, durationHours);
    setFormData((prev) => ({ ...prev, scheduleDescription: updated }));
  };

  const applyPreset = (preset: 'odd' | 'even' | 'all' | 'weekend') => {
    let nextDays: string[] = [];
    if (preset === 'odd') nextDays = ['Dush', 'Chor', 'Juma'];
    if (preset === 'even') nextDays = ['Sesh', 'Pay', 'Shanba'];
    if (preset === 'all') nextDays = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shanba'];
    if (preset === 'weekend') nextDays = ['Shanba', 'Yakshanba'];
    setSelectedDays(nextDays);
    const updated = computeScheduleText(nextDays, startTime, durationHours);
    setFormData((prev) => ({ ...prev, scheduleDescription: updated }));
  };

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    const updated = computeScheduleText(selectedDays, val, durationHours);
    setFormData((prev) => ({ ...prev, scheduleDescription: updated }));
  };

  const handleDurationChange = (val: number) => {
    setDurationHours(val);
    const updated = computeScheduleText(selectedDays, startTime, val);
    setFormData((prev) => ({ ...prev, scheduleDescription: updated }));
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await groupApi.getAll({ pageSize: 50 });
      setGroups(res.items);
    } catch (err) {
      console.error('Groups fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    teacherApi.getAll({ pageSize: 100 }).then((res) => setTeachers(res.items));
    subjectApi.getAll().then((res) => setSubjects(res));
    studentApi.getAll({ pageSize: 100 }).then((res) => setStudents(res.items));
  }, []);

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        ...formData,
        teacherId: formData.teacherId || undefined,
        subjectId: formData.subjectId || undefined,
        studentIds: selectedStudentIds.length > 0 ? selectedStudentIds : undefined,
      };

      if (selectedGroup) {
        await groupApi.update(selectedGroup.id, {
          ...payload,
          isActive: selectedGroup.isActive,
        });
      } else {
        await groupApi.create(payload);
      }
      setIsModalOpen(false);
      fetchGroups();
    } catch (err: any) {
      setFormError(
        err.response?.data?.message ||
          (language === 'RU'
            ? 'Ошибка при сохранении группы.'
            : language === 'EN'
            ? 'Error saving group.'
            : 'Guruhni saqlashda xatolik yuz berdi.')
      );
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    try {
      await groupApi.delete(selectedGroup.id);
      setIsDeleteOpen(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (err) {
      console.error('Delete group error', err);
    }
  };

  const openCreateModal = () => {
    setSelectedGroup(null);
    const initialDays = ['Dush', 'Chor', 'Juma'];
    const initialStart = '14:00';
    const initialDuration = 2.0;
    const initialDesc = computeScheduleText(initialDays, initialStart, initialDuration);

    setSelectedDays(initialDays);
    setStartTime(initialStart);
    setDurationHours(initialDuration);
    setSelectedStudentIds([]);
    setStudentSearch('');

    setFormData({
      name: '',
      teacherId: '',
      subjectId: '',
      monthlyFee: 400000,
      maxStudents: 15,
      scheduleDescription: initialDesc,
      room: '102-xona',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    setSelectedGroup(group);
    setSelectedStudentIds([]);
    setStudentSearch('');

    setFormData({
      name: group.name,
      teacherId: group.teacherId || '',
      subjectId: group.subjectId || '',
      monthlyFee: group.monthlyFee,
      maxStudents: group.maxStudents,
      scheduleDescription: group.scheduleDescription || '',
      room: group.room || '',
    });
    setIsModalOpen(true);
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      (s.phoneNumber && s.phoneNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <StartupBanner
        badgeText={language === 'RU' ? 'Академические Группы 👥' : language === 'EN' ? 'Academic Groups 👥' : 'Akademik Guruhlar 👥'}
        title={t('groups.title', 'Guruhlar va Kurslar')}
        description={t('groups.desc', 'Barcha o‘quv guruhlari, haftalik dars jadvallari, o‘qituvchilar va dars vaqtlari.')}
        icon={<Users className="w-6 h-6" />}
        gradientTheme="amber"
        metrics={[
          { label: t('dash.active_groups', 'Jami guruhlar'), value: `${groups.length} ${language === 'RU' ? 'гр.' : language === 'EN' ? 'groups' : 'ta'}` },
          { label: t('table.status', 'Dars jadvallari'), value: t('status.active', 'Faol') },
        ]}
        actions={
          canManage ? (
            <button
              onClick={openCreateModal}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('groups.add_new', 'Yangi guruh ochish')}</span>
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingSpinner text={t('action.loading', 'Guruhlar yuklanmoqda...')} />
      ) : groups.length === 0 ? (
        <StartupEmptyState
          title={language === 'RU' ? 'Пока нет групп' : language === 'EN' ? 'No groups yet' : 'Hozircha guruhlar mavjud emas'}
          subtitle={
            canManage
              ? language === 'RU' ? 'Создайте учебную группу, прикрепите предмет, преподавателя и расписание.' : language === 'EN' ? 'Create a study group, assign a subject, teacher, and schedule.' : 'Yangi o‘quv guruhi oching, unga fan va o‘qituvchi biriktiring hamda dars vaqtlarini belgilang.'
              : language === 'RU' ? 'Вам пока не назначены группы.' : language === 'EN' ? 'You do not have any groups assigned yet.' : 'Sizga hali guruhlar biriktirilmagan.'
          }
          type="groups"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 4xl:grid-cols-5 gap-4 sm:gap-5">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group relative bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 p-6 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-80 group-hover:h-1.5 transition-all" />
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    {group.subjectName && <Badge variant="info">{group.subjectName}</Badge>}
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mt-1.5 group-hover:text-[#0050cb] transition-colors">
                      {group.name}
                    </h3>
                  </div>
                  <Badge variant={group.isActive ? 'success' : 'neutral'}>
                    {group.isActive ? t('status.active', 'Faol') : t('status.inactive', 'Nofaol')}
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 my-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#0050cb]" />
                    <span>
                      {t('table.teacher', 'O\'qituvchi')}:{' '}
                      <strong className="text-slate-800 dark:text-white">
                        {group.teacherName ? (
                          <span className="text-[#0050cb] font-bold">{group.teacherName}</span>
                        ) : (
                          <span className="text-amber-500 font-semibold italic">Biriktirilmagan</span>
                        )}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>
                      {t('table.student', 'O\'quvchilar')}: <strong className="text-slate-800 dark:text-white">{group.enrolledStudentsCount} / {group.maxStudents}</strong>
                    </span>
                  </div>

                  {group.scheduleDescription && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] font-semibold text-[#0050cb] dark:text-blue-300">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-[#0050cb]" />
                      <span>{group.scheduleDescription}</span>
                    </div>
                  )}

                  {group.room && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('table.room', 'Xona')}: <strong>{group.room}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{t('groups.monthly_fee', 'Oylik to\'lov')}</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                    {group.monthlyFee.toLocaleString()} UZS
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {canManage && (
                    <>
                      <button
                        onClick={() => openEditModal(group)}
                        title={t('action.edit', 'Tahrirlash')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setIsDeleteOpen(true);
                        }}
                        title={t('action.delete', 'O\'chirish')}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <Link
                    to={user?.role === 3 ? `${langPrefix}/teacher/groups/${group.id}` : `${langPrefix}/groups/${group.id}`}
                    className="p-1.5 px-3 bg-blue-50 dark:bg-blue-950/40 text-[#0050cb] dark:text-blue-300 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>{t('action.details', 'Batafsil')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGroup ? t('groups.modal_edit_title', 'Guruhni tahrirlash') : t('groups.modal_add_title', 'Yangi guruh ochish')}
      >
        <form onSubmit={handleSaveGroup} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">{formError}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('groups.name', 'Guruh nomi')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masalan: Frontend React - Guruh 1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('table.subject', 'Fan')} *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              >
                <option value="">{language === 'RU' ? 'Выберите предмет' : language === 'EN' ? 'Select subject' : 'Fan tanlang'}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('table.teacher', 'O\'qituvchini biriktirish')} *
              </label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-medium"
              >
                <option value="">{language === 'RU' ? 'Выберите преподавателя' : language === 'EN' ? 'Select teacher' : 'O\'qituvchi tanlang'}</option>
                {teachers.map((tItem) => (
                  <option key={tItem.id} value={tItem.id}>
                    {tItem.fullName} {tItem.specialization ? `(${tItem.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('groups.monthly_fee', 'Oylik to\'lov (UZS)')} *
              </label>
              <input
                type="number"
                required
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'RU' ? 'Макс. студентов' : language === 'EN' ? 'Max students' : 'Maksimal o\'quvchi'} *
              </label>
              <input
                type="number"
                required
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('table.room', 'Xona')}
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="102-xona"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Detailed Schedule Constructor */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0050cb]" />
                <span>Dars Jadvali va Davomiyligi Soati</span>
              </span>
              <span className="text-[10px] font-semibold text-[#0050cb] bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                Jadval konstruktori
              </span>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                Tezkor kunlar andozasi:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('odd')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 hover:bg-blue-50 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  🔵 Toq kunlar (Du-Cho-Ju)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('even')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  🟢 Juft kunlar (Se-Pa-Sha)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 hover:bg-purple-50 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  🟣 Har kuni (Du-Sha)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('weekend')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 hover:bg-amber-50 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  🟠 Dam olish (Sha-Yak)
                </button>
              </div>
            </div>

            {/* Days pills */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Hafta kunlarini tanlash:
              </span>
              <div className="flex flex-wrap gap-1">
                {ALL_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#0050cb] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time & Duration */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Boshlanish vaqti:
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Dars davomiyligi (soat):
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => handleDurationChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                >
                  <option value={1.0}>1 soat (60 daqiqa)</option>
                  <option value={1.5}>1.5 soat (90 daqiqa)</option>
                  <option value={2.0}>2 soat (120 daqiqa)</option>
                  <option value={2.5}>2.5 soat (150 daqiqa)</option>
                  <option value={3.0}>3 soat (180 daqiqa)</option>
                </select>
              </div>
            </div>

            {/* Result preview & Custom override */}
            <div className="pt-2 border-t border-blue-100 dark:border-slate-700">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Jadval tavsifi (avtomatik formatlangan):
              </label>
              <input
                type="text"
                value={formData.scheduleDescription}
                onChange={(e) => setFormData({ ...formData, scheduleDescription: e.target.value })}
                placeholder="Dush, Chor, Juma | 14:00 - 16:00 (2 soat)"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#0050cb] dark:text-blue-300"
              />
            </div>
          </div>

          {/* Student enrollment during creation */}
          {!selectedGroup && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>O'quvchilarni biriktirish (Ixtiyoriy)</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">
                  {selectedStudentIds.length} ta tanlandi
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="O'quvchi ismi yoki telefon raqami..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800">
                {filteredStudents.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-2">O'quvchilar topilmadi</p>
                ) : (
                  filteredStudents.map((st) => {
                    const isChecked = selectedStudentIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                          isChecked ? 'bg-blue-50 dark:bg-blue-950/40 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds([...selectedStudentIds, st.id]);
                              } else {
                                setSelectedStudentIds(selectedStudentIds.filter((id) => id !== st.id));
                              }
                            }}
                            className="rounded text-[#0050cb]"
                          />
                          <span className="text-slate-800 dark:text-white">
                            {st.firstName} {st.lastName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{st.phoneNumber}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t('action.cancel', 'Bekor qilish')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {t('action.save', 'Saqlash va Guruhni ochish')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteGroup}
        title={t('groups.modal_delete_title', 'Guruhni o\'chirish')}
        message={t('groups.delete_confirm', `${selectedGroup?.name} guruhini o'chirishni tasdiqlaysizmi?`)}
        confirmText={t('action.delete', 'O\'chirish')}
        cancelText={t('action.cancel', 'Bekor qilish')}
        isDanger
      />
    </div>
  );
};
