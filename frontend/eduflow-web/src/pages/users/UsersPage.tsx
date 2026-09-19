import React, { useEffect, useState, useCallback } from 'react';
import { userManagementApi } from '../../services/api';
import { User, UserRole } from '../../types';
import { Modal, ConfirmModal, Badge, LoadingSpinner, EmptyState } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { useLanguage } from '../../context/LanguageContext';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  GraduationCap,
  UserCheck,
  Heart,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Filter,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<boolean | undefined>(undefined);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 2 as UserRole, // default CenterAdmin
    password: '',
    isActive: true,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userManagementApi.getAll({
        search: search || undefined,
        role: selectedRole,
        isActive: selectedStatus,
        page,
        pageSize,
      });
      setUsers(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole, selectedStatus, page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 2,
      password: '',
      isActive: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      password: '',
      isActive: user.isActive,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Ism va familiyani kiriting.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email manzilini kiriting.');
      return;
    }
    if (!selectedUser && !formData.password.trim()) {
      setFormError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedUser) {
        await userManagementApi.update(selectedUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: Number(formData.role),
          isActive: formData.isActive,
          newPassword: formData.password ? formData.password : undefined,
        });
      } else {
        await userManagementApi.create({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: Number(formData.role),
          password: formData.password,
          isActive: formData.isActive,
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Saqlashda xatolik yuz berdi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userManagementApi.delete(selectedUser.id);
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi.');
    }
  };

  const getRoleBadge = (role: number) => {
    switch (role) {
      case 1:
        return <Badge variant="warning"><Shield className="w-3 h-3 mr-1 inline" />SuperAdmin</Badge>;
      case 2:
        return <Badge variant="info"><Shield className="w-3 h-3 mr-1 inline" />Admin</Badge>;
      case 3:
        return <Badge variant="success"><GraduationCap className="w-3 h-3 mr-1 inline" />O‘qituvchi</Badge>;
      case 4:
        return <Badge variant="neutral"><Heart className="w-3 h-3 mr-1 inline" />Ota-ona</Badge>;
      case 5:
        return <Badge variant="info"><UserCheck className="w-3 h-3 mr-1 inline" />O‘quvchi</Badge>;
      default:
        return <Badge variant="neutral">Foydalanuvchi</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <StartupBanner
        badgeText="Foydalanuvchilar Boshqaruvi 👥"
        title="Tizim Foydalanuvchilari"
        description="Barcha administratorlar, o‘qituvchilar, o‘quvchilar va ota-onalar hisoblarini nazorat qilish."
        icon={<Users className="w-6 h-6" />}
        gradientTheme="blue"
        metrics={[
          { label: 'Jami Foydalanuvchilar', value: `${totalCount} ta` },
          { label: 'Ko‘rsatilmoqda', value: `${users.length} ta` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Foydalanuvchilar Boshqaruvi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Tizim Foydalanuvchilari
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Barcha administratorlar, o‘qituvchilar, o‘quvchilar va ota-onalar hisoblarini nazorat qilish ({totalCount} ta foydalanuvchi).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Foydalanuvchi</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ism, email yoki telefon orqali qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedRole === undefined ? '' : selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value === '' ? undefined : Number(e.target.value));
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          >
            <option value="">Barcha Rollar</option>
            <option value="1">SuperAdmin</option>
            <option value="2">Admin</option>
            <option value="3">O‘qituvchi</option>
            <option value="4">Ota-ona</option>
            <option value="5">O‘quvchi</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus === undefined ? '' : String(selectedStatus)}
            onChange={(e) => {
              setSelectedStatus(e.target.value === '' ? undefined : e.target.value === 'true');
              setPage(1);
            }}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          >
            <option value="">Barcha Holatlar</option>
            <option value="true">Faqat Faollar</option>
            <option value="false">Faqat Nofaollar</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="Foydalanuvchilar yuklanmoqda..." />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Foydalanuvchilar topilmadi"
            description="Qidiruv shartlariga mos foydalanuvchi mavjud emas yoki hali ro'yxatga olinmagan."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Foydalanuvchi</th>
                  <th className="py-3.5 px-4">Aloqa</th>
                  <th className="py-3.5 px-4">Rol</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {u.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {u.phoneNumber ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.phoneNumber}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Faol
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3" />
                          Nofaol
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Nofaol qilish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? "Foydalanuvchini Tahrirlash" : "Yangi Foydalanuvchi Qo‘shish"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ism *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Familiya *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Manzili *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Telefon Raqami
            </label>
            <input
              type="tel"
              placeholder="+998901234567"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tizimdagi Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) as UserRole })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value={2}>Admin</option>
                <option value={3}>O‘qituvchi</option>
                <option value={4}>Ota-ona</option>
                <option value={5}>O‘quvchi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Holati
              </label>
              <select
                value={String(formData.isActive)}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="true">Faol</option>
                <option value="false">Nofaol</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {selectedUser ? "Yangi Parol (ixtiyoriy, o'zgartirish uchun)" : "Parol *"}
            </label>
            <input
              type="password"
              placeholder={selectedUser ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Kamida 6 ta belgi"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Foydalanuvchini Nofaol Qilish"
        message={`Haqiqatan ham ${selectedUser?.firstName} ${selectedUser?.lastName} hisobini nofaol qilmoqchimisiz?`}
      />
    </div>
  );
};
