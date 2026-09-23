import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupApi, lessonApi, attendanceApi, teacherApi } from '../../services/api';
import { Group, Lesson, Student, Teacher } from '../../types';
import { Badge, LoadingSpinner, EmptyState, Pagination, ConfirmModal } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { StartupEmptyState } from '../../components/common/StartupEmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Trash2,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  CheckCheck,
  Calendar,
  UserCheck,
  Users,
  BookOpen,
  MapPin,
  Search,
  ArrowRight,
  History,
  Plus,
  GraduationCap,
  Sparkles,
  Check,
  Eye,
  CalendarDays,
  ShieldCheck,
  Info,
  Phone,
  Filter,
  Sparkle,
  Layers,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const langPrefix = '/' + language.toLowerCase();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';

  const isAdmin = !user?.role || user.role <= 2;
  const isTeacher = user?.role === 3;

  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // Admin Top Tab: 'teachers' (Teacher Attendance) vs 'groups' (View Teacher's Group Attendance)
  const [adminTab, setAdminTab] = useState<'teachers' | 'groups'>('teachers');

  // Sub tab for group view: attendance sheet vs history/journal
  const [activeTab, setActiveTab] = useState<'attendance' | 'history'>('attendance');

  // Teachers state (for Admin)
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [teacherAttDate, setTeacherAttDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [teacherAttendanceMap, setTeacherAttendanceMap] = useState<
    Record<string, { status: number; note?: string }>
  >({});
  const [savingTeacherAtt, setSavingTeacherAtt] = useState(false);

  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Lessons of the selected group
  const [groupLessons, setGroupLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessonId || '');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  // Students of the selected group
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Attendance state: studentId -> { status, comment }
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: number; comment?: string }>>({});

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Format lesson date nicely in Uzbek
  const formatLessonDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const monthsUz = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
    ];
    const daysUz = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

    const day = d.getDate();
    const month = monthsUz[d.getMonth()];
    const weekday = daysUz[d.getDay()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}-${month} (${weekday}), ${hours}:${minutes}`;
  };

  // Format teacher attendance date display
  const formatTeacherAttDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const monthsUz = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
    ];
    const daysUz = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    return `${d.getDate()}-${monthsUz[d.getMonth()]}, ${d.getFullYear()}-yil (${daysUz[d.getDay()]})`;
  };

  // 1. Initial load: fetch groups and teachers
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [groupsRes, teachersRes] = await Promise.all([
          groupApi.getAll({ pageSize: 100 }),
          teacherApi.getAll({ pageSize: 100 }),
        ]);

        const allTeachers = teachersRes.items || [];
        setTeachers(allTeachers);

        let loadedGroups = groupsRes.items || [];
        // If logged in as Teacher, filter to only their own groups
        if (isTeacher && user) {
          const userFull = `${user.firstName} ${user.lastName}`.toLowerCase().trim();
          loadedGroups = loadedGroups.filter(
            (g) =>
              (g.teacherName && g.teacherName.toLowerCase() === userFull) ||
              (user.lastName && g.teacherName && g.teacherName.toLowerCase().includes(user.lastName.toLowerCase()))
          );
        }
        setGroups(loadedGroups);

        if (lessonId) {
          try {
            const lRes = await lessonApi.getById(lessonId);
            if (lRes.success && lRes.data) {
              setCurrentLesson(lRes.data);
              setSelectedLessonId(lRes.data.id);
              setSelectedGroupId(lRes.data.groupId);
              if (isAdmin) setAdminTab('groups');
            }
          } catch (e) {
            console.error('Error loading lesson from URL', e);
          }
        } else if (loadedGroups.length > 0) {
          setSelectedGroupId(loadedGroups[0].id);
        }
      } catch (err) {
        console.error('Error loading initial attendance data', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [lessonId, isTeacher, isAdmin, user]);

  // 2. Load teacher attendance from localStorage whenever date or teachers change
  useEffect(() => {
    if (!isAdmin || teachers.length === 0) return;
    const storageKey = `eduflow_teacher_att_${teacherAttDate}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setTeacherAttendanceMap(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Parse saved teacher att error', e);
      }
    }
    const def: Record<string, { status: number; note?: string }> = {};
    teachers.forEach((tItem) => {
      def[tItem.id] = { status: 1, note: '' };
    });
    setTeacherAttendanceMap(def);
  }, [teacherAttDate, teachers, isAdmin]);

  // Available groups filtered by selected teacher (for Admin)
  const availableGroups = groups.filter((g) => {
    if (!isAdmin) return true;
    if (selectedTeacherId === 'all') return true;
    const tObj = teachers.find((tItem) => tItem.id === selectedTeacherId);
    return (
      g.teacherId === selectedTeacherId ||
      (tObj && g.teacherName?.toLowerCase() === tObj.fullName.toLowerCase())
    );
  });

  // When selectedGroupId changes, load group details, real enrolled students, and group lessons
  useEffect(() => {
    if (!selectedGroupId) return;

    const loadGroupData = async () => {
      setLessonsLoading(true);
      setSuccessMessage('');
      try {
        const found = groups.find((g) => g.id === selectedGroupId) || null;
        setSelectedGroup(found);

        const detailRes = await groupApi.getById(selectedGroupId);
        if (detailRes.success && detailRes.data) {
          const detail = detailRes.data;
          setStudents((detail.students || []) as unknown as Student[]);

          let todayLesson: Lesson | null = null;
          try {
            const todayRes = await lessonApi.getOrCreateToday(selectedGroupId);
            if (todayRes.success && todayRes.data) {
              todayLesson = todayRes.data;
            }
          } catch (e) {
            console.warn('Avtomatik bugungi darsni tekshirish:', e);
          }

          const allLessonsRes = await lessonApi.getAll({ groupId: selectedGroupId, pageSize: 50 });
          let lessonsList = (allLessonsRes.items || []) as Lesson[];

          if (todayLesson && !lessonsList.some((l) => l.id === todayLesson!.id)) {
            lessonsList = [todayLesson, ...lessonsList];
          }

          setGroupLessons(lessonsList);

          if (todayLesson) {
            setSelectedLessonId(todayLesson.id);
            setCurrentLesson(todayLesson);
          } else if (lessonsList.length > 0) {
            setSelectedLessonId(lessonsList[0].id);
            setCurrentLesson(lessonsList[0]);
          } else {
            setSelectedLessonId('');
            setCurrentLesson(null);
          }
        }
      } catch (err) {
        console.error('Error loading group details and students', err);
      } finally {
        setLessonsLoading(false);
      }
    };

    loadGroupData();
  }, [selectedGroupId, groups]);

  // When selectedLessonId changes, load existing attendance
  useEffect(() => {
    if (!selectedLessonId) return;

    const loadLessonAttendance = async () => {
      try {
        const lFound = groupLessons.find((l) => l.id === selectedLessonId);
        if (lFound) {
          setCurrentLesson(lFound);
        } else {
          const lRes = await lessonApi.getById(selectedLessonId);
          if (lRes.success && lRes.data) {
            setCurrentLesson(lRes.data);
          }
        }

        const attRes = await attendanceApi.getByLesson(selectedLessonId);
        const nextMap: Record<string, { status: number; comment?: string }> = {};

        if (attRes && attRes.length > 0) {
          attRes.forEach((a: any) => {
            nextMap[a.studentId] = { status: a.status, comment: a.comment || '' };
          });
        }

        students.forEach((st) => {
          if (!nextMap[st.id]) {
            nextMap[st.id] = { status: 1, comment: '' };
          }
        });

        setAttendanceMap(nextMap);
      } catch (err) {
        console.error('Error loading lesson attendance', err);
      }
    };

    loadLessonAttendance();
  }, [selectedLessonId, groupLessons, students]);

  // Teacher Attendance Handlers (Admin)
  const handleTeacherStatusChange = (teacherId: string, status: number) => {
    setTeacherAttendanceMap((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        status,
      },
    }));
  };

  const handleTeacherNoteChange = (teacherId: string, note: string) => {
    setTeacherAttendanceMap((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        note,
      },
    }));
  };

  const handleMarkAllTeachersPresent = () => {
    const updated: Record<string, { status: number; note?: string }> = {};
    teachers.forEach((tItem) => {
      updated[tItem.id] = { status: 1, note: teacherAttendanceMap[tItem.id]?.note || '' };
    });
    setTeacherAttendanceMap(updated);
  };

  const handleMarkAllTeachersAbsent = () => {
    const updated: Record<string, { status: number; note?: string }> = {};
    teachers.forEach((tItem) => {
      updated[tItem.id] = { status: 2, note: teacherAttendanceMap[tItem.id]?.note || '' };
    });
    setTeacherAttendanceMap(updated);
  };

  const handleSaveTeacherAttendance = () => {
    setSavingTeacherAtt(true);
    const storageKey = `eduflow_teacher_att_${teacherAttDate}`;
    localStorage.setItem(storageKey, JSON.stringify(teacherAttendanceMap));

    const pCount = Object.values(teacherAttendanceMap).filter((v) => v.status === 1).length;
    const aCount = Object.values(teacherAttendanceMap).filter((v) => v.status === 2).length;
    const lCount = Object.values(teacherAttendanceMap).filter((v) => v.status === 3).length;

    setSuccessMessage(
      `O'qituvchilar davomati saqlandi! [${teacherAttDate}] — Keldi: ${pCount}, Kelmadi: ${aCount}, Kechikdi: ${lCount}. Jami: ${teachers.length} nafar.`
    );
    setSavingTeacherAtt(false);
    setTimeout(() => setSuccessMessage(''), 6000);
  };

  // Student Attendance Handlers (Only for Teacher role)
  const handleStatusChange = (studentId: string, status: number) => {
    if (isAdmin) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    if (isAdmin) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    if (isAdmin) return;
    const updated = { ...attendanceMap };
    students.forEach((st) => {
      updated[st.id] = { ...updated[st.id], status: 1 };
    });
    setAttendanceMap(updated);
  };

  const handleMarkAllAbsent = () => {
    if (isAdmin) return;
    const updated = { ...attendanceMap };
    students.forEach((st) => {
      updated[st.id] = { ...updated[st.id], status: 2 };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (isAdmin) return;
    if (!selectedLessonId) return;
    setSaving(true);
    setSuccessMessage('');

    try {
      const items = Object.entries(attendanceMap).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        comment: data.comment,
      }));

      await attendanceApi.saveBulk({
        lessonId: selectedLessonId,
        items,
      });

      const pCount = items.filter((i) => i.status === 1).length;
      const aCount = items.filter((i) => i.status === 2).length;
      const lCount = items.filter((i) => i.status === 3).length;
      const eCount = items.filter((i) => i.status === 4).length;

      const groupTitle = currentLesson?.groupName || selectedGroup?.name || 'Guruh';
      const msg = `[${groupTitle}] — Keldi: ${pCount}, Kelmadi: ${aCount}, Kechikdi: ${lCount}, Sababli: ${eCount}. Jami: ${students.length} nafar o‘quvchi.`;
      setSuccessMessage(msg);

      // Smooth scroll to top of page so top banner is in view
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Refresh recent lessons and group details from backend
      const detailRes = await groupApi.getById(selectedGroupId);
      if (detailRes.success && detailRes.data) {
        setGroupLessons((detailRes.data.recentLessons || []) as unknown as Lesson[]);
        setSelectedGroup(detailRes.data);
      }
    } catch (err) {
      console.error('Save attendance error', err);
    } finally {
      setSaving(false);
    }
  };

  // Compute live student attendance stats
  const totalCount = students.length;
  const presentCount = students.filter((st) => (attendanceMap[st.id]?.status ?? 1) === 1).length;
  const absentCount = students.filter((st) => (attendanceMap[st.id]?.status ?? 1) === 2).length;
  const lateCount = students.filter((st) => (attendanceMap[st.id]?.status ?? 1) === 3).length;
  const excusedCount = students.filter((st) => (attendanceMap[st.id]?.status ?? 1) === 4).length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

  // Compute teacher attendance stats
  const totalTeachers = teachers.length;
  const presentTeachers = teachers.filter((tItem) => (teacherAttendanceMap[tItem.id]?.status ?? 1) === 1).length;
  const absentTeachers = teachers.filter((tItem) => (teacherAttendanceMap[tItem.id]?.status ?? 1) === 2).length;
  const lateTeachers = teachers.filter((tItem) => (teacherAttendanceMap[tItem.id]?.status ?? 1) === 3).length;
  const excusedTeachers = teachers.filter((tItem) => (teacherAttendanceMap[tItem.id]?.status ?? 1) === 4).length;
  const teacherAttRate = totalTeachers > 0 ? Math.round((presentTeachers / totalTeachers) * 100) : 100;

  // Filtered teachers
  const filteredTeachers = teachers.filter((tItem) => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      tItem.fullName.toLowerCase().includes(q) ||
      (tItem.specialization && tItem.specialization.toLowerCase().includes(q)) ||
      (tItem.phoneNumber && tItem.phoneNumber.toLowerCase().includes(q))
    );
  });

  // Filtered students for search
  const filteredStudents = students.filter((st) => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (st.fullName && st.fullName.toLowerCase().includes(q)) ||
      (st.firstName && st.firstName.toLowerCase().includes(q)) ||
      (st.lastName && st.lastName.toLowerCase().includes(q)) ||
      (st.phoneNumber && st.phoneNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 w-full max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[2100px] 4xl:max-w-[2800px] mx-auto animate-in fade-in duration-300">
      {/* Attendance Submission Prominent Alert Banner */}
      {successMessage && (
        <div className="p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500/80 text-emerald-900 dark:text-emerald-100 rounded-3xl text-xs sm:text-sm font-bold shadow-xl shadow-emerald-500/10 animate-in fade-in slide-in-from-top duration-300 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-black text-sm sm:text-base text-emerald-950 dark:text-emerald-50">
                {t('attendance.saved_title', 'Davomat muvaffaqiyatli saqlandi va markaz ma’muriyatiga yuborildi!')}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                {successMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="p-1.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 cursor-pointer shrink-0 transition-colors"
            title="Yopish"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner */}
      <StartupBanner
        badgeText={isAdmin ? "Davomat Nazorati & O'qituvchilar ⚡" : "Davomat Tizimi ⚡"}
        title={isAdmin ? "O'qituvchilar va Guruhlar Davomati" : "Guruhlar Dars Davomati"}
        description={
          isAdmin
            ? "O'quv markazidagi o'qituvchilarning kunlik ishga kelish davomatini belgilang hamda o'qituvchilar guruhlaridagi dars davomatlarini monitoring qiling."
            : "Har bir guruh uchun dars kuni bo'yicha davomatni aniq kiritish, kim kelgani va kim kelmaganini nazorat qilish."
        }
        icon={<UserCheck className="w-6 h-6" />}
        gradientTheme="blue"
        metrics={
          isAdmin
            ? [
                { label: 'Jami O‘qituvchilar', value: `${totalTeachers} nafar` },
                { label: 'O‘qituvchilar Davomati', value: `${teacherAttRate}%` },
                { label: 'Faol Guruhlar', value: `${groups.length} ta` },
              ]
            : [
                { label: 'Faol guruhlar', value: `${groups.length} ta` },
                { label: 'Tanlangan guruh o‘quvchilari', value: `${totalCount} nafar` },
              ]
        }
      />

      {/* Admin Top Level Navigation Tabs (Sleek Apple / Linear style Segmented Control) */}
      {isAdmin && (
        <div className="flex justify-center my-2 overflow-x-auto no-scrollbar py-1">
          <div className="inline-flex items-center p-1 sm:p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-black/20 gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setAdminTab('teachers')}
              className={`flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
                adminTab === 'teachers'
                  ? 'bg-[#0050cb] text-white shadow-md shadow-blue-600/25 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${adminTab === 'teachers' ? 'text-white' : 'text-slate-400'}`} />
              <span>O‘qituvchilar Davomati</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                  adminTab === 'teachers'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {teachers.length > 0 ? `${teachers.length} nafar` : 'Xodimlar'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('groups')}
              className={`flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
                adminTab === 'groups'
                  ? 'bg-[#0050cb] text-white shadow-md shadow-blue-600/25 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <Eye className={`w-4 h-4 ${adminTab === 'groups' ? 'text-white' : 'text-slate-400'}`} />
              <span>Guruhlar Davomati</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                  adminTab === 'groups'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {groups.length > 0 ? `${groups.length} guruh` : 'Monitoring'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 1: TEACHER ATTENDANCE (Admin Marks Teachers)     */}
      {/* ---------------------------------------------------- */}
      {isAdmin && adminTab === 'teachers' ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Control Bar: Date picker & Actions */}
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/30 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0050cb] dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/60 shadow-xs">
                  <CalendarDays className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Davomat Sanasi</span>
                  <input
                    type="date"
                    value={teacherAttDate}
                    onChange={(e) => setTeacherAttDate(e.target.value)}
                    className="bg-transparent border-0 p-0 text-sm font-black text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs font-bold text-[#0050cb] dark:text-blue-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                <span>{formatTeacherAttDate(teacherAttDate)}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleMarkAllTeachersPresent}
                className="group px-4 py-2 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white text-xs font-black rounded-xl border border-emerald-500/25 hover:border-emerald-600 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-md hover:shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="w-5 h-5 rounded-lg bg-emerald-500/20 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" />
                </div>
                <span>Barchasi Keldi</span>
              </button>

              <button
                type="button"
                onClick={handleMarkAllTeachersAbsent}
                className="group px-4 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white text-xs font-black rounded-xl border border-rose-500/25 hover:border-rose-600 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-md hover:shadow-rose-600/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="w-5 h-5 rounded-lg bg-rose-500/20 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
                <span>Barchasi Kelmadi</span>
              </button>
            </div>
          </div>

          {/* Teacher Attendance Live Stats Counters (Bento Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-500/40 hover:shadow-md transition-all flex flex-col justify-between group">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Jami O‘qituvchilar:</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{totalTeachers} nafar</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0050cb] dark:text-blue-400 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-emerald-950/20 backdrop-blur-md p-4 rounded-3xl border border-emerald-500/25 dark:border-emerald-500/30 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between group">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Kelganlar:</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{presentTeachers} ta</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-rose-950/20 backdrop-blur-md p-4 rounded-3xl border border-rose-500/25 dark:border-rose-500/30 shadow-xs hover:border-rose-500/50 hover:shadow-md transition-all flex flex-col justify-between group">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Kelmaganlar:</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{absentTeachers} ta</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-amber-950/20 backdrop-blur-md p-4 rounded-3xl border border-amber-500/25 dark:border-amber-500/30 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between group">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Kechikkanlar:</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{lateTeachers} ta</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-purple-950/20 backdrop-blur-md p-4 rounded-3xl border border-purple-500/25 dark:border-purple-500/30 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all flex flex-col justify-between col-span-2 sm:col-span-1 group">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Sababli:</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{excusedTeachers} ta</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Attendance Sheet */}
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>O‘qituvchilarning Kunlik Ishga Kelish Jurnali</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Har bir o‘qituvchi holatini belgilang va tizimga saqlang.
                </p>
              </div>

              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="O‘qituvchini qidirish..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {teachers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                O‘qituvchilar mavjud emas.
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Qidiruv bo‘yicha o‘qituvchi topilmadi.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeachers.map((tItem, idx) => {
                  const currentStatus = teacherAttendanceMap[tItem.id]?.status ?? 1;
                  const currentNote = teacherAttendanceMap[tItem.id]?.note ?? '';

                  return (
                    <div
                      key={tItem.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 backdrop-blur-md ${
                        currentStatus === 1
                          ? 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-emerald-500/30'
                          : currentStatus === 2
                          ? 'bg-rose-950/15 hover:bg-rose-950/25 border-rose-900/40'
                          : currentStatus === 3
                          ? 'bg-amber-950/15 hover:bg-amber-950/25 border-amber-900/40'
                          : 'bg-purple-950/15 hover:bg-purple-950/25 border-purple-900/40'
                      }`}
                    >
                      {/* Teacher Profile Info */}
                      <div className="flex items-center gap-3.5">
                        <span className="w-6 text-xs font-bold text-slate-500 text-center">
                          {idx + 1}.
                        </span>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-900/50 to-indigo-900/50 border border-purple-500/30 text-purple-300 font-extrabold flex items-center justify-center text-sm shrink-0 shadow-sm">
                          {tItem.fullName ? tItem.fullName[0] : 'O'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                            <span>{tItem.fullName}</span>
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                            <span className="text-blue-400 font-semibold bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-900/30">
                              {tItem.specialization || 'Fan mutaxassisi'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{tItem.phoneNumber || 'Telefon yo‘q'}</span>
                            </span>
                            <span>•</span>
                            <span className="bg-slate-800 px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-300">
                              {tItem.groupsCount || 0} ta guruh
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Status Segmented Buttons for Admin */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTeacherStatusChange(tItem.id, 1)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                            currentStatus === 1
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50 scale-105'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Keldi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTeacherStatusChange(tItem.id, 2)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                            currentStatus === 2
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50 scale-105'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Kelmadi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTeacherStatusChange(tItem.id, 3)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                            currentStatus === 3
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50 scale-105'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Kechikdi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTeacherStatusChange(tItem.id, 4)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                            currentStatus === 4
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50 scale-105'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Sababli</span>
                        </button>
                      </div>

                      {/* Note / Check-in comment */}
                      <div className="w-full lg:w-48">
                        <input
                          type="text"
                          value={currentNote}
                          onChange={(e) => handleTeacherNoteChange(tItem.id, e.target.value)}
                          placeholder="Izoh yoki vaqt..."
                          className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky Save Button for Teacher Attendance */}
          <div className="sticky bottom-4 z-20 flex justify-end">
            <button
              type="button"
              onClick={handleSaveTeacherAttendance}
              disabled={savingTeacherAtt || teachers.length === 0}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white text-sm font-black rounded-2xl shadow-xl shadow-blue-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{savingTeacherAtt ? 'Saqlanmoqda...' : '💾 O‘qituvchilar Davomatini Saqlash'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* ---------------------------------------------------- */
        /* TAB 2: TEACHER'S GROUPS ATTENDANCE (VIEW FOR ADMIN,  */
        /* FULL ATTENDANCE CONTROLS FOR TEACHER ROLE)          */
        /* ---------------------------------------------------- */
        <div className="space-y-6 animate-in fade-in">
          {/* Admin Role Specific Guidance Glass Banner */}
          {isAdmin && (
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-white">Monitoring Rejimi</h4>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Guruh davomatini o‘qituvchi o‘z portalidan belgilaydi. Bu yerda siz dars qatnashuvi va jurnalni real vaqtda kuzatib borasiz.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Faqat ko‘rish</span>
                </span>
              </div>
            </div>
          )}

          {/* Group & Teacher Selector Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Teacher Selector (Only for Admin to filter by teacher) */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-purple-400" />
                    <span>1. O‘qituvchini tanlang:</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => {
                        const newTId = e.target.value;
                        setSelectedTeacherId(newTId);
                        const filtered =
                          newTId === 'all'
                            ? groups
                            : groups.filter(
                                (g) =>
                                  g.teacherId === newTId ||
                                  g.teacherName?.toLowerCase() ===
                                    teachers.find((tItem) => tItem.id === newTId)?.fullName.toLowerCase()
                              );
                        if (filtered.length > 0) {
                          setSelectedGroupId(filtered[0].id);
                        } else {
                          setSelectedGroupId('');
                          setCurrentLesson(null);
                        }
                      }}
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 cursor-pointer shadow-inner transition-colors"
                    >
                      <option value="all" className="bg-slate-900 text-white">
                        🌐 Barcha O‘qituvchilar ({teachers.length} nafar)
                      </option>
                      {teachers.map((tItem) => (
                        <option key={tItem.id} value={tItem.id} className="bg-slate-900 text-white">
                          {tItem.fullName} ({tItem.specialization || 'Fan'} — {tItem.groupsCount || 0} ta guruh)
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Group Selector */}
              <div className={isAdmin ? '' : 'md:col-span-2'}>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>
                    {isAdmin ? '2. O‘qituvchining guruhini tanlang:' : 'Qaysi guruh uchun davomat qilmoqchisiz?'}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => {
                      setSelectedGroupId(e.target.value);
                      setSelectedLessonId('');
                      setCurrentLesson(null);
                    }}
                    className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-inner transition-colors"
                  >
                    {availableGroups.length === 0 ? (
                      <option value="" className="bg-slate-900 text-white">
                        Guruhlar mavjud emas
                      </option>
                    ) : (
                      availableGroups.map((g) => (
                        <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                          {g.name} — {g.subjectName || 'Fan'} (Ustoz: {g.teacherName || 'Biriktirilmagan'}, {g.enrolledStudentsCount || 0} o‘quvchi)
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Toggle: Attendance vs History */}
            <div className="flex items-center justify-center sm:justify-end gap-1 pt-3 border-t border-slate-700/80 w-full">
              <div className="grid grid-cols-2 gap-1 bg-slate-800/80 p-1 sm:p-1.5 rounded-2xl w-full sm:w-auto border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('attendance')}
                  className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{isAdmin ? t('attendance.mark_tab', 'Davomatni Ko‘rish') : t('attendance.mark_tab', 'Davomat belgilash')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{t('attendance.history_tab', 'Guruh jurnali (Tarix)')}</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner text="Guruh va davomat ma'lumotlari yuklanmoqda..." />
          ) : !selectedGroup ? (
            <EmptyState
              title="Guruh tanlanmagan"
              description="Davomatni ko‘rish uchun yuqoridagi ro‘yxatdan o‘qituvchi va guruhni tanlang."
            />
          ) : activeTab === 'history' ? (
            /* History / Journal Tab */
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-xl flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-400" />
                    <span>'{selectedGroup.name}' guruhining o‘tilgan barcha darslari jurnali</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Jami {groupLessons.length} ta dars qayd etilgan. Ustoz: {selectedGroup.teacherName || 'Biriktirilmagan'}.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Darsga qaytish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden">
                {groupLessons.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Bu guruh uchun hali darslar mavjud emas.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-800/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3.5 px-6 whitespace-nowrap">Dars Sanasi va Vaqti</th>
                          <th className="py-3.5 px-6 min-w-[180px]">Mavzu</th>
                          <th className="py-3.5 px-6 text-center whitespace-nowrap">Jami O‘quvchi</th>
                          <th className="py-3.5 px-6 text-center whitespace-nowrap">Kelganlar</th>
                          <th className="py-3.5 px-6 text-center whitespace-nowrap">Kelmaganlar</th>
                          <th className="py-3.5 px-6 text-center whitespace-nowrap">Holat</th>
                          <th className="py-3.5 px-6 text-right whitespace-nowrap">Amal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {groupLessons.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-6 font-bold text-white whitespace-nowrap">
                              <div className="whitespace-nowrap">
                                {formatLessonDate(l.startTime).split('),')[0] + ')'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-normal whitespace-nowrap">
                                {new Date(l.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                {new Date(l.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="py-3.5 px-6 font-medium text-slate-300 min-w-[180px]">
                              {l.topic || 'Mavzu kiritilmagan'}
                            </td>
                            <td className="py-3.5 px-6 text-center font-bold text-slate-200 whitespace-nowrap">
                              {totalCount} nafar
                            </td>
                            <td className="py-3.5 px-6 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {l.presentCount ?? 0} ta
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                {l.absentCount ?? 0} ta
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-center whitespace-nowrap">
                              <Badge variant={l.status === 2 ? 'success' : 'warning'}>
                                {l.status === 2 ? 'Tugallangan' : 'Rejalashtirilgan'}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-6 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLessonId(l.id);
                                  setCurrentLesson(l);
                                  setActiveTab('attendance');
                                }}
                                className="inline-flex items-center justify-center whitespace-nowrap px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all shrink-0"
                              >
                                {isAdmin ? 'Davomatni ko‘rish' : 'Davomatni tahrirlash'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Attendance Sheet Tab */
            <div className="space-y-6 animate-in fade-in">
              {/* Selected Group Header Card */}
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-5 relative overflow-hidden">
                {/* Ambient glow accent */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-black tracking-wide">
                        {selectedGroup.subjectName || 'Fan'}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {selectedGroup.name}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-bold text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2.5 py-1 rounded-lg">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                        <span>Ustoz: {selectedGroup.teacherName || 'Biriktirilmagan'}</span>
                      </span>
                      {selectedGroup.scheduleDescription && (
                        <span className="flex items-center gap-1.5 font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>{selectedGroup.scheduleDescription}</span>
                        </span>
                      )}
                      {selectedGroup.room && (
                        <span className="flex items-center gap-1.5 font-medium text-slate-400 bg-slate-800/40 px-2.5 py-1 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Xona: {selectedGroup.room}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs font-black text-emerald-400 shadow-xs shrink-0 self-start md:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>{isAdmin ? 'Monitoring Faol' : 'Bugungi dars faol'}</span>
                  </div>
                </div>

                {/* Lesson / Date Selector for this group */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <CalendarDays className="w-4 h-4 text-blue-400" />
                      <span>Dars kuni va mavzuni tanlang:</span>
                    </span>
                    {groupLessons.length > 0 && (
                      <span className="text-[11px] text-slate-500">
                        Jami {groupLessons.length} ta dars qayd etilgan
                      </span>
                    )}
                  </label>

                  {groupLessons.length === 0 ? (
                    <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-400">
                      Darslar ro'yxati avtomatik shakllantirilmoqda...
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedLessonId}
                        onChange={(e) => setSelectedLessonId(e.target.value)}
                        className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-inner transition-colors"
                      >
                        {groupLessons.map((l) => (
                          <option key={l.id} value={l.id} className="bg-slate-900 text-white py-2">
                            {formatLessonDate(l.startTime)} — {l.topic || 'Mavzu kiritilmagan'}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Group & Attendance Statistics Counters (Bento Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-800/80 shadow-xs hover:border-slate-700 transition-all flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Guruhda jami:</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-black text-white">{totalCount} nafar</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-950/20 backdrop-blur-md p-4 rounded-3xl border border-emerald-500/25 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Kelganlar:</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-black text-emerald-400">{presentCount} ta</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="bg-rose-950/20 backdrop-blur-md p-4 rounded-3xl border border-rose-500/25 shadow-xs hover:border-rose-500/40 transition-all flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">Kelmaganlar:</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-black text-rose-400">{absentCount} ta</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                      <XCircle className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-950/20 backdrop-blur-md p-4 rounded-3xl border border-amber-500/25 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Kechikkanlar:</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-black text-amber-400">{lateCount} ta</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="bg-purple-950/20 backdrop-blur-md p-4 rounded-3xl border border-purple-500/25 shadow-xs hover:border-purple-500/40 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">Sababli:</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-black text-purple-400">{excusedCount} ta</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Students Attendance Sheet */}
              <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span>
                        {isAdmin
                          ? 'O‘quvchilar Davomat Varaqasi (Ko‘rish Rejimi)'
                          : 'O‘quvchilar Davomati Ruxsatnomasi (Kim keldi / Kim kelmadi)'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedGroup.name} guruhi — Jami {students.length} nafar o‘quvchi ro‘yxati.
                    </p>
                  </div>

                  {/* Mode Badge for Admin vs Quick Buttons for Teacher */}
                  {isAdmin ? (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/25 text-blue-300 rounded-xl text-xs font-extrabold shadow-2xs">
                      <Eye className="w-4 h-4" />
                      <span>Faqat Ko‘rish (Nazorat)</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-black rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Hammani 'Keldi' qilish</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleMarkAllAbsent}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-black rounded-xl border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hammani 'Kelmadi' qilish</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="O‘quvchi ismi yoki telefoni bo‘yicha izlash..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Students List */}
                {students.length === 0 ? (
                  <div className="py-12 text-center bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                    <Users className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-white">Ushbu guruhda hali o‘quvchilar yo‘q</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Guruhlar sahifasida guruhga o‘quvchilarni biriktiring.</p>
                    <Link
                      to={`${langPrefix}/groups/${selectedGroupId}`}
                      className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                    >
                      <span>Guruhga o‘quvchi qo‘shish</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Qidiruv bo‘yicha o‘quvchi topilmadi.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {students.some((s) => s.isPaymentBlocked) && (
                      <div className="mb-3 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center justify-between gap-3 text-rose-300">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">🚫</span>
                          <div>
                            <h5 className="text-xs font-black text-rose-200">
                              To'lov muddati o'tgan o'quvchilar mavjud: {students.filter((s) => s.isPaymentBlocked).length} nafar
                            </h5>
                            <p className="text-[11px] text-rose-300/80">
                              Qizil hoshiya bilan belgilangan o'quvchilarning oylik to'lov muddati tugagan. Ular to'lov qilmaguncha darsga kiritilmasin!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {filteredStudents.map((st, idx) => {
                      const currentStatus = attendanceMap[st.id]?.status ?? 1;
                      const currentComment = attendanceMap[st.id]?.comment ?? '';

                      return (
                        <div
                          key={st.id}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 backdrop-blur-md ${
                            st.isPaymentBlocked
                              ? 'bg-rose-950/30 border-rose-600/80 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/50'
                              : currentStatus === 1
                              ? 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-emerald-500/40'
                              : currentStatus === 2
                              ? 'bg-rose-950/15 hover:bg-rose-950/25 border-rose-900/40'
                              : currentStatus === 3
                              ? 'bg-amber-950/15 hover:bg-amber-950/25 border-amber-900/40'
                              : 'bg-purple-950/15 hover:bg-purple-950/25 border-purple-900/40'
                          }`}
                        >
                          {/* Student Info */}
                          <div className="flex items-center gap-3.5">
                            <span className="w-6 text-xs font-bold text-slate-500 text-center">
                              {idx + 1}.
                            </span>
                            <div
                              className={`relative w-11 h-11 rounded-2xl font-black flex items-center justify-center text-sm shrink-0 border ${
                                st.isPaymentBlocked
                                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                  : currentStatus === 1
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : currentStatus === 2
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                  : currentStatus === 3
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                              }`}
                            >
                              {st.firstName ? st.firstName[0] : 'O'}
                              <span
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                                  st.isPaymentBlocked
                                    ? 'bg-rose-600'
                                    : currentStatus === 1
                                    ? 'bg-emerald-500'
                                    : currentStatus === 2
                                    ? 'bg-rose-500'
                                    : currentStatus === 3
                                    ? 'bg-amber-500'
                                    : 'bg-purple-500'
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-sm text-white">
                                  {st.fullName || `${st.firstName} ${st.lastName}`}
                                </h4>
                                {st.isPaymentBlocked && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
                                    🚫 Darsga kiritilmaydi (To'lov muddati o'tgan)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  <span>{st.phoneNumber || 'Telefon raqamsiz'}</span>
                                </span>
                                {st.paidUntil && (
                                  <span className={`text-[10px] ${st.isPaymentBlocked ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                                    • To'lov muddati: {new Date(st.paidUntil).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Admin: Read-only badges | Teacher: Interactive status buttons */}
                          {isAdmin ? (
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span
                                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs ${
                                  currentStatus === 1
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : currentStatus === 2
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : currentStatus === 3
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                }`}
                              >
                                {currentStatus === 1 ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Kelgan</span>
                                  </>
                                ) : currentStatus === 2 ? (
                                  <>
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                    <span>Kelmagan</span>
                                  </>
                                ) : currentStatus === 3 ? (
                                  <>
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <span>Kechikkan</span>
                                  </>
                                ) : (
                                  <>
                                    <HelpCircle className="w-4 h-4 text-purple-400" />
                                    <span>Sababli</span>
                                  </>
                                )}
                              </span>

                              {currentComment && (
                                <span className="text-xs text-slate-300 italic bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
                                  "{currentComment}"
                                </span>
                              )}
                            </div>
                          ) : (
                            /* Teacher Interactive Controls */
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st.id, 1)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                                    currentStatus === 1
                                      ? 'bg-emerald-600 text-white shadow-md scale-105'
                                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Keldi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st.id, 2)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                                    currentStatus === 2
                                      ? 'bg-rose-600 text-white shadow-md scale-105'
                                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                  }`}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Kelmadi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st.id, 3)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                                    currentStatus === 3
                                      ? 'bg-amber-600 text-white shadow-md scale-105'
                                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                  }`}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Kechikdi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st.id, 4)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                                    currentStatus === 4
                                      ? 'bg-purple-600 text-white shadow-md scale-105'
                                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                  }`}
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                  <span>Sababli</span>
                                </button>
                              </div>

                              <div className="w-full sm:w-48">
                                <input
                                  type="text"
                                  value={currentComment}
                                  onChange={(e) => handleCommentChange(st.id, e.target.value)}
                                  placeholder="Sabab yoki izoh..."
                                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Teacher-only Sticky Bottom Save Bar */}
              {!isAdmin && (
                <div className="sticky bottom-4 z-20 flex justify-end">
                  <button
                    onClick={handleSaveAttendance}
                    disabled={saving || !selectedLessonId || students.length === 0}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white text-sm font-black rounded-2xl shadow-xl shadow-blue-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saqlanmoqda...' : '💾 Davomatni Tizimga Saqlash'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const LessonsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const langPrefix = '/' + language.toLowerCase();
  const locale = language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-US' : 'uz-UZ';
  const isAdmin = !user?.role || user.role <= 2;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters and Sorting
  const [descending, setDescending] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  // Delete modal state
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    groupApi
      .getAll({ pageSize: 100 })
      .then((res) => {
        if (res.items) setGroups(res.items);
      })
      .catch(() => {});
  }, []);

  const fetchLessons = (p: number, ps: number, gId?: string, isDesc?: boolean) => {
    setLoading(true);
    lessonApi
      .getAll({ page: p, pageSize: ps, groupId: gId || undefined, descending: isDesc })
      .then((res) => {
        setLessons(res.items || []);
        const total = res.totalCount ?? (res.items || []).length;
        setTotalCount(total);
        setTotalPages(res.totalPages || Math.max(1, Math.ceil(total / ps)));
        setPage(p);
      })
      .catch((err) => {
        console.error('Failed to load lessons', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLessons(page, pageSize, selectedGroupId, descending);
  }, [page, pageSize, selectedGroupId, descending]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;
    try {
      setIsDeleting(true);
      await lessonApi.delete(deleteLessonId);
      setDeleteLessonId(null);
      fetchLessons(page, pageSize, selectedGroupId, descending);
    } catch (err) {
      console.error('Failed to delete lesson', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTeacherName = (name?: string) => {
    if (!name) return '—';
    return name
      .split(' ')
      .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
      .join(' ');
  };

  const filteredLessons = lessons.filter((lesson) => {
    if (statusFilter === 'scheduled' && lesson.status === 2) return false;
    if (statusFilter === 'completed' && lesson.status !== 2) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const topicMatch = (lesson.topic || '').toLowerCase().includes(q);
      const groupMatch = (lesson.groupName || '').toLowerCase().includes(q);
      const teacherMatch = (lesson.teacherName || '').toLowerCase().includes(q);
      if (!topicMatch && !groupMatch && !teacherMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <StartupBanner
        badgeText={t('lessons.badge', 'Akademik Dars Jadvali 📅')}
        title={t('lessons.title', 'Darslar Jadvali Markazi')}
        description={t('lessons.desc', 'Rejalashtirilgan, bugungi va o‘tilgan barcha darslar, xonalar va o‘qituvchilar monitoringi.')}
        icon={<Calendar className="w-6 h-6" />}
        gradientTheme="emerald"
        metrics={[
          { label: t('dash.scheduled_lessons', 'Rejalashtirilgan darslar'), value: `${totalCount} ${t('lessons.count_unit', 'ta')}` },
          { label: t('table.status', 'Holati'), value: t('status.active', 'Faol') },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Link
              to={user?.role === 3 ? `${langPrefix}/teacher/attendance` : `${langPrefix}/attendance`}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>{user?.role && user.role <= 2 ? 'Davomat monitoringi' : t('header.take_attendance', 'Davomat belgilash')}</span>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-800/80 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mavzu, guruh, ustoz..."
              className="w-full bg-slate-800/90 border border-slate-700/80 text-white placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Group Filter */}
          <select
            value={selectedGroupId}
            onChange={(e) => {
              setSelectedGroupId(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto bg-slate-800/90 border border-slate-700/80 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-800/90 border border-slate-700/80 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Barcha holatlar</option>
            <option value="scheduled">Rejalashtirilgan</option>
            <option value="completed">Tugallangan</option>
          </select>
        </div>

        {/* Sort Order Toggle */}
        <button
          type="button"
          onClick={() => {
            setDescending(!descending);
            setPage(1);
          }}
          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          title="Sana tartibini o‘zgartirish"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
          <span>{descending ? 'Oxirgi darslar birinchi ⬇' : '1-darsdan boshlab tartiblash ⬆'}</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text={t('action.loading', 'Darslar jadvali yuklanmoqda...')} />
      ) : lessons.length === 0 ? (
        <StartupEmptyState
          title={language === 'RU' ? 'Расписание уроков пусто' : language === 'EN' ? 'Lesson timetable is empty' : 'Darslar jadvali hali mavjud emas'}
          subtitle={language === 'RU' ? 'Назначьте расписание группам или перейдите к посещаемости.' : language === 'EN' ? 'Assign timetable to groups or proceed to attendance.' : 'Guruhlarga dars jadvallarini biriktiring yoki davomat sahifasiga o‘ting.'}
          onCreateClick={() => navigate(user?.role === 3 ? `${langPrefix}/teacher/groups` : `${langPrefix}/groups`)}
          createButtonText={t('groups.add_new', 'Guruhlar jadvalini sozlash')}
          type="groups"
        />
      ) : (
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6 whitespace-nowrap">{t('table.group', 'Guruh va Fan')}</th>
                  <th className="py-3.5 px-6 min-w-[200px]">{t('teacher.topic', 'Mavzu')}</th>
                  <th className="py-3.5 px-6 whitespace-nowrap">{t('table.teacher', "O'qituvchi")}</th>
                  <th className="py-3.5 px-6 whitespace-nowrap">{t('table.date', 'Sana va Vaqt')}</th>
                  <th className="py-3.5 px-6 text-center whitespace-nowrap">{t('table.attendance', 'Davomat')}</th>
                  <th className="py-3.5 px-6 text-center whitespace-nowrap">{t('table.status', 'Holat')}</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap">{t('table.actions', 'Amallar')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredLessons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Filtr bo‘yicha darslar topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredLessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <strong className="text-white block font-bold text-sm">{lesson.groupName}</strong>
                        {lesson.subjectName && (
                          <span className="text-[11px] text-slate-400 block">{lesson.subjectName}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 min-w-[200px]">
                        <span className="text-slate-200 font-semibold">{lesson.topic}</span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-slate-300 font-medium">
                        {formatTeacherName(lesson.teacherName)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="text-white font-bold block whitespace-nowrap">
                          {new Date(lesson.startTime).toLocaleDateString(locale)}
                        </span>
                        <span className="text-[11px] text-slate-400 block whitespace-nowrap">
                          {new Date(lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(lesson.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className="text-emerald-400 font-bold">{lesson.presentCount}</span> /{' '}
                        <span className="text-slate-400">{lesson.totalStudents}</span>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <Badge variant={lesson.status === 2 ? 'success' : 'warning'}>
                          {lesson.status === 2 ? t('status.completed', 'Tugallangan') : t('status.scheduled', 'Rejalashtirilgan')}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={user?.role === 3 ? `${langPrefix}/teacher/attendance/${lesson.id}` : `${langPrefix}/attendance/${lesson.id}`}
                            className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
                          >
                            {user?.role && user.role <= 2 ? 'Davomatni ko‘rish' : t('action.attend', 'Davomat')}
                          </Link>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteLessonId(lesson.id)}
                              title="Darsni o‘chirish"
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-800/40 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-3 text-slate-400">
              <span>
                Jami <strong className="text-white">{totalCount}</strong> ta darsdan{' '}
                <strong className="text-white">
                  {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, totalCount)}
                </strong>{' '}
                ko‘rsatilmoqda
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-slate-500">Qatorlar:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={5}>5 ta</option>
                  <option value={10}>10 ta</option>
                  <option value={20}>20 ta</option>
                  <option value={50}>50 ta</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Oldingi
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, index, array) => {
                      const prev = array[index - 1];
                      return (
                        <React.Fragment key={p}>
                          {prev && p - prev > 1 && (
                            <span className="px-1 text-slate-600">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePageChange(p)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              page === p
                                ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/30'
                                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Keyingi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteLessonId}
        onClose={() => setDeleteLessonId(null)}
        onConfirm={handleDeleteLesson}
        title="Darsni o‘chirish"
        message="Haqiqatan ham ushbu darsni ro‘yxatdan o‘chirmoqchimisiz? Darsga tegishli davomat va baholar ham o‘chirilishi mumkin."
        confirmText={isDeleting ? 'O‘chirilmoqda...' : 'Ha, o‘chirilsin'}
        cancelText="Bekor qilish"
        isDanger={true}
      />
    </div>
  );
};
