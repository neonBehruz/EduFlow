import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsApi, telegramApi, financeApi, authApi } from '../../services/api';
import { Organization, Subscription, SubscriptionPlan, FinanceSetting } from '../../types';
import { LoadingSpinner, Badge, Modal, ConfirmModal } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import {
  Building,
  Send,
  Shield,
  User,
  Check,
  Sparkles,
  Sun,
  Moon,
  Clock,
  Palette,
  Settings,
  DollarSign,
  Percent,
  AlertCircle,
  KeyRound,
  Globe,
  Save,
  GraduationCap,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isStaffAdmin = user?.role === 1 || user?.role === 2;

  const confirmLogout = () => {
    sessionStorage.setItem('eduflow_logout_msg', 'true');
    logout();
    navigate(`/${language.toLowerCase()}/login`);
  };

  const [activeSection, setActiveSection] = useState<'profile' | 'org' | 'telegram' | 'sub' | 'theme' | 'finance'>(
    isStaffAdmin ? 'org' : 'profile'
  );
  const { themeMode, activeTheme, setThemeMode, toggleTheme, isMorning, isNight } = useTheme();
  const [org, setOrg] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [financeSettings, setFinanceSettings] = useState<FinanceSetting | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    specialization: (user as any)?.specialization || 'Ingliz tili (IELTS)',
    password: '',
    confirmPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Sync profileForm when user changes
  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        specialization: (user as any)?.specialization || prev.specialization,
      }));
    }
  }, [user]);

  // Edit Org Form
  const [orgForm, setOrgForm] = useState({ name: '', phone: '', email: '', address: '', logoUrl: '' });
  const [financeForm, setFinanceForm] = useState({
    defaultTeacherSharePercentage: 20,
    familyDiscount2ndStudent: 10,
    familyDiscount3rdStudent: 15,
    familyDiscount4thPlusStudent: 20,
    discountConflictRule: 1 as 1 | 2,
    excusedAbsenceRefundEnabled: true,
  });
  const [isSuccess, setIsSuccess] = useState('');

  // Upgrade Modal
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [orgRes, subRes, plansRes, finRes] = await Promise.all([
          settingsApi.getOrganization(),
          settingsApi.getSubscription(),
          settingsApi.getPlans(),
          financeApi.getSettings().catch(() => ({ success: false, data: null })),
        ]);
        if (orgRes.success) {
          setOrg(orgRes.data);
          setOrgForm({
            name: orgRes.data.name,
            phone: orgRes.data.phone,
            email: orgRes.data.email,
            address: orgRes.data.address,
            logoUrl: orgRes.data.logoUrl || '',
          });
        }
        if (subRes.success) setSubscription(subRes.data);
        setPlans(plansRes);

        if (finRes.success && finRes.data) {
          setFinanceSettings(finRes.data);
          setFinanceForm({
            defaultTeacherSharePercentage: finRes.data.defaultTeacherSharePercentage,
            familyDiscount2ndStudent: finRes.data.familyDiscount2ndStudent,
            familyDiscount3rdStudent: finRes.data.familyDiscount3rdStudent,
            familyDiscount4thPlusStudent: finRes.data.familyDiscount4thPlusStudent,
            discountConflictRule: finRes.data.discountConflictRule,
            excusedAbsenceRefundEnabled: finRes.data.excusedAbsenceRefundEnabled,
          });
        }
      } catch (err) {
        console.error('Settings fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleUpdateFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await financeApi.updateSettings(financeForm);
      if (res.success && res.data) {
        setFinanceSettings(res.data);
        setIsSuccess('Moliyaviy parametrlar va foizlar muvaffaqiyatli saqlandi!');
        setTimeout(() => setIsSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Update finance error', err);
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await settingsApi.updateOrganization(orgForm);
      if (res.success) {
        setOrg(res.data);
        setIsSuccess("Tashkilot ma'lumotlari saqlandi!");
        setTimeout(() => setIsSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Update org error', err);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      await settingsApi.upgradePlan(planId);
      setIsUpgradeOpen(false);
      const subRes = await settingsApi.getSubscription();
      if (subRes.success) setSubscription(subRes.data);
    } catch (err) {
      console.error('Upgrade error', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setProfileError(t('profile.password_mismatch', 'Yangi parollar bir-biriga mos kelmadi!'));
      return;
    }

    try {
      setSavingProfile(true);
      const res = await authApi.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phoneNumber: profileForm.phoneNumber,
        specialization: profileForm.specialization,
        password: profileForm.password || undefined,
      });

      if (res.success && res.data) {
        updateUser(res.data);
        setProfileSuccess(t('profile.saved_success', 'Shaxsiy ma’lumotlar muvaffaqiyatli saqlandi!'));
        setProfileForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        setTimeout(() => setProfileSuccess(''), 4000);
      }
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || 'Xatolik yuz berdi.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) return <LoadingSpinner text="Sozlamalar yuklanmoqda..." />;

  const getRoleLabel = () => {
    switch (user?.role) {
      case 1:
        return t('role.superadmin', 'SuperAdmin');
      case 2:
        return t('role.admin', 'Administrator');
      case 3:
        return t('role.teacher', 'O‘qituvchi');
      case 4:
        return t('role.parent', 'Ota-ona');
      case 5:
        return t('role.student', 'O‘quvchi');
      default:
        return t('role.user', 'Foydalanuvchi');
    }
  };

  const getBannerDetails = () => {
    if (user?.role === 5) {
      return {
        badge: language === 'RU' ? 'Профиль Ученика 🎓' : language === 'EN' ? 'Student Profile 🎓' : 'O‘quvchi Profili 🎓',
        title: language === 'RU' ? 'Мой Профиль и Настройки' : language === 'EN' ? 'My Profile & Settings' : 'Mening Profilim va Sozlamalar',
        desc: language === 'RU' ? 'Управление личными данными, номером телефона и безопасностью пароля.' : language === 'EN' ? 'Manage your personal details, phone number, and account security.' : 'Shaxsiy ma’lumotlaringiz, telefon raqamingiz va xavfsizlik parolingizni boshqaring.',
        icon: <GraduationCap className="w-6 h-6" />,
        gradientTheme: 'blue' as const,
        metrics: [
          { label: language === 'RU' ? 'Ученик' : language === 'EN' ? 'Student' : 'O‘quvchi', value: `${user?.firstName} ${user?.lastName}` },
          { label: language === 'RU' ? 'Статус' : language === 'EN' ? 'Status' : 'Holat', value: language === 'RU' ? 'Активен' : language === 'EN' ? 'Active' : 'Faol' },
        ],
      };
    }
    if (user?.role === 3) {
      return {
        badge: language === 'RU' ? 'Профиль Преподавателя 👨‍🏫' : language === 'EN' ? 'Teacher Profile 👨‍🏫' : 'O‘qituvchi Profili 👨‍🏫',
        title: language === 'RU' ? 'Профиль Преподавателя и Настройки' : language === 'EN' ? 'Teacher Profile & Settings' : 'O‘qituvchi Profili va Sozlamalar',
        desc: language === 'RU' ? 'Управление личными данными, номером телефона, специализацией и безопасностью.' : language === 'EN' ? 'Manage your personal details, phone number, subject specialization, and security.' : 'Shaxsiy ma’lumotlaringiz, mutaxassisligingiz, telefon raqamingiz va xavfsizlikni boshqaring.',
        icon: <GraduationCap className="w-6 h-6" />,
        gradientTheme: 'purple' as const,
        metrics: [
          { label: language === 'RU' ? 'Преподаватель' : language === 'EN' ? 'Teacher' : 'O‘qituvchi', value: `${user?.firstName} ${user?.lastName}` },
          { label: language === 'RU' ? 'Специализация' : language === 'EN' ? 'Specialization' : 'Mutaxassislik', value: profileForm.specialization || 'Pedagog' },
        ],
      };
    }
    if (user?.role === 4) {
      return {
        badge: language === 'RU' ? 'Кабинет Родителя 👨‍👩‍👧' : language === 'EN' ? 'Parent Portal 👨‍👩‍👧' : 'Ota-ona Kabineti 👨‍👩‍👧',
        title: language === 'RU' ? 'Мой Профиль и Настройки' : language === 'EN' ? 'My Profile & Settings' : 'Mening Profilim va Sozlamalar',
        desc: language === 'RU' ? 'Управление личными данными и уведомлениями об успеваемости детей.' : language === 'EN' ? 'Manage personal contact information and child progress notifications.' : 'Shaxsiy aloqa ma’lumotlaringiz va farzandlar nazorati parametrlarini boshqaring.',
        icon: <User className="w-6 h-6" />,
        gradientTheme: 'blue' as const,
        metrics: [
          { label: language === 'RU' ? 'Родитель' : language === 'EN' ? 'Parent' : 'Ota-ona', value: `${user?.firstName} ${user?.lastName}` },
          { label: language === 'RU' ? 'Статус' : language === 'EN' ? 'Status' : 'Holat', value: language === 'RU' ? 'Активен' : language === 'EN' ? 'Active' : 'Faol' },
        ],
      };
    }
    return {
      badge: language === 'RU' ? 'Управление Центром ⚙️' : language === 'EN' ? 'Center Management ⚙️' : 'Markaz Boshqaruvi ⚙️',
      title: t('settings.title', 'O‘quv Markazi Sozlamalari'),
      desc: t('settings.desc', 'O‘quv markazingiz rekvizitlari, aloqa ma’lumotlari, Telegram bot avtomatizatsiyasi va interfeys mavzulari.'),
      icon: <Settings className="w-6 h-6" />,
      gradientTheme: 'blue' as const,
      metrics: [
        { label: language === 'RU' ? 'Центр' : language === 'EN' ? 'Center' : 'Markaz', value: org?.name || 'EduFlow' },
        { label: 'Telegram Bot', value: t('status.active', 'Faol') },
      ],
    };
  };

  const banner = getBannerDetails();

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1500px] 3xl:max-w-[1900px] mx-auto animate-in fade-in duration-300">
      <StartupBanner
        badgeText={banner.badge}
        title={banner.title}
        description={banner.desc}
        icon={banner.icon}
        gradientTheme={banner.gradientTheme}
        metrics={banner.metrics}
      />

      {/* Settings Navigation Tabs (Only rendered when there are multiple sections for staff admin) */}
      {isStaffAdmin && (
        <div className="flex bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs w-full max-w-2xl gap-1 overflow-x-auto scroll-touch backdrop-blur-md">
          {[
            { id: 'profile', label: t('profile.tab', 'Shaxsiy Profil & Parametrlar'), icon: User },
            { id: 'org', label: t('settings.general', 'O‘quv Markazi'), icon: Building },
            { id: 'finance', label: t('payroll.title', 'Moliya & Foizlar'), icon: DollarSign },
            { id: 'telegram', label: 'Telegram Bot', icon: Send },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'bg-gradient-to-r from-[#0050cb] to-[#0066ff] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Profile & Parameters Section */}
      {activeSection === 'profile' && (
        <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-8 backdrop-blur-xl transition-all">
          {/* Header Profile Identity Showcase */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-[#0050cb] via-[#0066ff] to-cyan-400 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 border-2 border-white dark:border-slate-800 group-hover:scale-105 transition-transform">
                  {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[9px] shadow-xs" title="Faol">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#0050cb] dark:text-blue-300 text-[11px] font-bold border border-blue-200/70 dark:border-blue-800/70 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {getRoleLabel()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{user?.email}</span>
                  <span>•</span>
                  <span>{org?.name || 'EduFlow O‘quv Markazi'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{language === 'RU' ? 'Безопасный аккаунт' : language === 'EN' ? 'Secure Account' : 'Himoyalangan profil'}</span>
              </div>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-4 bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-4 bg-rose-500/10 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#0050cb]" />
                <span>{language === 'RU' ? 'Основные Данные' : language === 'EN' ? 'Personal Information' : 'Asosiy Ma’lumotlar'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('profile.first_name', 'Ism')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 focus:border-[#0050cb] transition-all"
                      placeholder="Ismingizni kiriting"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('profile.last_name', 'Familiya')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 focus:border-[#0050cb] transition-all"
                      placeholder="Familiyangizni kiriting"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('profile.phone', 'Telefon raqami')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 focus:border-[#0050cb] transition-all"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('profile.email', 'Email (Login)')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'RU' ? 'Email является логином для входа и не редактируется.' : language === 'EN' ? 'Email is your login identifier and cannot be edited.' : 'Email tizimga kirish logini hisoblanadi va o‘zgartirilmaydi.'}
                  </p>
                </div>
              </div>

              {/* Specialization for teachers */}
              {user?.role === 3 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('profile.specialization', 'Mutaxassislik / Fan')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                    placeholder="Masalan: Ingliz tili (IELTS / CEFR), Matematika..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 focus:border-[#0050cb] transition-all"
                  />
                </div>
              )}
            </div>

            {/* Section 2: Security & Password Update Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/40 dark:to-slate-800/20 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {t('profile.change_password', 'Xavfsizlik & Parol yangilash')}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'RU' ? 'Оставьте пустым, если не хотите менять текущий пароль' : language === 'EN' ? 'Leave blank if you do not want to change current password' : 'Joriy parolni saqlab qolish uchun bu maydonlarni bo‘sh qoldiring'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('profile.new_password', 'Yangi parol (ixtiyoriy)')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={profileForm.password}
                      onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                      placeholder="Kamida 6 ta belgi"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 focus:border-[#0050cb] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('profile.confirm_password', 'Yangi parolni tasdiqlash')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      placeholder="Parolni qayta kiriting"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 focus:border-[#0050cb] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? t('action.loading', 'Saqlanmoqda...') : t('profile.save_btn', 'Profilni saqlash')}</span>
              </button>
            </div>
          </form>

          {/* Danger Zone: Session Termination / Logout */}
          <div className="pt-6 border-t border-rose-100 dark:border-rose-950/60">
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-extrabold text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{t('auth.danger_zone_title', 'Sessiyani yakunlash / Chiqish')}</span>
                </div>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 max-w-xl">
                  {t('auth.danger_zone_desc', 'Akkauntingizdan xavfsiz chiqish va joriy qurilmadagi sessiyani to‘xtatish.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-rose-600/20 hover:shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('header.logout', 'Chiqish')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organization Section */}
      {activeSection === 'org' && org && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">Tashkilot rekvizitlari</h3>
            <p className="text-xs text-slate-500 mt-0.5">O'quv markazingizning asosiy ma'lumotlari</p>
          </div>

          {isSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              {isSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateOrg} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">O'quv markazi nomi *</label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon raqami *</label>
                <input
                  type="text"
                  required
                  value={orgForm.phone}
                  onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={orgForm.email}
                  onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logotip URL</label>
                <input
                  type="url"
                  value={orgForm.logoUrl}
                  onChange={(e) => setOrgForm({ ...orgForm, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manzil</label>
              <input
                type="text"
                value={orgForm.address}
                onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Finance Settings Section */}
      {activeSection === 'finance' && (
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs space-y-6 backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Moliyaviy Hisob-Kitob Qoidalari & Foizlar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O‘qituvchi ulushlari, oilaviy chegirma shkalasi va markazning moliyaviy siyosati
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
              <strong>Tarixiy himoya kafolati:</strong> Bu yerdagi kurs narxlari, chegirma yoki o‘qituvchi foizlarini istalgan vaqt o‘zgartirishingiz mumkin. O‘zgarishlar faqat keyingi yangi to‘lovlarga ta’sir qiladi — o‘tmishdagi to‘lovlar va hisobotlar 100% o‘zgarishsiz saqlanadi.
            </p>
          </div>

          <form onSubmit={handleUpdateFinance} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Teacher Share */}
              <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-purple-600" />
                  O‘qituvchining Standart Ulushi
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  O‘quvchilar to‘lagan haqiqiy summadan o‘qituvchiga ajratiladigan standart foiz. Har bir o‘qituvchiga alohida maxsus foiz belgilash ham mumkin.
                </p>
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={financeForm.defaultTeacherSharePercentage}
                      onChange={(e) => setFinanceForm({ ...financeForm, defaultTeacherSharePercentage: Number(e.target.value) })}
                      className="w-24 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-800 dark:text-white"
                    />
                    <span className="text-xs font-bold text-slate-500">% ulush</span>
                  </div>
                </div>
              </div>

              {/* Conflict Rule */}
              <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Chegirmalar To‘qnashuvi Qoidasi
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  O‘quvchida ham oilaviy chegirma (masalan 15%), ham shaxsiy chegirma (masalan 20%) bo‘lsa, qaysi qoida asosida hisoblansin?
                </p>
                <select
                  value={financeForm.discountConflictRule}
                  onChange={(e) => setFinanceForm({ ...financeForm, discountConflictRule: Number(e.target.value) as 1 | 2 })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white"
                >
                  <option value={1}>Eng katta chegirma qo‘llansin (Tavsiya etiladi)</option>
                  <option value={2}>Individual maxsus chegirma har doim ustuvor</option>
                </select>
              </div>
            </div>

            {/* Family Discount Tiers */}
            <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  👨‍👩‍👧‍👦 Oilaviy Chegirma Shkalasi (Bir oiladan kelgan farzandlar uchun)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Bitta ota-onaga biriktirilgan 2-farzand, 3-farzand va keyingi farzandlarga avtomatik beriladigan chegirma foizi:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">2-farzand uchun:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={financeForm.familyDiscount2ndStudent}
                      onChange={(e) => setFinanceForm({ ...financeForm, familyDiscount2ndStudent: Number(e.target.value) })}
                      className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">3-farzand uchun:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={financeForm.familyDiscount3rdStudent}
                      onChange={(e) => setFinanceForm({ ...financeForm, familyDiscount3rdStudent: Number(e.target.value) })}
                      className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">4+ farzandlar uchun:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={financeForm.familyDiscount4thPlusStudent}
                      onChange={(e) => setFinanceForm({ ...financeForm, familyDiscount4thPlusStudent: Number(e.target.value) })}
                      className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Excused Absences Policy */}
            <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  Sababli Qoldirilgan Darslar Kompensatsiyasi
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg leading-relaxed">
                  O‘quvchi yoki o‘qituvchi sababli darsga kela olmasa, kelmagan darslar keyingi oylik to‘lovga avtomatik chegirilsinmi?
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={financeForm.excusedAbsenceRefundEnabled}
                  onChange={(e) => setFinanceForm({ ...financeForm, excusedAbsenceRefundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Moliyaviy Sozlamalarni Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Telegram Bot Section */}
      {activeSection === 'telegram' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Telegram Xabarnomalar Boti</h3>
              <p className="text-xs text-slate-500">Ota-onalar va o'quvchilar bilan avtomatlashtirilgan muloqot</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
            <h4 className="font-bold text-slate-800">Qanday ishlaydi?</h4>
            <p className="text-slate-600 leading-relaxed">
              O'quvchi darsga kelmaganda yoki kechikib kelganda, baho qo'yilganda yoki to'lov muddati yaqinlashganda
              tizim avtomatik ravishda ota-onaga Telegram bot orqali bildirishnoma yuboradi.
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold flex items-center gap-2 mt-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>EduFlow Telegram Notification Service faol holatda.</span>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Section */}
      {activeSection === 'sub' && subscription && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Joriy Tarif Rejangiz</span>
                <div className="flex items-center gap-3 mt-1">
                  <h3 className="text-2xl font-black text-slate-800">{subscription.planName} Tarif</h3>
                  <Badge variant={subscription.status === 2 ? 'success' : 'warning'}>
                    {subscription.status === 1 ? 'Sinov muddati' : 'Faol'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Amal qilish muddati: {new Date(subscription.endDate).toLocaleDateString()} gacha
                </p>
              </div>

              <button
                onClick={() => setIsUpgradeOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Tarifni yangilash</span>
              </button>
            </div>

            {/* Limits Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">O'quvchilar limiti</span>
                <div className="text-xl font-black text-slate-800 mt-1">
                  {subscription.currentStudentsCount} / {subscription.plan.maxStudents >= 1000 ? 'Cheksiz' : subscription.plan.maxStudents}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Guruhlar limiti</span>
                <div className="text-xl font-black text-slate-800 mt-1">
                  {subscription.currentGroupsCount} / {subscription.plan.maxGroups >= 500 ? 'Cheksiz' : subscription.plan.maxGroups}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">O'qituvchilar limiti</span>
                <div className="text-xl font-black text-slate-800 mt-1">
                  {subscription.currentTeachersCount} / {subscription.plan.maxTeachers >= 100 ? 'Cheksiz' : subscription.plan.maxTeachers}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Upgrade Modal */}
      <Modal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} title="Tarif rejasini tanlang" maxWidth="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                subscription?.subscriptionPlanId === p.id
                  ? 'border-[#0050cb] bg-blue-50/40 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-xs font-extrabold text-slate-800 uppercase block">{p.name}</span>
                <div className="text-xl font-black text-[#0050cb] mt-2">
                  {p.monthlyPrice === 0 ? 'Bepul' : `${p.monthlyPrice.toLocaleString()} UZS`}
                  <span className="text-[10px] text-slate-400 font-normal"> /oy</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 mt-4">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{p.maxStudents >= 1000 ? 'Cheksiz' : p.maxStudents} o'quvchilar</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{p.maxGroups >= 500 ? 'Cheksiz' : p.maxGroups} guruhlar</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{p.maxTeachers >= 100 ? 'Cheksiz' : p.maxTeachers} o'qituvchilar</span>
                  </li>
                  {p.hasTelegram && (
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Telegram Bot bildirishnomalari</span>
                    </li>
                  )}
                  {p.hasReports && (
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kengaytirilgan hisobotlar</span>
                    </li>
                  )}
                </ul>
              </div>

              <button
                onClick={() => handleUpgradePlan(p.id)}
                disabled={subscription?.subscriptionPlanId === p.id}
                className={`w-full mt-6 py-2 rounded-xl text-xs font-bold transition-all ${
                  subscription?.subscriptionPlanId === p.id
                    ? 'bg-slate-200 text-slate-500 cursor-default'
                    : 'bg-[#0050cb] hover:bg-[#003fa4] text-white shadow-xs'
                }`}
              >
                {subscription?.subscriptionPlanId === p.id ? 'Joriy Tarif' : 'Ushbu Tarifni Tanlash'}
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title={t('auth.logout_confirm_title', 'Tizimdan chiqishni xohlaysizmi?')}
        message={t('auth.logout_confirm_desc', 'Joriy sessiyangiz yakunlanadi. Qayta kirish uchun login va parolingizni kiritishingiz kerak bo‘ladi.')}
        confirmText={t('auth.logout_btn', 'Ha, chiqish')}
        cancelText={t('action.cancel', 'Bekor qilish')}
        isDanger={true}
      />
    </div>
  );
};
