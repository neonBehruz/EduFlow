import React, { useEffect, useState } from 'react';
import { parentPortalApi } from '../../services/api';
import { ParentDashboardDto } from '../../types';
import { LoadingSpinner, Modal } from '../../components/common/UIComponents';
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
  Phone,
  Search,
  ChevronRight,
  Receipt,
  GraduationCap,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

// Generates localized sample children data when database has 0 students
const getDemoChildren = (lang: 'UZ' | 'RU' | 'EN') => {
  const isRu = lang === 'RU';
  const isEn = lang === 'EN';

  return [
    {
      id: 'demo-1',
      fullName: 'Azizbek Rahimov',
      birthDate: '2008-05-14',
      phoneNumber: '+998 90 123 45 67',
      enrollmentDate: '2025-09-01',
      attendanceRate: 92,
      totalLessons: 24,
      attendedLessons: 22,
      absentLessons: 1,
      lateLessons: 1,
      averageGrade: 89,
      monthlyFee: 450000,
      pendingDebt: 450000,
      groups: [
        {
          id: 'g-1',
          name: 'IELTS Intermediate',
          subject: isRu ? 'Английский язык (IELTS)' : isEn ? 'English (IELTS)' : 'Ingliz tili (IELTS)',
          teacher: 'Azizbek Karimov',
          schedule: isRu ? 'Пн, Ср, Пт | 14:00 - 15:30' : isEn ? 'Mon, Wed, Fri | 14:00 - 15:30' : 'Du, Chor, Jum | 14:00 - 15:30',
          room: isRu ? 'Аудитория 101' : isEn ? 'Room 101' : 'Xona 101',
        },
        {
          id: 'g-2',
          name: isRu ? 'Высшая математика' : isEn ? 'Higher Mathematics' : 'Oliy Matematika',
          subject: isRu ? 'Математика' : isEn ? 'Mathematics' : 'Matematika',
          teacher: 'Rustam Qodirov',
          schedule: isRu ? 'Вт, Чт, Сб | 16:00 - 17:30' : isEn ? 'Tue, Thu, Sat | 16:00 - 17:30' : 'Se, Pay, Sha | 16:00 - 17:30',
          room: isRu ? 'Аудитория 201' : isEn ? 'Room 201' : 'Xona 201',
        },
      ],
      recentAttendances: [
        {
          subject: 'IELTS Writing Task 2',
          status: 1,
          date: '2026-03-08',
          comment: isRu ? 'Пришел вовремя, отлично усвоил тему' : isEn ? 'On time, mastered the topic well' : 'Darsga o‘z vaqtida keldi, mavzuni yaxshi o‘zlashtirdi',
        },
        {
          subject: isRu ? 'Высшая математика' : isEn ? 'Higher Mathematics' : 'Oliy Matematika',
          status: 2,
          date: '2026-03-06',
          comment: isRu ? 'Отсутствовал по болезни (предупредили)' : isEn ? 'Absent due to illness (notified)' : 'Kelmadi, kasallik sababli ogohlantirilgan',
        },
        {
          subject: 'IELTS Speaking Mock',
          status: 1,
          date: '2026-03-04',
          comment: isRu ? 'Активно участвовал в диалогах' : isEn ? 'Active in speaking sessions' : 'Darsda faol qatnashdi',
        },
      ],
      grades: [
        { subject: 'IELTS Essay #3', score: 92, maxScore: 100, date: '2026-03-07', comment: isRu ? 'Отличная грамматика и структура' : isEn ? 'Excellent grammar & cohesion' : 'Grammatika va struktura a‘lo' },
        { subject: isRu ? 'Тест по интегралам' : isEn ? 'Integrals Quiz' : 'Integrallar test', score: 86, maxScore: 100, date: '2026-03-05', comment: isRu ? 'Хорошо, повторить формулы' : isEn ? 'Good job, review formulas' : 'Yaxshi, formulalarni takrorlash kerak' },
      ],
      invoices: [
        { id: 'INV-2026-03', period: isRu ? 'Март 2026' : isEn ? 'March 2026' : 'Mart 2026', number: 'INV-2026-03', amount: 450000, status: 'unpaid' },
        { id: 'INV-2026-02', period: isRu ? 'Февраль 2026' : isEn ? 'February 2026' : 'Fevral 2026', number: 'INV-2026-02', amount: 450000, status: 'paid' },
      ],
    },
    {
      id: 'demo-2',
      fullName: 'Malika Rahimova',
      birthDate: '2011-09-20',
      phoneNumber: '+998 90 987 65 43',
      enrollmentDate: '2025-10-15',
      attendanceRate: 98,
      totalLessons: 20,
      attendedLessons: 20,
      absentLessons: 0,
      lateLessons: 0,
      averageGrade: 94,
      monthlyFee: 380000,
      pendingDebt: 0,
      groups: [
        {
          id: 'g-3',
          name: 'General English (Beginner)',
          subject: isRu ? 'Английский язык' : isEn ? 'English Language' : 'Ingliz tili',
          teacher: 'Malika Tursunova',
          schedule: isRu ? 'Пн, Ср, Пт | 10:00 - 11:30' : isEn ? 'Mon, Wed, Fri | 10:00 - 11:30' : 'Du, Chor, Jum | 10:00 - 11:30',
          room: isRu ? 'Аудитория 102' : isEn ? 'Room 102' : 'Xona 102',
        },
      ],
      recentAttendances: [
        {
          subject: 'English Vocabulary Unit 5',
          status: 1,
          date: '2026-03-08',
          comment: isRu ? '100% присутствие, домашнее задание выполнено' : isEn ? '100% attendance, homework completed' : '100% qatnashdi, uy vazifasi to‘liq bajarilgan',
        },
      ],
      grades: [
        { subject: 'Vocabulary Quiz', score: 98, maxScore: 100, date: '2026-03-06', comment: isRu ? 'Превосходный результат' : isEn ? 'Outstanding result' : 'Ajoyib natija' },
      ],
      invoices: [
        { id: 'INV-2026-03-M', period: isRu ? 'Март 2026' : isEn ? 'March 2026' : 'Mart 2026', number: 'INV-2026-03-M', amount: 380000, status: 'paid' },
      ],
    },
  ];
};

export const MyChildrenPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [dashboard, setDashboard] = useState<ParentDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'attendance' | 'grades' | 'billing'>('groups');

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentChild, setPaymentChild] = useState<any | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'payme' | 'click' | 'uzum'>('payme');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await parentPortalApi.getDashboard();
      if (res.success && res.data) {
        setDashboard(res.data);
      }
    } catch (err) {
      console.error('Parent children load error', err);
    } finally {
      setLoading(false);
    }
  };

  const realChildren = dashboard?.children || [];
  const hasRealChildren = realChildren.length > 0;
  const demoChildren = getDemoChildren(language);
  const displayChildren = hasRealChildren ? realChildren : demoChildren;

  const handlePayChild = (child: any) => {
    setPaymentChild(child);
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setPaymentModalOpen(false);
      if (paymentChild) {
        paymentChild.pendingDebt = 0;
        if (paymentChild.invoices && paymentChild.invoices[0]) {
          paymentChild.invoices[0].status = 'paid';
        }
      }
    }, 1500);
  };

  if (loading) {
    return <LoadingSpinner text={t('action.loading', 'Yuklanmoqda...')} />;
  }

  const isRu = language === 'RU';
  const isEn = language === 'EN';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Zero state notice */}
      {!hasRealChildren && (
        <div className="bg-blue-500/10 border border-blue-500/30 dark:bg-blue-950/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                {t('children.demo_notice_title', 'Namunaviy farzandlar profili ko‘rinishi')}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('children.demo_notice_desc', 'Tizim yangi boshlanganligi sababli quyida namunaviy farzandlar profillari ko‘rsatilmoqda. Farzandingiz ma\'lumotlarini markaz administratoridan biriktirishingiz mumkin.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0050cb] via-[#1a65db] to-[#3b82f6] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {t('children.mgmt_badge', 'Farzandlarim boshqaruvi')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('children.title', 'Mening Farzandlarim')} ({displayChildren.length} {isRu ? 'детей' : isEn ? 'children' : 'nafar'})
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              {t('children.subtitle', 'Har bir farzandingizning dars jadvali, o‘qituvchilari, davomat daftari, baholari va oylik to‘lovlarini alohida boshqaring.')}
            </p>
          </div>
        </div>
      </div>

      {/* Children Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayChildren.map((child: any) => {
          const isPaid = (child.pendingDebt ?? child.pendingPaymentAmount ?? 0) <= 0;
          const groups = child.groups || [
            {
              id: 'g-default',
              name: child.groupNames || (isRu ? 'Основная группа' : isEn ? 'Primary Group' : 'Asosiy guruh'),
              subject: isRu ? 'Предмет прикреплен' : isEn ? 'Subject Enrolled' : 'Fan biriktirilgan',
              teacher: isRu ? 'Преподаватель' : isEn ? 'Teacher' : 'O‘qituvchi',
              schedule: isRu ? 'Пн, Ср, Пт | 14:00 - 15:30' : isEn ? 'Mon, Wed, Fri | 14:00 - 15:30' : 'Du, Chor, Jum | 14:00 - 15:30',
              room: isRu ? 'Аудитория 101' : isEn ? 'Room 101' : 'Xona 101',
            },
          ];

          return (
            <div
              key={child.id}
              className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-900 transition-all"
            >
              <div className="p-6 space-y-4">
                {/* Child Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0050cb] to-[#3b82f6] text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
                      {(child.fullName || 'F')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {child.fullName}
                        </h3>
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                          {t('children.active_student', 'Faol o‘quvchi')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{child.phoneNumber || '+998 90 000 00 00'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isPaid ? (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('children.paid', 'To‘langan')} ✅
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> {t('children.debt', 'Qarzdorlik')} ⚠️
                      </span>
                    )}
                  </div>
                </div>

                {/* Key KPIs (Davomat, O'rtacha baho, Guruhlar soni) */}
                <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-center">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                      {t('children.attendance', 'Davomat')}
                    </span>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {child.attendanceRate || 92}%
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {t('children.attendance_sub', 'Qatnashuv')}
                    </span>
                  </div>

                  <div className="text-center border-x border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                      {t('children.avg_grade', 'O‘rtacha baho')}
                    </span>
                    <p className="text-base font-black text-[#0050cb] dark:text-blue-400 mt-0.5">
                      {child.averageGrade || 89} <span className="text-[10px] text-slate-400">/ 100</span>
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {t('children.avg_grade_sub', 'Akademik')}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                      {t('children.groups', 'Guruhlar')}
                    </span>
                    <p className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">
                      {groups.length} {isRu ? 'гр.' : isEn ? 'gr.' : 'ta'}
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {t('children.groups_sub', 'Biriktirilgan')}
                    </span>
                  </div>
                </div>

                {/* Groups Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {t('children.assigned_courses', 'Biriktirilgan kurslar va guruhlar:')}
                  </span>
                  <div className="space-y-2">
                    {groups.map((g: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center font-bold text-xs shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">
                              {g.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {t('children.teacher', 'Ustoz:')} {g.teacher} • {g.room}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded-lg">
                          {g.schedule}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {!isPaid ? (
                  <button
                    onClick={() => handlePayChild(child)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      {isRu ? 'Оплатить' : isEn ? 'Pay' : 'To‘lov qilish'} ({((child.pendingDebt || child.monthlyFee) ?? 450000).toLocaleString()} {isRu ? 'сум' : isEn ? 'UZS' : 'so‘m'})
                    </span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {t('children.paid', 'To‘langan')}
                  </span>
                )}

                <button
                  onClick={() => {
                    setSelectedChild(child);
                    setActiveTab('groups');
                  }}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>{t('children.view_full_profile', 'To‘liq ma\'lumotlarni ko‘rish')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Child Profile Modal */}
      {selectedChild && (
        <Modal
          isOpen={!!selectedChild}
          onClose={() => setSelectedChild(null)}
          title={`${selectedChild.fullName} - ${t('children.view_full_profile', 'To‘liq ma\'lumotlar')}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Child Header Card */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0050cb] text-white flex items-center justify-center font-black text-lg">
                  {selectedChild.fullName[0]}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedChild.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tel: {selectedChild.phoneNumber}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-[#0050cb] dark:text-blue-400 block">
                  {t('children.attendance', 'Davomat')}: {selectedChild.attendanceRate}%
                </span>
                <span className="text-[11px] text-slate-500">
                  {t('children.avg_grade', 'O‘rtacha')}: {selectedChild.averageGrade} {isRu ? 'баллов' : isEn ? 'pts' : 'ball'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {[
                { id: 'groups', label: t('children.tab_schedule', 'Dars Jadvali'), icon: Calendar },
                { id: 'attendance', label: t('children.tab_attendance', 'Davomat daftari'), icon: CheckCircle2 },
                { id: 'grades', label: t('children.tab_grades', 'Baholar'), icon: Award },
                { id: 'billing', label: t('children.tab_payments', 'To‘lov & Invoyslar'), icon: CreditCard },
              ].map((tab) => {
                const Icon = tab.icon;
                const isCurrent = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-white dark:bg-slate-900 text-[#0050cb] dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Dars jadvali va Guruhlar */}
            {activeTab === 'groups' && (
              <div className="space-y-3">
                {(selectedChild.groups || []).map((g: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#0050cb]" />
                        {g.name}
                      </h5>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-[#0050cb] text-[10px] font-bold rounded-md">
                        {g.subject}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t('children.teacher', 'Ustoz:')}</span>
                        <span className="font-semibold">{g.teacher}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isRu ? 'Аудитория:' : isEn ? 'Room:' : 'Xona:'}</span>
                        <span className="font-semibold">{g.room}</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-xs font-mono text-[#0050cb] dark:text-blue-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{g.schedule}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Davomat tarixi (Borligi / Yo'qligi) */}
            {activeTab === 'attendance' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold">
                  <span>{isRu ? 'Всего уроков:' : isEn ? 'Total lessons:' : 'Darslar soni:'} {selectedChild.totalLessons || 24}</span>
                  <span className="text-emerald-600">{t('children.present', 'Bor')}: {selectedChild.attendedLessons || 22}</span>
                  <span className="text-rose-600">{t('children.absent', 'Yo‘q')}: {selectedChild.absentLessons || 1}</span>
                </div>

                {(selectedChild.recentAttendances || []).map((att: any, idx: number) => {
                  const isPresent = att.status === 1;
                  const isAbsent = att.status === 2;
                  const isLate = att.status === 3;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex items-center justify-between ${
                        isPresent
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40'
                          : isAbsent
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40'
                          : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-600'
                              : isAbsent
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          {isPresent && <CheckCircle2 className="w-4 h-4" />}
                          {isAbsent && <XCircle className="w-4 h-4" />}
                          {isLate && <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {att.subject}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {att.comment}
                          </p>
                          <span className="text-[10px] text-slate-400">{att.date}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isPresent && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                            {t('children.present', 'Bor')} ✅
                          </span>
                        )}
                        {isAbsent && (
                          <span className="text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
                            {t('children.absent', 'Yo‘q')} ❌
                          </span>
                        )}
                        {isLate && (
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                            {t('children.late', 'Kechikdi')} ⏱️
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Baholar jurnali */}
            {activeTab === 'grades' && (
              <div className="space-y-2.5">
                {(selectedChild.grades || []).map((grade: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {grade.subject}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                        "{grade.comment}"
                      </p>
                      <span className="text-[10px] text-slate-400">{grade.date}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {grade.score} / {grade.maxScore || 100}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: To'lovlar va Invoyslar */}
            {activeTab === 'billing' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      {t('children.monthly_tuition', 'Oylik to‘lov:')}
                    </span>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {(selectedChild.monthlyFee || 450000).toLocaleString()} {isRu ? 'сум' : isEn ? 'UZS' : 'so‘m'}
                    </p>
                  </div>
                  {(selectedChild.pendingDebt || 0) > 0 ? (
                    <button
                      onClick={() => {
                        setSelectedChild(null);
                        handlePayChild(selectedChild);
                      }}
                      className="px-4 py-2 bg-[#0050cb] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#003fa4] cursor-pointer"
                    >
                      {isRu ? 'Оплатить' : isEn ? 'Pay' : 'To‘lov qilish'}
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl">
                      {t('children.paid', 'To‘langan')} ✅
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h6 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isRu ? 'Список счетов:' : isEn ? 'Invoice List:' : 'Cheklar ro‘yxati:'}
                  </h6>
                  {(selectedChild.invoices || []).map((inv: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Receipt className="w-4 h-4 text-[#0050cb]" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{inv.period}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{inv.number}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold">{inv.amount.toLocaleString()} {isRu ? 'сум' : isEn ? 'UZS' : 'so‘m'}</p>
                        <span className={`text-[10px] font-bold ${inv.status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {inv.status === 'paid' ? `${t('children.paid', 'To‘langan')} ✅` : `${t('children.debt', 'Qarzdorlik')} ⚠️`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}


      {/* Online Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={isRu ? 'Оплата обучения онлайн' : isEn ? 'Online Tuition Payment' : 'Oylik to‘lovni amalga oshirish'}
      >
        {paymentSuccess ? (
          <div className="p-8 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              {isRu ? 'Оплата успешно завершена!' : isEn ? 'Payment successful!' : 'To‘lov muvaffaqiyatli amalga oshirildi!'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isRu ? 'Средства зачислены и подтверждены учебным центром.' : isEn ? 'Funds credited and confirmed by center.' : 'Oylik to‘lov qabul qilindi va tizimda tasdiqlandi.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{isRu ? 'Учащийся:' : isEn ? 'Student:' : 'Farzand:'}</span>
                <span className="font-bold text-slate-800 dark:text-white">{paymentChild?.fullName}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{isRu ? 'Период:' : isEn ? 'Period:' : 'Davr:'}</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {isRu ? 'Март 2026' : isEn ? 'March 2026' : '2026-Mart oyi'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>{isRu ? 'К оплате:' : isEn ? 'Amount to pay:' : 'To‘lanadigan summa:'}</span>
                <span className="text-[#0050cb] dark:text-blue-400">
                  {((paymentChild?.pendingDebt || paymentChild?.monthlyFee) ?? 450000).toLocaleString()} {isRu ? 'сум' : isEn ? 'UZS' : 'so‘m'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {isRu ? 'Выберите платежную систему:' : isEn ? 'Select Payment Method:' : 'To‘lov tizimini tanlang:'}
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
                    onClick={() => setSelectedProvider(item.id as any)}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      selectedProvider === item.id
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
                {t('action.cancel', 'Bekor qilish')}
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0050cb] hover:bg-[#003fa4] text-white shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isRu ? 'Подтвердить оплату' : isEn ? 'Confirm Payment' : 'To‘lovni tasdiqlash'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
