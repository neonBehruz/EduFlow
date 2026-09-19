import React, { useEffect, useState } from 'react';
import { parentPortalApi, feedbackApi } from '../../services/api';
import { ParentDashboardDto, ParentChildProfileDto } from '../../types';
import { LoadingSpinner, Badge, Modal } from '../../components/common/UIComponents';
import { useLanguage } from '../../context/LanguageContext';
import {
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  BookOpen,
  Calendar,
  AlertCircle,
  FileCheck2,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Phone,
  ShieldCheck,
  ArrowRight,
  Receipt,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';

// Sample child data for demonstration when database has 0 students
const DEMO_CHILD = {
  id: 'demo-student-1',
  fullName: 'Azizbek Rahimov',
  firstName: 'Azizbek',
  lastName: 'Rahimov',
  phoneNumber: '+998 90 123 45 67',
  groupName: 'IELTS Intermediate & Matematika',
  teacherName: 'Azizbek Karimov (IELTS) / Rustam Qodirov (Matematika)',
  attendanceRate: 92,
  totalLessons: 24,
  attendedLessons: 22,
  absentLessons: 1,
  lateLessons: 1,
  pendingPaymentAmount: 450000,
  monthlyFee: 450000,
  paymentStatus: 'unpaid', // 'paid' or 'unpaid'
  recentAttendances: [
    {
      id: 'att-1',
      lessonDate: new Date().toISOString(),
      subjectName: 'IELTS Writing Task 2',
      status: 1, // Present (Bor / Kelgan)
      comment: 'Darsga o\'z vaqtida keldi, mavzuni yaxshi o\'zlashtirdi',
      time: '14:00 - 15:30',
    },
    {
      id: 'att-2',
      lessonDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      subjectName: 'Oliy Matematika',
      status: 2, // Absent (Yo'q / Kelmadi)
      comment: 'Darsda ishtirok etmadi (Sababsiz dars qoldirilgan)',
      time: '16:00 - 17:30',
    },
    {
      id: 'att-3',
      lessonDate: new Date(Date.now() - 86400000 * 4).toISOString(),
      subjectName: 'IELTS Reading Skills',
      status: 3, // Late (Kechikdi)
      comment: '15 daqiqa kechikib kirdi',
      time: '14:00 - 15:30',
    },
    {
      id: 'att-4',
      lessonDate: new Date(Date.now() - 86400000 * 6).toISOString(),
      subjectName: 'General English Grammar',
      status: 1, // Present (Bor / Kelgan)
      comment: 'Lug\'at testidan a\'lo natija ko\'rsatdi',
      time: '10:00 - 11:30',
    },
  ],
  invoices: [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-202609-001',
      period: '2026-Sentabr (Joriy oy)',
      amount: 450000,
      dueDate: new Date(Date.now() + 86400000 * 5).toLocaleDateString('uz-UZ'),
      status: 'pending', // Unpaid
      paidDate: null,
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-202608-089',
      period: '2026-Avgust',
      amount: 450000,
      dueDate: '10.08.2026',
      status: 'paid', // Paid
      paidDate: '08.08.2026 (Payme orqali)',
    },
  ],
  schedule: [
    { day: 'Dushanba', time: '14:00 - 15:30', subject: 'IELTS Writing', room: 'Xona 101' },
    { day: 'Chorshanba', time: '14:00 - 15:30', subject: 'IELTS Reading & Speaking', room: 'Xona 101' },
    { day: 'Juma', time: '14:00 - 15:30', subject: 'IELTS Listening & Mock Test', room: 'Xona 101' },
  ],
  grades: [
    { subject: 'IELTS Writing Task 2', score: 85, date: '08.09.2026', comment: 'Yaxshi insho, so\'z boyligi boy' },
    { subject: 'Matematika - Matritsalar', score: 95, date: '06.09.2026', comment: 'Barcha masalalar to\'g\'ri yechildi' },
    { subject: 'General English - Vocabulary', score: 90, date: '04.09.2026', comment: 'Lug\'at boyligi a\'lo' },
  ],
  homeworks: [
    { title: 'Writing Task 2: Opinion Essay yozish', dueDate: '12.09.2026', status: 'Kutilmoqda' },
    { title: 'Matritsalar bo\'yicha 15 ta masala', dueDate: '11.09.2026', status: 'Topshirilgan' },
  ],
};

export const ParentPortalPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [dashboard, setDashboard] = useState<ParentDashboardDto | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [childProfile, setChildProfile] = useState<ParentChildProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [useSampleData, setUseSampleData] = useState(false);

  // Modals
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<'payme' | 'click' | 'uzum'>('payme');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await parentPortalApi.getDashboard();
      if (res.success && res.data) {
        setDashboard(res.data);
        const children = res.data.children || [];
        if (children.length > 0) {
          const firstChild = children[0];
          const firstId = firstChild.id || firstChild.studentId;
          if (firstId) {
            setSelectedStudentId(firstId);
            loadChildProfile(firstId);
          }
        } else {
          // If no children in DB, activate sample data preview by default
          setUseSampleData(true);
        }
      } else {
        setUseSampleData(true);
      }
    } catch (err) {
      console.error('Parent dashboard error', err);
      setUseSampleData(true);
    } finally {
      setLoading(false);
    }
  };

  const loadChildProfile = async (studentId: string) => {
    try {
      setProfileLoading(true);
      const res = await parentPortalApi.getChildProfile(studentId);
      if (res.success && res.data) {
        setChildProfile(res.data);
      }
    } catch (err) {
      console.error('Child profile load error', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSelectChild = (id: string) => {
    setSelectedStudentId(id);
    setUseSampleData(false);
    loadChildProfile(id);
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;
    try {
      await feedbackApi.submit({
        parentId: dashboard?.parentId,
        studentId: selectedStudentId || undefined,
        rating,
        comment: feedbackComment,
        category: 'Center',
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackSuccess(false);
        setFeedbackOpen(false);
        setFeedbackComment('');
      }, 1500);
    } catch (err) {
      console.error('Feedback submit error', err);
    }
  };

  const handleSimulatePayment = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setPaymentModalOpen(false);
      if (useSampleData) {
        DEMO_CHILD.pendingPaymentAmount = 0;
        DEMO_CHILD.paymentStatus = 'paid';
        DEMO_CHILD.invoices[0].status = 'paid';
        DEMO_CHILD.invoices[0].paidDate = `Bugun (${selectedPaymentProvider.toUpperCase()} orqali)`;
      }
    }, 1500);
  };

  if (loading) {
    return <LoadingSpinner text="Ota-ona kabineti yuklanmoqda..." />;
  }

  const parentName = dashboard?.parentFullName || dashboard?.parentName || 'Ota-ona';
  const realChildren = dashboard?.children || [];
  const hasRealChildren = realChildren.length > 0;

  // Active student information (either from real data or sample preview)
  const activeRealChild = realChildren.find(
    (c) => (c.id || c.studentId) === selectedStudentId
  ) || realChildren[0];

  const currentChildName = useSampleData || !hasRealChildren
    ? DEMO_CHILD.fullName
    : (activeRealChild?.fullName || `${activeRealChild?.firstName || ''} ${activeRealChild?.lastName || ''}`.trim() || 'Farzand');

  const currentGroupName = useSampleData || !hasRealChildren
    ? DEMO_CHILD.groupName
    : (Array.isArray(activeRealChild?.groupNames)
        ? activeRealChild.groupNames.join(', ')
        : (activeRealChild?.groupNames || 'Guruh biriktirilmagan'));

  // Attendance metrics
  const attendanceRate = useSampleData || !hasRealChildren
    ? DEMO_CHILD.attendanceRate
    : (childProfile?.attendancePercentage ?? 100);

  // Payment status calculation
  const pendingDebt = useSampleData || !hasRealChildren
    ? DEMO_CHILD.pendingPaymentAmount
    : (activeRealChild?.pendingPaymentAmount ?? (childProfile?.paymentHistory?.filter(p => p.status !== 1).reduce((acc, p) => acc + (p.debtAmount || p.amount), 0) || 0));

  const isPaid = pendingDebt <= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Notice if sample preview is active */}
      {!hasRealChildren && (
        <div className="bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                {language === 'RU' ? 'База данных обновлена (0 студентов).' : language === 'EN' ? 'Database reset (0 students).' : 'Tizimdagi ma\'lumotlar tozalandi (0 ta o‘quvchi).'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'RU'
                  ? 'Ниже отображается демонстрационный вид родительского портала (посещаемость: был/нет, оплата: оплачено/долг).'
                  : language === 'EN'
                  ? 'Below all parent portal features are shown in demonstration view (attendance: present/absent, tuition: paid/debt).'
                  : 'Quyida ota-ona portalining barcha imkoniyatlari (Davomat: bor/yo‘q, Oylik to‘lov: to‘langan/to‘lanmagan) namunaviy ko‘rinishda namoyish etilmoqda.'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold shrink-0">
            {language === 'RU' ? 'Демонстрационный режим' : language === 'EN' ? 'Demo Mode' : 'Namunaviy ko‘rinish'}
          </span>
        </div>
      )}

      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0050cb] via-[#1a65db] to-[#3b82f6] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {language === 'RU' ? 'Родительский портал (EduFlow)' : language === 'EN' ? 'Parent Portal (EduFlow)' : 'Ota-ona portali (EduFlow)'}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-400/25 text-emerald-100 rounded-full text-[10px] font-bold">
                {language === 'RU' ? 'Активен' : language === 'EN' ? 'Active' : 'Faol'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'RU' ? `Добро пожаловать, ${parentName}!` : language === 'EN' ? `Welcome, ${parentName}!` : `Assalomu alaykum, ${parentName}!`}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              {language === 'RU'
                ? 'Отслеживайте посещаемость ребенка (был/не был), статус ежемесячной оплаты, оценки и расписание занятий онлайн.'
                : language === 'EN'
                ? 'Monitor your child\'s attendance (present/absent), monthly tuition status, academic grades, and class schedule online.'
                : 'Farzandingizning dars davomati (bor/yo‘qligi), oylik to‘lov holati, o‘zlashtirish ko‘rsatkichlari va dars jadvalini to‘g‘ridan-to‘g‘ri kuzatib boring.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('feedback.new_feedback', 'Fikr bildirish')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Child Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {hasRealChildren ? (
          realChildren.map((child) => {
            const childId = child.id || child.studentId || '';
            const isSelected = selectedStudentId === childId && !useSampleData;
            const groupsStr = Array.isArray(child.groupNames)
              ? child.groupNames.join(', ')
              : (child.groupNames || 'Guruh');

            return (
              <button
                key={childId}
                onClick={() => handleSelectChild(childId)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-[#0050cb] shadow-md ring-2 ring-[#0050cb]/20'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isSelected
                      ? 'bg-[#0050cb] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {(child.fullName || child.firstName || 'F')[0]}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                    {child.fullName || `${child.firstName} ${child.lastName}`}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[160px] truncate">
                    {groupsStr}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseSampleData(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white dark:bg-slate-900 border-[#0050cb] shadow-md ring-2 ring-[#0050cb]/20 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0050cb] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                A
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                    Azizbek Rahimov
                  </p>
                  <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-[#0050cb] text-[9px] font-bold rounded">
                    Namunaviy
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  IELTS Intermediate & Matematika
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* KEY METRICS OVERVIEW (Davomat, To'lov, O'rtacha baho, Guruh) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. DARS DAVOMATI (BORLIGI / YO'QLIGI) */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Dars davomati</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {attendanceRate}%
            </p>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
              Yuqori davomat
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Bor: 22 ta
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-rose-600 font-bold">
              <XCircle className="w-3.5 h-3.5" /> Yo'q: 1 ta
            </span>
          </div>
        </div>

        {/* 2. OYLIK TO'LOV HOLATI */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Oylik to'lov holati</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isPaid
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 animate-pulse'
            }`}>
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {isPaid ? (
              <>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  To'langan ✅
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Qarzdorlik yo'q (Joriy oy yopilgan)
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {pendingDebt.toLocaleString()}
                  </p>
                  <span className="text-xs font-bold text-rose-600">so'm</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-bold text-rose-500">To'lanmagan (Qarzdorlik)</span>
                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="text-[11px] font-bold text-[#0050cb] hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    To'lash <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. AKADEMIK KO'RSATKICH / O'RTACHA BAHO */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">O'rtacha baho</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-3">
            89 / 100
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1 text-blue-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> A'lo darajadagi o'zlashtirish
          </p>
        </div>

        {/* 4. FARZAND PROFILI VA GURUHI */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Farzand ma'lumotlari</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-base font-extrabold text-slate-900 dark:text-white mt-2 truncate">
            {currentChildName}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {currentGroupName}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] text-purple-600 font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>SmartEdu O'quv Markazi</span>
          </div>
        </div>
      </div>

      {/* DETAILED SECTIONS: DAVOMAT (BORLIGI / YO'QLIGI) & OYLIK TO'LOV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. DARS DAVOMATI (BORLIGI / YO'QLIGI TO'LIQ RO'YXATI) */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Dars davomati (Borligi / Yo'qligi)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Farzandingizning har bir darsda qatnashganlik holati
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-bold">
                So'nggi darslar
              </span>
            </div>

            {/* Attendance Status Legend */}
            <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-[11px]">
              <span className="flex items-center gap-1 font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Bor (Kelgan)
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 font-bold text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Yo'q (Kelmadi)
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 font-bold text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Kechikdi
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 font-bold text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Sababli
              </span>
            </div>

            {/* Attendance List */}
            <div className="space-y-2.5">
              {DEMO_CHILD.recentAttendances.map((item) => {
                const isPresent = item.status === 1;
                const isAbsent = item.status === 2;
                const isLate = item.status === 3;
                const isExcused = item.status === 4;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isPresent
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40'
                        : isAbsent
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40'
                        : isLate
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40'
                        : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isPresent
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600'
                            : isAbsent
                            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600'
                            : isLate
                            ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600'
                            : 'bg-blue-100 dark:bg-blue-900/60 text-blue-600'
                        }`}
                      >
                        {isPresent && <CheckCircle2 className="w-5 h-5" />}
                        {isAbsent && <XCircle className="w-5 h-5" />}
                        {isLate && <Clock className="w-5 h-5" />}
                        {isExcused && <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {item.subjectName}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          {item.comment}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(item.lessonDate).toLocaleDateString('uz-UZ', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isPresent && (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Darsda bor
                        </span>
                      )}
                      {isAbsent && (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Yo'q (Kelmadi)
                        </span>
                      )}
                      {isLate && (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Kechikdi
                        </span>
                      )}
                      {isExcused && (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Sababli
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              Davomat o'qituvchi tomonidan dars boshida elektron jurnal orqali belgilanadi.
            </span>
          </div>
        </div>

        {/* 2. OYLIK TO'LOV HOLATI VA INVOYSLAR */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Oylik to'lov holati
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Oylik to'lovlar, to'langan cheklar va qarz holati
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>To'lov qilish</span>
              </button>
            </div>

            {/* Current Monthly Status Card */}
            <div
              className={`p-4 rounded-2xl border mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isPaid
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Joriy oylik to'lov (2026-Sentabr)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className={`text-2xl font-black ${isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {isPaid ? 'To\'liq to\'langan' : `${pendingDebt.toLocaleString()} so'm`}
                  </p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    isPaid
                      ? 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                  }`}>
                    {isPaid ? 'Qarzdorlik yo\'q' : 'To\'lanmagan'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Oylik to'lov summasi: {DEMO_CHILD.monthlyFee.toLocaleString()} so'm
                </p>
              </div>

              {!isPaid && (
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Hozir to'lash</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Invoices History Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To'lovlar va invoyslar tarixi
              </h4>
              <div className="space-y-2">
                {DEMO_CHILD.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {inv.period}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {inv.invoiceNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {inv.status === 'paid' ? `To'langan: ${inv.paidDate}` : `To'lov muddati: ${inv.dueDate}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {inv.amount.toLocaleString()} so'm
                      </span>
                      {inv.status === 'paid' ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          To'langan ✅
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                          To'lanmagan ⚠️
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>To'lov tizimlari: Payme, Click, Uzum Bank</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Xavfsiz to'lov
            </span>
          </div>
        </div>
      </div>

      {/* ADDITIONAL SECTIONS: DARS JADVALI, BAHOLAR VA UYGA VAZIFALAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Dars jadvali */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0050cb]" />
              Dars jadvali
            </h3>
            <span className="text-xs text-slate-400">Haftalik</span>
          </div>

          <div className="space-y-2.5">
            {DEMO_CHILD.schedule.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-white">
                  <span>{item.day}</span>
                  <span className="text-[#0050cb] dark:text-blue-400 font-mono text-[11px]">{item.time}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>{item.subject}</span>
                  <span className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{item.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. So'nggi baholar */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              So'nggi baholar
            </h3>
            <span className="text-xs text-slate-400">Jurnal</span>
          </div>

          <div className="space-y-2.5">
            {DEMO_CHILD.grades.map((grade, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    {grade.subject}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                    "{grade.comment}"
                  </p>
                  <span className="text-[10px] text-slate-400">{grade.date}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {grade.score} ball
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Uy vazifalari */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              Uy vazifalari
            </h3>
            <span className="text-xs text-slate-400">Topshiriqlar</span>
          </div>

          <div className="space-y-2.5">
            {DEMO_CHILD.homeworks.map((hw, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{hw.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Muddat: {hw.dueDate}
                  </p>
                </div>
                <Badge variant={hw.status === 'Topshirilgan' ? 'success' : 'warning'}>
                  {hw.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Online Payment Modal */}
      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Oylik to'lovni amalga oshirish">
        {paymentSuccess ? (
          <div className="p-8 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">To'lov muvaffaqiyatli qabul qilindi!</h4>
            <p className="text-xs text-slate-500 mt-1">
              {pendingDebt.toLocaleString()} so'm to'lov qabul qilindi va tizimda tasdiqlandi.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Farzand:</span>
                <span className="font-bold text-slate-800 dark:text-white">{currentChildName}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Davr:</span>
                <span className="font-bold text-slate-800 dark:text-white">2026-Sentabr oylik to'lovi</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>To'lanadigan summa:</span>
                <span className="text-[#0050cb] dark:text-blue-400">{pendingDebt.toLocaleString()} so'm</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                To'lov tizimini tanlang:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'payme', label: 'Payme', color: 'border-cyan-500 bg-cyan-50/30' },
                  { id: 'click', label: 'Click', color: 'border-blue-500 bg-blue-50/30' },
                  { id: 'uzum', label: 'Uzum Bank', color: 'border-purple-500 bg-purple-50/30' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedPaymentProvider(item.id as any)}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      selectedPaymentProvider === item.id
                        ? `${item.color} ring-2 ring-[#0050cb]`
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0050cb] hover:bg-[#003fa4] text-white shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>To'lovni tasdiqlash ({pendingDebt.toLocaleString()} so'm)</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="O'quv markaziga fikr bildirish">
        {feedbackSuccess ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Rahmat!</h4>
            <p className="text-xs text-slate-500 mt-1">Sizning fikringiz markaz ma'muriyatiga yuborildi.</p>
          </div>
        ) : (
          <form onSubmit={submitFeedback} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Baho (1 dan 5 gacha)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      rating >= star
                        ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'
                    }`}
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Fikringiz yoki taklifingiz
              </label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Dars sifati, o'qituvchilar yoki markaz sharoitlari haqida fikringizni yozing..."
                rows={4}
                required
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
              >
                Yuborish
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
