import React, { useEffect, useState } from 'react';
import { reportApi } from '../../services/api';
import { AttendanceReport, PaymentReport, StudentReport } from '../../types';
import { LoadingSpinner, Badge, PageHeader } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { useLanguage } from '../../context/LanguageContext';
import { BarChart3, TrendingUp, Users, CheckCircle, Clock, XCircle, CreditCard, DollarSign } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'attendance' | 'payments' | 'students'>('attendance');
  const [attReport, setAttReport] = useState<AttendanceReport | null>(null);
  const [payReport, setPayReport] = useState<PaymentReport | null>(null);
  const [stReport, setStReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [aRes, pRes, sRes] = await Promise.all([
          reportApi.getAttendance(),
          reportApi.getPayments(),
          reportApi.getStudents(),
        ]);
        if (aRes.success) setAttReport(aRes.data);
        if (pRes.success) setPayReport(pRes.data);
        if (sRes.success) setStReport(sRes.data);
      } catch (err) {
        console.error('Reports fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <LoadingSpinner text={t('action.loading', 'Analitika va hisobotlar tayyorlanmoqda...')} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <StartupBanner
        badgeText="Data & Growth Intelligence 📊"
        title={t('reports.title', 'Analitika va Hisobotlar Markazi')}
        description={t('reports.desc', 'O‘quv markazi davomat ko‘rsatkichlari, oylik tushumlar o‘sish dinamikasi va o‘quvchilar oqimi tahlili.')}
        icon={<BarChart3 className="w-6 h-6" />}
        gradientTheme="blue"
        metrics={[
          { label: 'Tahlil turi', value: 'Real-time' },
          { label: 'Hisobotlar', value: 'Eksportga tayyor' },
        ]}
      />

      {/* Tabs with mobile overflow scroll */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs max-w-xl gap-1 overflow-x-auto">
        {[
          { id: 'attendance', label: t('reports.attendance', 'Davomat hisoboti'), icon: CheckCircle },
          { id: 'payments', label: t('reports.financial', 'Moliya va To‘lovlar'), icon: CreditCard },
          { id: 'students', label: t('dash.total_students', 'O‘quvchilar tahlili'), icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0050cb] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'attendance' && attReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Jami Darslar</span>
              <div className="text-3xl font-black text-slate-800 mt-1">{attReport.totalLessons}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Qatnashganlar</span>
              <div className="text-3xl font-black text-emerald-600 mt-1">{attReport.totalPresent}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Kelmaganlar</span>
              <div className="text-3xl font-black text-rose-600 mt-1">{attReport.totalAbsent}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Umumiy Davomat</span>
              <div className="text-3xl font-black text-[#0050cb] mt-1">{attReport.attendancePercentage}%</div>
            </div>
          </div>

          {/* Group Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800">Guruhlar bo'yicha davomat</h3>
            <div className="space-y-3">
              {attReport.groupSummaries.map((g) => (
                <div key={g.groupId} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{g.groupName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">{g.presentCount} / {g.totalRecords} qayd</span>
                    <span className="text-xs font-extrabold text-[#0050cb] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      {g.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && payReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
              <span className="text-xs font-bold text-emerald-800 uppercase">To'langan Tushum</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-2">
                {payReport.totalPaid.toLocaleString()} UZS
              </div>
              <span className="text-[11px] text-emerald-700 mt-1 block">{payReport.paidTransactionsCount} ta to'lov</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
              <span className="text-xs font-bold text-amber-800 uppercase">Kutilayotgan Summa</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-2">
                {payReport.totalPending.toLocaleString()} UZS
              </div>
              <span className="text-[11px] text-amber-700 mt-1 block">{payReport.pendingTransactionsCount} ta to'lov</span>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5">
              <span className="text-xs font-bold text-rose-800 uppercase">Qarzdorlik</span>
              <div className="text-2xl sm:text-3xl font-black text-rose-900 mt-2">
                {payReport.totalOverdue.toLocaleString()} UZS
              </div>
              <span className="text-[11px] text-rose-700 mt-1 block">{payReport.overdueTransactionsCount} ta muddati o'tgan</span>
            </div>
          </div>

          {/* Monthly Trend Bars */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800">Oylik daromad dinamikasi</h3>
            <div className="grid grid-cols-6 gap-2 pt-6 items-end h-48 border-b border-slate-100">
              {payReport.monthlyTrend.map((m, idx) => {
                const max = Math.max(...payReport.monthlyTrend.map((x) => x.amount), 1);
                const pct = Math.round((m.amount / max) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.amount > 0 ? `${(m.amount / 1000000).toFixed(1)}M` : '0'}
                    </span>
                    <div
                      style={{ height: `${Math.max(pct, 8)}%` }}
                      className="w-full bg-[#0050cb] group-hover:bg-[#003fa4] rounded-t-xl transition-all"
                    ></div>
                    <span className="text-xs font-semibold text-slate-600">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && stReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Jami O'quvchilar</span>
              <div className="text-3xl font-black text-slate-800 mt-1">{stReport.totalStudents}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Faol</span>
              <div className="text-3xl font-black text-emerald-600 mt-1">{stReport.activeStudents}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">O'rtacha Ball</span>
              <div className="text-3xl font-black text-[#0050cb] mt-1">{stReport.averageOverallGrade}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">O'rtacha Davomat</span>
              <div className="text-3xl font-black text-purple-600 mt-1">{stReport.averageOverallAttendance}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
