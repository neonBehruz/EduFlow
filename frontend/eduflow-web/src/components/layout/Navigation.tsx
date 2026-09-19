import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UsersRound,
  BookOpen,
  CalendarCheck2,
  ClipboardCheck,
  CreditCard,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  CalendarDays,
  FileCheck2,
  Layers,
  FileText,
  DollarSign,
  AlertTriangle,
  HeartHandshake,
  Share2,
  Globe,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useLanguage } from '../../context/LanguageContext';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, organization, logout, isSuperAdmin } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Role-specific Navigation Links
  const getNavLinks = () => {
    const role = user?.role;
    const langPrefix = '/' + language.toLowerCase();

    if (role === 4) {
      // Parent Portal
      return [
        { to: `${langPrefix}/parent/dashboard`, label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
        { to: `${langPrefix}/parent/children`, label: t('nav.my_children', 'Farzandlarim'), icon: Users },
        { to: `${langPrefix}/parent/payments`, label: t('nav.payments', 'To‘lovlar & Invoyslar'), icon: CreditCard },
        { to: `${langPrefix}/parent/feedback`, label: t('nav.feedback', 'Fikr bildirish'), icon: HeartHandshake },
        { to: `${langPrefix}/parent/settings`, label: t('nav.settings', 'Sozlamalar'), icon: Settings },
      ];
    }

    if (role === 5) {
      // Student Portal
      return [
        { to: `${langPrefix}/student/dashboard`, label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
        { to: `${langPrefix}/student/calendar`, label: t('nav.calendar', 'Dars Jadvali'), icon: CalendarDays },
        { to: `${langPrefix}/student/homework`, label: t('nav.homework', 'Uy Vazifalari'), icon: FileCheck2 },
        { to: `${langPrefix}/student/payments`, label: t('nav.payments', 'To‘lovlar & Invoyslar'), icon: CreditCard },
        { to: `${langPrefix}/student/feedback`, label: t('nav.feedback', 'Fikr bildirish'), icon: HeartHandshake },
        { to: `${langPrefix}/student/settings`, label: t('nav.settings', 'Sozlamalar'), icon: Settings },
      ];
    }

    if (role === 3) {
      // Teacher Portal
      return [
        { to: `${langPrefix}/teacher/dashboard`, label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
        { to: `${langPrefix}/teacher/lessons`, label: t('nav.my_lessons', 'Darslarim'), icon: CalendarCheck2 },
        { to: `${langPrefix}/teacher/attendance`, label: t('nav.attendance', 'Davomat'), icon: ClipboardCheck },
        { to: `${langPrefix}/teacher/homework`, label: t('nav.homework', 'Uy Vazifalari'), icon: FileCheck2 },
        { to: `${langPrefix}/teacher/groups`, label: t('nav.my_groups', 'Guruhlarim'), icon: UsersRound },
        { to: `${langPrefix}/teacher/payroll`, label: t('nav.my_salary', 'Oylik Maosh'), icon: DollarSign },
        { to: `${langPrefix}/teacher/settings`, label: t('nav.settings', 'Sozlamalar'), icon: Settings },
      ];
    }

    // Admin / SuperAdmin
    return [
      { to: `${langPrefix}/dashboard`, label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
      ...(isSuperAdmin ? [{ to: `${langPrefix}/admin`, label: t('nav.superadmin', 'SuperAdmin Boshqaruvi'), icon: ShieldCheck }] : []),
      { to: `${langPrefix}/users`, label: 'Foydalanuvchilar', icon: Users },
      { to: `${langPrefix}/courses`, label: 'Kurslar', icon: BookOpen },
      { to: `${langPrefix}/crm`, label: t('nav.crm', 'CRM & Lidlar'), icon: Layers },
      { to: `${langPrefix}/calendar`, label: t('nav.calendar', 'Dars Jadvali'), icon: CalendarDays },
      { to: `${langPrefix}/students`, label: t('nav.students', 'O‘quvchilar'), icon: Users },
      { to: `${langPrefix}/teachers`, label: t('nav.teachers', 'O‘qituvchilar'), icon: GraduationCap },
      { to: `${langPrefix}/groups`, label: t('nav.groups', 'Guruhlar'), icon: UsersRound },
      { to: `${langPrefix}/lessons`, label: t('nav.lessons', 'Darslar'), icon: CalendarCheck2 },
      { to: `${langPrefix}/attendance`, label: t('nav.attendance', 'Davomat'), icon: ClipboardCheck },
      { to: `${langPrefix}/payments`, label: t('nav.payments', 'To‘lovlar'), icon: CreditCard },
      { to: `${langPrefix}/invoices`, label: t('nav.invoices', 'Invoyslar'), icon: FileText },
      { to: `${langPrefix}/payroll`, label: t('nav.payroll', 'Oylik & Payroll'), icon: DollarSign },
      { to: `${langPrefix}/risk`, label: t('nav.risk', 'Risk Tahlili'), icon: AlertTriangle },
      { to: `${langPrefix}/reports`, label: t('nav.reports', 'Hisobotlar'), icon: BarChart3 },
      { to: `${langPrefix}/settings`, label: t('nav.settings', 'Sozlamalar'), icon: Settings },
    ];
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    navigate(`/${language.toLowerCase()}/login`);
  };

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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0050cb] to-[#0066ff] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              E
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-800 dark:text-white tracking-tight leading-none">EduFlow</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate max-w-[130px]">
                {organization?.name
                  ? organization.name.replace(/O['‘`’]quv Markazi/i, language === 'RU' ? 'Учебный Центр' : language === 'EN' ? 'Learning Center' : "O'quv Markazi")
                  : language === 'RU' ? 'Учебный Центр' : language === 'EN' ? 'Learning Center' : "O'quv Markazi"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-[#d0e1fb]/60 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <Link
              to={`/${language.toLowerCase()}/profile`}
              className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer group"
              title="Shaxsiy profilga o'tish"
            >
              <div className="w-8 h-8 rounded-full bg-[#0050cb] text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:ring-2 ring-indigo-400 transition-all">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {getRoleLabel()}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Chiqish"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user, organization } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);

  // Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick add outside click listener
  useEffect(() => {
    if (!isQuickOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setIsQuickOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isQuickOpen]);

  return (
    <>
      <header className="sticky top-0 right-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-500 hover:text-slate-800 md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Button / Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/70 dark:bg-slate-800/70 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/80 rounded-full text-xs text-slate-500 dark:text-slate-400 w-48 sm:w-64 md:w-80 cursor-pointer transition-all text-left"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate flex-1">{t('header.search', 'Qidirish (Ctrl + K)...')}</span>
            <kbd className="hidden sm:inline-block text-[10px] uppercase font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md text-slate-400 shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Add for Admin/Teacher */}
          {user?.role && user.role <= 3 && (
            <div ref={quickRef} className="relative">
              <button
                onClick={() => setIsQuickOpen(!isQuickOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('header.quick_add', 'Qo‘shish')}</span>
              </button>

              {isQuickOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  {user?.role && user.role <= 2 ? (
                    <>
                      <button
                        onClick={() => { setIsQuickOpen(false); navigate(`/${language.toLowerCase()}/students`); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-[#0050cb]" />
                        <span>{t('header.new_student', 'Yangi O‘quvchi')}</span>
                      </button>
                      <button
                        onClick={() => { setIsQuickOpen(false); navigate(`/${language.toLowerCase()}/teachers`); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      >
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                        <span>{t('header.new_teacher', 'Yangi O‘qituvchi')}</span>
                      </button>
                      <button
                        onClick={() => { setIsQuickOpen(false); navigate(`/${language.toLowerCase()}/groups`); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      >
                        <UsersRound className="w-4 h-4 text-amber-500" />
                        <span>{t('header.new_group', 'Yangi Guruh')}</span>
                      </button>
                      <button
                        onClick={() => { setIsQuickOpen(false); navigate(`/${language.toLowerCase()}/attendance`); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      >
                        <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                        <span>{t('header.teacher_attendance', 'O‘qituvchilar Davomati')}</span>
                      </button>
                      <button
                        onClick={() => { setIsQuickOpen(false); navigate(`/${language.toLowerCase()}/crm`); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      >
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>{t('header.new_lead', 'Yangi Lid (CRM)')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setIsQuickOpen(false); navigate(`/${language.toLowerCase()}/teacher/attendance`); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      >
                        <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                        <span>{t('header.take_attendance', 'Davomat Qilish')}</span>
                      </button>
                      <button
                        onClick={() => { setIsQuickOpen(false); navigate(`/${language.toLowerCase()}/teacher/homework`); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4 text-indigo-600" />
                        <span>{t('nav.homework', 'Uy Vazifalari')}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Language Selector */}
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold">
            {(['UZ', 'RU', 'EN'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-white dark:bg-slate-900 text-[#0050cb] dark:text-blue-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <ThemeToggle />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

          {/* User Profile avatar */}
          <NavLink
            to={
              user?.role === 3
                ? `/${language.toLowerCase()}/teacher/settings`
                : user?.role === 4
                ? `/${language.toLowerCase()}/parent/settings`
                : user?.role === 5
                ? `/${language.toLowerCase()}/student/settings`
                : `/${language.toLowerCase()}/settings`
            }
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0050cb] to-[#0066ff] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-slate-800 dark:text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-slate-400">
                {user?.role === 1
                  ? t('role.superadmin', 'SuperAdmin')
                  : user?.role === 2
                  ? t('role.admin', 'Admin')
                  : user?.role === 3
                  ? t('role.teacher', 'O‘qituvchi')
                  : user?.role === 4
                  ? t('role.parent', 'Ota-ona')
                  : user?.role === 5
                  ? t('role.student', 'O‘quvchi')
                  : t('role.user', 'Admin')}
              </span>
            </div>
          </NavLink>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
