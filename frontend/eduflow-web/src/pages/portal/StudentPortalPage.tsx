import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentPortalApi, fileApi } from '../../services/api';
import {
  StudentPortalDashboardDto,
  HomeworkDto,
  CertificateDto,
  AvailableTeacherDto,
  StudentAttendanceSummaryDto,
  StudentAttendanceHistoryItemDto,
} from '../../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../../components/common/UIComponents';
import { useLanguage } from '../../context/LanguageContext';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Award,
  FileCheck2,
  UploadCloud,
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Users,
  Search,
  Check,
  UserPlus,
  UserMinus,
  Sparkles,
  Phone,
  MapPin,
  ArrowRight,
  Filter,
  XCircle,
  MessageSquare,
  Percent,
  Star,
  Plus,
} from 'lucide-react';

export const StudentPortalPage: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';

  const [dashboard, setDashboard] = useState<StudentPortalDashboardDto | null>(null);
  const [homeworkList, setHomeworkList] = useState<HomeworkDto[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummaryDto | null>(null);
  const [attendanceFilterGroup, setAttendanceFilterGroup] = useState<string>('all');
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState<string>('all');
  const [attendanceSearch, setAttendanceSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance'>('dashboard');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Submit Homework modal
  const [selectedHw, setSelectedHw] = useState<HomeworkDto | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Course enrollment state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<AvailableTeacherDto[]>([]);
  const [enrollApplications, setEnrollApplications] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Enrollment modal fields
  const [selectedCourseType, setSelectedCourseType] = useState<'existing' | 'custom'>('existing');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [customSubjectName, setCustomSubjectName] = useState<string>('Ingliz tili (General)');
  const [preferredTime, setPreferredTime] = useState<string>('Ertalab (09:00 - 12:00)');
  const [enrollNote, setEnrollNote] = useState<string>('');
  const [submittingEnroll, setSubmittingEnroll] = useState(false);

  const loadApplications = () => {
    try {
      const raw = localStorage.getItem('eduflow_course_applications');
      if (raw) {
        setEnrollApplications(JSON.parse(raw));
      } else {
        setEnrollApplications([]);
      }
    } catch (e) {
      setEnrollApplications([]);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      setLoadingTeachers(true);
      const res = await studentPortalApi.getAvailableTeachers();
      if (res?.success && res.data) {
        setAvailableTeachers(res.data);
        if (res.data.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(res.data[0].id);
          if (res.data[0].groups?.length > 0) {
            setSelectedGroupId(res.data[0].groups[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load available teachers', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [dashRes, hwRes, attRes] = await Promise.all([
        studentPortalApi.getDashboard(),
        studentPortalApi.getMyHomework(),
        studentPortalApi.getAttendanceHistory().catch(() => ({ success: false, data: null })),
      ]);

      if (dashRes.success && dashRes.data) {
        setDashboard(dashRes.data);
      }
      if (hwRes.success && hwRes.data) {
        setHomeworkList(hwRes.data);
      }
      if (attRes?.success && attRes?.data) {
        setAttendanceSummary(attRes.data);
      }
    } catch (err) {
      console.error('Student portal error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
    loadApplications();
    loadAvailableCourses();

    const handleUpdate = () => {
      loadApplications();
      loadStudentData();
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('eduflow_application_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('eduflow_application_updated', handleUpdate);
    };
  }, []);

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
          loadStudentData();
        }, 1200);
      }
    } catch (err) {
      console.error('Submit homework error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelApplication = (appId: string) => {
    const updated = enrollApplications.filter((a: any) => a.id !== appId);
    localStorage.setItem('eduflow_course_applications', JSON.stringify(updated));
    setEnrollApplications(updated);
    window.dispatchEvent(new Event('eduflow_application_updated'));
    setToastMessage({
      type: 'success',
      text: 'Kursga yozilish arizangiz bekor qilindi.',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSubmitEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEnroll(true);
    try {
      let courseName = '';
      let subjectName = '';
      let teacherName = '';

      if (selectedCourseType === 'existing') {
        const teacher = availableTeachers.find((t) => t.id === selectedTeacherId);
        const group = teacher?.groups?.find((g) => g.id === selectedGroupId);
        teacherName = teacher?.fullName || '';
        subjectName = group?.subjectName || teacher?.specialization || 'Umumiy kurs';
        courseName = group ? `${group.name} (${subjectName})` : `${teacherName || 'Ustoz'} kursi`;
      } else {
        courseName = customSubjectName;
        subjectName = customSubjectName;
      }

      const currentDisplayName = dashboard?.studentName || dashboard?.fullName || 'Jasurbek Aliyev';

      const newApp = {
        id: 'app-' + Date.now(),
        studentId: dashboard?.studentId || 'student-current',
        studentName: currentDisplayName,
        studentPhone: '+998 90 123 45 67',
        courseName,
        subjectName,
        preferredTeacherId: selectedTeacherId || '',
        preferredTeacherName: teacherName,
        preferredGroupId: selectedGroupId || '',
        preferredTime,
        note: enrollNote,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const raw = localStorage.getItem('eduflow_course_applications');
      const existing = raw ? JSON.parse(raw) : [];
      const updated = [newApp, ...existing.filter((a: any) => a.id !== newApp.id)];
      localStorage.setItem('eduflow_course_applications', JSON.stringify(updated));
      setEnrollApplications(updated);
      window.dispatchEvent(new Event('eduflow_application_updated'));

      setIsEnrollModalOpen(false);
      setEnrollNote('');
      setToastMessage({
        type: 'success',
        text: 'Kursga yozilish arizangiz muvaffaqiyatli qabul qilindi! Admin ko‘rib chiqib sizni guruh va o‘qituvchiga biriktiradi.',
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Enroll submit error', err);
    } finally {
      setSubmittingEnroll(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text={t('student.loading_portal', "O'quvchi kabineti yuklanmoqda...")} />;
  }

  if (!dashboard) {
    return (
      <EmptyState
        title={t('student.not_found_title', "Ma'lumot topilmadi")}
        description={t('student.not_found_desc', "O'quvchi ma'lumotlari tizimda topilmadi. Iltimos qaytadan kiring.")}
      />
    );
  }

  const enrolledGroupsList = dashboard.groups || dashboard.enrolledGroups || [];
  const upcomingLessonsList = dashboard.upcomingLessons || [];
  const todayLessonsList = dashboard.todayLessons || [];
  const pendingHwCount = dashboard.pendingHomework?.length ?? dashboard.pendingHomeworkCount ?? 0;
  const studentDisplayName = dashboard.studentName || dashboard.fullName || 'Jasurbek Aliyev';
  const progressData = dashboard.progress;
  const skillsList = progressData?.skillProgress || dashboard.skills || [];

  // Match current student's course applications
  const currentStudentId = dashboard.studentId;
  const studentApplications = enrollApplications.filter(
    (a: any) =>
      (currentStudentId && a.studentId === currentStudentId) ||
      (studentDisplayName && a.studentName?.toLowerCase() === studentDisplayName.toLowerCase())
  );
  const pendingApp = studentApplications.find((a: any) => a.status === 'pending');
  const recentlyEnrolledApp = studentApplications.find((a: any) => a.status === 'enrolled');

  // Attendance filter logic
  const attendanceHistoryList = attendanceSummary?.items || [];
  const uniqueAttendanceGroups = Array.from(
    new Map(attendanceHistoryList.map((h) => [h.groupId, { id: h.groupId, name: h.groupName }])).values()
  );

  const filteredAttendance = attendanceHistoryList.filter((item) => {
    const matchesGroup = attendanceFilterGroup === 'all' || item.groupId === attendanceFilterGroup;
    
    let itemStatusStr = 'present';
    if (typeof item.status === 'number') {
      if (item.status === 1) itemStatusStr = 'present';
      else if (item.status === 2) itemStatusStr = 'absent';
      else if (item.status === 3) itemStatusStr = 'late';
      else if (item.status === 4) itemStatusStr = 'excused';
    } else if (typeof item.status === 'string') {
      itemStatusStr = (item.status as string).toLowerCase();
    }

    const matchesStatus =
      attendanceFilterStatus === 'all' || itemStatusStr === attendanceFilterStatus.toLowerCase();
    const query = attendanceSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.lessonTopic?.toLowerCase().includes(query) ||
      item.teacherName?.toLowerCase().includes(query) ||
      item.subjectName?.toLowerCase().includes(query) ||
      item.groupName?.toLowerCase().includes(query);
    return matchesGroup && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <p className="text-xs font-semibold">{toastMessage.text}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Student Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0050cb] via-[#0066ff] to-[#4d8eff] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
                {t('student.badge', 'O‘quvchi profili')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('student.greeting', 'Salom')}, {studentDisplayName}!
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              {t('student.hero_desc', 'Darslaringiz jadvali, ustozlar tanlash, uy vazifalarini topshirish va natijalaringizni kuzatib boring.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                loadAvailableCourses();
                setIsEnrollModalOpen(true);
              }}
              className="px-4 py-2.5 bg-white text-[#0050cb] hover:bg-blue-50 text-xs font-black rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <GraduationCap className="w-4 h-4 text-[#0050cb]" />
              <span>+ Yangi kursga yozilish</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-2xl backdrop-blur-md shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Davomat tarixi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Active Course Enrollment Banners */}
      {pendingApp && (
        <div className="p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/60 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Yangi kursga yozilish arizangiz Adminga yuborilgan
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                    Kutilmoqda
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Tanlangan kurs: <span className="font-bold text-slate-900 dark:text-white">{pendingApp.courseName}</span>
                  {pendingApp.preferredTeacherName && ` • Ustoz: ${pendingApp.preferredTeacherName}`}
                  {pendingApp.preferredTime && ` • Qulay vaqt: ${pendingApp.preferredTime}`}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
                  ℹ️ Administrator arizangizni ko‘rib chiqib, sizni mos o‘qituvchi va guruhga biriktiradi. Shundan so‘ng dars jadvalingiz bu yerda faollashadi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCancelApplication(pendingApp.id)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer whitespace-nowrap self-end sm:self-center"
            >
              Arizani bekor qilish
            </button>
          </div>
        </div>
      )}

      {recentlyEnrolledApp && (
        <div className="p-4 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-700/60 shadow-sm backdrop-blur-md flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                🎉 Tabriklaymiz! Siz o‘quv markazi administratori tomonidan guruh va o‘qituvchiga biriktirildingiz!
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                Kurs: <span className="font-semibold">{recentlyEnrolledApp.courseName}</span>. Dars jadvalingiz va o‘qituvchingiz ma'lumotlari quyida faollashtirildi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const updated = enrollApplications.filter((a: any) => a.id !== recentlyEnrolledApp.id);
              localStorage.setItem('eduflow_course_applications', JSON.stringify(updated));
              setEnrollApplications(updated);
            }}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
            title="Yopish"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/20'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Mening Ta'limim (Darslar & Vazifalar)</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/20'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Mening Davomatim</span>
          {attendanceSummary && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-[#0050cb] dark:text-blue-300">
              {(attendanceSummary.attendancePercentage ?? 0).toFixed(0)}%
            </span>
          )}
        </button>
      </div>

      {activeTab === 'attendance' ? (
        /* Personal Attendance History Tab */
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Lessons */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jami darslar</span>
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {attendanceSummary?.totalLessons ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Darslar soni</p>
            </div>

            {/* Present Count */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kelgan</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {attendanceSummary?.presentCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">To'liq qatnashgan</p>
            </div>

            {/* Late Count */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kechikkan</span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {attendanceSummary?.lateCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Kechikib kelingan</p>
            </div>

            {/* Excused Count */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sababli</span>
                <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                  <FileCheck2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-2">
                {attendanceSummary?.excusedCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ruxsat olingan</p>
            </div>

            {/* Absent Count */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kelmagan</span>
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {attendanceSummary?.absentCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Sababsiz qoldirilgan</p>
            </div>

            {/* Overall Rate */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Davomat foizi</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
                  <Percent className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-[#0050cb] dark:text-blue-400 mt-2">
                {(attendanceSummary?.attendancePercentage ?? 0).toFixed(1)}%
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#0050cb] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, attendanceSummary?.attendancePercentage ?? 0))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  <Filter className="w-3.5 h-3.5 text-[#0050cb]" />
                  <span>Holat:</span>
                </div>

                {/* Status Filter Buttons */}
                {[
                  { key: 'all', label: 'Barchasi' },
                  { key: 'present', label: 'Kelgan' },
                  { key: 'late', label: 'Kechikkan' },
                  { key: 'excused', label: 'Sababli' },
                  { key: 'absent', label: 'Kelmagan' },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setAttendanceFilterStatus(st.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      attendanceFilterStatus === st.key
                        ? 'bg-[#0050cb] text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}

                {/* Group Filter Dropdown */}
                {uniqueAttendanceGroups.length > 1 && (
                  <select
                    value={attendanceFilterGroup}
                    onChange={(e) => setAttendanceFilterGroup(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
                  >
                    <option value="all">Barcha guruhlar</option>
                    {uniqueAttendanceGroups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Mavzu, fan yoki ustoz..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
                />
              </div>
            </div>
          </div>

          {/* Attendance History Table / List */}
          {filteredAttendance.length === 0 ? (
            <div className="bg-white/80 dark:bg-slate-900/80 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Davomat yozuvlari topilmadi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {attendanceHistoryList.length === 0
                  ? "Siz uchun hali davomat o'tkazilmagan. Darslar bo'lib, o'qituvchi davomat qilganda bu yerda barcha yozuvlaringiz ko'rinadi."
                  : "Tanlangan parametrlar bo'yicha ma'lumot topilmadi. Filtrni o'zgartirib ko'ring."}
              </p>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs backdrop-blur-md">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0050cb]" />
                    <span>Darslar va Davomat Kundaligi</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Har bir dars sanasi, fan, mavzu, davomat holati va o'qituvchi qo'ygan baholar
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Jami: {filteredAttendance.length} ta dars
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-3 px-4">Sana va Vaqt</th>
                      <th className="py-3 px-4">Guruh va Fan</th>
                      <th className="py-3 px-4">O'qituvchi</th>
                      <th className="py-3 px-4">Dars Mavzusi</th>
                      <th className="py-3 px-4 text-center">Davomat Holati</th>
                      <th className="py-3 px-4">Ustoz Bahosi & Izohi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredAttendance.map((item, idx) => {
                      const lessonDateObj = item.lessonStartTime ? new Date(item.lessonStartTime) : null;
                      const lessonDateStr = lessonDateObj
                        ? lessonDateObj.toLocaleDateString(locale, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—';
                      const startFmt = lessonDateObj
                        ? lessonDateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                        : '';
                      const endObj = item.lessonEndTime ? new Date(item.lessonEndTime) : null;
                      const endFmt = endObj
                        ? endObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                        : '';

                      let isPresent = false;
                      let isAbsent = false;
                      let isLate = false;
                      let isExcused = false;

                      if (typeof item.status === 'number') {
                        isPresent = item.status === 1;
                        isAbsent = item.status === 2;
                        isLate = item.status === 3;
                        isExcused = item.status === 4;
                      } else if (typeof item.status === 'string') {
                        const stLower = (item.status as string).toLowerCase();
                        isPresent = stLower === 'present' || stLower === 'keldi';
                        isAbsent = stLower === 'absent' || stLower === 'kelmadi';
                        isLate = stLower === 'late' || stLower === 'kechikdi';
                        isExcused = stLower === 'excused' || stLower === 'sababli';
                      }

                      return (
                        <tr
                          key={item.lessonId || idx}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#0050cb]" />
                              <span>{lessonDateStr}</span>
                            </div>
                            {(startFmt || endFmt) && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{startFmt} - {endFmt}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-100">
                              {item.groupName}
                            </div>
                            {item.subjectName && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/70 text-[#0050cb] dark:text-blue-300 rounded-md">
                                {item.subjectName}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.teacherName || '—'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.lessonTopic || 'Dars mashg‘uloti'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Keldi
                              </span>
                            ) : isLate ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3.5 h-3.5" /> Kechikdi
                              </span>
                            ) : isExcused ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                <FileCheck2 className="w-3.5 h-3.5" /> Sababli
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <AlertCircle className="w-3.5 h-3.5" /> Kelmadi
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {item.gradeScore != null ? (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-black">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>{item.gradeScore} ball</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                              {item.comment && (
                                <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700 flex items-start gap-1.5 mt-1">
                                  <MessageSquare className="w-3 h-3 text-[#0050cb] shrink-0 mt-0.5" />
                                  <span>{item.comment}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Overview Dashboard Tab */
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('student.my_groups', 'Guruhlarim')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0050cb] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {enrolledGroupsList.length} {t('student.groups_unit', 'ta guruh')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Markaz biriktirgan guruhlar
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('student.attendance', 'Davomat')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {attendanceSummary?.attendancePercentage != null
                  ? `${attendanceSummary.attendancePercentage.toFixed(0)}%`
                  : `${dashboard.attendanceRate}%`}
              </p>
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Davomat tarixini ko'rish</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('student.avg_grade', "O'rtacha baho")}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {dashboard.averageGrade} / 100
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {t('student.academic_perf', "Akademik o'zlashtirish")}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('student.homework_title', 'Uy vazifalari')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {pendingHwCount} {t('student.pending_count_suffix', 'ta kutilmoqda')}
              </p>
              <p className="text-[11px] text-purple-600 font-medium mt-1">
                {t('student.due_date_active', 'Topshirish muddati bor')}
              </p>
            </div>
          </div>

          {/* Enrolled Groups List Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0050cb]" />
                <span>Mening Guruhlarim va O'qituvchilarim</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadAvailableCourses();
                    setIsEnrollModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>+ Kursga yozilish</span>
                </button>
              </div>
            </div>

            {enrolledGroupsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledGroupsList.map((g: any) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {g.name}
                        </span>
                        {g.subjectName && (
                          <Badge variant="info">{g.subjectName}</Badge>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 font-semibold text-[#0050cb] dark:text-blue-400">
                          <GraduationCap className="w-4 h-4 shrink-0" />
                          <span>Ustoz: {g.teacherName || 'Biriktirilmagan'}</span>
                        </div>
                        {(g.scheduleDescription || g.schedule) && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-[#0050cb]" />
                            <span>{g.scheduleDescription || g.schedule}</span>
                          </div>
                        )}
                        {g.room && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>Xona: {g.room}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Faol a'zo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-blue-50/30 dark:bg-slate-800/30 rounded-3xl border border-blue-100 dark:border-slate-800 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-3xl bg-blue-100 dark:bg-blue-950/80 text-[#0050cb] dark:text-blue-400 flex items-center justify-center mb-3 shadow-inner">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                  Siz hali hech qanday guruhga biriktirilmagansiz
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                  O‘quv markazimizning sifatli kurslariga yoziling! O'zingiz qiziqqan kurs va qulay vaqtni tanlab ariza topshiring. Markaz administratori arizangizni ko'rib chiqib sizni guruh va o'qituvchiga rasman biriktiradi.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    loadAvailableCourses();
                    setIsEnrollModalOpen(true);
                  }}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kursga yozilish (Ariza topshirish)</span>
                </button>
              </div>
            )}
          </div>

      {/* Homework Assignments Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#0050cb]" />
            {t('student.my_homework_section', 'Mening Uy Vazifalarim')}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {homeworkList.length} {t('student.tasks_unit', 'ta vazifa')}
            </span>
            <Link
              to={`/${language.toLowerCase()}/student/homework`}
              className="text-xs font-bold text-[#0050cb] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {language === 'RU' ? 'Все задания →' : language === 'EN' ? 'View all →' : 'Barchasini ko‘rish →'}
            </Link>
          </div>
        </div>

        {homeworkList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeworkList.map((hw) => {
              const submission = hw.userSubmission;
              return (
                <div
                  key={hw.id}
                  className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-[#0050cb] dark:text-blue-300">
                        {hw.groupName}
                      </span>
                      <Badge variant={submission ? 'success' : 'warning'}>
                        {submission?.status === 4
                          ? `${t('student.graded_badge', 'Baholandi')}: ${submission.score} ${t('teacher.score_unit', 'ball')}`
                          : submission
                          ? t('student.submitted_badge', 'Topshirilgan')
                          : t('status.pending', 'Kutilmoqda')}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{hw.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {hw.description}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {t('student.due_date', 'Muddat')}: {new Date(hw.dueDate).toLocaleDateString(locale)}
                    </p>

                    {submission?.feedback && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                          {t('student.teacher_comment', "O'qituvchi sharhi")}:
                        </span>
                        <p className="text-emerald-700 dark:text-emerald-400 italic">
                          "{submission.feedback}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedHw(hw);
                        setSubmissionText(submission?.content || '');
                        setFileUrl(submission?.attachmentUrls || '');
                      }}
                      className="px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      {submission 
                        ? t('student.resubmit_btn', 'Qayta topshirish / Tahrirlash') 
                        : t('student.submit_btn', 'Vazifani topshirish')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            {t('student.no_homework', 'Hozircha hech qanday uy vazifasi berilmagan.')}
          </div>
        )}
      </div>

      {/* Today's Lessons (if any) */}
      {todayLessonsList.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-blue-200 dark:border-blue-900/50 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <Calendar className="w-4 h-4 text-[#0050cb]" />
              {language === 'RU' ? 'Сегодняшние уроки' : language === 'EN' ? "Today's Lessons" : 'Bugungi darslar'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-[#0050cb] dark:text-blue-300">
              {todayLessonsList.length} {language === 'RU' ? 'урока' : language === 'EN' ? 'lessons' : 'ta dars'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayLessonsList.map((l: any) => (
              <div
                key={l.id}
                className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-200/80 dark:border-blue-900/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{l.groupName}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-[#0050cb] dark:text-blue-300">
                      {l.teacherName || 'O‘qituvchi'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                    {l.topic || t('dash.no_topic', 'Mavzu belgilanmagan')}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200/50 dark:border-slate-700/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0050cb] dark:text-blue-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(l.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(l.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' '}({Math.round((new Date(l.endTime).getTime() - new Date(l.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10} soat)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {l.room || 'Xona 102'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Lessons Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          {t('student.upcoming_lessons', 'Yaqinlashayotgan darslar')}
        </h3>
        {upcomingLessonsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingLessonsList.map((l: any) => (
              <div
                key={l.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{l.groupName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {l.topic || t('dash.no_topic', 'Mavzu belgilanmagan')}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(l.startTime).toLocaleDateString(locale)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(l.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(l.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' '}({Math.round((new Date(l.endTime).getTime() - new Date(l.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10} soat)
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            {t('student.no_upcoming', "Yaqin orada darslar yo'q.")}
          </div>
        )}
      </div>

      {/* Academic Skills & Progress */}
      {skillsList.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              {language === 'RU' ? 'Академические навыки и успеваемость' : language === 'EN' ? 'Academic Skills & Progress' : 'Akademik ko‘nikmalar va o‘zlashtirish'}
            </h3>
            {progressData?.overallProgressPercent && (
              <span className="text-xs font-extrabold text-[#0050cb] dark:text-blue-400">
                {progressData.overallProgressPercent}% {language === 'RU' ? 'общий прогресс' : language === 'EN' ? 'overall' : 'umumiy o‘sish'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {skillsList.map((sk: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{sk.skillName}</span>
                  <span className="text-xs font-extrabold text-[#0050cb] dark:text-blue-400">{sk.scorePercent}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#0050cb] to-[#0066ff] rounded-full transition-all duration-500"
                    style={{ width: `${sk.scorePercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 truncate">{sk.level}</p>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* Homework Submission Modal */}
      <Modal
        isOpen={!!selectedHw}
        onClose={() => setSelectedHw(null)}
        title={selectedHw 
          ? `${t('student.submit_modal_title', 'Vazifani topshirish')}: ${selectedHw.title}` 
          : t('student.submit_modal_title', 'Vazifani topshirish')}
      >
        {submitSuccess ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {t('student.submit_success_title', 'Muvaffaqiyatli!')}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {t('student.submit_success_desc', "Vazifangiz o'qituvchiga tekshirish uchun yuborildi.")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitHomework} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('student.solution_label', 'Vazifa javobi yoki sharhingiz')}
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder={t('student.solution_placeholder', 'Yechim yoki insho matnini bu yerga yozing...')}
                rows={5}
                required
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'RU' ? 'Прикрепить изображение решения (только фото)' : language === 'EN' ? 'Attach Solution Image (photos only)' : 'Yechim rasmini biriktirish (faqat rasmli fayllar)'}
              </label>

              {!fileUrl ? (
                <div>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0050cb] dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 transition-all">
                    <UploadCloud className="w-5 h-5 text-[#0050cb]" />
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
                    {/* Change Button */}
                    <label
                      title={language === 'RU' ? 'Заменить' : language === 'EN' ? 'Change' : 'O‘zgartirish'}
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

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      title={language === 'RU' ? 'Удалить' : language === 'EN' ? 'Delete' : 'O‘chirish'}
                      className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
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
                onClick={() => setSelectedHw(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t('action.cancel', 'Bekor qilish')}
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white shadow-xs hover:bg-[#003fa4] cursor-pointer disabled:opacity-50"
              >
                {submitting ? t('action.loading', 'Yuborilmoqda...') : t('action.submit', 'Topshirish')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Course Enrollment Application Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="O‘quv Markazi Kurslariga Yozilish"
      >
        <form onSubmit={handleSubmitEnrollment} className="space-y-4">
          <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#0050cb] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Qanday ishlaydi?</p>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                  Siz o‘zingizga mos kurs, o‘qituvchi va qulay dars vaqtini tanlab ariza yuborasiz. O'quv markazi administratori arizangizni qabul qilib, sizni tanlangan guruh va o‘qituvchiga rasman biriktiradi.
                </p>
              </div>
            </div>
          </div>

          {/* Type Selector: From Teachers/Groups vs Custom Subject */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setSelectedCourseType('existing')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedCourseType === 'existing'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ustozlar va Mavjud Guruhlar
            </button>
            <button
              type="button"
              onClick={() => setSelectedCourseType('custom')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedCourseType === 'custom'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Boshqa Fan / Yo‘nalish
            </button>
          </div>

          {selectedCourseType === 'existing' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  O‘qituvchini tanlang
                </label>
                {loadingTeachers ? (
                  <div className="p-3 text-center text-xs text-slate-400">O‘qituvchilar ro‘yxati yuklanmoqda...</div>
                ) : availableTeachers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    Hozircha o‘qituvchilar ro‘yxati bo‘sh
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableTeachers.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          setSelectedTeacherId(t.id);
                          if (t.groups && t.groups.length > 0) {
                            setSelectedGroupId(t.groups[0].id);
                          } else {
                            setSelectedGroupId('');
                          }
                        }}
                        className={`p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                          selectedTeacherId === t.id
                            ? 'border-[#0050cb] bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-[#0050cb]/20'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center font-bold text-xs shrink-0">
                            {t.fullName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {t.fullName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {t.specialization || 'Ustoz'} • {t.groups?.length || 0} ta guruh
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Group Selector for the selected teacher */}
              {selectedTeacherId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ustozning guruhi (ixtiyoriy)
                  </label>
                  {(() => {
                    const teacher = availableTeachers.find((t) => t.id === selectedTeacherId);
                    const teacherGroups = teacher?.groups || [];
                    if (teacherGroups.length === 0) {
                      return (
                        <p className="text-[11px] text-slate-400 italic">
                          Ushbu ustozda hozircha ochiq guruh yo‘q. Administrator arizangizga asosan yangi guruh ochib sizni biriktirishi mumkin.
                        </p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {teacherGroups.map((g) => (
                          <button
                            type="button"
                            key={g.id}
                            onClick={() => setSelectedGroupId(g.id)}
                            className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                              selectedGroupId === g.id
                                ? 'border-[#0050cb] bg-blue-50/70 dark:bg-blue-950/50 font-bold text-[#0050cb]'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">{g.name}</span>
                              {g.monthlyFee && (
                                <span className="text-[10px] text-emerald-600 font-bold">
                                  {g.monthlyFee.toLocaleString()} so'm/oy
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {g.scheduleDescription || 'Haftada 3 kun'} {g.room ? `• ${g.room}` : ''}
                            </p>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Qaysi fan yoki yo‘nalishda o‘qimoqchisiz?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Ingliz tili (General)',
                  'IELTS 7.0+',
                  'Matematika (Pre-Calculus)',
                  'Frontend Dasturlash',
                  'Python & AI',
                  'Fizika',
                  'Ona tili va Adabiyot',
                  'Nemis tili',
                  'SAT / GMAT',
                ].map((subj) => (
                  <button
                    type="button"
                    key={subj}
                    onClick={() => setCustomSubjectName(subj)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      customSubjectName === subj
                        ? 'border-[#0050cb] bg-[#0050cb] text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Time Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Sizga qulay dars vaqti (Smena)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { time: 'Ertalab (09:00 - 12:00)', label: '🌅 Ertalab (09:00 - 12:00)' },
                { time: 'Tushdan keyin (14:00 - 17:00)', label: '☀️ Tushdan keyin (14:00 - 17:00)' },
                { time: 'Kechki smena (18:00 - 20:30)', label: '🌙 Kechki smena (18:00 - 20:30)' },
                { time: 'Dam olish kunlari (Shanba-Yakshanba)', label: '📅 Shanba & Yakshanba' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.time}
                  onClick={() => setPreferredTime(item.time)}
                  className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                    preferredTime === item.time
                      ? 'border-[#0050cb] bg-blue-50/70 dark:bg-blue-950/50 text-[#0050cb] font-bold ring-1 ring-[#0050cb]'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Qo‘shimcha istaklaringiz yoki maqsadingiz (ixtiyoriy)
            </label>
            <textarea
              value={enrollNote}
              onChange={(e) => setEnrollNote(e.target.value)}
              placeholder="Masalan: Ingliz tilini noldan boshlamoqchiman, IELTS 7.5 olish asosiy maqsadim..."
              rows={3}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30"
            />
          </div>

          {/* Application Summary Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Ariza topshiruvchi:</span>
              <span className="font-bold text-slate-900 dark:text-white">{studentDisplayName}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tanlangan yo‘nalish:</span>
              <span className="font-bold text-[#0050cb]">
                {selectedCourseType === 'existing'
                  ? (availableTeachers.find((t) => t.id === selectedTeacherId)?.groups?.find((g) => g.id === selectedGroupId)?.name ||
                     availableTeachers.find((t) => t.id === selectedTeacherId)?.specialization ||
                     'Ustoz tanlandi')
                  : customSubjectName}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Qulay vaqt:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{preferredTime}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEnrollModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submittingEnroll}
              className="px-5 py-2.5 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submittingEnroll ? (
                <span>Yuborilmoqda...</span>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span>Arizani Adminga Yuborish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
