import React, { useState, useEffect } from 'react';
import { Eye, X, Gift } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const PROMO_STORAGE_KEY = 'eduflow_read_promotions';
export const CURRENT_PROMO_ID = 'promo-referral-2friends-20';

export const PromotionBanner: React.FC = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const readPromotions = JSON.parse(localStorage.getItem(PROMO_STORAGE_KEY) || '[]');
      if (!readPromotions.includes(CURRENT_PROMO_ID)) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleMarkAsRead = () => {
    try {
      const readPromotions: string[] = JSON.parse(localStorage.getItem(PROMO_STORAGE_KEY) || '[]');
      if (!readPromotions.includes(CURRENT_PROMO_ID)) {
        readPromotions.push(CURRENT_PROMO_ID);
        localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(readPromotions));
      }
    } catch {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify([CURRENT_PROMO_ID]));
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-yellow-500/20 border-2 border-amber-400/40 dark:border-amber-500/30 p-4 sm:p-5 shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top duration-300">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
            <Gift className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
                {t('promo.badge_discount', 'Chegirma 20%')}
              </span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                {t('promo.special_offer', 'Maxsus Aksiya')}
              </span>
            </div>
            <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-1">
              {t('promo.friend_title', 'Maxsus Aksiya: Do‘stlaringizni taklif qiling!')}
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {t('promo.friend_desc', 'O‘zingiz bilan yana 2 ta do‘stingizni o‘quv markazimizga olib kelsangiz, keyingi oylik to‘lovingiz uchun 20% maxsus chegirmaga ega bo‘lasiz!')}
            </p>
          </div>
        </div>

        {/* Action Buttons: "O'qidim / Tushundim" and "✕" */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200/40 dark:border-amber-800/40">
          <button
            type="button"
            onClick={handleMarkAsRead}
            className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('promo.mark_read', 'O‘qidim / Tushundim')}</span>
          </button>
          <button
            type="button"
            onClick={handleMarkAsRead}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
