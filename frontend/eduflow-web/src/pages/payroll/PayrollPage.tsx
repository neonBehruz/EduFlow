import React, { useEffect, useState } from 'react';
import { payrollApi, teacherApi } from '../../services/api';
import { TeacherPayrollDto, Teacher, CalculatePayrollRequestDto } from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  Calculator,
} from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isTeacher = user?.role === 3;
  const isAdmin = user?.role === 1 || user?.role === 2;

  const [payrolls, setPayrolls] = useState<TeacherPayrollDto[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Month & Year Filter
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Calculate Modal
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcTeacherId, setCalcTeacherId] = useState('');
  const [calcType, setCalcType] = useState<number>(2); // Default: Percentage
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [customRate, setCustomRate] = useState<number>(20);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    loadPayrolls();
  }, [selectedYear, selectedMonth]);

  const loadTeachers = async () => {
    try {
      const res = await teacherApi.getAll({ pageSize: 100 });
      if (res.items) {
        setTeachers(res.items);
      }
    } catch (err) {
      console.error('Teachers load error', err);
    }
  };

  const loadPayrolls = async () => {
    try {
      setLoading(true);
      const res = await payrollApi.getPayrolls({
        year: selectedYear,
        month: selectedMonth,
      });
      if (res.success && res.data) {
        setPayrolls(res.data);
      }
    } catch (err) {
      console.error('Payrolls load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcTeacherId) return;

    try {
      setCalculating(true);
      const payload: CalculatePayrollRequestDto = {
        teacherId: calcTeacherId,
        year: selectedYear,
        month: selectedMonth,
        calculationType: calcType,
        customRate: calcType === 2 ? customRate : undefined,
        baseSalary: (calcType === 1 || calcType === 4) ? baseSalary : undefined,
      };

      const res = await payrollApi.calculate(payload);
      if (res.success) {
        setCalcOpen(false);
        loadPayrolls();
      }
    } catch (err) {
      console.error('Payroll calculate error', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleMarkPaid = async (payrollId: string) => {
    try {
      const res = await payrollApi.markPaid(payrollId);
      if (res.success) {
        loadPayrolls();
      }
    } catch (err) {
      console.error('Mark payroll paid error', err);
    }
  };

  const getTypeName = (type: number) => {
    if (language === 'RU') {
      switch (type) {
        case 1: return 'Фиксированный оклад';
        case 2: return 'Процент от курса';
        case 3: return 'Почасовая / Поурочная';
        case 4: return 'Оклад + Процент';
        default: return 'Обычный';
      }
    }
    if (language === 'EN') {
      switch (type) {
        case 1: return 'Fixed Salary';
        case 2: return 'Percentage Share';
        case 3: return 'Per Lesson Rate';
        case 4: return 'Base + Share';
        default: return 'Standard';
      }
    }
    switch (type) {
      case 1: return 'Fikslangan oylik';
      case 2: return 'Foizli ulush';
      case 3: return 'Darsbay stavka';
      case 4: return 'Baza + Foiz';
      default: return 'Oddiy';
    }
  };

  const totalCalculated = payrolls.reduce((acc, p) => acc + p.calculatedSalary, 0);
  const totalPaid = payrolls.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalRemaining = payrolls.reduce((acc, p) => acc + p.remainingAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isTeacher
                ? t('payroll.my_salary_title', 'Mening Oylik Maoshim')
                : t('payroll.title', 'O‘qituvchilar Oylik Maoshi (Payroll)')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isTeacher
                ? t('payroll.my_salary_desc', 'Har oylik hisoblangan va to‘langan maoshlar, foizlar hamda bonuslar tarixi.')
                : t('payroll.desc', 'Foizli, darsbay va fikslangan ish haqi hisob-kitobi')}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              if (teachers.length > 0) setCalcTeacherId(teachers[0].id);
              setCalcOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
          >
            <Calculator className="w-4 h-4" />
            <span>{t('payroll.calculate_all', 'Oylikni hisoblash')}</span>
          </button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'RU' ? 'Всего начислено' : language === 'EN' ? 'Total Calculated' : 'Jami hisoblangan'}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalCalculated.toLocaleString()} UZS
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {payrolls.length} {t('dash.teachers_count', "o'qituvchi")}
          </span>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t('payroll.paid_out', 'To‘lab berildi')}
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {totalPaid.toLocaleString()} UZS
          </p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            {t('status.paid', 'To\'langan qism')}
          </span>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t('payroll.total_payout', 'To‘lanishi kerak')}
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {totalRemaining.toLocaleString()} UZS
          </p>
          <span className="text-[11px] text-rose-600 font-medium mt-1 block">
            {t('table.debt', 'Qoldiq maosh')}
          </span>
        </div>
      </div>

      {/* Payroll Table */}
      {loading ? (
        <LoadingSpinner text={t('action.loading', 'Payroll hisob-kitoblari yuklanmoqda...')} />
      ) : payrolls.length > 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4 pl-6">{t('table.teacher', 'O‘qituvchi')}</th>
                  <th className="p-4">{t('table.type', 'Turi')}</th>
                  <th className="p-4">{language === 'RU' ? 'Уроков' : language === 'EN' ? 'Lessons' : 'Darslar soni'}</th>
                  <th className="p-4">{t('table.student', 'O‘quvchilar')}</th>
                  <th className="p-4">{language === 'RU' ? 'Выручка' : language === 'EN' ? 'Revenue' : 'Tushum'}</th>
                  <th className="p-4">{t('teacher.monthly_earnings', 'Hisoblangan maosh')}</th>
                  <th className="p-4">{t('status.paid', 'To‘langan')}</th>
                  <th className="p-4">{language === 'RU' ? 'Остаток' : language === 'EN' ? 'Remaining' : 'Qoldiq'}</th>
                  <th className="p-4 pr-6 text-right">{t('table.actions', 'Amal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">
                      {p.teacherName}
                    </td>
                    <td className="p-4 text-slate-500">{getTypeName(p.calculationType)}</td>
                    <td className="p-4 text-slate-500">{p.lessonsTaught} ta</td>
                    <td className="p-4 text-slate-500">{p.studentsCount} nafar</td>
                    <td className="p-4 text-slate-500">{p.totalRevenue.toLocaleString()} so‘m</td>
                    <td className="p-4 font-bold text-[#0050cb] dark:text-blue-400">
                      {p.calculatedSalary.toLocaleString()} so‘m
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      {p.paidAmount.toLocaleString()} so‘m
                    </td>
                    <td className="p-4 font-bold text-rose-600">
                      {p.remainingAmount.toLocaleString()} so‘m
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {isAdmin && p.remainingAmount > 0 ? (
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          {t('payroll.mark_paid', 'To‘landi deb belgilash')}
                        </button>
                      ) : (
                        <Badge variant={p.remainingAmount === 0 ? 'success' : 'warning'}>
                          {p.remainingAmount === 0 ? t('status.paid', 'To‘langan') : t('status.pending', 'Kutilmoqda')}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title={language === 'RU' ? 'Нет записей о зарплате' : language === 'EN' ? 'No payroll records' : 'Payroll yozuvlari topilmadi'}
          description={language === 'RU' ? 'За этот месяц зарплата еще не начислялась.' : language === 'EN' ? 'No salary calculated for this month yet.' : 'Ushbu oy uchun hali oylik maoshlar hisoblanmagan.'}
          actionText={isAdmin ? t('payroll.calculate_all', 'Oylikni hisoblash') : undefined}
          onAction={isAdmin ? () => {
            if (teachers.length > 0) setCalcTeacherId(teachers[0].id);
            setCalcOpen(true);
          } : undefined}
        />
      )}

      {/* Calculate Modal */}
      <Modal isOpen={calcOpen} onClose={() => setCalcOpen(false)} title={t('payroll.calculate_all', 'Oylik Maoshni Hisoblash')}>
        <form onSubmit={handleCalculatePayroll} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('calendar.select_teacher', 'O‘qituvchini tanlang')}
            </label>
            <select
              value={calcTeacherId}
              onChange={(e) => setCalcTeacherId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
            >
              {teachers.map((tItem) => (
                <option key={tItem.id} value={tItem.id}>
                  {tItem.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'RU' ? 'Модель начисления' : language === 'EN' ? 'Calculation Model' : 'Hisoblash modeli'}
            </label>
            <select
              value={calcType}
              onChange={(e) => setCalcType(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
            >
              <option value={2}>
                {language === 'RU' ? 'Процент от оплат группы' : language === 'EN' ? 'Percentage of group tuition' : 'Foizli ulush (% guruh to\'lovlaridan)'}
              </option>
              <option value={1}>
                {t('teachers.fixed', 'Fikslangan oylik maosh')}
              </option>
              <option value={3}>
                {language === 'RU' ? 'Поурочно (за каждый проведенный урок)' : language === 'EN' ? 'Per lesson rate' : 'Darsbay (har bir o\'tilgan dars uchun)'}
              </option>
              <option value={4}>
                {language === 'RU' ? 'Комбинированный (База + Процент)' : language === 'EN' ? 'Combined (Base + Percentage)' : 'Kombinatsiyalangan (Baza + Foiz)'}
              </option>
            </select>
          </div>

          {calcType === 2 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('teachers.share_percent', 'Ulush foizi (%)')}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={customRate}
                onChange={(e) => setCustomRate(Number(e.target.value))}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>
          )}

          {(calcType === 1 || calcType === 4) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('teachers.base_salary', 'Asosiy stavka (so\'m)')}
              </label>
              <input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCalcOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t('action.cancel', 'Bekor qilish')}
            </button>
            <button
              type="submit"
              disabled={calculating}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer disabled:opacity-50"
            >
              {calculating ? t('action.loading', 'Hisoblanmoqda...') : t('payroll.calculate_all', 'Hisoblash')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
