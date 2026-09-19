import React, { useEffect, useState } from 'react';
import { superAdminApi, settingsApi } from '../../services/api';
import { SuperAdminStats, SubscriptionPlan } from '../../types';
import { LoadingSpinner, Badge, Modal, PageHeader } from '../../components/common/UIComponents';
import { ShieldCheck, Building, Users, DollarSign, Power, Sparkles } from 'lucide-react';

export const SuperAdminPage: React.FC = () => {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [sRes, orgsRes, plansRes] = await Promise.all([
        superAdminApi.getStats(),
        superAdminApi.getOrganizations(),
        settingsApi.getPlans(),
      ]);
      if (sRes.success) setStats(sRes.data);
      setOrganizations(orgsRes);
      setPlans(plansRes);
    } catch (err) {
      console.error('SuperAdmin fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      await superAdminApi.toggleStatus(id);
      fetchAdminData();
    } catch (err) {
      console.error('Toggle status error', err);
    }
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !selectedPlanId) return;
    try {
      await superAdminApi.changePlan(selectedOrg.id, selectedPlanId);
      setIsPlanModalOpen(false);
      fetchAdminData();
    } catch (err) {
      console.error('Change plan error', err);
    }
  };

  if (loading) return <LoadingSpinner text="SuperAdmin boshqaruv paneli yuklanmoqda..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SuperAdmin Platforma Boshqaruvi"
        description="Barcha mijozlar, o'quv markazlari va SaaS statistikasi"
        icon={<ShieldCheck className="w-5 h-5" />}
      />

      {/* Stats Cards with animated gradient accents */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jami Tashkilotlar</span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{stats.totalOrganizations}</div>
          </div>

          <div className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faol Markazlar</span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{stats.activeOrganizations}</div>
          </div>

          <div className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jami O'quvchilar</span>
            <div className="text-3xl font-black text-[#0050cb] dark:text-indigo-400 mt-2">{stats.totalStudents}</div>
          </div>

          <div className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-80" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Oylik SaaS Daromad</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2 truncate">
              {stats.totalMonthlyRevenue.toLocaleString()} <span className="text-xs font-semibold">UZS</span>
            </div>
          </div>
        </div>
      )}

      {/* Organizations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 font-bold text-xs text-slate-700">
          Mijoz O'quv Markazlari Ro'yxati ({organizations.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-6">Markaz Nomi</th>
                <th className="py-3 px-6">Email / Telefon</th>
                <th className="py-3 px-6">Tarif Rejasi</th>
                <th className="py-3 px-6">Holat</th>
                <th className="py-3 px-6">Qo'shilgan Sana</th>
                <th className="py-3 px-6 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organizations.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6 font-bold text-slate-800">{o.name}</td>
                  <td className="py-3.5 px-6">
                    <span className="block text-slate-700">{o.email}</span>
                    <span className="text-[10px] text-slate-400">{o.phone}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge variant="info">{o.planName || 'FREE'}</Badge>
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge variant={o.isActive ? 'success' : 'danger'}>
                      {o.isActive ? 'Faol' : 'Nofaol'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrg(o);
                          const currentPlan = plans.find(p => p.name === o.planName);
                          setSelectedPlanId(currentPlan?.id || plans[0]?.id || '');
                          setIsPlanModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold rounded-xl text-[11px] transition-all cursor-pointer shadow-xs"
                      >
                        Tarifni o'zgartirish
                      </button>
                      <button
                        onClick={() => handleToggleStatus(o.id)}
                        className={`px-3 py-1.5 font-bold rounded-xl text-[11px] transition-all cursor-pointer shadow-xs ${
                          o.isActive
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                        }`}
                      >
                        {o.isActive ? 'To‘xtatish' : 'Faollashtirish'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Changer Modal */}
      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="Tarif rejasini o'zgartirish">
        <form onSubmit={handleChangePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {selectedOrg?.name} uchun yangi tarif:
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.monthlyPrice.toLocaleString()} UZS/oy
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button type="submit" className="px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-semibold rounded-xl cursor-pointer">
              Saqlash
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
