import React, { useEffect, useState, useMemo } from 'react';
import { studentPortalApi, fileApi } from '../../services/api';
import { HomeworkDto } from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { useLanguage } from '../../context/LanguageContext';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  UploadCloud,
  AlertCircle,
  Award,
  Filter,
  CheckCircle,
  Hourglass,
  Calendar,
  Layers,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';

export const StudentHomeworkPage: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';

  const [homeworkList, setHomeworkList] = useState<HomeworkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'submitted' | 'reviewed'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Submit Homework modal
  const [selectedHw, setSelectedHw] = useState<HomeworkDto | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadHomework();
  }, []);

  const loadHomework = async () => {
    try {
      setLoading(true);
      const res = await studentPortalApi.getMyHomework();
      if (res.success && res.data) {
        setHomeworkList(res.data);
      }
    } catch (err) {
      console.error('Failed to load homework', err);
    } finally {
      setLoading(false);
    }
  };

  // Distinct groups for filtering
  const groups = useMemo(() => {
    const map = new Map<string, string>();
    homeworkList.forEach((h) => {
      if (h.groupId && h.groupName) {
        map.set(h.groupId, h.groupName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [homeworkList]);

  // Statistics
  const stats = useMemo(() => {
    const total = homeworkList.length;
    const reviewed = homeworkList.filter((h) => h.userSubmission?.status === 4).length;
    const submitted = homeworkList.filter((h) => h.userSubmission && h.userSubmission.status !== 4).length;
    const pending = homeworkList.filter((h) => !h.userSubmission).length;
    return { total, reviewed, submitted, pending };
  }, [homeworkList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return homeworkList.filter((h) => {
      // Group filter
      if (selectedGroup !== 'all' && h.groupId !== selectedGroup) return false;

      // Status filter
      const sub = h.userSubmission;
      if (activeFilter === 'pending') return !sub;
      if (activeFilter === 'submitted') return sub && sub.status !== 4;
      if (activeFilter === 'reviewed') return sub && sub.status === 4;
      return true;
    });
  }, [homeworkList, activeFilter, selectedGroup]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(
        language === 'RU'
          ? 'Разрешены только изображения (PNG, JPG, JPEG, WEBP, GIF).'
          : language === 'EN'
          ? 'Only image files are allowed (PNG, JPG, JPEG, WEBP, GIF).'
          : 'Faqat rasm formatidagi fayllar qabul qilinadi (PNG, JPG, JPEG, WEBP, GIF).'
      );
      e.target.value = '';
      return;
    }

    setUploadError('');
    try {
      setUploading(true);
      const res = await fileApi.upload(file);
      if (res && res.fileUrl) {
        setFileUrl(res.fileUrl);
        setFileName(res.originalName || file.name);
      }
    } catch (err) {
      console.error('File upload failed', err);
      setUploadError(
        language === 'RU'
          ? 'Ошибка при загрузке изображения.'
          : language === 'EN'
          ? 'Error uploading image.'
          : 'Rasmni yuklashda xatolik yuz berdi.'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveFile = () => {
    setFileUrl('');
    setFileName('');
    setUploadError('');
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHw) return;

    try {
      setSubmitting(true);
      const res = await studentPortalApi.submitHomework(selectedHw.id, {
        content: submissionText,
        attachmentUrls: fileUrl || undefined,
      });

      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setSelectedHw(null);
          setSubmissionText('');
          setFileUrl('');
          setFileName('');
          setUploadError('');
          loadHomework();
        }, 1200);
      }
    } catch (err) {
      console.error('Submit homework error', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text={language === 'RU' ? 'Загрузка домашних заданий...' : language === 'EN' ? 'Loading homework assignments...' : 'Uy vazifalari yuklanmoqda...'} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <StartupBanner
        badgeText={language === 'RU' ? 'Домашние Задания 📝' : language === 'EN' ? 'Homework Assignments 📝' : 'O‘quvchi Uy Vazifalari 📝'}
        title={language === 'RU' ? 'Мои Домашние Задания' : language === 'EN' ? 'My Homework Assignments' : 'Mening Uy Vazifalarim'}
        description={
          language === 'RU'
            ? 'Просматривайте все выданные задания, прикрепляйте решения и отслеживайте оценки преподавателей.'
            : language === 'EN'
            ? 'View all assigned homework, attach solution photos, and monitor teacher evaluations.'
            : 'O‘qituvchilar tomonidan berilgan barcha topshiriqlarni ko‘ring, yechimlarni yuboring va baholarni kuzatib boring.'
        }
        icon={<FileCheck2 className="w-6 h-6" />}
        gradientTheme="blue"
        metrics={[
          {
            label: language === 'RU' ? 'Всего заданий' : language === 'EN' ? 'Total Tasks' : 'Jami vazifalar',
            value: stats.total,
          },
          {
            label: language === 'RU' ? 'Ожидают решения' : language === 'EN' ? 'Pending' : 'Kutilmoqda',
            value: stats.pending,
          },
          {
            label: language === 'RU' ? 'Проверено' : language === 'EN' ? 'Graded' : 'Baholandi',
            value: stats.reviewed,
          },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {[
            { id: 'all', label: language === 'RU' ? 'Все' : language === 'EN' ? 'All' : 'Barchasi', count: stats.total },
            { id: 'pending', label: language === 'RU' ? 'К сдаче' : language === 'EN' ? 'Pending' : 'Topshirish kerak', count: stats.pending },
            { id: 'submitted', label: language === 'RU' ? 'На проверке' : language === 'EN' ? 'Submitted' : 'Topshirilgan', count: stats.submitted },
            { id: 'reviewed', label: language === 'RU' ? 'Оцененные' : language === 'EN' ? 'Graded' : 'Baholanganlar', count: stats.reviewed },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === pill.id
                  ? 'bg-[#0050cb] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeFilter === pill.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        {/* Group Selector */}
        {groups.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 focus:outline-none"
            >
              <option value="all">{language === 'RU' ? 'Все группы' : language === 'EN' ? 'All Groups' : 'Barcha guruhlar'}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Homework Cards Grid */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((hw) => {
            const submission = hw.userSubmission;
            const isReviewed = submission?.status === 4;
            const isSubmitted = !!submission;
            const isOverdue = !isSubmitted && new Date(hw.dueDate) < new Date();

            return (
              <div
                key={hw.id}
                className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all group"
              >
                <div>
                  {/* Header badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-100/80 dark:bg-blue-900/50 text-[#0050cb] dark:text-blue-300 flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      {hw.groupName}
                    </span>

                    {isReviewed ? (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                        <Award className="w-3.5 h-3.5" />
                        {language === 'RU' ? 'Оценка' : language === 'EN' ? 'Grade' : 'Baho'}: {submission.score} ball
                      </span>
                    ) : isSubmitted ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {language === 'RU' ? 'Сдано' : language === 'EN' ? 'Submitted' : 'Topshirilgan'}
                      </span>
                    ) : isOverdue ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {language === 'RU' ? 'Просрочено' : language === 'EN' ? 'Overdue' : 'Muddati o‘tgan'}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Hourglass className="w-3.5 h-3.5" />
                        {language === 'RU' ? 'К сдаче' : language === 'EN' ? 'Pending' : 'Kutilmoqda'}
                      </span>
                    )}
                  </div>

                  {/* Title & Teacher */}
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                    {hw.title}
                  </h3>
                  {hw.teacherName && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {language === 'RU' ? 'Преподаватель' : language === 'EN' ? 'Teacher' : 'O‘qituvchi'}: {hw.teacherName}
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {hw.description}
                  </p>

                  {/* Due date */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {language === 'RU' ? 'Срок сдачи' : language === 'EN' ? 'Due date' : 'Topshirish muddati'}:{' '}
                      <strong className="text-slate-800 dark:text-white">{new Date(hw.dueDate).toLocaleDateString(locale)}</strong>
                    </span>
                  </div>

                  {/* Submitted solution details if any */}
                  {submission && (
                    <div className="mt-3.5 p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                        {language === 'RU' ? 'Ваш ответ' : language === 'EN' ? 'Your Solution' : 'Yuborilgan javobingiz'}:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 italic mb-2">"{submission.content}"</p>

                      {submission.attachmentUrls && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600">
                            <img
                              src={submission.attachmentUrls}
                              alt="Attachment"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            {language === 'RU' ? 'Прикрепленное фото' : language === 'EN' ? 'Attached Photo' : 'Biriktirilgan rasm'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher Feedback Box if graded */}
                  {submission?.feedback && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {language === 'RU' ? 'Комментарий преподавателя' : language === 'EN' ? 'Teacher Feedback' : 'O‘qituvchi sharhi'}:
                      </span>
                      <p className="text-emerald-700 dark:text-emerald-400 italic">"{submission.feedback}"</p>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Max: {hw.maxScore || 100} ball
                  </span>
                  <button
                    onClick={() => {
                      setSelectedHw(hw);
                      setSubmissionText(submission?.content || '');
                      setFileUrl(submission?.attachmentUrls || '');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSubmitted
                        ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        : 'bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white'
                    }`}
                  >
                    {isSubmitted ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{language === 'RU' ? 'Пересдать / Изменить' : language === 'EN' ? 'Resubmit / Edit' : 'Qayta topshirish / Tahrirlash'}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{language === 'RU' ? 'Сдать задание' : language === 'EN' ? 'Submit Assignment' : 'Vazifani topshirish'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={language === 'RU' ? 'Задания не найдены' : language === 'EN' ? 'No Homework Found' : 'Vazifalar topilmadi'}
          description={
            language === 'RU'
              ? 'В выбранной категории пока нет домашних заданий.'
              : language === 'EN'
              ? 'No homework assignments found in the selected filter.'
              : 'Tanlangan filtr bo‘yicha hozircha uy vazifalari mavjud emas.'
          }
        />
      )}

      {/* Homework Submission Modal */}
      <Modal
        isOpen={!!selectedHw}
        onClose={() => setSelectedHw(null)}
        title={
          selectedHw
            ? `${language === 'RU' ? 'Сдать задание' : language === 'EN' ? 'Submit Homework' : 'Vazifani topshirish'}: ${selectedHw.title}`
            : language === 'RU' ? 'Сдать задание' : language === 'EN' ? 'Submit Homework' : 'Vazifani topshirish'
        }
      >
        {submitSuccess ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-bounce" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'RU' ? 'Успешно отправлено!' : language === 'EN' ? 'Successfully Submitted!' : 'Muvaffaqiyatli yuborildi!'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'RU'
                ? 'Ваше решение отправлено преподавателю на проверку.'
                : language === 'EN'
                ? 'Your solution has been sent to the teacher for evaluation.'
                : 'Vazifangiz o‘qituvchiga tekshirish uchun yuborildi.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitHomework} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'RU' ? 'Текст решения или комментарий' : language === 'EN' ? 'Solution Text or Comment' : 'Vazifa javobi yoki sharhingiz'}
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder={
                  language === 'RU'
                    ? 'Напишите текст решения, ссылку или пояснение здесь...'
                    : language === 'EN'
                    ? 'Write your solution text, link, or explanation here...'
                    : 'Yechim yoki insho matnini bu yerga yozing...'
                }
                rows={5}
                required
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'RU'
                  ? 'Прикрепить изображение решения (только фото)'
                  : language === 'EN'
                  ? 'Attach Solution Image (photos only)'
                  : 'Yechim rasmini biriktirish (faqat rasmli fayllar)'}
              </label>

              {!fileUrl ? (
                <div>
                  <label className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0050cb] dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 transition-all">
                    <UploadCloud className="w-5 h-5 text-[#0050cb]" />
                    <span>
                      {uploading
                        ? language === 'RU' ? 'Загрузка...' : language === 'EN' ? 'Uploading...' : 'Rasm yuklanmoqda...'
                        : language === 'RU' ? 'Выбрать фото (PNG, JPG, WEBP)' : language === 'EN' ? 'Choose image (PNG, JPG, WEBP)' : 'Rasm tanlash (PNG, JPG, WEBP)'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {uploadError && (
                    <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {uploadError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300/80 dark:border-slate-600 shrink-0 flex items-center justify-center">
                      <img
                        src={fileUrl}
                        alt="Solution preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {fileName || (language === 'RU' ? 'Прикрепленное изображение' : language === 'EN' ? 'Attached Image' : 'Biriktirilgan rasm')}
                      </p>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {language === 'RU' ? 'Изображение прикреплено' : language === 'EN' ? 'Image attached' : 'Rasm biriktirildi'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label
                      title={language === 'RU' ? 'Заменить' : language === 'EN' ? 'Change' : 'O‘zgartirish'}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <span>{language === 'RU' ? 'Заменить' : language === 'EN' ? 'Change' : 'O‘zgartirish'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      title={language === 'RU' ? 'Удалить' : language === 'EN' ? 'Delete' : 'O‘chirish'}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>{language === 'RU' ? 'Удалить' : language === 'EN' ? 'Delete' : 'O‘chirish'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedHw(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {language === 'RU' ? 'Отмена' : language === 'EN' ? 'Cancel' : 'Bekor qilish'}
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? language === 'RU' ? 'Отправка...' : language === 'EN' ? 'Submitting...' : 'Yuborilmoqda...'
                  : language === 'RU' ? 'Отправить решение' : language === 'EN' ? 'Submit Solution' : 'Yechimni yuborish'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
