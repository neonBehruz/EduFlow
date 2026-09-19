import React, { useEffect, useState } from 'react';
import { roomApi, branchApi } from '../../services/api';
import { RoomDto, BranchDto, CreateRoomDto } from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal, ConfirmModal } from '../../components/common/UIComponents';
import { DoorOpen, Plus, MapPin, Users, Monitor, Settings, Trash2, Edit2, CheckCircle2 } from 'lucide-react';

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomDto | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState(20);
  const [type, setType] = useState(1);
  const [status, setStatus] = useState(1);
  const [branchId, setBranchId] = useState('');
  const [equipment, setEquipment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, bRes] = await Promise.all([roomApi.getAll(), branchApi.getAll()]);
      if (rRes.success && rRes.data) setRooms(rRes.data);
      if (bRes.success && bRes.data) setBranches(bRes.data);
    } catch (err) {
      console.error('Rooms load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setName('');
    setNumber('');
    setCapacity(20);
    setType(1);
    setStatus(1);
    setBranchId(branches[0]?.id || '');
    setEquipment('');
    setModalOpen(true);
  };

  const handleOpenEdit = (r: RoomDto) => {
    setEditingRoom(r);
    setName(r.name);
    setNumber(r.number);
    setCapacity(r.capacity);
    setType(r.type);
    setStatus(r.status);
    setBranchId(r.branchId || '');
    setEquipment(r.equipment || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: CreateRoomDto = {
        name,
        number,
        capacity,
        type,
        status,
        branchId: branchId || undefined,
        equipment: equipment || undefined,
      };

      if (editingRoom) {
        await roomApi.update(editingRoom.id, payload);
      } else {
        await roomApi.create(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Save room error', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await roomApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('Delete room error', err);
    }
  };

  const getTypeName = (t: number) => {
    switch (t) {
      case 1:
        return 'Standart xona';
      case 2:
        return 'Kompyuter lab (IT)';
      case 3:
        return 'Ma’ruzalar zali';
      case 4:
        return 'Konferensiya zali';
      default:
        return 'Xona';
    }
  };

  const getStatusBadge = (s: number) => {
    switch (s) {
      case 1:
        return <Badge variant="success">Bo'sh</Badge>;
      case 2:
        return <Badge variant="warning">Band</Badge>;
      case 3:
        return <Badge variant="danger">Ta'mirda</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Xonalar Boshqaruvi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sinflar sig'imi, jihozlar va bandlik holati
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi xona qo‘shish</span>
        </button>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <LoadingSpinner text="Xonalar ro'yxati yuklanmoqda..." />
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xs flex items-center justify-center">
                      {room.number}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {room.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{getTypeName(room.type)}</p>
                    </div>
                  </div>
                  {getStatusBadge(room.status)}
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Sig'imi: <b>{room.capacity}</b> nafar o'quvchi</span>
                  </div>

                  {room.branchName && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>Filial: {room.branchName}</span>
                    </div>
                  )}

                  {room.equipment && (
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Jihozlar: {room.equipment}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenEdit(room)}
                  className="p-2 text-slate-400 hover:text-[#0050cb] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Tahrirlash"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(room)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="O‘chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Xonalar mavjud emas"
          description="Hozircha hech qanday o'quv xonasi qo'shilmagan."
          actionText="Birinchi xonani qo'shish"
          onAction={handleOpenAdd}
        />
      )}

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? 'Xonani tahrirlash' : 'Yangi xona qo‘shish'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Xona nomi
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: IT Lab 1"
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Xona raqami
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="101"
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sig'im (o'rin)
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Filial
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="">Tanlang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Xona turi
              </label>
              <select
                value={type}
                onChange={(e) => setType(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value={1}>Standart xona</option>
                <option value={2}>Kompyuter lab (IT)</option>
                <option value={3}>Ma’ruzalar zali</option>
                <option value={4}>Konferensiya zali</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Holati
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value={1}>Bo‘sh (Foydalanishda)</option>
                <option value={2}>Band</option>
                <option value={3}>Ta’mirda</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mavjud jihozlar
            </label>
            <textarea
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Proyektor, smart doska, 15 ta kompyuter..."
              rows={2}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xonani o‘chirish"
        message={`Haqiqatan ham "${deleteTarget?.name}" xonasini o‘chirmoqchimisiz?`}
        confirmText="O‘chirish"
        isDanger
      />
    </div>
  );
};
