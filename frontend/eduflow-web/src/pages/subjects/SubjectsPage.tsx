import React, { useEffect, useState } from 'react';
import { subjectApi } from '../../services/api';
import { Subject } from '../../types';
import { Modal, ConfirmModal, LoadingSpinner, EmptyState, Badge } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { useLanguage } from '../../context/LanguageContext';
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Clock,
  Banknote,
  Search,
  UsersRound,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Form State matching Course: Name, Description, Price, DurationWeeks, Status
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    durationWeeks: 12,
    isActive: true,
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await subjectApi.getAll();
      setSubjects(res || []);
    } catch (err) {
      console.error('Subjects fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleOpenCreate = () => {
    setSelectedSubject(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      durationWeeks: 12,
      isActive: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setSelectedSubject(sub);
    setFormData({
      name: sub.name,
      description: sub.description || '',
      price: sub.price || 0,
      durationWeeks: sub.durationWeeks || 12,
      isActive: sub.isActive ?? true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Kurs/Fan nomini kiriting.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: Number(formData.price) || 0,
        durationWeeks: Number(formData.durationWeeks) || 12,
        isActive: formData.isActive,
      };

      if (selectedSubject) {
        await subjectApi.update(selectedSubject.id, payload);
      } else {
        await subjectApi.create(payload);
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Kurs ma‘lumotlarini saqlashda xatolik.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;
    try {
      await subjectApi.delete(selectedSubject.id);
      setIsDeleteOpen(false);
      fetchSubjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Kursni o‘chirishda xatolik.');
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <StartupBanner
        badgeText={language === 'RU' ? 'Курсы и Предметы 📚' : language === 'EN' ? 'Courses & Subjects 📚' : 'Kurslar va Fanlar 📚'}
        title={language === 'RU' ? 'Центр Учебных Курсов' : language === 'EN' ? 'Academic Courses Hub' : 'O‘quv Kurslari va Fanlar'}
        description={language === 'RU' ? 'Все курсы, программы обучения, стоимость и продолжительность.' : language === 'EN' ? 'All courses, training curriculum, pricing, and duration.' : 'O‘quv markazida o‘qitiladigan barcha kurslar, oylik to‘lovlar, davomiylik va faol guruhlar.'}
        icon={<BookOpen className="w-6 h-6" />}
        gradientTheme="purple"
        metrics={[
          { label: 'Jami Kurslar', value: `${subjects.length} ta` },
          { label: 'Faol Kurslar', value: `${subjects.filter(s => s.isActive ?? true).length} ta` },
        ]}
        actions={
          <button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Kurs Qo‘shish</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Kurs nomi yoki tavsifi bo‘yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none text-sm focus:outline-none dark:text-white placeholder-slate-400"
        />
      </div>

      {loading ? (
        <LoadingSpinner text={t('action.loading', 'Kurslar yuklanmoqda...')} />
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          title="Kurslar topilmadi"
          description={search ? "Qidiruvga mos kurs mavjud emas." : "Hozircha kurslar kiritilmagan. Yangi kurs qo‘shish orqali boshlang."}
          actionText="Yangi Kurs Qo‘shish"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-800 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {sub.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <UsersRound className="w-3.5 h-3.5" />
                        <span>{sub.groupsCount || 0} ta guruh</span>
                      </div>
                    </div>
                  </div>

                  {(sub.isActive ?? true) ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Faol
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                      <XCircle className="w-3 h-3" />
                      Nofaol
                    </span>
                  )}
                </div>

                {sub.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                    {sub.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 mb-4 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                    <div className="text-slate-400 flex items-center gap-1 mb-1">
                      <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Oylik Narxi</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {sub.price ? `${sub.price.toLocaleString()} so‘m` : 'Ko‘rsatilmagan'}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                    <div className="text-slate-400 flex items-center gap-1 mb-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Davomiyligi</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {sub.durationWeeks ? `${sub.durationWeeks} hafta` : '12 hafta'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  onClick={() => handleOpenEdit(sub)}
                  className="px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Tahrirlash</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedSubject(sub);
                    setIsDeleteOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>O‘chirish</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSubject ? "Kursni Tahrirlash" : "Yangi Kurs Qo‘shish"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kurs Nomi *
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Frontend Dasturlash (React)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kurs Tavsifi
            </label>
            <textarea
              rows={3}
              placeholder="Kurs haqida qisqacha ma'lumot, o'quv dasturi rejalari..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Oylik Narxi (so‘m)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                placeholder="500000"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Davomiyligi (hafta)
              </label>
              <input
                type="number"
                min="1"
                max="104"
                placeholder="12"
                value={formData.durationWeeks || ''}
                onChange={(e) => setFormData({ ...formData, durationWeeks: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kurs Holati
            </label>
            <select
              value={String(formData.isActive)}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            >
              <option value="true">Faol (Guruhlar ochish mumkin)</option>
              <option value="false">Nofaol (Vaqtinchalik to‘xtatilgan)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Kursni O‘chirish"
        message={`Haqiqatan ham "${selectedSubject?.name}" kursini o‘chirmoqchimisiz? Agar unga guruhlar biriktirilgan bo‘lsa, o‘chirish mumkin bo‘lmasligi mumkin.`}
      />
    </div>
  );
};
