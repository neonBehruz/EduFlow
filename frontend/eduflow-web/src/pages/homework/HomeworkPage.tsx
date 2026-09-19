import React, { useEffect, useState } from 'react';
import { homeworkApi, groupApi, fileApi } from '../../services/api';
import { HomeworkDto, HomeworkSubmissionDto, Group } from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { StartupEmptyState } from '../../components/common/StartupEmptyState';
import { useLanguage } from '../../context/LanguageContext';
import {
  FileCheck2,
  Plus,
  Clock,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  Award,
  Trash2,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

export const HomeworkPage: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [homeworkList, setHomeworkList] = useState<HomeworkDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Homework Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');
  const [hwMaxScore, setHwMaxScore] = useState(100);
  const [hwAttachment, setHwAttachment] = useState('');
  const [hwAttachmentName, setHwAttachmentName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Submissions Modal
  const [viewSubmissionsHw, setViewSubmissionsHw] = useState<HomeworkDto | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmissionDto[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading state inside submission
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadHomework(selectedGroupId);
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await groupApi.getAll({ pageSize: 100 });
      if (res.items && res.items.length > 0) {
        setGroups(res.items);
        setSelectedGroupId(res.items[0].id);
      }
    } catch (err) {
      console.error('Groups load error', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHomework = async (groupId: string) => {
    try {
      setLoading(true);
      const res = await homeworkApi.getByGroup(groupId);
      if (res.success && res.data) {
        setHomeworkList(res.data);
      }
    } catch (err) {
      console.error('Homework load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Faqat rasm formatidagi fayllar qabul qilinadi
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
        setHwAttachment(res.fileUrl);
        setHwAttachmentName(res.originalName || file.name);
      }
    } catch (err) {
      console.error('Attachment upload error', err);
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

  const handleRemoveAttachment = () => {
    setHwAttachment('');
    setHwAttachmentName('');
    setUploadError('');
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !hwTitle || !hwDueDate) return;

    try {
      setCreating(true);
      const res = await homeworkApi.create({
        groupId: selectedGroupId,
        title: hwTitle,
        description: hwDesc,
        dueDate: new Date(hwDueDate).toISOString(),
        maxScore: hwMaxScore,
        attachmentUrls: hwAttachment || undefined,
      });

      if (res.success) {
        setCreateOpen(false);
        setHwTitle('');
        setHwDesc('');
        setHwDueDate('');
        setHwAttachment('');
        setHwAttachmentName('');
        setUploadError('');
        loadHomework(selectedGroupId);
      }
    } catch (err) {
      console.error('Create homework error', err);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSubmissions = async (hw: HomeworkDto) => {
    setViewSubmissionsHw(hw);
    try {
      setLoadingSubmissions(true);
      const res = await homeworkApi.getSubmissions(hw.id);
      if (res.success && res.data) {
        setSubmissions(res.data);
      }
    } catch (err) {
      console.error('Load submissions error', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSaveGrade = async (subId: string) => {
    try {
      setSavingGrade(true);
      const res = await homeworkApi.gradeSubmission(subId, {
        score: gradeScore,
        feedback: gradeFeedback,
      });
      if (res.success) {
        setGradingSubId(null);
        if (viewSubmissionsHw) {
          handleOpenSubmissions(viewSubmissionsHw);
        }
      }
    } catch (err) {
      console.error('Save grade error', err);
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Startup Banner */}
      <StartupBanner
        badgeText={t('homework.badge', 'Uy Vazifalari 📚')}
        title={t('homework.title', 'Uy Vazifalari Boshqaruvi')}
        description={t('homework.desc', 'Vazifalar berish, tekshirish, fayl biriktirish va baholash tizimi.')}
        icon={<FileCheck2 className="w-6 h-6" />}
        gradientTheme="purple"
        metrics={[
          { label: t('homework.submissions', 'Topshiriqlar'), value: `${homeworkList.length} ${t('dash.students_unit', 'ta')}` },
          { label: t('table.status', 'Holati'), value: t('status.active', 'Faol') },
        ]}
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('homework.create_btn', 'Yangi vazifa yaratish')}</span>
          </button>
        }
      />

      {/* Group Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroupId(g.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
              selectedGroupId === g.id
                ? 'bg-[#0050cb] border-[#0050cb] text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Homework List */}
      {loading ? (
        <LoadingSpinner text={t('action.loading', 'Vazifalar yuklanmoqda...')} />
      ) : homeworkList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homeworkList.map((hw) => (
            <div
              key={hw.id}
              className="bg-white/90 dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0050cb] dark:text-blue-300">
                    {t('homework.max_score', 'Maks. ball')}: {hw.maxScore}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(hw.dueDate).toLocaleDateString(locale)}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{hw.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {hw.description}
                </p>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <span>{t('homework.submissions', 'Topshirganlar')}: <b className="text-slate-800 dark:text-white">{hw.submissionsCount}</b></span>
                  <span>{t('status.graded', 'Tekshirilgan')}: <b className="text-slate-800 dark:text-white">{hw.gradedCount}</b></span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleOpenSubmissions(hw)}
                  className="px-4 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all cursor-pointer"
                >
                  {t('homework.check_submissions', 'Javoblarni tekshirish')} ({hw.submissionsCount})
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StartupEmptyState
          title={t('homework.no_homework', 'Bu guruh uchun uy vazifalari mavjud emas.')}
          subtitle={language === 'RU' ? 'Создайте первое задание для этой группы.' : language === 'EN' ? 'Create the first assignment for this group.' : 'Ushbu guruh uchun birinchi uy vazifasini yarating.'}
          onCreateClick={() => setCreateOpen(true)}
          createButtonText={t('homework.create_btn', 'Yangi vazifa yaratish')}
          type="groups"
        />
      )}

      {/* Create Homework Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('homework.modal_title', 'Yangi Uy Vazifasi Berish')}>
        <form onSubmit={handleCreateHomework} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('table.group', 'Guruh')}
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('homework.task_title', 'Vazifa mavzusi / sarlavhasi')}
            </label>
            <input
              type="text"
              value={hwTitle}
              onChange={(e) => setHwTitle(e.target.value)}
              placeholder="Masalan: Present Perfect mashqlari"
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('homework.task_desc', 'Vazifa tavsifi')}
            </label>
            <textarea
              value={hwDesc}
              onChange={(e) => setHwDesc(e.target.value)}
              placeholder="Talablar, kitobdagi betlar yoki shartlarni yozing..."
              rows={4}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('homework.deadline', 'Topshirish muddati')}
            </label>
            <input
              type="datetime-local"
              value={hwDueDate}
              onChange={(e) => setHwDueDate(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'RU' ? 'Прикрепить изображение (только фото)' : language === 'EN' ? 'Attach Image (photos only)' : 'Rasm biriktirish (faqat rasmli fayllar)'}
            </label>

            {!hwAttachment ? (
              <div>
                <label className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0050cb] dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 transition-all group">
                  <UploadCloud className="w-5 h-5 text-[#0050cb] group-hover:scale-110 transition-transform" />
                  <span>
                    {uploading
                      ? (language === 'RU' ? 'Загрузка...' : language === 'EN' ? 'Uploading...' : 'Rasm yuklanmoqda...')
                      : (language === 'RU' ? 'Выбрать фото (PNG, JPG, WEBP)' : language === 'EN' ? 'Choose image (PNG, JPG, WEBP)' : 'Rasm tanlash (PNG, JPG, WEBP)')}
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
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300/80 dark:border-slate-600 shrink-0 flex items-center justify-center">
                    <img
                      src={hwAttachment}
                      alt="Attachment Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {hwAttachmentName || (language === 'RU' ? 'Прикрепленное изображение' : language === 'EN' ? 'Attached Image' : 'Biriktirilgan rasm')}
                    </p>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {language === 'RU' ? 'Изображение прикреплено' : language === 'EN' ? 'Image attached' : 'Rasm biriktirildi'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Change / Replace Button */}
                  <label
                    title={language === 'RU' ? 'Заменить изображение' : language === 'EN' ? 'Change image' : 'Rasmni o‘zgartirish'}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#0050cb] ${uploading ? 'animate-spin' : ''}`} />
                    <span>{language === 'RU' ? 'Изменить' : language === 'EN' ? 'Change' : 'O‘zgartirish'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  {/* Delete / Remove Button */}
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    title={language === 'RU' ? 'Удалить изображение' : language === 'EN' ? 'Remove image' : 'Rasmni o‘chirish'}
                    className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'RU' ? 'Удалить' : language === 'EN' ? 'Delete' : 'O‘chirish'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t('action.cancel', 'Bekor qilish')}
            </button>
            <button
              type="submit"
              disabled={creating || uploading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer disabled:opacity-50"
            >
              {creating ? t('action.loading', 'Yaratilmoqda...') : t('homework.create_btn', 'Vazifani e’lon qilish')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submissions Review Modal */}
      <Modal
        isOpen={!!viewSubmissionsHw}
        onClose={() => setViewSubmissionsHw(null)}
        title={viewSubmissionsHw ? `${t('homework.submissions', 'Vazifa javoblari')}: ${viewSubmissionsHw.title}` : t('homework.submissions', 'Javoblar')}
        maxWidth="max-w-3xl"
      >
        {loadingSubmissions ? (
          <LoadingSpinner text={t('action.loading', 'Javoblar yuklanmoqda...')} />
        ) : submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      {sub.studentName}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {t('status.submitted', 'Topshirildi')}: {new Date(sub.submittedAt).toLocaleString(locale)}
                    </p>
                  </div>
                  <Badge variant={sub.status === 4 ? 'success' : 'warning'}>
                    {sub.status === 4 ? `${t('status.graded', 'Baholandi')}: ${sub.score} ball` : t('status.pending', 'Kutilmoqda')}
                  </Badge>
                </div>

                {sub.content && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {sub.content}
                  </div>
                )}

                {sub.attachmentUrls && (
                  <a
                    href={sub.attachmentUrls}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#0050cb] hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('homework.attached_file', 'Biriktirilgan faylni ko‘rish')}
                  </a>
                )}

                {/* Grading Action */}
                {gradingSubId === sub.id ? (
                  <div className="mt-3 p-3 rounded-xl bg-blue-50/60 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('grades.score', 'Baho')} ({t('homework.max_score', 'maks')}: {viewSubmissionsHw?.maxScore})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={viewSubmissionsHw?.maxScore || 100}
                          value={gradeScore}
                          onChange={(e) => setGradeScore(Number(e.target.value))}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('homework.feedback', 'Izoh / Sharh')}
                        </label>
                        <input
                          type="text"
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                          placeholder="A'lo natija! / Xatolar bor..."
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setGradingSubId(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        {t('action.cancel', 'Bekor qilish')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveGrade(sub.id)}
                        disabled={savingGrade}
                        className="px-4 py-1.5 text-xs font-bold bg-[#0050cb] text-white rounded-lg hover:bg-[#003fa4] cursor-pointer"
                      >
                        {savingGrade ? t('action.loading', 'Saqlanmoqda...') : t('homework.save_grade', 'Bahoni saqlash')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setGradingSubId(sub.id);
                        setGradeScore(sub.score || 100);
                        setGradeFeedback(sub.feedback || '');
                      }}
                      className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      {sub.status === 4 ? t('action.edit', 'Bahoni o‘zgartirish') : t('homework.grade_submission', 'Baholash')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {t('homework.no_homework', 'Ushbu vazifaga hali hech kim javob topshirmagan.')}
          </div>
        )}
      </Modal>
    </div>
  );
};
