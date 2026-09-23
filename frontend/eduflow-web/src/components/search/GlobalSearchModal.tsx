import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../services/api';
import { SearchResultItemDto } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Search, X, Users, GraduationCap, UsersRound, Calendar, CreditCard, Award, ArrowRight } from 'lucide-react';
import { useBodyScrollLock } from '../../utils/scrollLock';

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  const { language } = useLanguage();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Click outside and ESC key listeners to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const entityType = activeType === 'all' ? undefined : activeType;
        const res = await searchApi.search(query.trim(), entityType);
        if (res.success && res.data) {
          setResults(res.data.results || []);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, activeType]);

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'student':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'teacher':
        return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case 'group':
        return <UsersRound className="w-4 h-4 text-amber-500" />;
      case 'lesson':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'payment':
      case 'invoice':
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      case 'lead':
        return <Award className="w-4 h-4 text-indigo-500" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleSelect = (item: SearchResultItemDto) => {
    onClose();
    const lang = language.toLowerCase();
    let target = item.url;
    if (user?.role === 3) {
      if (target === '/lessons') target = '/teacher/lessons';
      else if (target === '/calendar') target = '/teacher/lessons';
      else if (target.startsWith('/attendance')) target = target.replace('/attendance', '/teacher/attendance');
      else if (target.startsWith('/grades')) target = '/teacher/dashboard';
      else if (target.startsWith('/homework')) target = '/teacher/homework';
      else if (target.startsWith('/groups')) target = target.replace('/groups', '/teacher/groups');
      else if (target.startsWith('/payroll')) target = '/teacher/payroll';
      else if (target.startsWith('/settings')) target = '/teacher/settings';
    } else if (user?.role === 5) {
      if (target.startsWith('/homework')) target = '/student/homework';
      else if (target.startsWith('/feedback')) target = '/student/feedback';
      else if (target.startsWith('/settings')) target = '/student/settings';
      else target = '/student/dashboard';
    }
    navigate(`/${lang}${target.startsWith('/') ? target : '/' + target}`);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-default overscroll-contain select-none touch-none"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 flex flex-col overscroll-contain select-text touch-auto"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidiruv: o'quvchi, o'qituvchi, guruh, dars, to'lov..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              title="Tozalash"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg cursor-pointer transition-colors"
            title="Yopish (ESC)"
          >
            <span>ESC</span>
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'student', label: 'O‘quvchilar' },
            { id: 'teacher', label: 'O‘qituvchilar' },
            { id: 'group', label: 'Guruhlar' },
            { id: 'payment', label: 'To‘lovlar' },
            { id: 'lead', label: 'Lidlar' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveType(pill.id)}
              className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                activeType === pill.id
                  ? 'bg-[#0050cb] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2 scroll-touch touch-pan-y">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Qidirilmoqda...</div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => (
                <div
                  key={`${item.entityType}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50/70 dark:hover:bg-slate-800/80 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getEntityIcon(item.entityType)}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      {item.entityType}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0050cb] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              "{query}" bo‘yicha hech narsa topilmadi.
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              O‘quvchi ismi, telefon raqami, o‘qituvchi yoki guruh nomi bo‘yicha izlang...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
