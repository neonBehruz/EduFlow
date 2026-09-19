import React, { useEffect, useState } from 'react';
import { crmApi, subjectApi, groupApi, teacherApi, roomApi } from '../../services/api';
import {
  LeadDto,
  CreateLeadDto,
  Subject,
  Group,
  Teacher,
  RoomDto,
  ScheduleTrialLessonDto,
  EnrollLeadDto,
} from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import {
  Layers,
  Plus,
  Phone,
  Calendar,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  MoreVertical,
  UserPlus,
} from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 1, title: 'Yangi Lidlar', color: 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20' },
  { id: 2, title: 'Bog‘lanildi', color: 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20' },
  { id: 3, title: 'Sinov darsida', color: 'border-purple-500 bg-purple-50/30 dark:bg-purple-950/20' },
  { id: 4, title: 'Qiziqmoqda', color: 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20' },
  { id: 5, title: 'O‘quvchi bo‘ldi', color: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' },
  { id: 6, title: 'Yo‘qotildi', color: 'border-slate-400 bg-slate-50/30 dark:bg-slate-900/20' },
];

export const CrmPage: React.FC = () => {
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Lead Modal
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [interestedSubjectId, setInterestedSubjectId] = useState('');
  const [source, setSource] = useState(1);
  const [notes, setNotes] = useState('');
  const [savingLead, setSavingLead] = useState(false);

  // Schedule Trial Lesson Modal
  const [trialModalLead, setTrialModalLead] = useState<LeadDto | null>(null);
  const [trialDate, setTrialDate] = useState('');
  const [trialStartTime, setTrialStartTime] = useState('10:00');
  const [trialEndTime, setTrialEndTime] = useState('11:30');
  const [trialTeacherId, setTrialTeacherId] = useState('');
  const [trialRoomId, setTrialRoomId] = useState('');
  const [savingTrial, setSavingTrial] = useState(false);

  // Convert to Student Modal
  const [enrollModalLead, setEnrollModalLead] = useState<LeadDto | null>(null);
  const [enrollGroupId, setEnrollGroupId] = useState('');
  const [firstPaymentAmount, setFirstPaymentAmount] = useState(450000);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lRes, sRes, gRes, tRes, rRes] = await Promise.all([
        crmApi.getLeads(),
        subjectApi.getAll(),
        groupApi.getAll({ pageSize: 100 }),
        teacherApi.getAll({ pageSize: 100 }),
        roomApi.getAll(),
      ]);

      if (lRes.success && lRes.data) setLeads(lRes.data);
      if (Array.isArray(sRes)) setSubjects(sRes);
      if (gRes.items) setGroups(gRes.items);
      if (tRes.items) setTeachers(tRes.items);
      if (rRes.success && rRes.data) setRooms(rRes.data);
    } catch (err) {
      console.error('CRM load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) return;

    try {
      setSavingLead(true);
      const payload: CreateLeadDto = {
        fullName,
        phoneNumber,
        interestedSubjectId: interestedSubjectId || undefined,
        source,
        notes,
      };
      await crmApi.createLead(payload);
      setAddLeadOpen(false);
      setFullName('');
      setPhoneNumber('');
      setNotes('');
      loadData();
    } catch (err) {
      console.error('Create lead error', err);
    } finally {
      setSavingLead(false);
    }
  };

  const handleMoveStage = async (leadId: string, newStatus: number) => {
    try {
      await crmApi.updateLeadStatus(leadId, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (err) {
      console.error('Update status error', err);
    }
  };

  const handleScheduleTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialModalLead || !trialDate) return;

    try {
      setSavingTrial(true);
      const payload: ScheduleTrialLessonDto = {
        leadId: trialModalLead.id,
        subjectId: trialModalLead.interestedSubjectId,
        teacherId: trialTeacherId || undefined,
        roomId: trialRoomId || undefined,
        scheduledDate: new Date(trialDate).toISOString(),
        startTime: trialStartTime + ':00',
        endTime: trialEndTime + ':00',
      };
      await crmApi.scheduleTrialLesson(payload);
      setTrialModalLead(null);
      loadData();
    } catch (err) {
      console.error('Schedule trial error', err);
    } finally {
      setSavingTrial(false);
    }
  };

  const handleEnrollLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollModalLead || !enrollGroupId) return;

    try {
      setEnrolling(true);
      const payload: EnrollLeadDto = {
        groupId: enrollGroupId,
        firstPaymentAmount,
        paymentMethod: 1, // Cash default or configured
      };
      await crmApi.enrollLead(enrollModalLead.id, payload);
      setEnrollModalLead(null);
      loadData();
    } catch (err) {
      console.error('Enroll lead error', err);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              CRM & Lidlar Quvuri
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Murojaatlar, sinov darslari va o‘quvchiga aylantirish
            </p>
          </div>
        </div>

        <button
          onClick={() => setAddLeadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Lid qo‘shish</span>
        </button>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <LoadingSpinner text="CRM quvuri yuklanmoqda..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.id);
            return (
              <div
                key={stage.id}
                className="flex flex-col rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3 min-w-[240px] max-h-[78vh] backdrop-blur-md"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {stage.title}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:shadow-md transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {lead.fullName}
                        </h4>
                        {lead.status === 5 && (
                          <span title="O'quvchi bo'ldi">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {lead.phoneNumber}
                      </p>

                      {lead.interestedSubjectName && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] dark:text-blue-300">
                          {lead.interestedSubjectName}
                        </span>
                      )}

                      {lead.notes && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-2">
                          "{lead.notes}"
                        </p>
                      )}

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1">
                        {lead.status !== 3 && lead.status < 5 && (
                          <button
                            onClick={() => {
                              setTrialModalLead(lead);
                              setTrialDate(new Date().toISOString().split('T')[0]);
                            }}
                            title="Sinov darsiga yozish"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Calendar className="w-3 h-3" />
                            Sinov
                          </button>
                        )}

                        {lead.status < 5 && (
                          <button
                            onClick={() => {
                              setEnrollModalLead(lead);
                              if (groups.length > 0) setEnrollGroupId(groups[0].id);
                            }}
                            title="O'quvchiga aylantirish"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <UserPlus className="w-3 h-3" />
                            Qabul
                          </button>
                        )}

                        {/* Move stage dropdown / button */}
                        {lead.status < 6 && (
                          <button
                            onClick={() => handleMoveStage(lead.id, lead.status + 1)}
                            title="Keyingi bosqichga o'tkazish"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0050cb] hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="p-4 text-center text-[11px] text-slate-400">
                      Lidlar yo'q
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal isOpen={addLeadOpen} onClose={() => setAddLeadOpen(false)} title="Yangi Lid Qo‘shish">
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              F.I.Sh (Mijoz ismi)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masalan: Sardor Aliyev"
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Telefon raqami
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+998901234567"
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Qiziqqan fani / kursi
              </label>
              <select
                value={interestedSubjectId}
                onChange={(e) => setInterestedSubjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="">Tanlang (ixtiyoriy)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Murojaat manbai
              </label>
              <select
                value={source}
                onChange={(e) => setSource(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value={1}>Instagram</option>
                <option value={2}>Telegram</option>
                <option value={3}>Veb-sayt</option>
                <option value={4}>Tavsiya (Referral)</option>
                <option value={5}>Markazga kelgan</option>
                <option value={6}>Boshqa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Izoh / Eslatma
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qachon qo'ng'iroq qilish kerak, istaklari..."
              rows={3}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddLeadOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={savingLead}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
            >
              {savingLead ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Trial Lesson Modal */}
      <Modal
        isOpen={!!trialModalLead}
        onClose={() => setTrialModalLead(null)}
        title={trialModalLead ? `Sinov darsini rejalashtirish: ${trialModalLead.fullName}` : 'Sinov darsi'}
      >
        <form onSubmit={handleScheduleTrial} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Sana
            </label>
            <input
              type="date"
              value={trialDate}
              onChange={(e) => setTrialDate(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Boshlanish vaqti
              </label>
              <input
                type="time"
                value={trialStartTime}
                onChange={(e) => setTrialStartTime(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tugash vaqti
              </label>
              <input
                type="time"
                value={trialEndTime}
                onChange={(e) => setTrialEndTime(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              O'qituvchi
            </label>
            <select
              value={trialTeacherId}
              onChange={(e) => setTrialTeacherId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="">O'qituvchini tanlang</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Xona
            </label>
            <select
              value={trialRoomId}
              onChange={(e) => setTrialRoomId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="">Xonani tanlang</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.number})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTrialModalLead(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={savingTrial}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
            >
              {savingTrial ? 'Saqlanmoqda...' : 'Belgilash'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert to Student 1-Click Modal */}
      <Modal
        isOpen={!!enrollModalLead}
        onClose={() => setEnrollModalLead(null)}
        title={enrollModalLead ? `O‘quvchiga aylantirish: ${enrollModalLead.fullName}` : 'Qabul'}
      >
        <form onSubmit={handleEnrollLead} className="space-y-4">
          <p className="text-xs text-slate-500">
            Lid avtomatik ravishda asosiy o‘quvchilar bazasiga qo‘shiladi, guruhga biriktiriladi va to‘lov hisob-kitobi shakllanadi.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Biriktiriladigan Guruh
            </label>
            <select
              value={enrollGroupId}
              onChange={(e) => setEnrollGroupId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.monthlyFee.toLocaleString()} so'm)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Dastlabki to‘lov summasi (so‘m)
            </label>
            <input
              type="number"
              value={firstPaymentAmount}
              onChange={(e) => setFirstPaymentAmount(Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEnrollModalLead(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={enrolling}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
            >
              {enrolling ? 'Rasmiylashtirilmoqda...' : 'O‘quvchiga aylantirish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
