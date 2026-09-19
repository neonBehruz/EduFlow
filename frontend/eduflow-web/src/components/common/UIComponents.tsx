import React from 'react';
import { X, Sparkles } from 'lucide-react';

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] transition-all`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/50">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Tasdiqlash',
  cancelText = 'Bekor qilish',
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200/90 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'bg-[#0050cb] hover:bg-[#003fa4] shadow-blue-600/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}> = ({ children, variant = 'neutral' }) => {
  const variants = {
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    danger: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    info: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    neutral: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

export const LoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Yuklanmoqda...' }) => (
  <div className="flex flex-col items-center justify-center p-12 text-slate-500">
    <div className="relative w-10 h-10 mb-3">
      <div className="w-10 h-10 border-3 border-blue-600/20 rounded-full" />
      <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
    </div>
    <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">{text}</span>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionText, onAction, icon }) => (
  <div className="relative overflow-hidden flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs my-4 backdrop-blur-md">
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500/15 to-indigo-500/15 text-[#0050cb] dark:text-cyan-400 flex items-center justify-center mb-3 shadow-inner">
      {icon || <span className="text-2xl">📋</span>}
    </div>
    <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">{title}</h4>
    {description && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>}
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="px-5 py-2.5 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
      >
        {actionText}
      </button>
    )}
  </div>
);

export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 sm:px-6 rounded-b-3xl">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Sahifa <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> / {totalPages}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Oldingi
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Keyingi
        </button>
      </div>
    </div>
  );
};

// Universal Responsive Page Header with Theme Glow Banner
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, description, badge, action, icon }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-xs transition-all">
      {/* Subtle ambient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-70" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          {icon && (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0050cb] to-[#38bdf8] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              {icon}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
};
