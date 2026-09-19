import React, { useEffect, useState } from 'react';
import { paymentApi, studentApi, teacherApi, financeApi } from '../../services/api';
import { Payment, Student, Teacher, PaymentCalculationPreview, CenterExpense, FinanceSummaryReport } from '../../types';
import { Modal, Badge, LoadingSpinner, EmptyState, Pagination } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { useLanguage } from '../../context/LanguageContext';
import {
  Plus,
  CreditCard,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Receipt,
  Sparkles,
  TrendingUp,
  Wallet,
  ArrowDownRight,
  Layers,
  Calendar,
  Send,
  Bell,
  MessageSquare
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Financial Summary
  const [summary, setSummary] = useState<FinanceSummaryReport | null>(null);
  const [expenses, setExpenses] = useState<CenterExpense[]>([]);

  // Create Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preview, setPreview] = useState<PaymentCalculationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    groupId: '',
    teacherId: '',
    amount: 450000,
    customDiscountPercent: 0,
    initialPaidAmount: 0,
    initialMethod: 1,
    dueDate: '',
    status: 1,
    description: '',
  });

  // Partial Payment Modal
  const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [partialMethod, setPartialMethod] = useState<number>(1);
  const [partialNotes, setPartialNotes] = useState('');
  const [partialNextDueDate, setPartialNextDueDate] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Promise Date Modal
  const [isPromiseModalOpen, setIsPromiseModalOpen] = useState(false);
  const [promisePayment, setPromisePayment] = useState<Payment | null>(null);
  const [newPromiseDate, setNewPromiseDate] = useState('');
  const [promiseNote, setPromiseNote] = useState('');
  const [isSubmittingPromise, setIsSubmittingPromise] = useState(false);

  // SMS and Action Feedback
  const [actionFeedback, setActionFeedback] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);

  // Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Elektr energiya',
    amount: 250000,
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAll({
        status: statusFilter,
        page,
        pageSize: 15,
      });
      setPayments(res.items);
      setTotalPages(res.totalPages);

      const sumRes = await financeApi.getSummary();
      if (sumRes.data) {
        setSummary(sumRes.data);
      }
      const expRes = await financeApi.getExpenses();
      if (expRes.data) {
        setExpenses(expRes.data);
      }
    } catch (err) {
      console.error('Payments fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, page]);

  useEffect(() => {
    studentApi.getAll({ pageSize: 100 }).then((res) => setStudents(res.items));
    teacherApi.getAll({ pageSize: 100 }).then((res) => setTeachers(res.items));
  }, []);

  // Update preview on student or discount change
  useEffect(() => {
    if (formData.studentId) {
      setPreviewLoading(true);
      financeApi.preview({
        studentId: formData.studentId,
        groupId: formData.groupId || undefined,
        customDiscountPercent: formData.customDiscountPercent > 0 ? formData.customDiscountPercent : undefined,
      })
        .then((res) => {
          if (res.data) {
            setPreview(res.data);
            setFormData((prev) => ({
              ...prev,
              amount: res.data.finalAmount,
              teacherId: prev.teacherId || res.data.teacherId || '',
            }));
          }
        })
        .catch((err) => console.error('Preview error', err))
        .finally(() => setPreviewLoading(false));
    } else {
      setPreview(null);
    }
  }, [formData.studentId, formData.groupId, formData.customDiscountPercent]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentApi.create({
        studentId: formData.studentId,
        groupId: formData.groupId || undefined,
        teacherId: formData.teacherId || undefined,
        amount: formData.amount,
        customDiscountPercent: formData.customDiscountPercent > 0 ? formData.customDiscountPercent : undefined,
        initialPaidAmount: formData.initialPaidAmount > 0 ? formData.initialPaidAmount : undefined,
        initialMethod: formData.initialMethod,
        dueDate: new Date(formData.dueDate).toISOString(),
        paymentDate: formData.initialPaidAmount > 0 ? new Date().toISOString() : undefined,
        status: formData.initialPaidAmount >= formData.amount ? 2 : formData.initialPaidAmount > 0 ? 5 : 1,
        description: formData.description || (preview?.discountType ? `Oylik to‘lov (${preview.discountType})` : 'Oylik to‘lov'),
      });
      setIsModalOpen(false);
      fetchPayments();
    } catch (err) {
      console.error('Create payment error', err);
    }
  };

  const handleAddPartialPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || partialAmount <= 0 || isSubmittingTx) return;

    setIsSubmittingTx(true);
    try {
      const idempotencyKey = `tx-${selectedPayment.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await financeApi.addTransaction({
        paymentId: selectedPayment.id,
        amount: partialAmount,
        method: partialMethod,
        idempotencyKey,
        notes: partialNotes || "Qisman to'lov",
      });

      // If promise date was set for the remainder, update it too
      if (partialNextDueDate) {
        await financeApi.updatePromiseDate(selectedPayment.id, {
          newDueDate: new Date(partialNextDueDate).toISOString(),
          note: `Qolgan qismi uchun yangi muddat: ${partialNextDueDate}`,
        });
      }

      setIsPartialModalOpen(false);
      setSelectedPayment(null);
      setPartialAmount(0);
      setPartialNotes('');
      setPartialNextDueDate('');
      setActionFeedback({
        text: `To‘lov qabul qilindi! Qoldiq qarz qayta hisoblandi.`,
        type: 'success',
      });
      setTimeout(() => setActionFeedback(null), 5000);
      fetchPayments();
    } catch (err) {
      console.error('Transaction error', err);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const openPromiseModal = (p: Payment) => {
    setPromisePayment(p);
    const existing = p.dueDate ? p.dueDate.split('T')[0] : new Date().toISOString().split('T')[0];
    setNewPromiseDate(existing);
    setPromiseNote('');
    setIsPromiseModalOpen(true);
  };

  const handleUpdatePromiseDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promisePayment || !newPromiseDate || isSubmittingPromise) return;

    setIsSubmittingPromise(true);
    try {
      await financeApi.updatePromiseDate(promisePayment.id, {
        newDueDate: new Date(newPromiseDate).toISOString(),
        note: promiseNote || undefined,
      });
      setIsPromiseModalOpen(false);
      setPromisePayment(null);
      setActionFeedback({
        text: `Va’da qilingan to‘lov kuni (${new Date(newPromiseDate).toLocaleDateString()}) belgilandi! Belgilangan kundan o‘tsa, tizim avtomatik SMS yuboradi.`,
        type: 'success',
      });
      setTimeout(() => setActionFeedback(null), 6000);
      fetchPayments();
    } catch (err) {
      console.error('Promise date error', err);
    } finally {
      setIsSubmittingPromise(false);
    }
  };

  const handleSendSmsReminder = async (paymentId: string, studentName: string) => {
    setSendingSmsId(paymentId);
    try {
      await financeApi.sendPaymentReminderSms(paymentId);
      setActionFeedback({
        text: `📲 ${studentName} va ota-onasining telefon raqamiga to‘lov eslatmasi SMS orqali yuborildi!`,
        type: 'success',
      });
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err) {
      console.error('SMS send error', err);
      setActionFeedback({
        text: 'SMS eslatma yuborishda xatolik yuz berdi.',
        type: 'info',
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } finally {
      setSendingSmsId(null);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeApi.createExpense({
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        expenseDate: new Date(expenseForm.expenseDate).toISOString(),
        description: expenseForm.description,
      });
      setIsExpenseModalOpen(false);
      fetchPayments();
    } catch (err) {
      console.error('Expense create error', err);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await paymentApi.markAsPaid(id);
      fetchPayments();
    } catch (err) {
      console.error('Mark as paid error', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <StartupBanner
        badgeText="FinTech & Moliya Markazi 💳"
        title={t('payments.title', 'Moliyaviy Hisob-Kitob va To‘lovlar')}
        description={t('payments.desc', 'O‘quvchilar kurs to‘lovlari, oilaviy va individual chegirmalar, qisman to‘lovlar, o‘qituvchi ulushi va markaz sof foydasi.')}
        icon={<CreditCard className="w-6 h-6" />}
        gradientTheme="emerald"
        metrics={[
          { label: t('payments.total_collected', 'Jami to‘lov qaydlari'), value: `${payments.length} ta` },
          { label: t('dash.net_revenue', 'Markaz sof foydasi'), value: summary ? `${(summary.netProfit || 0).toLocaleString()} UZS` : '0 UZS' },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setFormData({
                  studentId: '',
                  groupId: '',
                  teacherId: '',
                  amount: 450000,
                  customDiscountPercent: 0,
                  initialPaidAmount: 0,
                  initialMethod: 1,
                  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  status: 1,
                  description: '',
                });
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi hisob kiritish</span>
            </button>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2.5 bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold rounded-2xl border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>Xarajat kiritish</span>
            </button>
          </div>
        }
      />

      {/* Financial KPIs Bento Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Jami Kutilgan Tushum</span>
            <span className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1 block">
              {(summary.totalExpectedRevenue || 0).toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span>
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs backdrop-blur-md bg-emerald-50/20">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block tracking-wider">Haqiqiy Tushum</span>
            <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
              {(summary.totalCollectedRevenue || 0).toLocaleString()} <span className="text-[10px] text-emerald-600">UZS</span>
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-red-200/80 dark:border-red-900/50 shadow-xs backdrop-blur-md bg-red-50/20">
            <span className="text-[10px] font-bold text-red-500 uppercase block tracking-wider">Qarzdorlik</span>
            <span className="text-base sm:text-lg font-black text-red-600 dark:text-red-400 mt-1 block">
              {(summary.totalDebtAmount || 0).toLocaleString()} <span className="text-[10px] text-red-500">UZS</span>
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-purple-200/80 dark:border-purple-900/50 shadow-xs backdrop-blur-md bg-purple-50/20">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase block tracking-wider">O‘qituvchilar Ulushi</span>
            <span className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300 mt-1 block">
              {(summary.totalTeacherShares || 0).toLocaleString()} <span className="text-[10px] text-purple-600">UZS</span>
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 shadow-xs backdrop-blur-md bg-blue-50/20 col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-[#0050cb] dark:text-blue-400 uppercase block tracking-wider">Sof Foyda</span>
            <span className="text-base sm:text-lg font-black text-[#0050cb] dark:text-blue-300 mt-1 block">
              {(summary.netProfit || 0).toLocaleString()} <span className="text-[10px] text-blue-400">UZS</span>
            </span>
          </div>
        </div>
      )}

      {/* Tab Switcher & Status Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs gap-1">
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-[#0050cb] to-[#0066ff] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            💳 {language === 'RU' ? 'Платежи студентов' : language === 'EN' ? 'Student Payments' : 'O‘quvchi To‘lovlari'}
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            📉 {language === 'RU' ? 'Расходы центра' : language === 'EN' ? 'Center Expenses' : 'Markaz Xarajatlari'} ({expenses.length})
          </button>
        </div>

        {activeTab === 'payments' && (
          <div className="flex bg-white/90 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs gap-1 overflow-x-auto">
            {[
              { id: undefined, label: `📑 ${t('period.all', 'Barchasi')}` },
              { id: 5, label: `⏳ ${t('status.pending', 'Qisman')}` },
              { id: 3, label: `⚠️ ${t('status.overdue', 'Qarzdorlik')}` },
              { id: 1, label: `🕒 ${t('status.pending', 'Kutilmoqda')}` },
              { id: 2, label: `✅ ${t('status.paid', 'To‘langan')}` },
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setPage(1);
                }}
                className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {actionFeedback.text}
          </span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'payments' ? (
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden backdrop-blur-md">
          {loading ? (
            <LoadingSpinner text="To'lovlar ro'yxati yuklanmoqda..." />
          ) : payments.length === 0 ? (
            <EmptyState title="To'lovlar topilmadi" description="Ushbu filter bo'yicha to'lov qaydlari mavjud emas." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">{t('table.student', 'O‘quvchi')} & {t('table.group', 'Guruh')}</th>
                    <th className="py-3.5 px-4">{t('table.amount', 'Kurs Narxi')}</th>
                    <th className="py-3.5 px-4">{t('status.paid', 'To‘langan')} / {t('table.debt', 'Qarz')}</th>
                    <th className="py-3.5 px-4">{t('dash.teachers_count', 'O‘qituvchi')} {t('teacher.share_percent', 'Ulushi')}</th>
                    <th className="py-3.5 px-4">{t('teacher.due_date', 'Muddati')}</th>
                    <th className="py-3.5 px-4">{t('table.status', 'Holat')}</th>
                    <th className="py-3.5 px-5 text-right">{t('table.actions', 'Amallar')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {payments.map((p) => {
                    const finalAmount = p.finalAmount || p.amount;
                    const paidAmount = p.paidAmount ?? (p.status === 2 ? p.amount : 0);
                    const debtAmount = p.debtAmount ?? Math.max(0, finalAmount - paidAmount);
                    const teacherShare = p.teacherShareAmount ?? Math.round(paidAmount * 0.2);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-5">
                          <strong className="text-slate-800 dark:text-white block text-xs">{p.studentName}</strong>
                          <span className="text-[11px] text-slate-400 block">{p.groupName || 'Guruh biriktirilmagan'}</span>
                          {p.studentPhone && <span className="text-[10px] text-slate-400">{p.studentPhone}</span>}
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-xs font-bold text-slate-800 dark:text-white">
                            {finalAmount.toLocaleString()} UZS
                          </div>
                          {(p.discountPercent ?? 0) > 0 ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> -{p.discountPercent}% chegirma
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Chegirmasiz</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                              {paidAmount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400">/</span>
                            <span className={`text-xs font-extrabold ${debtAmount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                              {debtAmount > 0 ? `${debtAmount.toLocaleString()} qarz` : '0 qarz'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {p.transactions && p.transactions.length > 0 ? `${p.transactions.length} ta to‘lov` : 'Bir martalik'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-300 block">
                            {teacherShare.toLocaleString()} UZS
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[140px]" title={p.teacherName || 'Guruh o‘qituvchisi'}>
                            {p.teacherName || 'Guruh o‘qituvchisi'} ({p.teacherSharePercent || 20}%)
                          </span>
                        </td>

                        <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                          {new Date(p.dueDate).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              debtAmount <= 0
                                ? 'success'
                                : (p.paidAmount || 0) > 0
                                ? 'info'
                                : p.status === 3
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {debtAmount <= 0
                              ? 'To‘langan'
                              : (p.paidAmount || 0) > 0
                              ? 'Qisman (Kutilmoqda)'
                              : p.status === 3
                              ? 'Qarzdor'
                              : 'Kutilmoqda'}
                          </Badge>
                        </td>

                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          {debtAmount > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPayment(p);
                                  setPartialAmount(debtAmount > 0 ? debtAmount : 100000);
                                  setPartialNextDueDate(p.dueDate ? p.dueDate.split('T')[0] : '');
                                  setIsPartialModalOpen(true);
                                }}
                                title="Bo‘lib to‘lash / Tranzaksiya qo‘shish"
                                className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300 hover:bg-blue-100 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Wallet className="w-3.5 h-3.5" />
                                <span>Bo‘lib to‘lash</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openPromiseModal(p)}
                                title="Va’da qilingan to‘lov kunini belgilash"
                                className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Kun belgilash</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSendSmsReminder(p.id, p.studentName)}
                                disabled={sendingSmsId === p.id}
                                title="O‘quvchi va ota-onaga eslatma SMS yuborish"
                                className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{sendingSmsId === p.id ? 'Yuborilmoqda...' : 'SMS'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkAsPaid(p.id)}
                                title="To‘liq to‘landi deb belgilash"
                                className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Yopish</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> To‘liq yopilgan
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : (
        /* Expenses Table */
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden backdrop-blur-md">
          {expenses.length === 0 ? (
            <EmptyState title="Xarajatlar mavjud emas" description="Hozircha markaz xarajatlari kiritilmagan." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Kategoriya</th>
                    <th className="py-3.5 px-4">Summa</th>
                    <th className="py-3.5 px-4">Sana</th>
                    <th className="py-3.5 px-4">Izoh</th>
                    <th className="py-3.5 px-5 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-800 dark:text-white">
                        {e.category}
                      </td>
                      <td className="py-4 px-4 font-extrabold text-red-500">
                        -{e.amount.toLocaleString()} UZS
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        {e.description || '—'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={async () => {
                            await financeApi.deleteExpense(e.id);
                            fetchPayments();
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
                        >
                          O‘chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Partial Payment (Bo'lib to'lash) Modal */}
      <Modal
        isOpen={isPartialModalOpen}
        onClose={() => {
          setIsPartialModalOpen(false);
          setSelectedPayment(null);
        }}
        title="Qisman To‘lov (Tranzaksiya Qabul Qilish)"
      >
        {selectedPayment && (
          <form onSubmit={handleAddPartialPayment} className="space-y-4">
            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#0050cb] dark:text-blue-300 block">
                O‘quvchi: {selectedPayment.studentName}
              </span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Yakuniy to‘lov summasi:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {(selectedPayment.finalAmount || selectedPayment.amount).toLocaleString()} UZS
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Hozirgacha to‘langan:</span>
                <span className="font-bold text-emerald-600">
                  {(selectedPayment.paidAmount || 0).toLocaleString()} UZS
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-blue-200/50 dark:border-blue-800 pt-1">
                <span className="text-slate-600 dark:text-slate-400">Qolgan qarz:</span>
                <span className="font-black text-red-500">
                  {(selectedPayment.debtAmount || Math.max(0, (selectedPayment.finalAmount || selectedPayment.amount) - (selectedPayment.paidAmount || 0))).toLocaleString()} UZS
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">To‘lov summasi (UZS) *</label>
              <input
                type="number"
                required
                min={1000}
                value={partialAmount}
                onChange={(e) => setPartialAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">To‘lov usuli</label>
              <select
                value={partialMethod}
                onChange={(e) => setPartialMethod(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              >
                <option value={1}>Naqd pul</option>
                <option value={2}>Payme</option>
                <option value={3}>Click</option>
                <option value={4}>Bank o‘tkazmasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Qolgan qismi uchun yangi to‘lov muddati (ixtiyoriy)
              </label>
              <input
                type="date"
                value={partialNextDueDate}
                onChange={(e) => setPartialNextDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                O‘quvchi qolgan qarzini shu kunda beraman degan bo‘lsa, muddatni yangilang. Belgilangan kun o‘tsa SMS eslatma yuboriladi.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Izoh / Kvitansiya</label>
              <input
                type="text"
                value={partialNotes}
                onChange={(e) => setPartialNotes(e.target.value)}
                placeholder="Payme orqali 2-bo‘lib to‘lash..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPartialModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSubmittingTx}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingTx ? 'Qabul qilinmoqda...' : 'To‘lovni Qabul Qilish'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Promise Date Modal */}
      <Modal
        isOpen={isPromiseModalOpen}
        onClose={() => setIsPromiseModalOpen(false)}
        title="Va’da Qilingan To‘lov Kunini Belgilash"
      >
        {promisePayment && (
          <form onSubmit={handleUpdatePromiseDate} className="space-y-4">
            <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white">
                <span>O‘quvchi:</span>
                <span>{promisePayment.studentName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Guruh:</span>
                <span>{promisePayment.groupName || 'Biriktirilmagan'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Jami kurs to‘lovi:</span>
                <span>{(promisePayment.finalAmount || promisePayment.amount).toLocaleString()} UZS</span>
              </div>
              <div className="flex items-center justify-between font-extrabold border-t border-purple-200/80 dark:border-purple-800 pt-1.5 text-red-500">
                <span>Qolgan qarz:</span>
                <span>{(promisePayment.debtAmount || Math.max(0, (promisePayment.finalAmount || promisePayment.amount) - (promisePayment.paidAmount || 0))).toLocaleString()} UZS</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Va’da qilingan to‘lov kuni (Yangi muddat) *
              </label>
              <input
                type="date"
                required
                value={newPromiseDate}
                onChange={(e) => setNewPromiseDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Izoh / Va’da sharti
              </label>
              <input
                type="text"
                value={promiseNote}
                onChange={(e) => setPromiseNote(e.target.value)}
                placeholder="Masalan: 10-sanada oylik olgach qolganini beradi..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Bell className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Avtomatik SMS himoyasi:</strong> Agar ushbu belgilangan kunga qadar to‘lov qilinmasa, belgilangan kundan o‘tgan zahoti tizim avtomatik ravishda o‘quvchi va uning ota-onasining telefon raqamiga eslatma SMS yuboradi.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPromiseModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSubmittingPromise}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPromise ? 'Saqlanmoqda...' : 'Muddatni Saqlash'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Payment Modal with Live Breakdown Preview */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi To‘lov Hisob-Kitobi Yaratish">
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">O‘quvchini tanlang *</label>
            <select
              required
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
            >
              <option value="">O‘quvchi tanlang</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mas’ul O‘qituvchi (Ulush biriktiriladi)</label>
            <select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
            >
              <option value="">Guruh o‘qituvchisi bo‘yicha avtomatik</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.specialization || 'O‘qituvchi'})
                </option>
              ))}
            </select>
          </div>

          {/* Live Breakdown Preview */}
          {preview && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Kurs asosiy narxi:</span>
                <span className="font-bold text-slate-800 dark:text-white">{preview.basePrice.toLocaleString()} UZS</span>
              </div>

              {preview.appliedDiscountPercent > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Chegirma ({preview.discountType}):</span>
                  <span>-{preview.discountAmount.toLocaleString()} UZS</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-slate-700 pt-1.5 font-bold">
                <span className="text-slate-800 dark:text-white">Yakuniy to‘lov:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">{preview.finalAmount.toLocaleString()} UZS</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>O‘qituvchi ulushi ({preview.teacherSharePercent}%):</span>
                <span>{preview.estimatedTeacherShare.toLocaleString()} UZS</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Maxsus Chegirma (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.customDiscountPercent}
                onChange={(e) => setFormData({ ...formData, customDiscountPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">To‘lov muddati *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hozir to‘lanayotgan summa</label>
              <input
                type="number"
                min={0}
                value={formData.initialPaidAmount}
                onChange={(e) => setFormData({ ...formData, initialPaidAmount: Number(e.target.value) })}
                placeholder="Bo‘sh bo‘lsa qarz bo‘lib yoziladi"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">To‘lov usuli</label>
              <select
                value={formData.initialMethod}
                onChange={(e) => setFormData({ ...formData, initialMethod: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              >
                <option value={1}>Naqd pul</option>
                <option value={2}>Payme</option>
                <option value={3}>Click</option>
                <option value={4}>Bank</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Izoh / Tavsif</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Sentyabr oylik kursi..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Hisobni Saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Markaz Xarajati Kiritish">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Xarajat Kategoriyasi</label>
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
            >
              <option value="Elektr energiya">Elektr energiya / Kommunal</option>
              <option value="Bino ijarasi">Bino ijarasi</option>
              <option value="Internet va aloqa">Internet va aloqa</option>
              <option value="Marketing va reklama">Marketing va reklama</option>
              <option value="Kantselyariya va jihozlar">Kantselyariya va jihozlar</option>
              <option value="Boshqa xarajat">Boshqa xarajat</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Summa (UZS) *</label>
              <input
                type="number"
                required
                min={1000}
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sana *</label>
              <input
                type="date"
                required
                value={expenseForm.expenseDate}
                onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Izoh / Maqsad</label>
            <input
              type="text"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              placeholder="Avgust oyi elektr energiya to‘lovi..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Xarajatni Saqlash
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
