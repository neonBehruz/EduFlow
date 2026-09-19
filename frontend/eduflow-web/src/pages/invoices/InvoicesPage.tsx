import React, { useEffect, useState } from 'react';
import { invoiceApi, studentApi } from '../../services/api';
import { InvoiceDto, Student, ReceiptDataDto, CreateInvoiceDto } from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import {
  FileText,
  Plus,
  Printer,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<ReceiptDataDto | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // Create Invoice Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState(450000);
  const [billingPeriod, setBillingPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [savingInvoice, setSavingInvoice] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const statusParam = filterStatus ? Number(filterStatus) : undefined;
      const [invRes, stRes] = await Promise.all([
        invoiceApi.getAll({ status: statusParam }),
        studentApi.getAll({ pageSize: 100 }),
      ]);

      if (invRes.success && invRes.data) setInvoices(invRes.data);
      if (stRes.items) setStudents(stRes.items);
    } catch (err) {
      console.error('Invoices load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (inv: InvoiceDto) => {
    if (!inv.paymentId) {
      // Create mock receipt preview from invoice
      setReceiptData({
        receiptNumber: inv.invoiceNumber,
        organizationName: "EduFlow O'quv Markazi",
        organizationPhone: '+998712001122',
        organizationAddress: 'Toshkent sh., Yunusobod tumani',
        studentName: inv.studentName,
        groupName: inv.groupName,
        amount: inv.amount,
        paymentDate: inv.paidDate || inv.issueDate,
        paymentMethod: "To'lov tizimi (Elektron)",
        transactionId: inv.id.slice(0, 8).toUpperCase(),
        cashierOrAdmin: 'Bosh Administrator',
        notes: inv.notes,
      });
      return;
    }

    try {
      setLoadingReceipt(true);
      const res = await invoiceApi.getReceipt(inv.paymentId);
      if (res.success && res.data) {
        setReceiptData(res.data);
      }
    } catch (err) {
      console.error('Receipt load error', err);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !invoiceDueDate) return;

    try {
      setSavingInvoice(true);
      const payload: CreateInvoiceDto = {
        studentId: selectedStudentId,
        amount: invoiceAmount,
        billingPeriod,
        dueDate: new Date(invoiceDueDate).toISOString(),
        notes: invoiceNotes,
      };
      await invoiceApi.create(payload);
      setCreateOpen(false);
      setSelectedStudentId('');
      setInvoiceNotes('');
      loadData();
    } catch (err) {
      console.error('Create invoice error', err);
    } finally {
      setSavingInvoice(false);
    }
  };

  const getStatusBadge = (s: number) => {
    switch (s) {
      case 1:
        return <Badge variant="neutral">Qoralama</Badge>;
      case 2:
        return <Badge variant="warning">Chiqarildi</Badge>;
      case 3:
        return <Badge variant="success">To‘landi</Badge>;
      case 4:
        return <Badge variant="danger">Kechikkan</Badge>;
      case 5:
        return <Badge variant="neutral">Bekor qilingan</Badge>;
      default:
        return null;
    }
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Invoyslar & Kvitansiyalar
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hisob-fakturalar chiqarish va to'lov cheklarini chop etish
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Invoys chiqarish</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: '', label: 'Barchasi' },
          { id: '2', label: 'Kutilmoqda' },
          { id: '3', label: 'To‘langan' },
          { id: '4', label: 'Kechikkan' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
              filterStatus === tab.id
                ? 'bg-[#0050cb] border-[#0050cb] text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {loading ? (
        <LoadingSpinner text="Invoyslar yuklanmoqda..." />
      ) : invoices.length > 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4 pl-6">Invoys №</th>
                  <th className="p-4">O‘quvchi</th>
                  <th className="p-4">Guruh</th>
                  <th className="p-4">Davr</th>
                  <th className="p-4">Summa</th>
                  <th className="p-4">Muddat</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 pr-6 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white font-mono">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {inv.studentName}
                    </td>
                    <td className="p-4 text-slate-500">{inv.groupName || '—'}</td>
                    <td className="p-4 text-slate-500">{inv.billingPeriod}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {inv.amount.toLocaleString()} so‘m
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="p-4">{getStatusBadge(inv.status)}</td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handlePrintReceipt(inv)}
                        title="Kvitansiyani chop etish"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Kvitansiya</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Invoyslar topilmadi"
          description="Ko'rsatilgan filtrlar bo'yicha hisob-faktura mavjud emas."
          actionText="Yangi invoys yaratish"
          onAction={() => setCreateOpen(true)}
        />
      )}

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        title="To‘lov Kvitansiyasi / Chek"
        maxWidth="max-w-md"
      >
        {receiptData && (
          <div className="space-y-4">
            {/* Printable Area */}
            <div id="receipt-printable-area" className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xs font-mono text-xs space-y-4">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-bold text-sm tracking-tight">{receiptData.organizationName}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{receiptData.organizationAddress}</p>
                <p className="text-[10px] text-slate-500">Tel: {receiptData.organizationPhone}</p>
                <div className="mt-2 text-[10px] font-bold uppercase bg-slate-100 py-1 rounded">
                  To‘lov Kvitansiyasi (Chek)
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Chek №:</span>
                  <span className="font-bold">{receiptData.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sana va vaqt:</span>
                  <span>{new Date(receiptData.paymentDate).toLocaleString('uz-UZ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">O‘quvchi:</span>
                  <span className="font-bold">{receiptData.studentName}</span>
                </div>
                {receiptData.groupName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guruh:</span>
                    <span>{receiptData.groupName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">To‘lov usuli:</span>
                  <span>{receiptData.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kassir / Admin:</span>
                  <span>{receiptData.cashierOrAdmin}</span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-slate-300 flex justify-between items-center text-sm font-black">
                <span>JAMI TO‘LANDI:</span>
                <span className="text-base">{receiptData.amount.toLocaleString()} UZS</span>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                EduFlow SaaS tizimi orqali shakllantirildi.
                <br />
                Rahmat, o‘qishingizda zafarlar tilaymiz!
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReceiptData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={triggerBrowserPrint}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Chop etish</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Invoice Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Yangi Invoys Chiqarish">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              O‘quvchini tanlang
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="">Tanlang</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Summa (so‘m)
              </label>
              <input
                type="number"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Davr (Oy)
              </label>
              <input
                type="month"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              To‘lov muddati
            </label>
            <input
              type="date"
              value={invoiceDueDate}
              onChange={(e) => setInvoiceDueDate(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Izoh
            </label>
            <textarea
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              placeholder="Oylik to'lov kursi uchun..."
              rows={2}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={savingInvoice}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
            >
              {savingInvoice ? 'Chiqarilmoqda...' : 'Invoys chiqarish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
