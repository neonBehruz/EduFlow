import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentApi, groupApi, teacherApi } from '../../services/api';
import { Student, Group, Teacher } from '../../types';
import { Modal, ConfirmModal, Badge, LoadingSpinner, Pagination, PageHeader } from '../../components/common/UIComponents';
import { StartupBanner } from '../../components/common/StartupBanner';
import { StartupEmptyState } from '../../components/common/StartupEmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Search, Eye, Edit2, Trash2, Phone, Users, GraduationCap, BookOpen, CheckCircle2, Clock, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Assign Student to Group & Teacher modal state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignStudent, setAssignStudent] = useState<Student | null>(null);
  const [assignTeacherId, setAssignTeacherId] = useState<string>('');
  const [assignGroupId, setAssignGroupId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [applications, setApplications] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthDate: '',
    parentFullName: '',
    parentPhoneNumber: '',
    groupId: '',
    login: '',
    password: '',
  });
  const [formError, setFormError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentApi.getAll({
        search: search || undefined,
        groupId: selectedGroup || undefined,
        page,
        pageSize: 10,
      });
      setStudents(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Students fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = () => {
    try {
      const raw = localStorage.getItem('eduflow_course_applications');
      if (raw) {
        setApplications(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    groupApi.getAll({ pageSize: 100 }).then((res) => setGroups(res.items));
    teacherApi.getAll({ pageSize: 100 }).then((res) => setTeachers(res.items));
    loadApplications();

    const handleStorageChange = () => loadApplications();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('eduflow_application_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('eduflow_application_updated', handleStorageChange);
    };
  }, []);

  const openAssignModal = (student: Student, defaultTeacherId?: string, defaultGroupId?: string) => {
    setAssignStudent(student);
    setFormError('');
    if (defaultTeacherId) {
      setAssignTeacherId(defaultTeacherId);
    } else if (teachers.length > 0) {
      setAssignTeacherId(teachers[0].id);
    } else {
      setAssignTeacherId('');
    }
    if (defaultGroupId) {
      setAssignGroupId(defaultGroupId);
    } else {
      const tGroups = groups.filter((g) => !defaultTeacherId || g.teacherId === defaultTeacherId);
      setAssignGroupId(tGroups.length > 0 ? tGroups[0].id : (groups.length > 0 ? groups[0].id : ''));
    }
    setIsAssignOpen(true);
  };

  const handleAssignStudentToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStudent || !assignGroupId) return;
    setAssigning(true);
    setFormError('');
    try {
      await groupApi.addStudent(assignGroupId, assignStudent.id);

      const rawApps = localStorage.getItem('eduflow_course_applications');
      if (rawApps) {
        try {
          const apps = JSON.parse(rawApps);
          const updated = apps.map((app: any) =>
            (app.studentId === assignStudent.id || app.studentPhone === assignStudent.phoneNumber)
              ? { ...app, status: 'enrolled', enrolledGroupId: assignGroupId }
              : app
          );
          localStorage.setItem('eduflow_course_applications', JSON.stringify(updated));
          setApplications(updated);
        } catch (e) {}
      }

      const targetGroup = groups.find((g) => g.id === assignGroupId);
      const targetTeacher = teachers.find((t) => t.id === assignTeacherId) ||
        (targetGroup ? teachers.find((t) => t.id === targetGroup.teacherId) : null);

      setToastMessage({
        type: 'success',
        text: `${assignStudent.fullName} muvaffaqiyatli "${targetGroup?.name || 'Guruh'}" guruhi va ustoz ${targetTeacher?.fullName || targetGroup?.teacherName || 'o‘qituvchi'}ga biriktirildi!`,
      });
      setTimeout(() => setToastMessage(null), 5000);

      setIsAssignOpen(false);
      setAssignStudent(null);
      setAssignGroupId('');
      setAssignTeacherId('');
      fetchStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'O‘quvchini guruhga biriktirishda xatolik yuz berdi.');
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, selectedGroup]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    if (!teacherId) return;
    const teacherGroups = groups.filter((g) => g.teacherId === teacherId);
    if (teacherGroups.length > 0) {
      if (!formData.groupId || !teacherGroups.some((g) => g.id === formData.groupId)) {
        setFormData((prev) => ({ ...prev, groupId: teacherGroups[0].id }));
      }
    } else {
      setFormData((prev) => ({ ...prev, groupId: '' }));
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setFormData((prev) => ({ ...prev, groupId }));
    const grp = groups.find((g) => g.id === groupId);
    if (grp && grp.teacherId) {
      setSelectedTeacherId(grp.teacherId);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await studentApi.create({
        ...formData,
        groupId: formData.groupId || undefined,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : undefined,
        login: formData.login.trim() || undefined,
        password: formData.password || undefined,
      });
      setIsCreateOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        birthDate: '',
        parentFullName: '',
        parentPhoneNumber: '',
        groupId: '',
        login: '',
        password: '',
      });
      setSelectedTeacherId('');
      fetchStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.message || (language === 'RU' ? 'Ошибка при добавлении студента.' : language === 'EN' ? 'Error adding student.' : "O'quvchi qo'shishda xatolik yuz berdi."));
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormError('');
    try {
      await studentApi.update(selectedStudent.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : undefined,
        parentFullName: formData.parentFullName,
        parentPhoneNumber: formData.parentPhoneNumber,
        groupId: formData.groupId || undefined,
        isActive: selectedStudent.isActive,
      });
      setIsEditOpen(false);
      fetchStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.message || (language === 'RU' ? 'Ошибка при обновлении студента.' : language === 'EN' ? 'Error updating student.' : "O'quvchini yangilashda xatolik yuz berdi."));
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    try {
      await studentApi.delete(selectedStudent.id);
      setIsDeleteOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      console.error('Delete student error', err);
    }
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    const matchedGroup = groups.find((g) => student.groupNames?.includes(g.name) || (student as any).groupIds?.includes(g.id));
    const initialGroupId = matchedGroup?.id || (student as any).groupIds?.[0] || '';
    const initialTeacherId = matchedGroup?.teacherId || '';
    setSelectedTeacherId(initialTeacherId);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      phoneNumber: student.phoneNumber,
      birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
      parentFullName: student.parentName || '',
      parentPhoneNumber: student.parentPhone || '',
      groupId: initialGroupId,
      login: '',
      password: '',
    });
    setIsEditOpen(true);
  };

  const pendingApps = applications.filter((a) => a.status === 'pending');

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

      {/* Course Applications Alert Banner */}
      {pendingApps.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 border border-blue-500/30 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0050cb] text-white flex items-center justify-center font-bold shrink-0 shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Yangi kursga yozilish arizalari ({pendingApps.length} ta)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                  Kutilmoqda
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                O‘quvchilar kursga yozilish arizasi topshirdi. Ularni guruh va mas'ul o‘qituvchiga biriktiring.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {pendingApps.map((app: any) => (
              <div
                key={app.id}
                className="flex items-center gap-3 px-3.5 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 rounded-2xl shadow-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {app.studentName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#0050cb] dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/50">
                      {app.courseName}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    {app.preferredTime && <span>⏰ {app.preferredTime}</span>}
                    {app.preferredTeacherName && <span>👤 Ustoz: {app.preferredTeacherName}</span>}
                    {app.note && <span className="italic max-w-xs truncate">"{app.note}"</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const matchedStudent = students.find(
                      (s) =>
                        s.id === app.studentId ||
                        s.phoneNumber === app.studentPhone ||
                        s.fullName.toLowerCase().includes(app.studentName?.toLowerCase() || '')
                    ) || students[0] || ({
                      id: app.studentId || '00000000-0000-0000-0000-000000000001',
                      firstName: app.studentName?.split(' ')[0] || 'O‘quvchi',
                      lastName: app.studentName?.split(' ')[1] || '',
                      fullName: app.studentName || 'O‘quvchi',
                      phoneNumber: app.studentPhone || '+998 90 000 00 00',
                      groupNames: [],
                    } as any);
                    openAssignModal(matchedStudent, app.preferredTeacherId, app.preferredGroupId);
                  }}
                  className="px-3 py-1.5 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0 ml-1"
                >
                  <span>Guruhga bog‘lash</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Dynamic Startup Banner Header */}
      <StartupBanner
        title={t('students.title', 'O‘quvchilar Boshqaruvi')}
        description={t('students.desc', 'O‘quv markazingizdagi barcha o‘quvchilar, guruhlar taqsimoti, ota-onalar bilan aloqa va oylik davomat monitoringi.')}
        icon={<Users className="w-6 h-6" />}
        gradientTheme="blue"
        metrics={[
          { label: t('students.total_enrolled', 'Jami ro‘yxatda'), value: `${totalCount} ${t('dash.students_unit', 'ta')}` },
          { label: t('students.active_groups', 'Faol guruhlar'), value: `${groups.length} ${t('dash.students_unit', 'ta')}` },
          { label: t('students.tg_integration', 'Telegram integratsiya'), value: t('status.active', 'Faol') },
        ]}
        actions={
          <button
            onClick={() => {
              setFormData({ firstName: '', lastName: '', phoneNumber: '', birthDate: '', parentFullName: '', parentPhoneNumber: '', groupId: '', login: '', password: '' });
              setIsCreateOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#0050cb] to-[#0066ff] hover:from-[#003fa4] hover:to-[#0050cb] text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('students.add_new', 'Yangi o‘quvchi qo‘shish')}</span>
          </button>
        }
      />

      {/* Filters & Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('students.search_placeholder', 'Ism, familiya yoki telefon...')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 focus:border-[#0050cb]"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 focus:border-[#0050cb]"
            >
              <option value="">{t('students.all_groups', 'Barcha guruhlar')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table or Interactive Startup Empty State */}
      <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden backdrop-blur-md">
        {loading ? (
          <LoadingSpinner text={t('students.loading', "O'quvchilar ro'yxati yuklanmoqda...")} />
        ) : students.length === 0 ? (
          <div className="p-4 sm:p-6">
            <StartupEmptyState
              title={t('students.empty_title', 'Birinchi o‘quvchingizni qo‘shing yoki Demo ma’lumotlarni sinab ko‘ring!')}
              subtitle={t('students.empty_sub', 'Yangi o‘quvchi ro‘yxatdan o‘tgach, uning davomati, to‘lovlari va ota-onasi bilan muloqoti avtomatik boshqariladi.')}
              onCreateClick={() => setIsCreateOpen(true)}
              createButtonText={t('students.add_new', 'Yangi o‘quvchi qo‘shish')}
              onDemoLoaded={fetchStudents}
              type="students"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">{t('table.student', "O'quvchi")}</th>
                  <th className="py-3.5 px-6">{t('table.group', 'Guruhlar')}</th>
                  <th className="py-3.5 px-6">{t('table.parent', 'Ota-ona')}</th>
                  <th className="py-3.5 px-6 text-center">{t('table.attendance', 'Davomat')}</th>
                  <th className="py-3.5 px-6 text-center">{t('dash.average_grade', "O'rtacha Baho")}</th>
                  <th className="py-3.5 px-6 text-center">{t('table.status', "To'lov Holati")}</th>
                  <th className="py-3.5 px-6 text-right">{t('table.actions', 'Amallar')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center font-bold text-xs shrink-0">
                          {st.firstName[0]}
                        </div>
                        <div>
                          <Link
                            to={`/students/${st.id}`}
                            className="font-bold text-slate-800 hover:text-[#0050cb] transition-colors block"
                          >
                            {st.fullName}
                          </Link>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {st.phoneNumber}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {st.groupNames.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {st.groupNames.map((g, idx) => (
                            <Badge key={idx} variant="info">
                              {g}
                            </Badge>
                          ))}
                          <button
                            onClick={() => openAssignModal(st)}
                            title="Yana guruhga qo‘shish"
                            className="p-1 text-[#0050cb] hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAssignModal(st)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#0050cb] dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Guruhga bog‘lash</span>
                        </button>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      {st.parentName ? (
                        <div>
                          <span className="font-semibold text-slate-700 block">{st.parentName}</span>
                          <span className="text-[10px] text-slate-400">{st.parentPhone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="font-bold text-slate-800">{st.attendancePercentage}%</span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="font-bold text-slate-800">{st.averageGrade > 0 ? st.averageGrade : '—'}</span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      {st.currentPaymentStatus === 2 ? (
                        <Badge variant="success">{t('status.paid', "To'langan")}</Badge>
                      ) : st.currentPaymentStatus === 3 ? (
                        <Badge variant="danger">{t('status.overdue', 'Qarzdor')}</Badge>
                      ) : (
                        <Badge variant="warning">{t('status.pending', 'Kutilmoqda')}</Badge>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAssignModal(st)}
                          title="Guruh va O‘qituvchiga bog‘lash"
                          className="p-1.5 text-[#0050cb] hover:text-white hover:bg-[#0050cb] rounded-lg transition-colors cursor-pointer"
                        >
                          <GraduationCap className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/students/${st.id}`}
                          title={t('action.details', "Ko'rish")}
                          className="p-1.5 text-slate-400 hover:text-[#0050cb] hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(st)}
                          title={t('action.edit', 'Tahrirlash')}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(st);
                            setIsDeleteOpen(true);
                          }}
                          title={t('action.delete', "O'chirish")}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Create Modal */}
      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        title={t('students.modal_add_title', "Yangi o'quvchi qo'shish")}
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">{formError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('students.first_name', 'Ism')} *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('students.last_name', 'Familiya')} *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('table.phone', 'Telefon raqam')} *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+998 90 123 45 67"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'RU' ? 'Дата рождения' : language === 'EN' ? 'Date of Birth' : "Tug'ilgan sana"}
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
              />
            </div>
          </div>

          {/* Teacher & Group Binding Section */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#0050cb]" />
                <span>O‘qituvchi va Guruhga biriktirish</span>
              </span>
              {selectedTeacherId && (
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                  {groups.filter((g) => g.teacherId === selectedTeacherId).length} ta guruh
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Select Teacher */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  1. O‘qituvchini tanlang
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => handleTeacherSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
                >
                  <option value="">Barcha o‘qituvchilar</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} {t.specialization ? `(${t.specialization})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Select Group */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  2. Guruhni tanlang
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => handleGroupSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
                >
                  <option value="">Guruh tanlanmagan</option>
                  {(selectedTeacherId
                    ? groups.filter((g) => g.teacherId === selectedTeacherId)
                    : groups
                  ).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.subjectName || 'Fan'} ({g.teacherName || 'Ustozsiz'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTeacherId && groups.filter((g) => g.teacherId === selectedTeacherId).length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200">
                ⚠️ Tanlangan o‘qituvchiga hali guruh biriktirilmagan. Guruhlar bo‘limida yangi guruh ochib biriktiring.
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              {language === 'RU' ? 'Данные родителей' : language === 'EN' ? 'Parent details' : "Ota-ona ma'lumotlari"}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('students.parent_name', 'Ota-ona F.I.SH')}
                </label>
                <input
                  type="text"
                  value={formData.parentFullName}
                  onChange={(e) => setFormData({ ...formData, parentFullName: e.target.value })}
                  placeholder="Otabek Rahimov"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('students.parent_phone', 'Ota-ona telefoni')}
                </label>
                <input
                  type="tel"
                  value={formData.parentPhoneNumber}
                  onChange={(e) => setFormData({ ...formData, parentPhoneNumber: e.target.value })}
                  placeholder="+998 90 999 88 77"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>🔑</span> Tizimga kirish logini va paroli (ixtiyoriy)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Login (nom yoki email)
                </label>
                <input
                  type="text"
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  placeholder="masalan: jasurbek yoki jasur@eduflow.uz"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Parol
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="•••••••• (kamida 4 ta belgi)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Oddiy nom (masalan: <code className="text-[#0050cb]">jasurbek</code>) yoki email kiritishingiz mumkin. O'quvchi ushbu login va parol orqali o'z kabinetiga kiradi.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t('action.cancel', 'Bekor qilish')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t('action.save', 'Saqlash')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        title={t('students.modal_edit_title', "O'quvchi ma'lumotlarini tahrirlash")}
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">{formError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('students.first_name', 'Ism')} *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('students.last_name', 'Familiya')} *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('table.phone', 'Telefon raqam')} *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'RU' ? 'Дата рождения' : language === 'EN' ? 'Date of Birth' : "Tug'ilgan sana"}
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Teacher & Group Binding Section in Edit */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#0050cb]" />
                <span>O‘qituvchi va Guruhni o‘zgartirish</span>
              </span>
              {selectedTeacherId && (
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                  {groups.filter((g) => g.teacherId === selectedTeacherId).length} ta guruh
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Select Teacher */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  1. O‘qituvchini tanlang
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => handleTeacherSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
                >
                  <option value="">Barcha o‘qituvchilar</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} {t.specialization ? `(${t.specialization})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Select Group */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  2. Guruhni tanlang
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => handleGroupSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
                >
                  <option value="">Guruh tanlanmagan</option>
                  {(selectedTeacherId
                    ? groups.filter((g) => g.teacherId === selectedTeacherId)
                    : groups
                  ).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.subjectName || 'Fan'} ({g.teacherName || 'Ustozsiz'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTeacherId && groups.filter((g) => g.teacherId === selectedTeacherId).length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200">
                ⚠️ Tanlangan o‘qituvchiga hali guruh biriktirilmagan. Guruhlar bo‘limida yangi guruh ochib biriktiring.
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              {language === 'RU' ? 'Данные родителей' : language === 'EN' ? 'Parent details' : "Ota-ona ma'lumotlari"}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('students.parent_name', 'Ota-ona F.I.SH')}
                </label>
                <input
                  type="text"
                  value={formData.parentFullName}
                  onChange={(e) => setFormData({ ...formData, parentFullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('students.parent_phone', 'Ota-ona telefoni')}
                </label>
                <input
                  type="tel"
                  value={formData.parentPhoneNumber}
                  onChange={(e) => setFormData({ ...formData, parentPhoneNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t('action.cancel', 'Bekor qilish')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t('action.save', 'Yangilash')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteStudent}
        title={t('students.modal_delete_title', "O'quvchini o'chirish")}
        message={t('students.delete_confirm', "Haqiqatan ham ushbu o'quvchini tizimdan o'chirmoqchimisiz?")}
        confirmText={t('action.delete', "O'chirish")}
        cancelText={t('action.cancel', 'Bekor qilish')}
        isDanger
      />

      {/* Assign Student to Group & Teacher Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false);
          setAssignStudent(null);
        }}
        title="O‘quvchini Guruh va O‘qituvchiga bog‘lash"
      >
        <form onSubmit={handleAssignStudentToGroup} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs">
              {formError}
            </div>
          )}

          {/* Student Profile Info Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0050cb] text-white flex items-center justify-center font-bold text-sm">
                {(assignStudent?.firstName || 'O')[0]}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {assignStudent?.fullName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {assignStudent?.phoneNumber}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400 block">Joriy guruhlar:</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {assignStudent?.groupNames.length ? assignStudent.groupNames.join(', ') : 'Guruhsiz'}
              </span>
            </div>
          </div>

          {/* Step 1: Select Teacher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#0050cb]" />
              <span>1-Qadam: O‘qituvchini tanlang *</span>
            </label>
            <select
              value={assignTeacherId}
              onChange={(e) => {
                const newTId = e.target.value;
                setAssignTeacherId(newTId);
                const teacherGroups = groups.filter((g) => !newTId || g.teacherId === newTId);
                setAssignGroupId(teacherGroups.length > 0 ? teacherGroups[0].id : (groups.length > 0 ? groups[0].id : ''));
              }}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
            >
              <option value="">O‘qituvchini tanlang...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.specialization || 'O‘qituvchi'}) — {groups.filter((g) => g.teacherId === t.id).length} ta guruh
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0050cb]" />
              <span>2-Qadam: Guruhni tanlang *</span>
            </label>
            <select
              value={assignGroupId}
              onChange={(e) => {
                const gId = e.target.value;
                setAssignGroupId(gId);
                const grp = groups.find((g) => g.id === gId);
                if (grp && grp.teacherId && grp.teacherId !== assignTeacherId) {
                  setAssignTeacherId(grp.teacherId);
                }
              }}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
            >
              <option value="">Guruhni tanlang...</option>
              {groups
                .filter((g) => !assignTeacherId || g.teacherId === assignTeacherId)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.subjectName || 'Fan'} | {g.scheduleDescription || 'Jadval'} ({g.room || 'Xona'})
                  </option>
                ))}
            </select>
          </div>

          {/* Step 3: Selected Group Details Preview */}
          {assignGroupId && (() => {
            const grp = groups.find((g) => g.id === assignGroupId);
            const tch = teachers.find((t) => t.id === (grp?.teacherId || assignTeacherId));
            if (!grp) return null;

            return (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-900/50 pb-2">
                  <span className="font-extrabold text-[#0050cb] dark:text-blue-300">
                    {grp.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-[#0050cb] dark:text-blue-300 font-bold text-[10px]">
                    {grp.subjectName || 'Fan'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    <span>Ustoz: <strong className="text-slate-800 dark:text-white">{tch?.fullName || grp.teacherName || '—'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Vaqti: <strong className="text-slate-800 dark:text-white">{grp.scheduleDescription || 'Du, Chor, Jum'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>Sig'im: <strong className="text-slate-800 dark:text-white">{grp.enrolledStudentsCount ?? (grp as any).studentCount ?? 0} / {grp.maxStudents || 15} nafar</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>Oylik to'lov: <strong className="text-slate-800 dark:text-white">{(grp.monthlyFee || 450000).toLocaleString()} so'm</strong></span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Modal Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAssignOpen(false);
                setAssignStudent(null);
              }}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={assigning || !assignGroupId}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#0050cb] hover:bg-[#003fa4] rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{assigning ? 'Biriktirilmoqda...' : 'Guruh va O‘qituvchiga biriktirish'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
