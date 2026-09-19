import React, { useState } from 'react';
import { Sparkles, Plus, CheckCircle, Rocket, ShieldCheck, Zap, ArrowRight, Database } from 'lucide-react';
import { studentApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface StartupEmptyStateProps {
  title: string;
  subtitle: string;
  onCreateClick?: () => void;
  createButtonText?: string;
  onDemoLoaded?: () => void;
  type?: 'students' | 'teachers' | 'groups';
}

export const StartupEmptyState: React.FC<StartupEmptyStateProps> = ({
  title,
  subtitle,
  onCreateClick,
  createButtonText = "Yangi qo'shish",
  onDemoLoaded,
  type = 'students',
}) => {
  const { t, language } = useLanguage();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleSeedDemo = async () => {
    setLoadingDemo(true);
    try {
      if (type === 'students') {
        const demoStudents = [
          { firstName: 'Jasur', lastName: 'Umarov', phoneNumber: '+998901234501', parentFullName: 'Shuhrat Umarov', parentPhoneNumber: '+998901112233' },
          { firstName: 'Madina', lastName: 'Xoliqova', phoneNumber: '+998901234502', parentFullName: 'Feruza Xoliqova', parentPhoneNumber: '+998902223344' },
          { firstName: 'Diyorbek', lastName: 'Saidov', phoneNumber: '+998901234503', parentFullName: 'Jamshid Saidov', parentPhoneNumber: '+998903334455' },
          { firstName: 'Nilufar', lastName: 'Karimova', phoneNumber: '+998901234504', parentFullName: 'Dilnoza Karimova', parentPhoneNumber: '+998904445566' },
          { firstName: 'Sardor', lastName: 'Aliyev', phoneNumber: '+998901234505', parentFullName: 'Bahrom Aliyev', parentPhoneNumber: '+998905556677' },
        ];

        for (const st of demoStudents) {
          await studentApi.create({
            firstName: st.firstName,
            lastName: st.lastName,
            phoneNumber: st.phoneNumber,
            parentFullName: st.parentFullName,
            parentPhoneNumber: st.parentPhoneNumber,
            birthDate: '2007-05-15',
          });
        }
      }

      onDemoLoaded?.();
    } catch (err) {
      console.error('Demo loading error', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-b from-white/90 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-xl text-center my-6">
      {/* Background Animated Lights */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Floating 3D Graphic Mascot */}
      <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#0050cb] to-[#38bdf8] text-white shadow-xl shadow-blue-500/25 mb-6 group hover:scale-110 transition-transform">
        <Rocket className="w-10 h-10 animate-bounce" />
        <div className="absolute inset-0 rounded-3xl bg-blue-400/20 animate-ping opacity-30" />
      </div>

      <div className="max-w-xl mx-auto space-y-3">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      </div>



      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="px-6 py-3 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{createButtonText}</span>
          </button>
        )}

        {onDemoLoaded && (
          <button
            onClick={handleSeedDemo}
            disabled={loadingDemo}
            className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-700 text-xs font-extrabold rounded-2xl shadow-xs transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              {loadingDemo
                ? (language === 'RU' ? 'Загрузка...' : language === 'EN' ? 'Loading...' : 'Yuklanmoqda...')
                : (language === 'RU' ? '⚡ Загрузить демо-студентов' : language === 'EN' ? '⚡ Load demo students' : '⚡ Demo o‘quvchilarni yuklash')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
