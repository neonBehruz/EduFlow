import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Lock, Mail, Eye, EyeOff, Building, User, Phone, CheckCircle, ArrowRight, GraduationCap, Shield, ShieldCheck, Users, UserCheck } from 'lucide-react';

export type LoginRoleType = 'admin' | 'superadmin' | 'teacher' | 'student' | 'parent';

export const LoginPage: React.FC = () => {
  const { login, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const langPrefix = '/' + language.toLowerCase();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<LoginRoleType>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoutAlert, setLogoutAlert] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('eduflow_logout_msg')) {
      sessionStorage.removeItem('eduflow_logout_msg');
      return true;
    }
    return false;
  });

  const roleConfigs: Record<
    LoginRoleType,
    { label: string; icon: any; expectedRole: number; placeholder: string; activeClass: string; inactiveClass: string }
  > = {
    admin: {
      label: t('role.admin', 'Admin'),
      icon: Shield,
      expectedRole: 2,
      placeholder: 'admin@smartedu.uz',
      activeClass: 'bg-[#0050cb] text-white border-[#0050cb] shadow-sm shadow-blue-600/30',
      inactiveClass: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750',
    },
    superadmin: {
      label: t('role.superadmin', 'SuperAdmin'),
      icon: ShieldCheck,
      expectedRole: 1,
      placeholder: 'superadmin@smartedu.uz',
      activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30',
      inactiveClass: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750',
    },
    teacher: {
      label: t('role.teacher', "O'qituvchi"),
      icon: Users,
      expectedRole: 3,
      placeholder: 'teacher@smartedu.uz / azizbek',
      activeClass: 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/30',
      inactiveClass: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750',
    },
    student: {
      label: t('role.student', "O'quvchi"),
      icon: GraduationCap,
      expectedRole: 5,
      placeholder: 'student@eduflow.uz / jasurbek',
      activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30',
      inactiveClass: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750',
    },
    parent: {
      label: t('role.parent', 'Ota-ona'),
      icon: UserCheck,
      expectedRole: 4,
      placeholder: 'parent@eduflow.uz',
      activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/30',
      inactiveClass: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750',
    },
  };

  const currentConfig = roleConfigs[selectedRole];

  const handleRoleSelect = (role: LoginRoleType) => {
    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login({
        email: email.trim(),
        password,
        expectedRole: currentConfig.expectedRole,
      });

      // Verify the user's role matches the selected tab
      if (loggedUser) {
        const expectedRoleNum = currentConfig.expectedRole;
        const isRoleMatch = loggedUser.role === expectedRoleNum;

        if (!isRoleMatch) {
          logout();
          setError(
            language === 'RU'
              ? `Этот аккаунт не имеет прав для роли "${currentConfig.label}". Пожалуйста, выберите правильную роль.`
              : language === 'EN'
              ? `This account does not have access for the "${currentConfig.label}" role. Please select your correct role.`
              : `Bu hisob "${currentConfig.label}" roliga tegishli emas. Iltimos, to'g'ri rolni tanlab kiring.`
          );
          setLoading(false);
          return;
        }
      }

      // Role-based redirection
      if (loggedUser) {
        if (loggedUser.role === 1) {
          navigate(`${langPrefix}/admin`);
        } else if (loggedUser.role === 5) {
          navigate(`${langPrefix}/student/dashboard`);
        } else if (loggedUser.role === 3) {
          navigate(`${langPrefix}/teacher/dashboard`);
        } else if (loggedUser.role === 4) {
          navigate(`${langPrefix}/parent/dashboard`);
        } else {
          navigate(`${langPrefix}/dashboard`);
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (language === 'RU'
            ? 'Неверный email или пароль'
            : language === 'EN'
            ? 'Invalid email or password'
            : "Email/login yoki parol noto'g'ri"))
      ;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative group animate-in fade-in zoom-in-95 duration-500">
      {/* Soft atmospheric backlight halo */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/25 via-cyan-500/20 to-indigo-600/25 blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

      <div className="relative bg-white/90 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl transition-all duration-300">
        
        {/* Top bar with Language Switcher */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            EduFlow v2.4
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold">
            {(['UZ', 'RU', 'EN'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-white dark:bg-slate-900 text-[#0050cb] dark:text-blue-300 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Center Logo & Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#0050cb] via-[#0066ff] to-[#38bdf8] text-white mb-2.5 shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform">
            <Building className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">EduFlow CRM</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'RU'
              ? 'Система управления учебным центром'
              : language === 'EN'
              ? 'Education Center Management Platform'
              : "O‘quv markazini boshqarish tizimi"}
          </p>
        </div>

        {/* Post-Logout Success Toast / Alert */}
        {logoutAlert && (
          <div className="mb-4 p-3 sm:p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{t('auth.logout_success', 'Siz tizimdan muvaffaqiyatli chiqdingiz!')}</span>
            </div>
            <button
              type="button"
              onClick={() => setLogoutAlert(false)}
              className="text-emerald-500 hover:text-emerald-800 text-xs px-1 cursor-pointer shrink-0"
              title="Yopish"
            >
              ✕
            </button>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="mb-5">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
            {language === 'RU'
              ? 'Выберите тип входа'
              : language === 'EN'
              ? 'Select Login Role'
              : 'Kirish turini tanlang'}
          </p>
          <div className="grid grid-cols-5 gap-0.5 sm:gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            {(Object.keys(roleConfigs) as LoginRoleType[]).map((role) => {
              const cfg = roleConfigs[role];
              const Icon = cfg.icon;
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`flex flex-col items-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected ? cfg.activeClass : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate w-full text-center">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-semibold animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'RU' ? 'Email или Логин' : language === 'EN' ? 'Email or Username' : 'Email yoki Login'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={currentConfig.placeholder}
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'RU' ? 'Пароль' : language === 'EN' ? 'Password' : 'Parol'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 px-4 bg-[#0050cb] hover:bg-[#0041a8] text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading
              ? (language === 'RU' ? 'Проверка...' : language === 'EN' ? 'Verifying...' : 'Tekshirilmoqda...')
              : `${currentConfig.label} ${language === 'RU' ? 'Войти как' : language === 'EN' ? 'Sign In as' : 'sifatida kirish'}`}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Accounts Buttons */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
            {language === 'RU'
              ? 'Быстрый демо-вход (в один клик):'
              : language === 'EN'
              ? 'Quick demo accounts (one-click autofill):'
              : "Tezkor demo hisoblar (bir bosishda to'ldirish):"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setEmail('admin@smartedu.uz');
                setPassword('admin123');
                setError('');
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-750 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <Shield className="w-3.5 h-3.5 text-[#0050cb] shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold leading-tight truncate">Admin</div>
                <div className="text-[9px] text-slate-400 truncate">Markaz</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('superadmin');
                setEmail('superadmin@smartedu.uz');
                setPassword('admin123');
                setError('');
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl text-left bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold leading-tight truncate text-indigo-700 dark:text-indigo-300">SuperAdmin</div>
                <div className="text-[9px] text-indigo-500 truncate">Platforma</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('teacher');
                setEmail('teacher@smartedu.uz');
                setPassword('admin123');
                setError('');
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/80 dark:border-slate-750 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold leading-tight truncate">O'qituvchi</div>
                <div className="text-[9px] text-slate-400 truncate">admin123</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('student');
                setEmail('student@eduflow.uz');
                setPassword('admin123');
                setError('');
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-750 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold leading-tight truncate">O'quvchi</div>
                <div className="text-[9px] text-slate-400 truncate">admin123</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('parent');
                setEmail('parent@eduflow.uz');
                setPassword('admin123');
                setError('');
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-750 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold leading-tight truncate">Ota-ona</div>
                <div className="text-[9px] text-slate-400 truncate">admin123</div>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 py-2.5 px-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Shield className="w-4 h-4 text-[#0050cb] shrink-0" />
            <span>Xavfsiz tizim: login va parol o'quv markazi administratori tomonidan beriladi.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
};
