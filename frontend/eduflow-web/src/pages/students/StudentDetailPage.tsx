import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentApi, groupApi, teacherApi } from '../../services/api';
import { StudentDetail, Group, Teacher } from '../../types';
import { Badge, LoadingSpinner, EmptyState, Modal } from '../../components/common/UIComponents';
import {
  User,
  Phone,
  Calendar,
  Send,
  ArrowLeft,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  Award,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Star,
  Sparkles,
  ArrowRight,
  BookOpen,
  MapPin,
} from 'lucide-react';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'grades' | 'payments'>('overview');
  const [loading, setLoading] = useState(true);

  // Group Assignment State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  const reloadStudent = () => {
    if (id) {
      studentApi.getById(id).then((res) => {
        if (res.success) setStudent(res.data);
      });
    }
  };

  useEffect(() => {
    if (id) {
      studentApi
        .getById(id)
        .then((res) => {
          if (res.success) setStudent(res.data);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const openAssignModal = async () => {
    setIsAssignModalOpen(true);
    setAssignError('');
    setAssignSuccess('');
    setSelectedTeacherId('');
    setSelectedGroupId('');
    try {
      const [gRes, tRes] = await Promise.all([
        groupApi.getAll({ pageSize: 100, isActive: true }),
        teacherApi.getAll({ pageSize: 100 }),
      ]);
      if (gRes?.items) setAvailableGroups(gRes.items);
      if (tRes?.items) setTeachers(tRes.items);
    } catch (err) {
      console.error('Error fetching groups/teachers', err);
    }
  };

  const handleAssignGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !id) {
      setAssignError("Iltimos, guruhni tanlang");
      return;
    }

    try {
      setAssignLoading(true);
      setAssignError('');
      const res = await groupApi.addStudent(selectedGroupId, id);
      if (res.success) {
        setAssignSuccess("O'quvchi muvaffaqiyatli guruhga biriktirildi!");
        setTimeout(() => {
          setIsAssignModalOpen(false);
          reloadStudent();
        }, 1200);
      } else {
        setAssignError(res.message || "Guruhga biriktirishda xatolik yuz berdi");
      }
    } catch (err: any) {
      setAssignError(err?.response?.data?.message || "Server xatosi");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveFromGroup = async (groupId: string, groupName: string) => {
    if (!id) return;
    const confirmed = window.confirm(`Haqiqatan ham o'quvchini "${groupName}" guruhidan chiqarmoqchimisiz?`);
    if (!confirmed) return;

    try {
      const res = await groupApi.removeStudent(groupId, id);
      if (res.success) {
        reloadStudent();
      }
    } catch (err) {
      console.error('Error removing student from group', err);
    }
  };

  if (loading) return <LoadingSpinner text="O'quvchi ma'lumotlari yuklanmoqda..." />;
  if (!student) return <EmptyState title="O'quvchi topilmadi" description="Bunday ID ga ega o'quvchi mavjud emas." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Bar: Back button & Quick Action */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/students"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0050cb] dark:hover:text-blue-400 hover:border-[#0050cb]/40 shadow-xs backdrop-blur-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>O‘quvchilar ro‘yxatiga qaytish</span>
        </Link>
        <button
          type="button"
          onClick={openAssignModal}
          className="px-4 py-2 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-extrabold rounded-2xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>+ Guruh biriktirish</span>
        </button>
      </div>

      {/* Student Profile Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0050cb] via-[#0066ff] to-[#4d8eff] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center font-black text-3xl shadow-inner">
                {student.firstName[0]}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black ${
                  student.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'
                }`}
                title={student.isActive ? 'Faol o‘quvchi' : 'Nofaol'}
              >
                {student.isActive ? '✓' : '—'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{student.fullName}</h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-black backdrop-blur-md ${
                    student.isActive
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                      : 'bg-white/20 text-white border border-white/30'
                  }`}
                >
                  {student.isActive ? 'Faol o‘quvchi' : 'Nofaol'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-blue-100 mt-2 font-medium">
                <a
                  href={`tel:${student.phoneNumber}`}
                  className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1 rounded-xl backdrop-blur-md"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{student.phoneNumber}</span>
                </a>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-md">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>A'zo bo‘lgan: {new Date(student.enrollmentDate).toLocaleDateString()}</span>
                </span>
                {student.parent?.isTelegramConnected ? (
                  <span className="flex items-center gap-1.5 bg-sky-400/20 text-sky-100 border border-sky-400/40 px-3 py-1 rounded-xl backdrop-blur-md font-bold">
                    <Send className="w-3.5 h-3.5 text-sky-200" />
                    <span>Telegram Ulangan (@{student.parent.telegramChatId})</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-white/10 text-blue-200 px-3 py-1 rounded-xl backdrop-blur-md opacity-80">
                    <Send className="w-3.5 h-3.5" />
                    <span>Telegram Ulanmagan</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 self-start md:self-center">
            <button
              type="button"
              onClick={openAssignModal}
              className="px-4 py-2.5 bg-white text-[#0050cb] hover:bg-blue-50 text-xs font-black rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4 text-[#0050cb]" />
              <span>Guruh biriktirish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Umumiy Ma’lumot', icon: User },
          { id: 'attendance', label: 'Davomat Tarixi', icon: ClipboardCheck, count: student.recentAttendances?.length },
          { id: 'grades', label: 'Baholar', icon: Award, count: student.recentGrades?.length },
          { id: 'payments', label: 'To‘lovlar', icon: CreditCard, count: student.recentPayments?.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count != null && tab.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Section */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Average Grade Card */}
              <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    O‘rtacha Baho
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                  {student.averageGrade > 0 ? student.averageGrade : '—'}
                  {student.averageGrade > 0 && <span className="text-sm font-semibold text-slate-400 ml-1">/ 100</span>}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {student.averageGrade > 0 ? "O'quvchining akademik o'zlashtirishi" : "Hozircha baho qo'yilmagan"}
                </p>
              </div>

              {/* Attendance Percentage Card */}
              <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Davomat Foizi
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {student.attendancePercentage}%
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, student.attendancePercentage))}%` }}
                  />
                </div>
              </div>

              {/* Payment Status Card */}
              <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    To‘lov Holati
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <Badge variant={student.currentPaymentStatus === 2 ? 'success' : student.currentPaymentStatus === 3 ? 'danger' : 'warning'}>
                    {student.currentPaymentStatus === 2 ? "To'langan" : student.currentPaymentStatus === 3 ? 'Qarzdor' : 'Kutilmoqda'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {student.currentPaymentStatus === 2
                    ? "Joriy oy to'lovi to'liq qoplangan"
                    : student.currentPaymentStatus === 3
                    ? "To'lov muddati o'tgan yoki qarzdorlik bor"
                    : "To'lov qabul qilinishi kutilmoqda"}
                </p>
              </div>
            </div>

            {/* Parent & Groups Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Parent Info Card */}
              <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span>Ota-ona Ma'lumotlari</span>
                </h3>
                {student.parent ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">F.I.SH:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{student.parent.fullName}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Telefon:</span>
                      <a
                        href={`tel:${student.parent.phoneNumber}`}
                        className="text-[#0050cb] dark:text-blue-400 font-bold hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{student.parent.phoneNumber}</span>
                      </a>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Telegram:</span>
                      {student.parent.isTelegramConnected ? (
                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          <span>Ulangan (@{student.parent.telegramChatId})</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Ulanmagan
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    Ota-ona ma'lumotlari kiritilmagan.
                  </div>
                )}
              </div>

              {/* Enrolled Groups Card */}
              <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span>A'zo bo‘lgan Guruhlari ({student.groups.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={openAssignModal}
                    className="px-3 py-1.5 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Guruh biriktirish</span>
                  </button>
                </div>

                {student.groups.length > 0 ? (
                  <div className="space-y-3">
                    {student.groups.map((g) => (
                      <div
                        key={g.id}
                        className="p-4 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-black text-slate-900 dark:text-white">{g.name}</strong>
                            {g.subjectName && (
                              <Badge variant="info">{g.subjectName}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-[#0050cb]" />
                              <span>Ustoz: <strong className="text-slate-700 dark:text-slate-300">{g.teacherName || 'Biriktirilmagan'}</strong></span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Link
                            to={`/groups/${g.id}`}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-bold border border-blue-200/60 dark:border-blue-900/60 transition-all flex items-center gap-1"
                          >
                            <span>Guruhga o‘tish</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromGroup(g.id, g.name)}
                            title="Guruhdan chiqarish"
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-blue-50/40 dark:bg-slate-800/40 rounded-2xl border border-blue-100 dark:border-slate-800">
                    <GraduationCap className="w-10 h-10 text-[#0050cb]/40 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Hech qanday guruhga biriktirilmagan</p>
                    <button
                      type="button"
                      onClick={openAssignModal}
                      className="mt-3 px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Guruhga biriktirish</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#0050cb]" />
              <span>Oxirgi davomat qaydlari</span>
            </h3>
            {student.recentAttendances.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                Hozircha davomat qaydlari mavjud emas.
              </div>
            ) : (
              <div className="space-y-2.5">
                {student.recentAttendances.map((att) => (
                  <div
                    key={att.id}
                    className="p-4 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Dars sanasi: {new Date(att.lessonDate).toLocaleDateString()}
                      </span>
                      {att.comment && (
                        <span className="text-slate-500 dark:text-slate-400 italic text-[11px] mt-0.5 block">
                          Izoh: {att.comment}
                        </span>
                      )}
                    </div>
                    <Badge variant={att.status === 1 ? 'success' : att.status === 2 ? 'danger' : att.status === 3 ? 'warning' : 'info'}>
                      {att.status === 1 ? 'Qatnashdi' : att.status === 2 ? 'Kelmadi' : att.status === 3 ? 'Kechikdi' : 'Sababli'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Oxirgi baholar</span>
            </h3>
            {student.recentGrades.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                Hozircha baholar qo'yilmagan.
              </div>
            ) : (
              <div className="space-y-2.5">
                {student.recentGrades.map((gr) => (
                  <div
                    key={gr.id}
                    className="p-4 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{gr.subjectName || 'Dars'}</span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(gr.createdAt).toLocaleDateString()} {gr.comment ? `• ${gr.comment}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-black">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{gr.score} ball</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>To‘lovlar tarixi</span>
            </h3>
            {student.recentPayments.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                Hozircha to'lov qaydlari mavjud emas.
              </div>
            ) : (
              <div className="space-y-2.5">
                {student.recentPayments.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-4 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {pm.amount.toLocaleString()} UZS
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Muddat: {new Date(pm.dueDate).toLocaleDateString()} {pm.description ? `• ${pm.description}` : ''}
                      </span>
                    </div>
                    <Badge variant={pm.status === 2 ? 'success' : pm.status === 3 ? 'danger' : 'warning'}>
                      {pm.status === 2 ? "To'langan" : pm.status === 3 ? 'Qarzdor' : 'Kutilmoqda'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Group Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="O‘quvchini Guruh va O‘qituvchiga bog‘lash"
      >
        <form onSubmit={handleAssignGroup} className="space-y-4">
          {assignError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{assignError}</span>
            </div>
          )}

          {assignSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{assignSuccess}</span>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#0050cb] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Guruh va O‘qituvchi tanlash</p>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                  O‘qituvchini tanlang, so‘ngra uning tegishli guruhiga o‘quvchini biriktiring.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bosh O‘qituvchi (Ustoz)
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                const tId = e.target.value;
                setSelectedTeacherId(tId);
                const currentGroup = availableGroups.find((g) => g.id === selectedGroupId);
                if (tId && currentGroup && currentGroup.teacherId !== tId) {
                  setSelectedGroupId('');
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
            >
              <option value="">-- Barcha o‘qituvchilar --</option>
              {teachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.fullName} {tch.specialization ? `(${tch.specialization})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Guruhni tanlang *
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                const gId = e.target.value;
                setSelectedGroupId(gId);
                const grp = availableGroups.find((g) => g.id === gId);
                if (grp?.teacherId) {
                  setSelectedTeacherId(grp.teacherId);
                }
              }}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
            >
              <option value="">-- Guruhni tanlang --</option>
              {availableGroups
                .filter((g) => !selectedTeacherId || g.teacherId === selectedTeacherId)
                .map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.name} {grp.subjectName ? `[${grp.subjectName}]` : ''} — Ustoz: {grp.teacherName || 'Biriktirilmagan'}
                  </option>
                ))}
            </select>
          </div>

          {selectedGroupId && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
              {(() => {
                const grp = availableGroups.find((g) => g.id === selectedGroupId);
                if (!grp) return null;
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fan:</span>
                      <strong className="text-slate-800 dark:text-white">{grp.subjectName || '—'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">O‘qituvchi:</span>
                      <strong className="text-[#0050cb] dark:text-blue-400">{grp.teacherName || 'Biriktirilmagan'}</strong>
                    </div>
                    {grp.monthlyFee && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Oylik to‘lov:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">{grp.monthlyFee.toLocaleString()} UZS</strong>
                      </div>
                    )}
                    {grp.scheduleDescription && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Dars vaqti:</span>
                        <strong className="text-slate-800 dark:text-white">{grp.scheduleDescription}</strong>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={assignLoading || !selectedGroupId}
              className="px-5 py-2.5 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {assignLoading ? 'Biriktirilmoqda...' : 'Guruhga biriktirish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
