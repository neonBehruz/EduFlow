import React, { useEffect, useState } from 'react';
import { lessonApi, groupApi, gradeApi } from '../../services/api';
import { Lesson, Student, Grade } from '../../types';
import { Badge, LoadingSpinner, EmptyState } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { StartupEmptyState } from '../../components/common/StartupEmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { Award, Save, CheckCircle2 } from 'lucide-react';

export const GradesPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeMap, setGradeMap] = useState<Record<string, { score: number; comment?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    lessonApi.getAll({ pageSize: 50 }).then((res) => {
      setLessons(res.items);
      if (res.items.length > 0) setSelectedLessonId(res.items[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedLessonId) return;
    const loadLessonGrades = async () => {
      setLoading(true);
      setSuccessMessage('');
      try {
        const lRes = await lessonApi.getById(selectedLessonId);
        if (lRes.success && lRes.data) {
          const gStudents = await groupApi.getStudents(lRes.data.groupId);
          setStudents(gStudents);

          const existingGrades = await gradeApi.getByLesson(selectedLessonId);
          const map: Record<string, { score: number; comment?: string }> = {};

          gStudents.forEach((st) => {
            const found = existingGrades.find((g) => g.studentId === st.id);
            map[st.id] = {
              score: found ? found.score : 85,
              comment: found?.comment || '',
            };
          });

          setGradeMap(map);
        }
      } catch (err) {
        console.error('Error loading lesson grades', err);
      } finally {
        setLoading(false);
      }
    };

    loadLessonGrades();
  }, [selectedLessonId]);

  const handleScoreChange = (studentId: string, score: number) => {
    setGradeMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], score },
    }));
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setGradeMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], comment },
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedLessonId) return;
    setSaving(true);
    setSuccessMessage('');

    try {
      const items = Object.entries(gradeMap).map(([studentId, data]) => ({
        studentId,
        score: Number(data.score),
        comment: data.comment,
      }));

      await gradeApi.saveBulk({
        lessonId: selectedLessonId,
        items,
      });

      setSuccessMessage(t('grades.saved_success', 'Baholar saqlandi! Ota-onalar Telegram orqali xabardor qilindi.'));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Save grades error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <StartupBanner
        badgeText={t('grades.badge', 'Baholar va Reyting 🏆')}
        title={t('grades.title', 'Baholar Jurnali Markazi')}
        description={t('grades.desc', 'O‘quvchilarning darslardagi o‘zlashtirish ko‘rsatkichlari, ballar, test natijalari va monitoring.')}
        icon={<Award className="w-6 h-6" />}
        gradientTheme="amber"
        metrics={[
          { label: t('grades.assessed_lessons', 'Baholangan darslar'), value: `${lessons.length} ${t('dash.students_unit', 'ta')}` },
          { label: t('grades.tg_integration', 'Telegram integratsiya'), value: t('status.active', 'Faol') },
        ]}
        actions={
          <div className="w-full sm:w-72">
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full px-4 py-3 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.groupName} — {l.topic}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <LoadingSpinner text={t('action.loading', 'Baholar yuklanmoqda...')} />
      ) : (
        <div className="space-y-4">
          {successMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden backdrop-blur-md">
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('grades.students_list', 'O‘quvchilar ro‘yxati')} ({students.length})
              </span>
              <button
                onClick={handleSaveGrades}
                disabled={saving}
                className="px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t('action.loading', 'Saqlanmoqda...') : t('grades.save_btn', 'Baholarni Saqlash')}</span>
              </button>
            </div>

            {students.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                {t('grades.no_students', 'Guruhda o‘quvchilar mavjud emas.')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {students.map((st, idx) => (
                  <div key={st.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-slate-400 font-semibold">{idx + 1}.</span>
                      <strong className="text-slate-800 dark:text-white text-sm">{st.fullName}</strong>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('grades.score', 'Ball')}:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={gradeMap[st.id]?.score ?? 85}
                          onChange={(e) => handleScoreChange(st.id, Number(e.target.value))}
                          className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-black text-sm text-[#0050cb] dark:text-blue-400 focus:bg-white dark:focus:bg-slate-900"
                        />
                      </div>

                      <input
                        type="text"
                        value={gradeMap[st.id]?.comment ?? ''}
                        onChange={(e) => handleCommentChange(st.id, e.target.value)}
                        placeholder={t('grades.comment_placeholder', 'Izoh (masalan: Test 100%)...')}
                        className="flex-1 sm:w-64 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
