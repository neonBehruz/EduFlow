import React, { useEffect, useState } from 'react';
import { riskApi } from '../../services/api';
import { StudentRiskDto } from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

export const RiskAnalysisPage: React.FC = () => {
  const [risks, setRisks] = useState<StudentRiskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('');

  useEffect(() => {
    loadRisks();
  }, [filterLevel]);

  const loadRisks = async () => {
    try {
      setLoading(true);
      const res = await riskApi.getRisks({
        riskLevel: filterLevel || undefined,
      });
      if (res.success && res.data) {
        setRisks(res.data);
      }
    } catch (err) {
      console.error('Risk analysis load error', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            YUQORI RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            O‘RTACHA RISK
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            PAST RISK
          </span>
        );
      default:
        return null;
    }
  };

  const highCount = risks.filter((r) => r.riskLevel === 'HIGH').length;
  const mediumCount = risks.filter((r) => r.riskLevel === 'MEDIUM').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              O‘quvchilar Retention & Risk Analizi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kursni tark etish (churn) xavfi yuqori bo'lgan o'quvchilarni erta aniqlash
            </p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Yuqori xavf guruhi</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{highCount} nafar o'quvchi</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Zudlik bilan bog'lanish lozim</span>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">O'rtacha xavf</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{mediumCount} nafar o'quvchi</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Nazorat ostidagi o'quvchilar</span>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tahlil algoritmi</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-white mt-2">
            Davomat, qarz va baholar
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Haqiqiy DB ma'lumotlari asosida</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: '', label: 'Barchasi' },
          { id: 'HIGH', label: 'Faqat Yuqori Xavf' },
          { id: 'MEDIUM', label: 'O‘rtacha Xavf' },
          { id: 'LOW', label: 'Past Xavf' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterLevel(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
              filterLevel === tab.id
                ? 'bg-[#0050cb] border-[#0050cb] text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Risk Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Risk tahlili hisoblanmoqda..." />
      ) : risks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {risks.map((risk) => (
            <div
              key={risk.studentId}
              className={`p-5 rounded-3xl border shadow-xs backdrop-blur-md flex flex-col justify-between transition-all ${
                risk.riskLevel === 'HIGH'
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                  : risk.riskLevel === 'MEDIUM'
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                  : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {risk.studentName}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {risk.groupNames.join(', ') || "Guruhsiz"}
                    </p>
                  </div>
                  {getRiskBadge(risk.riskLevel)}
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Davomat darajasi</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">
                      {risk.attendanceRate ?? 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">O'rtacha baho</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">
                      {risk.averageGrade ?? 0} / 100
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sababsiz qoldirish</span>
                    <span className="font-extrabold text-rose-600">{risk.unexcusedAbsences ?? 0} ta dars</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Qarzdorlik</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">
                      {(risk.overduePaymentDays ?? 0) > 0 ? `${risk.overduePaymentDays} kun kechikkan` : "Yo'q"}
                    </span>
                  </div>
                </div>

                {/* Risk Reasons List */}
                <div className="space-y-1 mt-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Aniqlangan sabablar:
                  </span>
                  {(risk.riskReasons || []).map((reason, idx) => (
                    <p
                      key={idx}
                      className="text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{reason}</span>
                    </p>
                  ))}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                {risk.phoneNumber && (
                  <a
                    href={`tel:${risk.phoneNumber}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Qo‘ng‘iroq</span>
                  </a>
                )}
                <a
                  href={`/students/${risk.studentId}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 ml-auto"
                >
                  <span>Profilga o'tish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Xavf aniqlanmadi"
          description="Barcha o'quvchilar ko'rsatkichlari me'yorda va darslarga to'liq qatnashmoqda."
        />
      )}
    </div>
  );
};
