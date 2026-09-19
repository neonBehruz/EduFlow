import React, { useEffect, useState } from 'react';
import { feedbackApi, teacherApi } from '../../services/api';
import { FeedbackDto, Teacher } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSpinner } from '../../components/common/UIComponents';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Building,
  GraduationCap,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [feedbacks, setFeedbacks] = useState<FeedbackDto[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<'Center' | 'Teacher' | 'Course' | 'General'>('Center');
  const [teacherId, setTeacherId] = useState<string>('');
  const [comment, setComment] = useState('');

  // Admin filter
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const isParentOrStudent = user?.role === 4 || user?.role === 5;
  const isAdmin = user?.role === 1 || user?.role === 2;
  const isRu = language === 'RU';
  const isEn = language === 'EN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fbRes, teacherRes] = await Promise.allSettled([
        feedbackApi.getAll(),
        teacherApi.getAll(),
      ]);

      if (fbRes.status === 'fulfilled' && fbRes.value) {
        const list = Array.isArray(fbRes.value) ? fbRes.value : (fbRes.value as any).data || [];
        setFeedbacks(list);
      }

      if (teacherRes.status === 'fulfilled' && teacherRes.value) {
        const tList = Array.isArray(teacherRes.value) ? teacherRes.value : (teacherRes.value as any).data || [];
        setTeachers(tList);
      }
    } catch (err) {
      console.error('Feedback load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      const res = await feedbackApi.submit({
        rating,
        category,
        teacherId: category === 'Teacher' && teacherId ? teacherId : undefined,
        comment: comment.trim(),
      });

      if (res.success || res.data) {
        setSubmitSuccess(true);
        setComment('');
        setRating(5);
        setTeacherId('');
        const updated = await feedbackApi.getAll();
        const list = Array.isArray(updated) ? updated : (updated as any).data || [];
        setFeedbacks(list);

        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Submit feedback error', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text={t('action.loading', 'Yuklanmoqda...')} />;
  }

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (filterCategory !== 'all' && fb.category.toLowerCase() !== filterCategory.toLowerCase()) {
      return false;
    }
    return true;
  });

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0050cb] via-[#1a65db] to-[#3b82f6] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                {t('feedback.page_title', 'Fikr-mulohazalar va Takliflar')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isParentOrStudent
                ? isRu ? 'Оставить отзыв или предложение центру' : isEn ? 'Send Feedback or Suggestion to Learning Center' : 'O‘quv markazimizga fikr yoki taklif bildiring'
                : isRu ? 'Отзывы родителей и студентов' : isEn ? 'Parent and Student Feedback' : 'Ota-onalar va o‘quvchilar fikrlari'}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              {t('feedback.page_subtitle', 'Markaz faoliyati, o‘qituvchilar va darslar haqida o‘z fikringizni bildiring')}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="text-center">
              <span className="text-[10px] text-blue-100 uppercase tracking-wider block">
                {isRu ? 'Средний балл' : isEn ? 'Average Rating' : 'O‘rtacha baho'}
              </span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
                <span className="text-2xl font-black">{averageRating}</span>
                <span className="text-xs text-blue-100">/ 5</span>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-white/20" />
            <div className="text-center">
              <span className="text-[10px] text-blue-100 uppercase tracking-wider block">
                {isRu ? 'Всего отзывов' : isEn ? 'Total Reviews' : 'Jami fikrlar'}
              </span>
              <span className="text-2xl font-black mt-0.5 block">{feedbacks.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Submit New Feedback Form */}
        <div className={isAdmin ? 'lg:col-span-5' : 'lg:col-span-6'}>
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {t('feedback.new_feedback', 'Yangi fikr bildirish')}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRu ? 'Заполните форму ниже' : isEn ? 'Fill out the form below' : 'Formani to‘ldirib yuboring'}
                </p>
              </div>
            </div>

            {submitSuccess && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold">{t('feedback.success_msg', 'Fikringiz muvaffaqiyatli yuborildi! Rahmat.')}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    {isRu ? 'Спасибо за помощь в развитии учебного центра!' : isEn ? 'Thank you for helping our learning center improve!' : 'O‘quv markazimiz rivojiga qo‘shgan hissangiz uchun katta rahmat!'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('feedback.rating_label', 'Baho (Yulduzlar)')}:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-2 rounded-xl transition-all cursor-pointer hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-500 ml-2">
                    {rating === 5 && (isRu ? '🌟 Отлично' : isEn ? '🌟 Excellent' : '🌟 A‘lo')}
                    {rating === 4 && (isRu ? '👍 Хорошо' : isEn ? '👍 Good' : '👍 Yaxshi')}
                    {rating === 3 && (isRu ? '👌 Удовлетворительно' : isEn ? '👌 Satisfactory' : '👌 Qoniqarli')}
                    {rating === 2 && (isRu ? '👎 Есть замечания' : isEn ? '👎 Needs improvement' : '👎 Kamchiliklar bor')}
                    {rating === 1 && (isRu ? '⚠️ Плохо' : isEn ? '⚠️ Poor' : '⚠️ Qoniqarsiz')}
                  </span>
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('feedback.target_label', 'Kim/Nima haqida fikr bildirasiz?')}:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Center', label: t('feedback.target_center', 'O‘quv markazi haqida'), icon: Building },
                    { id: 'Teacher', label: t('feedback.target_teacher', 'O‘qituvchi haqida'), icon: GraduationCap },
                    { id: 'Course', label: t('feedback.target_course', 'Kurs va darslar'), icon: BookOpen },
                    { id: 'General', label: t('feedback.target_general', 'Boshqa taklif'), icon: HelpCircle },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id as any)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-[#0050cb] text-[#0050cb] dark:text-blue-300 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teacher select if category is Teacher */}
              {category === 'Teacher' && teachers.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('feedback.select_teacher', 'O‘qituvchini tanlang')}:
                  </label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
                  >
                    <option value="">{isRu ? 'Все преподаватели или не выбрано' : isEn ? 'All teachers or not specified' : 'Barcha o‘qituvchilar yoki tanlanmagan'}</option>
                    {teachers.map((teach) => (
                      <option key={teach.id} value={teach.id}>
                        {teach.fullName} ({teach.specialization || (isRu ? 'Преподаватель' : isEn ? 'Teacher' : 'O‘qituvchi')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Comment Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isRu ? 'Ваш отзыв, предложение или замечание:' : isEn ? 'Your feedback, suggestion or comment:' : 'Fikringiz, taklifingiz yoki shikoyatingiz:'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('feedback.comment_placeholder', 'Taassurotlaringiz, taklif yoki e\'tirozlaringizni batafsil yozing...')}
                  rows={4}
                  required
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="w-full py-3 px-4 bg-[#0050cb] hover:bg-[#003fa4] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? (isRu ? 'Отправка...' : isEn ? 'Submitting...' : 'Yuborilmoqda...') : t('feedback.submit_btn', 'Fikrni yuborish')}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Feedbacks List / History */}
        <div className={isAdmin ? 'lg:col-span-7' : 'lg:col-span-6'}>
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isAdmin
                    ? isRu ? 'Поступившие отзывы' : isEn ? 'Received Feedback' : 'Kelib tushgan fikrlar'
                    : t('feedback.history_title', 'Barcha fikr-mulohazalar')}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRu ? 'Всего:' : isEn ? 'Total:' : 'Jami:'} {filteredFeedbacks.length}
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: isRu ? 'Все' : isEn ? 'All' : 'Barchasi' },
                  { id: 'Center', label: isRu ? 'Центр' : isEn ? 'Center' : 'Markaz' },
                  { id: 'Teacher', label: isRu ? 'Учитель' : isEn ? 'Teacher' : 'O‘qituvchi' },
                  { id: 'Course', label: isRu ? 'Курс' : isEn ? 'Course' : 'Kurs' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setFilterCategory(pill.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      filterCategory === pill.id
                        ? 'bg-[#0050cb] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredFeedbacks.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {t('feedback.no_feedback', 'Hozircha hech qanday fikr bildirilmagan')}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isRu ? 'Оставьте первый отзыв!' : isEn ? 'Be the first to leave feedback!' : 'Birinchi bo‘lib o‘z fikringizni bildiring!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 hover:border-blue-200 dark:hover:border-blue-900 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center font-bold text-xs">
                          {(fb.parentName || fb.studentName || 'O')[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">
                            {fb.parentName || fb.studentName || (isRu ? 'Родитель' : isEn ? 'Parent' : 'Ota-ona')}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(fb.createdAt).toLocaleDateString(isRu ? 'ru-RU' : isEn ? 'en-US' : 'uz-UZ', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < fb.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      "{fb.comment}"
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40 text-[10px]">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300 rounded-md font-semibold">
                        {fb.category === 'Center' && (isRu ? '🏫 Условия центра' : isEn ? '🏫 Center conditions' : '🏫 Markaz sharoitlari')}
                        {fb.category === 'Teacher' && `👨‍🏫 ${fb.teacherName || (isRu ? 'Преподаватель' : isEn ? 'Teacher' : 'O‘qituvchi')}`}
                        {fb.category === 'Course' && (isRu ? '📚 Программа курса' : isEn ? '📚 Course program' : '📚 Kurs dasturi')}
                        {fb.category === 'General' && (isRu ? '💬 Общее' : isEn ? '💬 General' : '💬 Umumiy')}
                      </span>

                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {isRu ? 'Принято' : isEn ? 'Received' : 'Qabul qilindi'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
