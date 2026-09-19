import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, FileQuestion, ServerCrash, Home, ArrowLeft, RefreshCw } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const lang = language.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner">
          <FileQuestion className="w-10 h-10" />
        </div>

        <div className="text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          404
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
          Sahifa Topilmadi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Kechirasiz, siz qidirayotgan sahifa mavjud emas, ko‘chirilgan yoki o‘chirilgan bo‘lishi mumkin.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Orqaga Qaytish</span>
          </button>
          <Link
            to={`/${lang}/dashboard`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Bosh Sahifa</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ForbiddenPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = language.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-rose-200/80 dark:border-rose-950/60 shadow-xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="text-6xl font-black text-rose-600 dark:text-rose-400 tracking-tight mb-2">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
          Ruxsat Etilmagan (Kirish Cheklangan)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Sizning tizimdagi rolingiz (
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {user?.role === 1
              ? 'SuperAdmin'
              : user?.role === 2
              ? 'Admin'
              : user?.role === 3
              ? 'O‘qituvchi'
              : user?.role === 4
              ? 'Ota-ona'
              : 'O‘quvchi'}
          </span>
          ) ushbu sahifaga kirish huquqiga ega emas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Orqaga Qaytish</span>
          </button>
          <Link
            to={`/${lang}/dashboard`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Mening Kabinetim</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ServerErrorPage: React.FC<{ error?: string; resetErrorBoundary?: () => void }> = ({
  error,
  resetErrorBoundary,
}) => {
  const { language } = useLanguage();
  const lang = language.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-amber-200/80 dark:border-amber-950/60 shadow-xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 shadow-inner">
          <ServerCrash className="w-10 h-10" />
        </div>

        <div className="text-6xl font-black text-amber-600 dark:text-amber-400 tracking-tight mb-2">
          500
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
          Tizim Xatoligi Yuz Berdi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Kutilmagan texnik nosozlik yuz berdi. Iltimos sahifani qayta yuklang yoki birozdan so‘ng urinib ko‘ring.
        </p>

        {error && (
          <div className="p-3 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-left text-xs font-mono text-rose-600 dark:text-rose-400 overflow-x-auto">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {resetErrorBoundary ? (
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Qayta Urinib Ko‘rish</span>
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sahifani Yangilash</span>
            </button>
          )}
          <Link
            to={`/${lang}/dashboard`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Bosh Sahifa</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
