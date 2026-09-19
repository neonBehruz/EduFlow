import React, { useEffect, useState } from 'react';
import { branchApi } from '../../services/api';
import { BranchDto, CreateBranchDto } from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import { Building2, Plus, Phone, MapPin, DoorOpen, UsersRound } from 'lucide-react';

export const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Branch Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await branchApi.getAll();
      if (res.success && res.data) {
        setBranches(res.data);
      }
    } catch (err) {
      console.error('Branches load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    try {
      setSaving(true);
      const payload: CreateBranchDto = {
        name,
        address,
        phone,
      };
      await branchApi.create(payload);
      setCreateOpen(false);
      setName('');
      setAddress('');
      setPhone('');
      loadBranches();
    } catch (err) {
      console.error('Create branch error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              O‘quv Markazi Filiallari
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ko'p filialli o'quv markazlari uchun markazlashgan boshqaruv
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi filial qo‘shish</span>
        </button>
      </div>

      {/* Branches Grid */}
      {loading ? (
        <LoadingSpinner text="Filiallar yuklanmoqda..." />
      ) : branches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <div
              key={b.id}
              className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-[#0050cb] flex items-center justify-center font-bold text-base">
                    {b.name[0]}
                  </div>
                  <Badge variant={b.isActive ? 'success' : 'neutral'}>
                    {b.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>

                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {b.name}
                </h4>

                <div className="space-y-2 mt-3 text-xs text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>{b.address}</span>
                  </p>
                  {b.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{b.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <DoorOpen className="w-4 h-4 text-indigo-500" />
                  <b>{b.roomsCount}</b> ta xona
                </span>
                <span className="flex items-center gap-1.5">
                  <UsersRound className="w-4 h-4 text-amber-500" />
                  <b>{b.groupsCount}</b> ta guruh
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Filiallar mavjud emas"
          description="Hozircha hech qanday filial qo'shilmagan."
          actionText="Yangi filial qo'shish"
          onAction={() => setCreateOpen(true)}
        />
      )}

      {/* Add Branch Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Yangi Filial Qo‘shish">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Filial nomi
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Chilonzor filiali"
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Manzil
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Toshkent sh., Chilonzor tumani..."
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Telefon raqami
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998712003344"
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
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
            >
              {saving ? 'Saqlanmoqda...' : 'Filialni saqlash'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
