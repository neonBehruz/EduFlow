import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { User, Mail, Phone, Shield, GraduationCap, Heart, UserCheck, Lock, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { Badge } from '../../components/common/UIComponents';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    specialization: '',
    password: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password && form.password !== form.confirmPassword) {
      setError('Yangi parollar bir-biriga mos kelmadi!');
      return;
    }

    setSaving(true);
    try {
      await authApi.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        specialization: form.specialization.trim() || undefined,
        password: form.password ? form.password : undefined,
      });
      setSuccess('Shaxsiy ma’lumotlar muvaffaqiyatli saqlandi!');
      setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Profilni yangilashda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role?: number) => {
    switch (role) {
      case 1:
        return <Badge variant="warning"><Shield className="w-3.5 h-3.5 mr-1 inline" />SuperAdmin</Badge>;
      case 2:
        return <Badge variant="info"><Shield className="w-3.5 h-3.5 mr-1 inline" />Administrator</Badge>;
      case 3:
        return <Badge variant="success"><GraduationCap className="w-3.5 h-3.5 mr-1 inline" />O‘qituvchi</Badge>;
      case 4:
        return <Badge variant="neutral"><Heart className="w-3.5 h-3.5 mr-1 inline" />Ota-ona</Badge>;
      case 5:
        return <Badge variant="info"><UserCheck className="w-3.5 h-3.5 mr-1 inline" />O‘quvchi</Badge>;
      default:
        return <Badge variant="neutral">Foydalanuvchi</Badge>;
    }
  };

  return (
    <div className="max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Profile Hero */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl font-extrabold shadow-inner">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="mb-2">{getRoleBadge(user?.role)}</div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-white/80 text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-4 h-4" />
              <span>{user?.email}</span>
              {user?.phoneNumber && (
                <>
                  <span>•</span>
                  <Phone className="w-4 h-4" />
                  <span>{user?.phoneNumber}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-500" />
          <span>Shaxsiy Profil Ma’lumotlarini Tahrirlash</span>
        </h2>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ism
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Familiya
              </label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefon Raqami
              </label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Manzili (O‘zgarmas)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Parolni O‘zgartirish (Ixtiyoriy)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Yangi Parol
                </label>
                <input
                  type="password"
                  placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Yangi Parolni Tasdiqlang
                </label>
                <input
                  type="password"
                  placeholder="Yangi parolni qayta kiriting"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saqlanmoqda...' : 'O‘zgarishlarni Saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
