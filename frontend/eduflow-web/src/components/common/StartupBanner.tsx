import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, ArrowRight } from 'lucide-react';

interface MetricItem {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
}

interface StartupBannerProps {
  badgeText?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradientTheme?: 'blue' | 'purple' | 'emerald' | 'amber';
  metrics?: MetricItem[];
  actions?: React.ReactNode;
}

export const StartupBanner: React.FC<StartupBannerProps> = ({
  badgeText = 'EduFlow Pro Cloud 🚀',
  title,
  description,
  icon,
  gradientTheme = 'blue',
  metrics = [],
  actions,
}) => {
  const { isNight } = useTheme();

  const themeGradients = {
    blue: {
      light: 'from-blue-600/10 via-indigo-500/10 to-cyan-400/10 border-blue-200/80',
      dark: 'from-blue-950/80 via-indigo-950/60 to-slate-900 border-blue-800/40',
      glow: isNight ? 'bg-blue-600/20' : 'bg-blue-400/20',
      accent: 'from-[#0050cb] to-[#38bdf8]',
      badge: isNight ? 'bg-blue-900/60 text-blue-300 border-blue-700/60' : 'bg-blue-50 text-[#0050cb] border-blue-200',
    },
    purple: {
      light: 'from-purple-600/10 via-pink-500/10 to-indigo-400/10 border-purple-200/80',
      dark: 'from-purple-950/80 via-indigo-950/60 to-slate-900 border-purple-800/40',
      glow: isNight ? 'bg-purple-600/20' : 'bg-purple-400/20',
      accent: 'from-purple-600 to-pink-500',
      badge: isNight ? 'bg-purple-900/60 text-purple-300 border-purple-700/60' : 'bg-purple-50 text-purple-700 border-purple-200',
    },
    emerald: {
      light: 'from-emerald-600/10 via-teal-500/10 to-blue-400/10 border-emerald-200/80',
      dark: 'from-emerald-950/80 via-teal-950/60 to-slate-900 border-emerald-800/40',
      glow: isNight ? 'bg-emerald-600/20' : 'bg-emerald-400/20',
      accent: 'from-emerald-600 to-teal-400',
      badge: isNight ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    amber: {
      light: 'from-amber-500/15 via-orange-400/10 to-yellow-300/10 border-amber-200/80',
      dark: 'from-amber-950/60 via-slate-900 to-indigo-950 border-amber-800/40',
      glow: isNight ? 'bg-amber-600/20' : 'bg-amber-400/20',
      accent: 'from-amber-500 to-orange-500',
      badge: isNight ? 'bg-amber-900/60 text-amber-300 border-amber-700/60' : 'bg-amber-50 text-amber-800 border-amber-200',
    },
  };

  const currentTheme = themeGradients[gradientTheme];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-lg backdrop-blur-xl transition-all duration-300 group ${
        isNight ? currentTheme.dark : currentTheme.light
      }`}
    >
      {/* Decorative Floating Glowing Orbs */}
      <div
        className={`absolute -right-12 -top-12 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-all duration-500 animate-pulse ${currentTheme.glow}`}
      />
      <div
        className={`absolute -left-12 -bottom-12 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${currentTheme.glow}`}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Icon + Title + Description */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentTheme.accent} text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0`}
            >
              {icon}
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${currentTheme.badge}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{badgeText}</span>
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Quick Metrics Bar if provided */}
          {metrics.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {metrics.map((m, i) => (
                <div
                  key={i}
                  className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center gap-2 text-xs backdrop-blur-md"
                >
                  {m.icon && <span className="text-slate-400">{m.icon}</span>}
                  <span className="text-slate-500 dark:text-slate-400">{m.label}:</span>
                  <span className="font-extrabold text-slate-800 dark:text-white">{m.value}</span>
                  {m.change && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1 rounded">
                      {m.change}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Actions Slot */}
        {actions && (
          <div className="w-full lg:w-auto shrink-0 flex flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
