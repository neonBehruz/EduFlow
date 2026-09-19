import React, { useEffect, useState } from 'react';
import { studentPortalApi, invoiceApi } from '../../services/api';
import { StudentFinanceDto, InvoiceDto, Payment, ReceiptDataDto } from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import { useLanguage } from '../../context/LanguageContext';
import {
  CreditCard,
  Receipt,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Filter,
  RefreshCw,
  ArrowDownLeft,
  ChevronRight,
  TrendingDown,
  Building2,
  Wallet,
  Info,
} from 'lucide-react';

export const StudentPaymentsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';

  const [finance, setFinance] = useState<StudentFinanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<ReceiptDataDto | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    loadFinances();
  }, []);

  const loadFinances = async () => {
    try {
      setLoading(true);
      const res = await studentPortalApi.getFinances();
      if (res.success && res.data) {
        setFinance(res.data);
      }
    } catch (err) {
      console.error('Student finance load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (paymentId?: string) => {
    if (!paymentId) return;
    try {
      setLoadingReceipt(true);
      const res = await invoiceApi.getReceipt(paymentId);
      if (res.success && res.data) {
        setReceiptData(res.data);
      }
    } catch (err) {
      console.error('Receipt load error', err);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const getInvoiceStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="neutral">Qoralama</Badge>;
      case 2:
        return <Badge variant="warning">Kutilmoqda</Badge>;
      case 3:
        return <Badge variant="success">To‘langan</Badge>;
      case 4:
        return <Badge variant="danger">Muddati o‘tgan</Badge>;
      case 5:
        return <Badge variant="neutral">Bekor qilingan</Badge>;
      default:
        return <Badge variant="neutral">—</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="warning">Kutilmoqda</Badge>;
      case 2:
        return <Badge variant="info">Qisman to‘langan</Badge>;
      case 3:
        return <Badge variant="success">To‘langan</Badge>;
      case 4:
        return <Badge variant="danger">Qarzdorlik</Badge>;
      default:
        return <Badge variant="neutral">—</Badge>;
    }
  };

  const invoices = finance?.invoices || [];
  const payments = finance?.payments || [];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.groupName || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.billingPeriod || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'paid') return inv.status === 3;
    if (statusFilter === 'pending') return inv.status === 2;
    if (statusFilter === 'overdue') return inv.status === 4;
    return true;
  });

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.groupName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  if (loading && !finance) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner text="Moliyaviy ma'lumotlar yuklanmoqda..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0050cb] via-[#0066ff] to-[#4d8eff] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Moliya & To'lovlar kabineti
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              To‘lovlar va Invoyslar
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              O'quv to'lovlaringiz tarixi, invoyslar holati, qarzdorlik va to'lov kvitansiyalarini bir joyda kuzating.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadFinances}
              disabled={loading}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-2xl backdrop-blur-md shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>
          </div>
        </div>
      </div>

      {/* Information Banner: Student view is informational, payments are handled by parents */}
      <div className="bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 p-4 sm:p-5 rounded-3xl flex items-start sm:items-center gap-3.5 backdrop-blur-md shadow-xs">
        <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-[#0050cb] dark:text-blue-300 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs mb-0.5">
            To‘lovlar haqida ma’lumot
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            O‘quv kursi uchun to‘lovlar ota-onalar tomonidan amalga oshiriladi. O‘quvchi sifatida bu sahifada hisoblangan oylik qarzdorlik yoki to‘langan summalar, dars to‘lovlari holati va kvitansiyalar bilan tanishib borishingiz mumkin.
          </p>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Paid */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jami to‘langan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {(finance?.totalPaid ?? 0).toLocaleString()} <span className="text-xs font-normal">so'm</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Amalga oshirilgan to'lovlar</p>
        </div>

        {/* Total Debt */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hozirgi qarzdorlik</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              (finance?.totalDebt ?? 0) > 0
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
            }`}>
              {(finance?.totalDebt ?? 0) > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${
            (finance?.totalDebt ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {(finance?.totalDebt ?? 0).toLocaleString()} <span className="text-xs font-normal">so'm</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {(finance?.totalDebt ?? 0) > 0 ? 'To‘lanishi kerak bo‘lgan qoldiq' : 'Qarzdorlik mavjud emas'}
          </p>
        </div>

        {/* Next Due Date */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Keyingi to‘lov muddati</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2 truncate">
            {finance?.nextDueDate
              ? new Date(finance.nextDueDate).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Belgilanmagan'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Navbatdagi to‘lov kuni</p>
        </div>

        {/* Invoices Count */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jami Invoyslar</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {invoices.length} <span className="text-xs font-normal text-slate-400">ta hisob-varaq</span>
          </p>
          <p className="text-[11px] text-purple-600 font-semibold mt-1">
            {invoices.filter((i) => i.status === 3).length} ta to‘langan
          </p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
          {/* Tab buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoyslar ({invoices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>To‘lovlar Tarixi ({payments.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidiruv..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
            />
          </div>
        </div>

        {/* Tab 1: Invoices */}
        {activeTab === 'invoices' && (
          <div>
            {/* Status Filter for Invoices */}
            <div className="flex items-center gap-2 pb-3 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" /> Holat:
              </span>
              {(['all', 'paid', 'pending', 'overdue'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-blue-100 dark:bg-blue-900/60 text-[#0050cb] dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {st === 'all'
                    ? 'Barchasi'
                    : st === 'paid'
                    ? 'To‘langan'
                    : st === 'pending'
                    ? 'Kutilmoqda'
                    : 'Muddati o‘tgan'}
                </button>
              ))}
            </div>

            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-3 px-4">Invoys №</th>
                      <th className="py-3 px-4">Guruh</th>
                      <th className="py-3 px-4">O'quv Davri</th>
                      <th className="py-3 px-4">Summa</th>
                      <th className="py-3 px-4">To‘lov Muddati</th>
                      <th className="py-3 px-4 text-center">Holati</th>
                      <th className="py-3 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {inv.groupName || 'Guruhsiz'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                          {inv.billingPeriod || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                          {inv.amount.toLocaleString()} UZS
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(inv.dueDate).toLocaleDateString(locale)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getInvoiceStatusBadge(inv.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {inv.status === 3 && inv.paymentId ? (
                            <button
                              onClick={() => handleOpenReceipt(inv.paymentId)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#0050cb] dark:text-blue-300 text-[11px] font-bold hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Chekni ko‘rish</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              Ota-ona to‘laydi
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Invoyslar topilmadi.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Payments History */}
        {activeTab === 'payments' && (
          <div>
            {filteredPayments.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-3 px-4">Sana</th>
                      <th className="py-3 px-4">Guruh</th>
                      <th className="py-3 px-4">To‘langan Summa</th>
                      <th className="py-3 px-4">Qoldiq Qarz</th>
                      <th className="py-3 px-4 text-center">Holat</th>
                      <th className="py-3 px-4">Izoh</th>
                      <th className="py-3 px-4 text-right">Kvitansiya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredPayments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {p.paymentDate
                            ? new Date(p.paymentDate).toLocaleDateString(locale)
                            : new Date(p.createdAt).toLocaleDateString(locale)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {p.groupName || 'Markaz kursi'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                          {(p.paidAmount ?? p.amount ?? 0).toLocaleString()} UZS
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">
                          {(p.debtAmount ?? 0) > 0 ? `${(p.debtAmount ?? 0).toLocaleString()} UZS` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getPaymentStatusBadge(p.status)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {p.description || 'Oylik to‘lov'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenReceipt(p.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <Printer className="w-3 h-3 text-[#0050cb]" />
                            <span>Chek</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                To‘lovlar tarixi topilmadi.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Official Receipt Modal */}
      <Modal
        isOpen={!!receiptData || loadingReceipt}
        onClose={() => setReceiptData(null)}
        title="Rasmiy To‘lov Kvitansiyasi (Chek)"
      >
        {loadingReceipt ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner text="Chek yuklanmoqda..." />
          </div>
        ) : receiptData ? (
          <div className="space-y-4">
            <div
              id="printable-receipt"
              className="p-6 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl space-y-4 font-sans text-xs text-slate-800 dark:text-slate-100"
            >
              <div className="text-center pb-3 border-b-2 border-dashed border-slate-300 dark:border-slate-700">
                <h3 className="font-extrabold text-base uppercase tracking-wider text-slate-900 dark:text-white">
                  {receiptData.organizationName}
                </h3>
                <p className="text-[11px] text-slate-500">TO‘LOV KVITANSIYASI / ЧЕК ОБ ОПЛАТЕ</p>
              </div>

              <div className="space-y-2 py-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Chek raqami:</span>
                  <span className="font-mono font-bold">{receiptData.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sana va vaqt:</span>
                  <span>{new Date(receiptData.paymentDate).toLocaleString(locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">O‘quvchi:</span>
                  <span className="font-bold">{receiptData.studentName}</span>
                </div>
                {receiptData.groupName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guruh / Kurs:</span>
                    <span className="font-semibold">{receiptData.groupName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">To‘lov usuli:</span>
                  <span className="capitalize">{receiptData.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Qabul qildi:</span>
                  <span>{receiptData.cashierOrAdmin}</span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-slate-300 dark:border-slate-700 flex justify-between items-center text-sm font-black">
                <span>JAMI TO‘LANDI:</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400">
                  {receiptData.amount.toLocaleString()} UZS
                </span>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                EduFlow ta'lim boshqaruv platformasi orqali shakllantirildi.
                <br />
                O‘qishingizda ulkan muvaffaqiyatlar tilaymiz!
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReceiptData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Chop etish (Print)</span>
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
