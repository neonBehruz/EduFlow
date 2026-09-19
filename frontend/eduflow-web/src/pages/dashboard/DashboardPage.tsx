import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardApi, extendedDashboardApi } from '../../services/api';
import { DashboardStats, ExtendedDashboardStats } from '../../types';
import { LoadingSpinner, Badge, EmptyState } from '../../components/common/UIComponents';
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { TeacherDashboard } from '../../components/dashboard/TeacherDashboard';
import { ParentPortalPage } from '../portal/ParentPortalPage';
import { StudentPortalPage } from '../portal/StudentPortalPage';
import {
  Users,
  GraduationCap,
  UsersRound,
  CalendarCheck2,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  DollarSign,
  DoorOpen,
  Award,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // If logged-in user is a Teacher
  if (user?.role === 3) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  // If logged-in user is a Parent
  if (user?.role === 4) {
    return <Navigate to="/parent/dashboard" replace />;
  }

  // If logged-in user is a Student
  if (user?.role === 5) {
    return <Navigate to="/student/dashboard" replace />;
  }

  // Otherwise: Admin / SuperAdmin Dashboard
  return <AdminDashboardView />;
};

const AdminDashboardView: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [extStats, setExtStats] = useState<ExtendedDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all'>('30d');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let start: Date | undefined;
      const end = now;

      if (period === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === '7d') {
        start = new Date(now.getTime() - 7 * 86400000);
      } else if (period === '30d') {
        start = new Date(now.getTime() - 30 * 86400000);
      } else if (period === '3m') {
        start = new Date(now.getTime() - 90 * 86400000);
      } else if (period === '6m') {
        start = new Date(now.getTime() - 180 * 86400000);
      } else if (period === '1y') {
        start = new Date(now.getTime() - 365 * 86400000);
      }

      const [res, extRes] = await Promise.allSettled([
        dashboardApi.getStats(),
        extendedDashboardApi.getStats({
          startDate: start ? start.toISOString() : undefined,
          endDate: end.toISOString(),
        }),
      ]);

      if (res.status === 'fulfilled' && res.value.success) {
        setStats(res.value.data);
      }
      if (extRes.status === 'fulfilled' && extRes.value.success) {
        setExtStats(extRes.value.data);
      }
    } catch (err) {
      console.error('Dashboard stats fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <LoadingSpinner text={t('action.loading', 'Dashboard ma\'lumotlari yuklanmoqda...')} />;
  }

  if (!stats) {
    return <EmptyState title="Ma'lumot topilmadi" description="Dashboard statistikasi mavjud emas." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Animated Interactive Dashboard Hero Banner */}
      <DashboardHero />

      {/* Quick Actions for Learning Center Admin */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/students"
          className="group relative overflow-hidden bg-white/80 dark:bg-slate-900/80 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center gap-3 backdrop-blur-md cursor-pointer hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-[#0050cb] dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">+ {t('header.new_student', 'O‘quvchi qo‘shish')}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('action.register_student_sub', 'Ro‘yxatga olish')}</span>
          </div>
        </Link>

        <Link
          to="/teachers"
          className="group relative overflow-hidden bg-white/80 dark:bg-slate-900/80 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center gap-3 backdrop-blur-md cursor-pointer hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">+ {t('header.new_teacher', 'O‘qituvchi qo‘shish')}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('action.assign_teacher_sub', 'Mentor biriktirish')}</span>
          </div>
        </Link>

        <Link
          to="/groups"
          className="group relative overflow-hidden bg-white/80 dark:bg-slate-900/80 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center gap-3 backdrop-blur-md cursor-pointer hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <UsersRound className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">+ {t('header.new_group', 'Yangi Guruh')}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('action.create_group_sub', 'Kurs ochish')}</span>
          </div>
        </Link>

        <Link
          to="/attendance"
          className="group relative overflow-hidden bg-white/80 dark:bg-slate-900/80 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center gap-3 backdrop-blur-md cursor-pointer hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">{t('header.take_attendance', 'Davomat qilish')}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('action.quick_mark_sub', 'Tezkor belgilash')}</span>
          </div>
        </Link>
      </div>

      {/* Period Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('period.analysis', 'Tahlil davri:')}</span>
          <span className="text-[11px] font-bold text-[#0050cb] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900">
            {period === 'today' && t('period.today', 'Bugun')}
            {period === '7d' && t('period.7d_full', 'So‘nggi 7 kun')}
            {period === '30d' && t('period.30d_full', 'So‘nggi 30 kun')}
            {period === '3m' && t('period.3m_full', 'So‘nggi 3 oy')}
            {period === '6m' && t('period.6m_full', 'So‘nggi 6 oy')}
            {period === '1y' && t('period.1y_full', 'So‘nggi 1 yil')}
            {period === 'all' && t('period.all_full', 'Barcha davr')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'today', labelKey: 'period.today', label: 'Bugun' },
            { id: '7d', labelKey: 'period.7d', label: '7 kun' },
            { id: '30d', labelKey: 'period.30d', label: '30 kun' },
            { id: '3m', labelKey: 'period.3m', label: '3 oy' },
            { id: '6m', labelKey: 'period.6m', label: '6 oy' },
            { id: '1y', labelKey: 'period.1y', label: '1 yil' },
            { id: 'all', labelKey: 'period.all', label: 'Barchasi' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                period === btn.id
                  ? 'bg-[#0050cb] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t(btn.labelKey, btn.label)}
            </button>
          ))}
        </div>
      </div>

      {/* 16 Extended Production Metrics Grid */}
      {extStats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('dash.expected_revenue', 'Kutilayotgan tushum')}</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {((extStats as any)?.totalExpectedRevenue ?? (extStats as any)?.monthlyRevenue ?? 0).toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span>
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">{t('dash.expected_sub', 'Davr bo‘yicha kurs to‘lovlari')}</span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('dash.collected_revenue', 'Yig‘ilgan tushum')}</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {((extStats as any)?.totalCollectedRevenue ?? (extStats as any)?.monthlyRevenue ?? 0).toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">{t('dash.collected_sub', 'Haqiqiy to‘langan')}</span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('dash.debt', 'Qarzdorlik')}</span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {((extStats as any)?.totalOutstandingDebt ?? (extStats as any)?.outstandingPayments ?? 0).toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span>
            </p>
            <span className="text-[10px] text-rose-600 font-semibold mt-1 block">{t('dash.debt_sub', 'Undirilishi lozim')}</span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('dash.net_revenue', 'Markaz sof tushumi')}</span>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {((extStats as any)?.centerNetRevenue ?? (extStats as any)?.netProfit ?? 0).toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span>
            </p>
            <span className="text-[10px] text-blue-600 font-semibold mt-1 block">{t('dash.net_sub', 'Oyliklar chegirilgach')}</span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('dash.attendance_rate', 'Davomat ko‘rsatkichi')}</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {((extStats as any)?.attendanceRatePercentage ?? (extStats as any)?.attendanceRate ?? 0)}%
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">{t('dash.attendance_sub', 'O‘rtacha dars qatnashuvi')}</span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('dash.average_grade', 'O‘rtacha baho')}</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {((extStats as any)?.averageStudentGrade ?? 0)} <span className="text-[10px] text-slate-400">/ 100</span>
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">{t('dash.average_grade_sub', 'Akademik o‘zlashtirish')}</span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('dash.room_occupancy', 'Xonalar bandligi')}</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {((extStats as any)?.roomOccupancyRatePercentage ?? 0)}%
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">{((extStats as any)?.roomsCount ?? 0)} {t('dash.active_rooms_suffix', 'ta faol xona')}</span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('dash.risk_group', 'Risk guruhi')}</span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {((extStats as any)?.highRiskStudentsCount ?? (extStats as any)?.atRiskStudentsCount ?? 0)} <span className="text-[10px] text-slate-400">{t('dash.students_unit', 'nafar')}</span>
            </p>
            <span className="text-[10px] text-rose-600 font-semibold mt-1 block">{t('dash.high_risk_desc', 'Chiqib ketish xavfi bor')}</span>
          </div>
        </div>
      )}

      {/* Main Stats Bento Grid with Animated Accents */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Link
          to="/students"
          className="group relative bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {t('dash.total_students', 'O\'quvchilar')}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.studentsCount}</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> {t('dash.active_students', 'Faol o‘quvchilar')}
            </span>
          </div>
        </Link>

        {/* Teachers */}
        <Link
          to="/teachers"
          className="group relative bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-80 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {t('dash.teachers_count', 'O‘qituvchilar')}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.teachersCount}</div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 mt-1.5">
              <Award className="w-3.5 h-3.5" /> {t('dash.mentors_teachers', 'Mentor & Ustozlar')}
            </span>
          </div>
        </Link>

        {/* Active Groups */}
        <Link
          to="/groups"
          className="group relative bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-80 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {t('dash.active_groups', 'Faol Guruhlar')}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <UsersRound className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.groupsCount}</div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1.5">
              {t('dash.study_groups', 'O‘quv guruhlari')}
            </span>
          </div>
        </Link>

        {/* Today's Lessons */}
        <Link
          to="/calendar"
          className="group relative bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {t('dash.today_lessons', 'Bugungi Darslar')}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.todayLessons.length}</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1.5">
              {t('dash.scheduled_lessons', 'Jadvaldagi darslar')}
            </span>
          </div>
        </Link>
      </div>

      {/* Main Content Split: Today's Lessons & Financial / Overdue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Lessons */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {t('dash.today_lessons_schedule', 'Bugungi Darslar Jadvali')}
              </h3>
            </div>
            <Link to="/lessons" className="text-xs font-bold text-[#0050cb] hover:underline flex items-center gap-1">
              <span>{t('action.view_all', 'Barchasi')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.todayLessons.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
              <CalendarCheck2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t('dash.no_lessons_today', 'Bugun uchun darslar belgilanmagan')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.todayLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">
                        {lesson.groupName}
                      </span>
                      {lesson.subjectName && <Badge variant="info">{lesson.subjectName}</Badge>}
                      <Badge variant={lesson.status === 2 ? 'success' : 'warning'}>
                        {lesson.status === 2 ? t('status.completed', 'Tugallangan') : t('status.scheduled', 'Rejalashtirilgan')}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{lesson.topic || t('dash.no_topic', 'Mavzu kiritilmagan')}</p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>{t('dash.teacher_prefix', 'O‘qituvchi:')} {lesson.teacherName || t('dash.unassigned', 'Biriktirilmagan')}</span>
                      <span>•</span>
                      <span>{t('dash.students_prefix', 'O‘quvchilar:')} {lesson.totalStudents} {t('dash.students_unit', 'nafar')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">
                        {new Date(lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-slate-400">{t('dash.time', 'Vaqt')}</span>
                    </div>
                    <Link
                      to={`/attendance/${lesson.id}`}
                      className="px-3.5 py-1.5 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-semibold rounded-xl shadow-xs transition-all whitespace-nowrap"
                    >
                      {t('action.attend', 'Davomat')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Overdue Payments & Revenue Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Overdue Alert Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>{t('dash.overdue_payments', 'Qarzdorliklar')} ({stats.overduePayments.length})</span>
              </h3>
              <Link to="/payments" className="text-xs font-bold text-[#0050cb] hover:underline">
                {t('action.view_all', 'Barchasi')}
              </Link>
            </div>

            {stats.overduePayments.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('dash.no_overdue', 'Hozirda muddati o\'tgan qarzdorliklar mavjud emas.')}</p>
            ) : (
              <div className="space-y-2.5">
                {stats.overduePayments.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">{p.studentName}</span>
                      <span className="text-[10px] text-rose-600 font-semibold">
                        {t('dash.due_date_prefix', 'Muddat:')} {new Date(p.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">
                        {p.amount.toLocaleString()} UZS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Overview Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">{t('dash.attendance_rate', 'O\'rtacha Davomat Ko\'rsatkichi')}</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-blue-100 dark:border-blue-950 border-t-[#0050cb] flex items-center justify-center font-black text-lg text-slate-800 dark:text-white">
                {stats.attendanceRate}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>{t('dash.attendance_desc', 'O‘quv markazidagi o‘quvchilarning umumiy darslarga qatnashish intizomi ko‘rsatkichi.')}</p>
                <Link to="/reports" className="text-[#0050cb] font-bold hover:underline inline-block mt-1">
                  {t('dash.view_detailed_report', 'Batafsil hisobotni ko‘rish →')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
