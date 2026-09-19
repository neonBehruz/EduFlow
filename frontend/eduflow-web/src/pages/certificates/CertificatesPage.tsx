import React, { useEffect, useState } from 'react';
import { certificateApi, studentApi, groupApi, subjectApi } from '../../services/api';
import { CertificateDto, Student, Group, Subject, IssueCertificateDto } from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import {
  Award,
  Plus,
  QrCode,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateDto[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue Modal
  const [issueOpen, setIssueOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [levelName, setLevelName] = useState('Boshlang‘ich (A1)');
  const [finalGrade, setFinalGrade] = useState<number>(90);
  const [groupId, setGroupId] = useState('');
  const [issuing, setIssuing] = useState(false);

  // QR Preview Modal
  const [previewCert, setPreviewCert] = useState<CertificateDto | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, sRes, gRes] = await Promise.all([
        certificateApi.getAll(),
        studentApi.getAll({ pageSize: 100 }),
        groupApi.getAll({ pageSize: 100 }),
      ]);

      if (cRes.success && cRes.data) setCertificates(cRes.data);
      if (sRes.items) setStudents(sRes.items);
      if (gRes.items) setGroups(gRes.items);
    } catch (err) {
      console.error('Certificates load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !courseName.trim()) return;

    try {
      setIssuing(true);
      const payload: IssueCertificateDto = {
        studentId: selectedStudentId,
        groupId: groupId || undefined,
        courseName,
        levelName,
        finalGrade,
      };

      await certificateApi.issue(payload);
      setIssueOpen(false);
      setSelectedStudentId('');
      setCourseName('');
      loadData();
    } catch (err) {
      console.error('Issue certificate error', err);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sertifikatlar Boshqaruvi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              QR-kodli onlayn tekshiriluvchi bitiruv sertifikatlari
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (students.length > 0) setSelectedStudentId(students[0].id);
            setIssueOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Sertifikat topshirish</span>
        </button>
      </div>

      {/* Certificates Grid */}
      {loading ? (
        <LoadingSpinner text="Sertifikatlar yuklanmoqda..." />
      ) : certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/5 via-white dark:via-slate-900 to-amber-500/10 border border-amber-200/80 dark:border-amber-900/50 shadow-xs backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    № {cert.certificateNumber}
                  </span>
                  <button
                    onClick={() => setPreviewCert(cert)}
                    title="QR kodni ko'rish"
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {cert.studentName}
                </h4>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {cert.courseName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Daraja: {cert.levelName}
                </p>

                {cert.finalGrade && (
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-2">
                    Yakuniy natija: <span className="text-emerald-600">{cert.finalGrade} ball</span>
                  </p>
                )}

                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Berilgan sana: {new Date(cert.issueDate).toLocaleDateString('uz-UZ')}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-amber-200/60 dark:border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 truncate">
                  Kod: {cert.verificationCode}
                </span>
                <a
                  href={`/verify/${cert.verificationCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-[#0050cb] dark:text-blue-400 hover:underline"
                >
                  <span>Tekshirish havolasi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sertifikatlar mavjud emas"
          description="Hozircha hech bir o'quvchiga sertifikat topshirilmagan."
          actionText="Birinchi sertifikatni berish"
          onAction={() => {
            if (students.length > 0) setSelectedStudentId(students[0].id);
            setIssueOpen(true);
          }}
        />
      )}

      {/* Issue Certificate Modal */}
      <Modal isOpen={issueOpen} onClose={() => setIssueOpen(false)} title="Yangi Sertifikat Topshirish">
        <form onSubmit={handleIssueCertificate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              O‘quvchi
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kurs / Yo'nalish nomi
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Masalan: IELTS Intensive, Frontend Dasturlash"
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Daraja
              </label>
              <select
                value={levelName}
                onChange={(e) => setLevelName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="Boshlang‘ich (A1/A2)">Boshlang‘ich (A1/A2)</option>
                <option value="O‘rta (B1/B2)">O‘rta (B1/B2)</option>
                <option value="Yuqori (C1/C2)">Yuqori (C1/C2)</option>
                <option value="Professional">Professional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Yakuniy baho (ball)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={finalGrade}
                onChange={(e) => setFinalGrade(Number(e.target.value))}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Guruh (ixtiyoriy)
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="">Tanlang</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIssueOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={issuing}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer"
            >
              {issuing ? 'Rasmiylashtirilmoqda...' : 'Sertifikatni berish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Preview Modal */}
      <Modal
        isOpen={!!previewCert}
        onClose={() => setPreviewCert(null)}
        title="QR Kod & Sertifikat Ma'lumotlari"
        maxWidth="max-w-sm"
      >
        {previewCert && (
          <div className="text-center space-y-4 p-2">
            <div className="w-48 h-48 mx-auto bg-white p-4 rounded-3xl border border-slate-200 shadow-md flex items-center justify-center">
              {previewCert.qrCodeData ? (
                <img src={previewCert.qrCodeData} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-32 h-32 text-slate-800" />
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                № {previewCert.certificateNumber}
              </p>
              <p className="text-sm font-extrabold text-[#0050cb] mt-1">
                {previewCert.studentName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{previewCert.courseName}</p>
            </div>

            <p className="text-[11px] text-slate-400">
              Telefon kamerasi orqali skanerlanganda haqiqiylik tasdiqlanadi.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
