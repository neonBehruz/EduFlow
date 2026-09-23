import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Clock, Sparkles, Check, ChevronDown, Wand2 } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const ThemeToggle: React.FC = () => {
  const { themeMode, activeTheme, setThemeMode, toggleTheme, isMorning, isNight } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerAnimation = () => {
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 700);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerAnimation();
    toggleTheme();
  };

  const options: {
    mode: ThemeMode;
    label: string;
    subLabel: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      mode: 'morning',
      label: 'Tong / Ertalabki tema',
      subLabel: 'Morning Glow',
      description: "Tiniq quyosh nuri, tetiklashtiruvchi yorug'lik va yuqori diqqat",
      icon: Sun,
      accentColor: 'from-amber-400 via-orange-400 to-amber-500 text-amber-500',
    },
    {
      mode: 'night',
      label: 'Tun / Kechki tema',
      subLabel: 'Midnight Eye-Care',
      description: "Ko'k nurni (blue-light) kesuvchi sokin tun, ko'z charchashidan himoya",
      icon: Moon,
      accentColor: 'from-indigo-500 via-purple-500 to-cyan-400 text-indigo-400',
    },
    {
      mode: 'auto',
      label: 'Aqlli Avtomatik rejim',
      subLabel: 'Smart Schedule',
      description: "Soat 06:00 dan 19:00 gacha Tong, kechasi esa Tun rejimi",
      icon: Clock,
      accentColor: 'from-emerald-400 to-teal-500 text-emerald-500',
    },
  ];

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Ripple Animation Wave Triggered On Switch */}
      {isWaving && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <div
            className={`absolute top-4 right-20 w-16 h-16 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping-expand opacity-30 ${
              isNight ? 'bg-indigo-500' : 'bg-amber-400'
            }`}
          />
        </div>
      )}

      {/* Main Interactive Sky Capsule Switcher */}
      <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/80 p-1 rounded-full border border-slate-300/60 dark:border-slate-700/80 backdrop-blur-md shadow-xs shrink-0">
        {/* Animated Day/Night Interactive Sky Track Button */}
        <button
          onClick={handleToggleClick}
          aria-label="Kun/Tun almashtirish"
          title={`Bosganda: ${isMorning ? "🌙 Tunga o'tish" : "🌅 Tongga o'tish"}`}
          className={`relative w-14 sm:w-16 h-7 sm:h-8 rounded-full overflow-hidden transition-all duration-500 cursor-pointer shadow-inner focus:outline-none select-none group border shrink-0 ${
            isMorning
              ? 'bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300 border-amber-200 shadow-sky-200/50'
              : 'bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 border-indigo-800 shadow-indigo-950/80'
          }`}
        >
          {/* Animated Sky Background Elements */}
          {isMorning ? (
            /* Day Sky: Drifting Clouds & Sun Glint */
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Cloud 1 */}
              <div className="absolute top-1 right-2 w-5 h-2 bg-white/70 rounded-full blur-[0.3px] animate-cloud-drift-1" />
              {/* Cloud 2 */}
              <div className="absolute bottom-1 right-5 w-4 h-1.5 bg-white/50 rounded-full blur-[0.3px] animate-cloud-drift-2" />
              {/* Sun Ray Beams */}
              <div className="absolute -left-2 -top-2 w-12 h-12 bg-amber-300/30 rounded-full blur-md animate-pulse" />
            </div>
          ) : (
            /* Night Sky: Stars & Galaxy Dust */
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Star 1 */}
              <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-twinkle shadow-xs shadow-white" />
              {/* Star 2 */}
              <div className="absolute bottom-2 left-5 w-0.5 h-0.5 bg-indigo-200 rounded-full animate-twinkle-delay shadow-xs" />
              {/* Star 3 */}
              <div className="absolute top-4 left-7 w-1 h-1 bg-cyan-200 rounded-full animate-twinkle shadow-xs" />
              {/* Nebula Glow */}
              <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-indigo-500/20 rounded-full blur-md" />
            </div>
          )}

          {/* Morphing Sun/Moon Thumb */}
          <div
            className={`absolute top-0.5 bottom-0.5 w-6 sm:w-7 h-6 sm:h-7 rounded-full transition-all duration-500 flex items-center justify-center transform shadow-md ${
              isMorning
                ? 'left-0.5 bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-900 translate-x-0 rotate-0 ring-2 ring-amber-300/80 shadow-amber-500/40'
                : 'left-0.5 bg-gradient-to-tr from-slate-200 via-indigo-100 to-slate-300 text-indigo-950 translate-x-7 sm:translate-x-8 -rotate-12 ring-2 ring-indigo-400/50 shadow-indigo-900/60'
            }`}
          >
            {isMorning ? (
              /* Sun with rotating rays */
              <div className="relative flex items-center justify-center w-full h-full">
                <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-800 animate-spin-slow" />
                <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping opacity-25" />
              </div>
            ) : (
              /* Moon with craters */
              <div className="relative flex items-center justify-center w-full h-full">
                <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-indigo-950" />
                {/* Moon crater dots */}
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-slate-400/40 rounded-full" />
                <div className="absolute bottom-1.5 left-2 w-0.8 h-0.8 bg-slate-400/30 rounded-full" />
              </div>
            )}
          </div>
        </button>

        {/* Dropdown Opener Pill (Hidden on mobile/small screens to preserve header width) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
            isNight
              ? 'text-slate-200 hover:text-white hover:bg-slate-700/60'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
          }`}
          title="Mavzular ro‘yxatini ochish"
        >
          <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
            {themeMode === 'auto' ? (
              <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
                <Sparkles className="w-3 h-3 animate-spin-slow" />
                <span>{t('theme.auto', 'Avto')}</span>
              </span>
            ) : isMorning ? (
              `🌅 ${t('theme.morning', 'Tong')}`
            ) : (
              `🌙 ${t('theme.night', 'Tun')}`
            )}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180 text-blue-500' : ''
            }`}
          />
        </button>
      </div>

      {/* Advanced Animated Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2.5 w-80 rounded-3xl shadow-2xl border p-2.5 z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-2xl ${
            isNight
              ? 'bg-slate-900/95 border-indigo-500/20 text-slate-100 shadow-indigo-950/70'
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
          }`}
        >
          {/* Header Banner */}
          <div
            className={`p-3 rounded-2xl mb-2 flex items-center justify-between border ${
              isNight
                ? 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-800/40 text-indigo-200'
                : 'bg-gradient-to-r from-amber-50 to-sky-50 border-amber-200/60 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-amber-500 dark:text-indigo-400 animate-bounce" />
              <div>
                <span className="text-xs font-bold block">EduFlow Vizual Mavzusi</span>
                <span className="text-[10px] opacity-75">
                  Ko‘z salomatligi va tetiklik uchun
                </span>
              </div>
            </div>
            <div
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                isNight
                  ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-700'
                  : 'bg-amber-200/80 text-amber-900 border border-amber-300'
              }`}
            >
              {isMorning ? '☀️ Faol: Tong' : '🌙 Faol: Tun'}
            </div>
          </div>

          {/* Mode Selector List */}
          <div className="space-y-1.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.mode;

              return (
                <button
                  key={opt.mode}
                  onClick={() => {
                    triggerAnimation();
                    setThemeMode(opt.mode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-2xl text-left transition-all duration-200 cursor-pointer group relative overflow-hidden ${
                    isSelected
                      ? isNight
                        ? 'bg-indigo-950/80 border border-indigo-500/50 shadow-md shadow-indigo-950/50'
                        : 'bg-amber-50/90 border border-amber-300/80 shadow-xs'
                      : isNight
                      ? 'hover:bg-slate-800/70 border border-transparent text-slate-300'
                      : 'hover:bg-slate-50 border border-transparent text-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                      isSelected
                        ? `bg-gradient-to-tr ${opt.accentColor} text-white`
                        : isNight
                        ? 'bg-slate-800 text-slate-400 group-hover:text-indigo-300'
                        : 'bg-slate-100 text-slate-600 group-hover:text-amber-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 block -mt-0.5">
                      {opt.subLabel}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-tight mt-1">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick toggle footer with sound hint */}
          <div
            className={`mt-2.5 pt-2 border-t px-2 flex items-center justify-between text-[11px] ${
              isNight ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
            }`}
          >
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Yoqimli ohang uyg‘unligi</span>
            </span>

            <button
              onClick={(e) => {
                handleToggleClick(e);
                setIsOpen(false);
              }}
              className="font-bold text-xs text-[#0050cb] dark:text-cyan-400 hover:underline cursor-pointer"
            >
              {isMorning ? '🌙 Kechki rejimga o‘tish' : '🌅 Ertalabki rejimga o‘tish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
