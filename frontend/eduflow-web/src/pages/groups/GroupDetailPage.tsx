import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupApi, studentApi, lessonApi } from '../../services/api';
import { GroupDetail, Student } from '../../types';
import { Badge, LoadingSpinner, EmptyState, Modal } from '../../components/common/UIComponents';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Play,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  Phone,
  ArrowRight,
} from 'lucide-react';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const langPrefix = '/' + language.toLowerCase();
  const canManage = user?.role === 1 || user?.role === 2;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [lessonFilter, setLessonFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [lessonData, setLessonData] = useState({
    topic: '',
    startTime: '',
    endTime: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchGroup = async () => {
    if (!id) return;
    try {
      const res = await groupApi.getById(id);
      if (res.success) setGroup(res.data);
    } catch (err) {
      console.error('Group fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    studentApi.getAll({ pageSize: 100 }).then((res) => setAllStudents(res.items || []));
  }, [id]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedStudentId) return;
    setModalLoading(true);
    setModalError('');
    try {
      const res = await groupApi.addStudent(id, selectedStudentId);
      if (res.success) {
        setModalSuccess("O‘quvchi guruhga muvaffaqiyatli qo‘shildi!");
        setTimeout(() => {
          setIsAddStudentOpen(false);
          setSelectedStudentId('');
          setModalSuccess('');
          fetchGroup();
        }, 1000);
      } else {
        setModalError(res.message || "Qo'shishda xatolik yuz berdi");
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || "Server xatosi");
    } finally {
      setModalLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName?: string) => {
    if (!id) return;
    const confirmed = window.confirm(
      `Haqiqatan ham ${studentName ? `"${studentName}"` : "o'quvchi"}ni ushbu guruhdan chiqarmoqchimisiz?`
    );
    if (!confirmed) return;
    try {
      await groupApi.removeStudent(id, studentId);
      fetchGroup();
    } catch (err) {
      console.error('Remove student error', err);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setModalLoading(true);
    setModalError('');
    try {
      const res = await lessonApi.create({
        groupId: id,
        topic: lessonData.topic,
        startTime: new Date(lessonData.startTime).toISOString(),
        endTime: new Date(lessonData.endTime).toISOString(),
      });
      if (res.success) {
        setModalSuccess("Yangi dars muvaffaqiyatli rejalashtirildi!");
        setTimeout(() => {
          setIsCreateLessonOpen(false);
          setLessonData({ topic: '', startTime: '', endTime: '' });
          setModalSuccess('');
          fetchGroup();
        }, 1000);
      } else {
        setModalError(res.message || "Dars yaratishda xatolik yuz berdi");
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || "Server xatosi");
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Guruh ma'lumotlari yuklanmoqda..." />;
  if (!group) return <EmptyState title="Guruh topilmadi" description="Bunday guruh mavjud emas yoki o'chirilgan." />;

  const groupStudents = group.students || [];
  const groupLessons = group.recentLessons || [];

  // Filter students
  const filteredStudents = groupStudents.filter(
    (st) =>
      (st.fullName || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (st.phoneNumber || '').includes(studentSearch)
  );

  // Filter lessons
  const filteredLessons = groupLessons.filter((l) => {
    if (lessonFilter === 'pending') return l.status === 1;
    if (lessonFilter === 'completed') return l.status === 2;
    return true;
  });

  // Calculate average attendance
  const avgAttendance =
    groupStudents.length > 0
      ? Math.round(
          groupStudents.reduce((sum, s) => sum + (s.attendancePercentage ?? 100), 0) /
            groupStudents.length
        )
      : 100;


  const backUrl = user?.role === 3 ? `${langPrefix}/teacher/groups` : `${langPrefix}/groups`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to={backUrl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0050cb] dark:hover:text-blue-400 hover:border-[#0050cb]/40 shadow-xs backdrop-blur-md transition-all cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Guruhlar ro‘yxatiga qaytish</span>
        </Link>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setIsAddStudentOpen(true);
                setModalError('');
                setModalSuccess('');
              }}
              className="px-4 py-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0050cb] hover:border-[#0050cb]/40 rounded-2xl shadow-xs backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#0050cb]" />
              <span>O‘quvchi qo‘shish</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsCreateLessonOpen(true);
              setModalError('');
              setModalSuccess('');
            }}
            className="px-4 py-2 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-extrabold rounded-2xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Dars yaratish</span>
          </button>
        </div>
      </div>

      {/* Group Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0050cb] via-[#0066ff] to-[#4d8eff] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              {group.subjectName && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-bold text-white shadow-xs">
                  {group.subjectName}
                </span>
              )}
              <span className="px-3 py-1 bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 rounded-full text-xs font-black backdrop-blur-md">
                Faol guruh
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{group.name}</h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-blue-100 mt-3 font-medium">
              <span className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <GraduationCap className="w-3.5 h-3.5 text-blue-200" />
                <span>Ustoz: <strong className="text-white font-bold">{group.teacherName || 'Biriktirilmagan'}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <CreditCard className="w-3.5 h-3.5 text-blue-200" />
                <span>Oylik to‘lov: <strong className="text-white font-bold">{group.monthlyFee.toLocaleString()} UZS</strong></span>
              </span>
              {group.scheduleDescription && (
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5 text-blue-200" />
                  <span>{group.scheduleDescription}</span>
                </span>
              )}
              {group.room && (
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                  <MapPin className="w-3.5 h-3.5 text-blue-200" />
                  <span>{group.room}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 self-start md:self-center">
            <button
              type="button"
              onClick={() => {
                setIsCreateLessonOpen(true);
                setModalError('');
                setModalSuccess('');
              }}
              className="px-4 py-2.5 bg-white text-[#0050cb] hover:bg-blue-50 text-xs font-black rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4 text-[#0050cb]" />
              <span>Dars yaratish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              O‘quvchilar
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {group.students.length} <span className="text-sm font-semibold text-slate-400">/ {group.maxStudents} nafar</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-[#0050cb] h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((group.students.length / (group.maxStudents || 15)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              O‘rtacha Davomat
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {avgAttendance}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Guruh davomat ko‘rsatkichi</p>
        </div>

        {/* Lessons Count */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Jami Darslar
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {group.recentLessons.length} <span className="text-sm font-semibold text-slate-400">ta dars</span>
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">
            {group.recentLessons.filter((l) => l.status === 2).length} ta o‘tildi
          </p>
        </div>

        {/* Monthly Fee */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Oylik To‘lov
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {group.monthlyFee.toLocaleString()} <span className="text-xs font-semibold text-slate-400">UZS</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Har bir o‘quvchi uchun</p>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Group Students */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span>Guruh o‘quvchilari ({group.students.length} / {group.maxStudents})</span>
            </h3>

            {canManage && (
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(true)}
                className="px-3 py-1.5 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>O‘quvchi qo‘shish</span>
              </button>
            )}
          </div>

          {/* Student Search */}
          {group.students.length > 3 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="O‘quvchi ismi yoki telefoni bo‘yicha qidirish..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/25"
              />
            </div>
          )}

          {/* Students List */}
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center bg-blue-50/40 dark:bg-slate-800/40 rounded-2xl border border-blue-100 dark:border-slate-800">
              <Users className="w-10 h-10 text-[#0050cb]/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                {group.students.length === 0
                  ? "Ushbu guruhga hali o‘quvchilar biriktirilmagan."
                  : "Qidiruv bo‘yicha o‘quvchi topilmadi."}
              </p>
              {canManage && group.students.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="mt-3 px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>O‘quvchi biriktirish</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredStudents.map((st) => (
                <div
                  key={st.id}
                  className="p-4 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0050cb] to-[#0066ff] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {st.firstName[0]}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/students/${st.id}`}
                        className="font-extrabold text-xs text-slate-900 dark:text-white hover:text-[#0050cb] dark:hover:text-blue-400 transition-colors truncate block"
                      >
                        {st.fullName}
                      </Link>
                      <a
                        href={`tel:${st.phoneNumber}`}
                        className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-500 flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{st.phoneNumber}</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{st.attendancePercentage ?? 100}% davomat</span>
                    </span>

                    <Link
                      to={`/students/${st.id}`}
                      className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#0050cb] rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                      title="O‘quvchi profili"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(st.id, st.fullName)}
                        title="Guruhdan chiqarish"
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Lessons History */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span>Darslar tarixi</span>
            </h3>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setLessonFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lessonFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={() => setLessonFilter('pending')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lessonFilter === 'pending'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Kutilmoqda
              </button>
              <button
                type="button"
                onClick={() => setLessonFilter('completed')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lessonFilter === 'completed'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                O‘tilgan
              </button>
            </div>
          </div>

          {/* Lessons List */}
          {filteredLessons.length === 0 ? (
            <div className="p-8 text-center bg-purple-50/30 dark:bg-slate-800/40 rounded-2xl border border-purple-100 dark:border-slate-800">
              <Calendar className="w-10 h-10 text-purple-500/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">Darslar mavjud emas.</p>
              <button
                type="button"
                onClick={() => setIsCreateLessonOpen(true)}
                className="mt-3 px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi dars yaratish</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessons.map((lesson) => {
                const isPending = lesson.status === 1;
                const attendanceUrl =
                  user?.role === 3
                    ? `${langPrefix}/teacher/attendance/${lesson.id}`
                    : `${langPrefix}/attendance/${lesson.id}`;

                return (
                  <div
                    key={lesson.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 shadow-xs'
                        : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {lesson.topic || 'Mavzu belgilanmagan'}
                          </span>
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                              <Clock className="w-3 h-3 animate-pulse" />
                              <span>Kutilmoqda</span>
                            </span>
                          )}
                          {!isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Tugallangan</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#0050cb]" />
                            <span>{new Date(lesson.startTime).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#0050cb]" />
                            <span>
                              {new Date(lesson.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(lesson.endTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </span>
                        </div>
                      </div>

                      <Link
                        to={attendanceUrl}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 ${
                          isPending
                            ? 'bg-[#0050cb] hover:bg-[#003fa4] text-white shadow-blue-500/25'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Davomat</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Guruhga o‘quvchi qo‘shish"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {modalSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{modalSuccess}</span>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#0050cb] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Guruh: {group.name}</p>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                  Markazda ro‘yxatdan o‘tgan o‘quvchini tanlang. U avtomatik ushbu guruh darslariga va davomat ro‘yxatiga qo‘shiladi.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              O‘quvchini tanlang *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/25"
            >
              <option value="">-- O‘quvchini tanlang --</option>
              {allStudents
                .filter((s) => !group.students.some((gs) => gs.id === s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.phoneNumber})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddStudentOpen(false)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={modalLoading || !selectedStudentId}
              className="px-5 py-2.5 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {modalLoading ? "Qo‘shilmoqda..." : "Guruhga qo‘shish"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Lesson Modal */}
      <Modal
        isOpen={isCreateLessonOpen}
        onClose={() => setIsCreateLessonOpen(false)}
        title="Yangi dars yaratish"
      >
        <form onSubmit={handleCreateLesson} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {modalSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{modalSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Dars mavzusi *
            </label>
            <input
              type="text"
              required
              value={lessonData.topic}
              onChange={(e) => setLessonData({ ...lessonData, topic: e.target.value })}
              placeholder="Masalan: IELTS Writing Task 2 - Essay Structures"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/25"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Boshlanish vaqti *
              </label>
              <input
                type="datetime-local"
                required
                value={lessonData.startTime}
                onChange={(e) => setLessonData({ ...lessonData, startTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/25"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tugash vaqti *
              </label>
              <input
                type="datetime-local"
                required
                value={lessonData.endTime}
                onChange={(e) => setLessonData({ ...lessonData, endTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/25"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateLessonOpen(false)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {modalLoading ? "Yaratilmoqda..." : "Dars yaratish"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
