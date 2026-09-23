import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, Calendar, Clock, ArrowRight, BookOpen, GraduationCap, Award, ShieldCheck, Flame, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardHero: React.FC = () => {
  const { user, organization, isSuperAdmin } = useAuth();
  const { isMorning, isNight } = useTheme();
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [language]);

  const greeting = isMorning
    ? `${t('hero.greeting_morning', 'Xayrli kun')}, ${user?.firstName || t('hero.user_fallback', 'Foydalanuvchi')}!`
    : `${t('hero.greeting_evening', 'Xayrli oqshom')}, ${user?.firstName || t('hero.user_fallback', 'Foydalanuvchi')}!`;

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 md:p-8 3xl:p-10 4xl:p-12 transition-all duration-500 border group shadow-lg">
      {/* Dynamic Background Mesh & Gradients */}
      <div
        className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
          isNight
            ? 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-purple-950/80 border-indigo-500/20'
            : 'bg-gradient-to-br from-sky-500/10 via-amber-100/30 to-blue-50/60 border-amber-300/40'
        }`}
      />

      {/* Decorative Floating Glowing Orbs */}
      <div
        className={`absolute -right-16 -top-16 w-64 3xl:w-96 h-64 3xl:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isNight ? 'bg-indigo-500/25 animate-pulse' : 'bg-amber-400/25 animate-pulse'
        }`}
      />
      <div
        className={`absolute -left-16 -bottom-16 w-64 3xl:w-96 h-64 3xl:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isNight ? 'bg-cyan-500/20' : 'bg-blue-400/20'
        }`}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 3xl:gap-8 items-center">
        {/* Left Column: Greeting & Info */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          {/* Status Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 3xl:px-4 3xl:py-1.5 rounded-full text-xs 3xl:text-sm font-bold border transition-all ${
                isNight
                  ? 'bg-indigo-900/60 text-indigo-300 border-indigo-700/60 shadow-xs'
                  : 'bg-amber-100/80 text-amber-800 border-amber-300/80 shadow-xs'
              }`}
            >
              {isMorning ? <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
              <span>{isMorning ? t('hero.morning_mode', 'Tonggi tetiklik rejimi') : t('hero.night_mode', 'Kechki qulay ko‘z himoyasi')}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 3xl:px-4 3xl:py-1.5 rounded-full text-xs 3xl:text-sm font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{t('hero.status_active', 'EduFlow Faol')}</span>
            </span>

            {/* Live Clock with Ticking Seconds */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 3xl:px-4 3xl:py-1.5 rounded-full text-xs 3xl:text-sm font-mono font-bold bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-300/40 dark:border-white/10">
              <Clock className="w-3.5 h-3.5 opacity-70" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl 3xl:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {greeting}
            </h2>
            <p className="text-xs sm:text-sm 3xl:text-base 4xl:text-lg text-slate-600 dark:text-slate-300 mt-2 max-w-xl 3xl:max-w-2xl leading-relaxed">
              {isMorning
                ? `${t('hero.desc_morning', 'Bugun yangi yutuqlar va darslar kuni. O‘quvchilaringiz bilim olishga tayyor!')} (${organization?.name || 'EduFlow'})`
                : t('hero.desc_evening', 'Bugungi darslar, davomat va to‘lovlar hisobotlarini ko‘rib chiqishingiz mumkin. Ko‘zlaringizga dam bering!')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
            <Link
              to="/attendance"
              className="px-4 sm:px-5 py-2.5 3xl:px-7 3xl:py-3.5 rounded-xl text-xs 3xl:text-sm font-bold text-white bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{t('hero.quick_attendance', 'Tezkor Davomat Qilish')}</span>
            </Link>

            <Link
              to="/students"
              className="px-3.5 sm:px-4 py-2.5 3xl:px-6 3xl:py-3.5 rounded-xl text-xs 3xl:text-sm font-bold bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-blue-500" />
              <span>{t('hero.students', 'O‘quvchilar')}</span>
            </Link>

            <Link
              to="/payments"
              className="px-3.5 sm:px-4 py-2.5 3xl:px-6 3xl:py-3.5 rounded-xl text-xs 3xl:text-sm font-bold bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              <Award className="w-4 h-4 text-emerald-500" />
              <span>{t('hero.payments', 'To‘lovlar')}</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Animated Visual Art / Educational Illustration (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 justify-end">
          <div className="relative w-full max-w-[340px] 3xl:max-w-[420px] aspect-4/3 flex items-center justify-center">
            {/* Ambient Backlight Aura */}
            <div
              className={`absolute inset-4 rounded-3xl blur-2xl opacity-60 transition-all duration-700 ${
                isNight
                  ? 'bg-gradient-to-tr from-indigo-500 to-cyan-500'
                  : 'bg-gradient-to-tr from-amber-400 to-sky-400'
              }`}
            />

            {/* Floating Glassmorphism Graphic Card */}
            <div className="relative z-10 w-full p-4 sm:p-5 3xl:p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0050cb] to-[#38bdf8] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    E
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block leading-tight">
                      {t('hero.hub_title', 'EduFlow Pro Hub')}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {t('hero.hub_subtitle', 'Multi-Tenant Smart CRM')}
                    </span>
                  </div>
                </div>

                <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  2026 v2.0
                </div>
              </div>

              {/* Live Animated Features Mini-Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5 transition-transform hover:scale-102">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                    ⚡
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">{t('hero.quick', 'Tezkor')}</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t('hero.attendance', 'Davomat')}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5 transition-transform hover:scale-102">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
                    🤖
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">{t('hero.telegram', 'Telegram')}</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t('hero.notifications', 'Xabarnoma')}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5 transition-transform hover:scale-102">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs">
                    📊
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">{t('hero.finance', 'Moliya')}</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t('hero.payments', 'To‘lovlar')}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5 transition-transform hover:scale-102">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">
                    🛡️
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">{t('hero.safe', 'Xavfsiz')}</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t('hero.cloud', 'Bulutli Tizim')}</span>
                  </div>
                </div>
              </div>

              {/* Bottom live indicator */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t('hero.server_online', 'Server 100% Onlayn')}</span>
                </span>
                <span className="font-semibold">{currentDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
