import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  groupApi,
  lessonApi,
  homeworkApi,
  payrollApi,
  studentApi,
} from '../../services/api';
import {
  Group,
  Lesson,
  HomeworkDto,
  TeacherPayrollDto,
  Student,
} from '../../types';
import {
  UsersRound,
  GraduationCap,
  CalendarCheck2,
  DollarSign,
  ClipboardCheck,
  FileCheck2,
  Award,
  CalendarDays,
  Plus,
  Clock,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { LoadingSpinner, Badge } from '../common/UIComponents';
import { PromotionBanner } from '../common/PromotionBanner';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const langPrefix = '/' + language.toLowerCase();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [homeworks, setHomeworks] = useState<HomeworkDto[]>([]);
  const [payrolls, setPayrolls] = useState<TeacherPayrollDto[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      const [groupsRes, todayRes, lessonsRes, payrollRes, studentsRes] = await Promise.allSettled([
        groupApi.getAll({ pageSize: 50 }),
        lessonApi.getToday(),
        lessonApi.getAll({ pageSize: 50 }),
        payrollApi.getPayrolls(),
        studentApi.getAll({ pageSize: 100 }),
      ]);

      const loadedGroups = groupsRes.status === 'fulfilled' ? groupsRes.value.items : [];
      setGroups(loadedGroups);

      if (todayRes.status === 'fulfilled') {
        setTodayLessons(todayRes.value);
      }
      if (lessonsRes.status === 'fulfilled') {
        setAllLessons(lessonsRes.value.items);
      }
      if (payrollRes.status === 'fulfilled' && payrollRes.value.data) {
        setPayrolls(payrollRes.value.data);
      }
      if (studentsRes.status === 'fulfilled') {
        setStudents(studentsRes.value.items);
      }

      // Fetch homeworks for first few groups
      if (loadedGroups.length > 0) {
        try {
          const hwPromises = loadedGroups.slice(0, 3).map(g => homeworkApi.getByGroup(g.id));
          const hwResults = await Promise.allSettled(hwPromises);
          const allHws: HomeworkDto[] = [];
          hwResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value.data) {
              allHws.push(...r.value.data);
            }
          });
          setHomeworks(allHws);
        } catch {
          // ignore hw errors
        }
      }
    } catch (err) {
      console.error("O'qituvchi ma'lumotlarini yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text={t('action.loading', 'Yuklanmoqda...')} />;
  }

  // Calculate metrics
  const totalGroupsCount = groups.length;
  // Unique students count
  const myStudentsCount = students.length > 0 ? students.length : groups.reduce((acc, g) => acc + (g.enrolledStudentsCount || 0), 0);
  const todayLessonsCount = todayLessons.length;
  const latestPayroll = payrolls[0];
  const monthlySalaryEstimate = latestPayroll?.calculatedSalary ?? (groups.reduce((acc, g) => acc + (g.monthlyFee || 400000), 0) * 0.25);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Promotional Campaign Banner with LocalStorage Persistence */}
      <PromotionBanner />

      {/* Teacher Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0050cb] via-[#003fa4] to-[#002b70] p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold mb-3 border border-white/10">
              <GraduationCap className="w-4 h-4 text-cyan-300" />
              <span>{t('teacher.badge', 'O‘qituvchi Paneli')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t('teacher.welcome', 'Xush kelibsiz')}, {user?.firstName} {user?.lastName}! 👋
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
              {t('teacher.hero_desc', 'Bugungi darslaringiz jadvali, o\'quvchilar davomati, baholari va oylik daromadingiz hisob-kitobini quyida kuzatishingiz mumkin.')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate(`${langPrefix}/teacher/attendance`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-[#0050cb] hover:bg-blue-50 font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              <ClipboardCheck className="w-4 h-4 text-[#0050cb]" />
              <span>{t('teacher.take_attendance_btn', 'Davomat belgilash')}</span>
            </button>
            <button
              onClick={() => navigate(`${langPrefix}/teacher/homework`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/30 hover:bg-blue-500/40 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              <FileCheck2 className="w-4 h-4 text-cyan-300" />
              <span>{t('teacher.new_homework_btn', 'Uy vazifasi berish')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Bento Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* My Groups */}
        <Link
          to={`${langPrefix}/teacher/groups`}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('teacher.my_groups_count', 'Guruhlarim')}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <UsersRound className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {totalGroupsCount}
            </h3>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {t('teacher.active_groups_sub', 'Faol dars guruhlari')}
            </span>
          </div>
        </Link>

        {/* My Students */}
        <Link
          to={`${langPrefix}/teacher/groups`}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('teacher.my_students_count', 'O‘quvchilarim')}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {myStudentsCount}
            </h3>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {t('teacher.enrolled_students_sub', 'Guruhlarga biriktirilgan')}
            </span>
          </div>
        </Link>

        {/* Today's Lessons */}
        <Link
          to={`${langPrefix}/teacher/lessons`}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('teacher.today_lessons_count', 'Bugungi darslarim')}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {todayLessonsCount}
            </h3>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5 block">
              {t('dash.scheduled_lessons', 'Jadvaldagi darslar')}
            </span>
          </div>
        </Link>

        {/* Monthly Salary */}
        <Link
          to={`${langPrefix}/teacher/payroll`}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('teacher.monthly_earnings', 'Oylik Maosh (Hisoblangan)')}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {Math.round(monthlySalaryEstimate).toLocaleString()} <span className="text-xs font-semibold text-slate-400">UZS</span>
            </h3>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {t('teacher.monthly_share_sub', 'Ushbu oydagi ulush')}
            </span>
          </div>
        </Link>
      </div>

      {/* Main Teacher Grid: Today's Lessons & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Lessons Schedule */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">
                  {t('teacher.today_schedule', 'Bugungi Darslarim Jadvali')}
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            {todayLessons.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <CalendarCheck2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t('teacher.no_today_lessons', 'Bugun uchun sizda rejalashtirilgan darslar yo‘q')}
                </p>
                <button
                  onClick={() => navigate(`${langPrefix}/teacher/lessons`)}
                  className="mt-3 text-xs font-bold text-[#0050cb] hover:underline"
                >
                  {t('nav.my_lessons', 'Darslarim')} →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-white">
                          {lesson.groupName}
                        </span>
                        {lesson.subjectName && (
                          <Badge variant="info">{lesson.subjectName}</Badge>
                        )}
                        <Badge variant={lesson.status === 2 ? 'success' : 'warning'}>
                          {lesson.status === 2 ? t('status.completed', 'Tugallangan') : t('status.scheduled', 'Rejalashtirilgan')}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {lesson.topic || t('dash.no_topic', 'Mavzu kiritilmagan')}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-[#0050cb] dark:text-blue-400">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(lesson.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' '}({Math.round((new Date(lesson.endTime).getTime() - new Date(lesson.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10} soat)
                        </span>
                        <span className="flex items-center gap-1">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                          {(lesson as any).roomName || (lesson as any).room || `${t('teacher.room', 'Xona')}-4`}
                        </span>
                        <span>•</span>
                        <span>{lesson.totalStudents} {t('teacher.students_count', 'o‘quvchi')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`${langPrefix}/teacher/attendance/${lesson.id}`}
                        className="px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>{t('action.attend', 'Davomat')}</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher's Groups Grid */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">
                  {t('teacher.my_groups_list', 'Biriktirilgan Guruhlarim')}
                </h2>
              </div>
              <Link to={`${langPrefix}/teacher/groups`} className="text-xs font-bold text-[#0050cb] hover:underline flex items-center gap-1">
                <span>{t('action.view_all', 'Barchasini ko‘rish')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {groups.slice(0, 6).map((g) => (
                <div
                  key={g.id}
                  onClick={() => navigate(`${langPrefix}/teacher/groups/${g.id}`)}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-[#0050cb] transition-colors">
                      {g.name}
                    </span>
                    <Badge variant={g.isActive ? 'success' : 'danger'}>
                      {g.isActive ? t('status.active', 'Faol') : t('status.inactive', 'Nofaol')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {g.subjectName || t('teacher.subject', 'Fan')}
                  </p>
                  {g.scheduleDescription && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/50 p-2 rounded-xl mb-2.5 border border-blue-100 dark:border-blue-900/40">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-[#0050cb]" />
                      <span>{g.scheduleDescription}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>{g.enrolledStudentsCount || 0} {t('teacher.students_count', 'o‘quvchi')}</span>
                    <span>{g.room ? `${t('teacher.room', 'Xona')}: ${g.room}` : `${t('teacher.room', 'Xona')}-4`}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Homeworks & Payroll Overview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Homework Status Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#0050cb]" />
                <span>{t('teacher.homework_title', 'Uyga Vazifalar Holati')}</span>
              </h3>
              <Link to={`${langPrefix}/teacher/homework`} className="text-xs font-bold text-[#0050cb] hover:underline">
                {t('action.view_all', 'Barchasi')}
              </Link>
            </div>

            {homeworks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/40 text-center border border-dashed border-blue-100 dark:border-slate-700">
                <FileCheck2 className="w-8 h-8 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {t('teacher.no_homeworks', 'Hozircha faol uy vazifalari mavjud emas')}
                </p>
                <button
                  onClick={() => navigate(`${langPrefix}/teacher/homework`)}
                  className="mt-2.5 px-3 py-1.5 bg-[#0050cb] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#003fa4] transition-all"
                >
                  {t('teacher.new_homework_btn', 'Uy vazifasi berish')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {homeworks.slice(0, 3).map((hw) => (
                  <div
                    key={hw.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">
                        {hw.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {t('teacher.due_date', 'Muddat')}: {new Date(hw.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#0050cb] block">
                        {hw.submissionsCount || 0} / {hw.maxScore || 100} {t('teacher.score_unit', 'ball')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher Payroll & Income Overview */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>{t('teacher.payroll_analysis_title', 'Oylik Maosh & Ulush Tahlili')}</span>
              </h3>
              <Link to={`${langPrefix}/teacher/payroll`} className="text-xs font-bold text-[#0050cb] hover:underline">
                {t('action.details', 'Batafsil')}
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t('teacher.calculated_for_month', 'Ushbu oy uchun hisoblangan:')}</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {Math.round(monthlySalaryEstimate).toLocaleString()} UZS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t('teacher.share_percent', 'Dars ulushi foizi')}:</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">25%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t('teacher.payroll_status', 'Maosh holati')}:</span>
                <Badge variant="success">{t('teacher.payroll_paid', 'To‘langan')}</Badge>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('teacher.payroll_auto_note', 'O\'quvchilar tomonidan to\'langan kurs to\'lovlari asosida avtomatik hisoblab boriladi.')}
            </p>
          </div>

          {/* Quick Schedule / Lessons Link */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-3xl border border-indigo-100 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">{t('teacher.my_lessons_title', 'Mening Darslarim')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('teacher.my_lessons_desc', 'Barcha rejalashtirilgan va yakunlangan darslar')}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`${langPrefix}/teacher/lessons`)}
              className="w-full py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 text-[#0050cb] dark:text-blue-300 font-bold text-xs rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-600 transition-all cursor-pointer"
            >
              {t('teacher.view_lessons_btn', 'Darslar ro‘yxatini ko‘rish →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
