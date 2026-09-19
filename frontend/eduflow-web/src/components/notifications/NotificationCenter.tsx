import React, { useState, useEffect, useRef } from 'react';
import { Bell, Megaphone, Sparkles, Clock, X, CheckCheck } from 'lucide-react';

interface AdNotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'promo' | 'announcement';
  badge: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Faqat reklama, aksiyalar va markaz e'lonlari uchun
  const [notifications, setNotifications] = useState<AdNotificationItem[]>([
    {
      id: 'ad-1',
      title: 'Yangi mavsum aksiyasi — 20% chegirma!',
      message: "Dasturlash va til kurslariga ro‘yxatdan o‘ting va birinchi oy to‘loviga 20% maxsus chegirmaga ega bo‘ling!",
      time: 'Yangi',
      isRead: false,
      type: 'promo',
      badge: 'Aksiya',
    },
    {
      id: 'ad-2',
      title: "Bepul Masterclass: IT sohasiga kirish",
      message: "Ushbu yakshanba kuni soat 15:00 da tajribali mutaxassislar bilan bepul ochiq masterclass bo‘lib o‘tadi.",
      time: '1 kun oldin',
      isRead: false,
      type: 'announcement',
      badge: 'Eʼlon',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Reklamalar va e'lonlar"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Megaphone className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Reklama va E'lonlar</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {unreadCount} ta yangi
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                title="Barchasini o'qilgan qilish"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>O‘qilgan</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-84 overflow-y-auto mt-2">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2.5">
                  <Megaphone className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">Hozircha yangi reklama yoki eʼlonlar yoʻq</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Yangi aksiyalar, chegirmalar va ochiq darslar eʼlonlari shu yerda koʻrinadi.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl transition-all my-1 relative group ${
                    item.isRead
                      ? 'opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      : 'bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300">
                            {item.badge}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => removeNotification(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      title="O'chirish"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pl-9 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                    {!item.isRead && (
                      <span className="font-bold text-amber-600 dark:text-amber-400">Yangi eʼlon</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
