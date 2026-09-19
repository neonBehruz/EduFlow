import axios from 'axios';
import {
  ApiResponse,
  AuthResponse,
  PagedResult,
  Student,
  StudentDetail,
  Teacher,
  Group,
  GroupDetail,
  Subject,
  Lesson,
  Attendance,
  Grade,
  Payment,
  DashboardStats,
  Subscription,
  SubscriptionPlan,
  Organization,
  AttendanceReport,
  PaymentReport,
  StudentReport,
  SuperAdminStats,
  User,
  FinanceSetting,
  PaymentTransaction,
  StudentDiscount,
  CenterExpense,
  PaymentCalculationPreview,
  FinanceSummaryReport,
  TeacherSalaryReportItem,
  ExtendedDashboardStats,
  ParentDashboardDto,
  ParentChildProfileDto,
  ChildProgressDetailDto,
  StudentPortalDashboardDto,
  StudentAttendanceSummaryDto,
  StudentFinanceDto,
  CalendarEventDto,
  ScheduleConflictCheckDto,
  ConflictCheckResultDto,
  RoomDto,
  CreateRoomDto,
  HomeworkDto,
  HomeworkSubmissionDto,
  CreateHomeworkDto,
  SubmitHomeworkDto,
  GradeHomeworkDto,
  LeadDto,
  CreateLeadDto,
  UpdateLeadStatusDto,
  TrialLessonDto,
  ScheduleTrialLessonDto,
  EnrollLeadDto,
  InvoiceDto,
  CreateInvoiceDto,
  ReceiptDataDto,
  TeacherPayrollDto,
  CalculatePayrollRequestDto,
  StudentRiskDto,
  CertificateDto,
  IssueCertificateDto,
  CertificateVerificationResultDto,
  GlobalSearchResultDto,
  BranchDto,
  CreateBranchDto,
  FeedbackDto,
  CreateFeedbackDto,
  ReferralCodeDto,
  ReferralDto,
  AvailableTeacherDto,
} from '../types';

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eduflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eduflow_token');
      localStorage.removeItem('eduflow_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post<ApiResponse<AuthResponse>>('/auth/login', data).then((r) => r.data),
  register: (data: any) => api.post<ApiResponse<AuthResponse>>('/auth/register', data).then((r) => r.data),
  getMe: () => api.get<ApiResponse<User>>('/auth/me').then((r) => r.data),
  updateProfile: (data: { firstName: string; lastName: string; phoneNumber: string; specialization?: string; password?: string }) =>
    api.put<ApiResponse<User>>('/auth/profile', data).then((r) => r.data),
};

export const studentApi = {
  getAll: (params?: { search?: string; groupId?: string; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get<PagedResult<Student>>('/students', { params }).then((r) => r.data),
  getById: (id: string) => api.get<ApiResponse<StudentDetail>>(`/students/${id}`).then((r) => r.data),
  create: (data: any) => api.post<ApiResponse<Student>>('/students', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<ApiResponse<Student>>(`/students/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<boolean>>(`/students/${id}`).then((r) => r.data),
};

export const teacherApi = {
  getAll: (params?: { search?: string; page?: number; pageSize?: number }) =>
    api.get<PagedResult<Teacher>>('/teachers', { params }).then((r) => r.data),
  getById: (id: string) => api.get<ApiResponse<Teacher>>(`/teachers/${id}`).then((r) => r.data),
  create: (data: any) => api.post<ApiResponse<Teacher>>('/teachers', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<ApiResponse<Teacher>>(`/teachers/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<boolean>>(`/teachers/${id}`).then((r) => r.data),
};

export const groupApi = {
  getAll: (params?: { search?: string; subjectId?: string; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get<PagedResult<Group>>('/groups', { params }).then((r) => r.data),
  getById: (id: string) => api.get<ApiResponse<GroupDetail>>(`/groups/${id}`).then((r) => r.data),
  create: (data: any) => api.post<ApiResponse<Group>>('/groups', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<ApiResponse<Group>>(`/groups/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<boolean>>(`/groups/${id}`).then((r) => r.data),
  addStudent: (id: string, studentId: string) =>
    api.post<ApiResponse<boolean>>(`/groups/${id}/students`, { studentId }).then((r) => r.data),
  removeStudent: (id: string, studentId: string) =>
    api.delete<ApiResponse<boolean>>(`/groups/${id}/students/${studentId}`).then((r) => r.data),
  getStudents: (id: string) => api.get<Student[]>(`/groups/${id}/students`).then((r) => r.data),
};

export const userManagementApi = {
  getAll: (params?: { search?: string; role?: number; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get<PagedResult<User>>('/users', { params }).then((r) => r.data),
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data),
  create: (data: any) => api.post<ApiResponse<User>>('/users', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<ApiResponse<User>>(`/users/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<boolean>>(`/users/${id}`).then((r) => r.data),
};

export const subjectApi = {
  getAll: () => api.get<Subject[]>('/subjects').then((r) => r.data),
  getById: (id: string) => api.get<ApiResponse<Subject>>(`/subjects/${id}`).then((r) => r.data),
  create: (data: any) => api.post<ApiResponse<Subject>>('/subjects', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<ApiResponse<Subject>>(`/subjects/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<boolean>>(`/subjects/${id}`).then((r) => r.data),
};

export const courseApi = subjectApi;

export const lessonApi = {
  getAll: (params?: { groupId?: string; date?: string; page?: number; pageSize?: number }) =>
    api.get<PagedResult<Lesson>>('/lessons', { params }).then((r) => r.data),
  getToday: () => api.get<Lesson[]>('/lessons/today').then((r) => r.data),
  getById: (id: string) => api.get<ApiResponse<Lesson>>(`/lessons/${id}`).then((r) => r.data),
  create: (data: any) => api.post<ApiResponse<Lesson>>('/lessons', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<ApiResponse<Lesson>>(`/lessons/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<boolean>>(`/lessons/${id}`).then((r) => r.data),
  getOrCreateToday: (groupId: string) =>
    api.post<ApiResponse<Lesson>>(`/lessons/get-or-create-today/${groupId}`).then((r) => r.data),
};

export const attendanceApi = {
  getByLesson: (lessonId: string) => api.get<Attendance[]>(`/attendance/lesson/${lessonId}`).then((r) => r.data),
  mark: (data: any) => api.post<ApiResponse<Attendance>>('/attendance', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<ApiResponse<Attendance>>(`/attendance/${id}`, data).then((r) => r.data),
  saveBulk: (data: { lessonId: string; items: { studentId: string; status: number; comment?: string }[] }) =>
    api.post<ApiResponse<boolean>>('/attendance/bulk', data).then((r) => r.data),
};

export const gradeApi = {
  getByStudent: (studentId: string) => api.get<Grade[]>(`/grades/student/${studentId}`).then((r) => r.data),
  getByLesson: (lessonId: string) => api.get<Grade[]>(`/grades/lesson/${lessonId}`).then((r) => r.data),
  add: (data: any) => api.post<ApiResponse<Grade>>('/grades', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<ApiResponse<Grade>>(`/grades/${id}`, data).then((r) => r.data),
  saveBulk: (data: { lessonId: string; items: { studentId: string; score: number; comment?: string }[] }) =>
    api.post<ApiResponse<boolean>>('/grades/bulk', data).then((r) => r.data),
};

export const paymentApi = {
  getAll: (params?: { status?: number; studentId?: string; page?: number; pageSize?: number }) =>
    api.get<PagedResult<Payment>>('/payments', { params }).then((r) => r.data),
  getOverdue: () => api.get<Payment[]>('/payments/overdue').then((r) => r.data),
  getUpcoming: () => api.get<Payment[]>('/payments/upcoming').then((r) => r.data),
  create: (data: any) => api.post<ApiResponse<Payment>>('/payments', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<ApiResponse<Payment>>(`/payments/${id}`, data).then((r) => r.data),
  markAsPaid: (id: string) => api.post<ApiResponse<boolean>>(`/payments/${id}/mark-paid`).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<boolean>>(`/payments/${id}`).then((r) => r.data),
};

export const financeApi = {
  getSettings: () => api.get<ApiResponse<FinanceSetting>>('/finance/settings').then((r) => r.data),
  updateSettings: (data: Partial<FinanceSetting>) =>
    api.put<ApiResponse<FinanceSetting>>('/finance/settings', data).then((r) => r.data),
  preview: (params: { studentId: string; groupId?: string; customDiscountPercent?: number }) =>
    api.get<ApiResponse<PaymentCalculationPreview>>('/finance/preview', { params }).then((r) => r.data),
  addTransaction: (data: { paymentId: string; amount: number; method: number; idempotencyKey?: string; notes?: string }) =>
    api.post<ApiResponse<PaymentTransaction>>('/finance/transactions', data).then((r) => r.data),
  getTransactions: (paymentId: string) =>
    api.get<ApiResponse<PaymentTransaction[]>>(`/finance/payments/${paymentId}/transactions`).then((r) => r.data),
  getDiscounts: (studentId?: string) =>
    api.get<ApiResponse<StudentDiscount[]>>('/finance/discounts', { params: { studentId } }).then((r) => r.data),
  createDiscount: (data: { studentId: string; discountPercentage: number; startDate: string; endDate?: string; reason: string }) =>
    api.post<ApiResponse<StudentDiscount>>('/finance/discounts', data).then((r) => r.data),
  deleteDiscount: (id: string) =>
    api.delete<ApiResponse<boolean>>(`/finance/discounts/${id}`).then((r) => r.data),
  getExpenses: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<CenterExpense[]>>('/finance/expenses', { params }).then((r) => r.data),
  createExpense: (data: { category: string; amount: number; expenseDate: string; description: string }) =>
    api.post<ApiResponse<CenterExpense>>('/finance/expenses', data).then((r) => r.data),
  deleteExpense: (id: string) =>
    api.delete<ApiResponse<boolean>>(`/finance/expenses/${id}`).then((r) => r.data),
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<FinanceSummaryReport>>('/finance/summary', { params }).then((r) => r.data),
  getTeacherSalaries: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<TeacherSalaryReportItem[]>>('/finance/teachers-salary', { params }).then((r) => r.data),
  sendPaymentReminderSms: (paymentId: string) =>
    api.post<ApiResponse<boolean>>(`/finance/payments/${paymentId}/send-reminder-sms`).then((r) => r.data),
  updatePromiseDate: (paymentId: string, data: { newDueDate: string; note?: string }) =>
    api.put<ApiResponse<Payment>>(`/finance/payments/${paymentId}/promise-date`, data).then((r) => r.data),
};

export const dashboardApi = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard').then((r) => r.data),
};

export const reportApi = {
  getAttendance: (params?: { startDate?: string; endDate?: string; groupId?: string }) =>
    api.get<ApiResponse<AttendanceReport>>('/reports/attendance', { params }).then((r) => r.data),
  getPayments: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<PaymentReport>>('/reports/payments', { params }).then((r) => r.data),
  getStudents: () => api.get<ApiResponse<StudentReport>>('/reports/students').then((r) => r.data),
};

export const settingsApi = {
  getOrganization: () => api.get<ApiResponse<Organization>>('/settings/organization').then((r) => r.data),
  updateOrganization: (data: any) => api.put<ApiResponse<Organization>>('/settings/organization', data).then((r) => r.data),
  getSubscription: () => api.get<ApiResponse<Subscription>>('/settings/subscription').then((r) => r.data),
  getPlans: () => api.get<SubscriptionPlan[]>('/settings/plans').then((r) => r.data),
  upgradePlan: (planId: string) => api.post<ApiResponse<boolean>>(`/settings/upgrade/${planId}`).then((r) => r.data),
};

export const telegramApi = {
  connect: (data: { parentId: string; chatId: string; username?: string }) =>
    api.post<ApiResponse<boolean>>('/telegram/connect', data).then((r) => r.data),
  send: (data: { parentId: string; message: string }) =>
    api.post<ApiResponse<boolean>>('/telegram/send', data).then((r) => r.data),
  getStatus: (parentId: string) =>
    api.get<ApiResponse<{ isConnected: boolean; chatId?: string; username?: string }>>(`/telegram/status/${parentId}`).then((r) => r.data),
};

export const superAdminApi = {
  getStats: () => api.get<ApiResponse<SuperAdminStats>>('/admin/stats').then((r) => r.data),
  getOrganizations: () => api.get<any[]>('/admin/organizations').then((r) => r.data),
  toggleStatus: (id: string) => api.post<ApiResponse<boolean>>(`/admin/organizations/${id}/toggle`).then((r) => r.data),
  changePlan: (id: string, planId: string) =>
    api.post<ApiResponse<boolean>>(`/admin/organizations/${id}/plan/${planId}`).then((r) => r.data),
};

export const extendedDashboardApi = {
  getStats: (params?: { startDate?: string; endDate?: string; branchId?: string }) =>
    api.get<ApiResponse<ExtendedDashboardStats>>('/extended-dashboard', { params }).then((r) => r.data),
};

export const parentPortalApi = {
  getDashboard: () => api.get<ApiResponse<ParentDashboardDto>>('/portal/parent/dashboard').then((r) => r.data),
  getChildProfile: (studentId: string) =>
    api.get<ApiResponse<ParentChildProfileDto>>(`/portal/parent/children/${studentId}`).then((r) => r.data),
  getChildProgress: (studentId: string) =>
    api.get<ApiResponse<ParentChildProfileDto>>(`/portal/parent/children/${studentId}`).then((r) => r.data),
};

export const studentPortalApi = {
  getDashboard: () => api.get<ApiResponse<StudentPortalDashboardDto>>('/portal/student/dashboard').then((r) => r.data),
  getMyHomework: () => api.get<ApiResponse<HomeworkDto[]>>('/portal/student/homework').then((r) => r.data),
  submitHomework: (homeworkId: string, data: SubmitHomeworkDto) =>
    api.post<ApiResponse<HomeworkSubmissionDto>>(`/portal/student/homework/${homeworkId}/submit`, data).then((r) => r.data),
  getMyCertificates: () => api.get<ApiResponse<CertificateDto[]>>('/portal/student/certificates').then((r) => r.data),
  getAvailableTeachers: () => api.get<ApiResponse<AvailableTeacherDto[]>>('/portal/student/available-teachers').then((r) => r.data),
  enrollInGroup: (groupId: string) => api.post<ApiResponse<boolean>>('/portal/student/enroll', { groupId }).then((r) => r.data),
  leaveGroup: (groupId: string) => api.post<ApiResponse<boolean>>('/portal/student/leave', { groupId }).then((r) => r.data),
  getAttendanceHistory: () => api.get<ApiResponse<StudentAttendanceSummaryDto>>('/portal/student/attendance').then((r) => r.data),
  getFinances: () => api.get<ApiResponse<StudentFinanceDto>>('/portal/student/finances').then((r) => r.data),
  getCalendar: (params?: { start?: string; end?: string }) =>
    api.get<ApiResponse<CalendarEventDto[]>>('/portal/student/calendar', { params }).then((r) => r.data),
};

export const calendarApi = {
  getEvents: (params: { start: string; end: string; teacherId?: string; roomId?: string; groupId?: string; branchId?: string }) =>
    api.get<ApiResponse<CalendarEventDto[]>>('/calendar/events', { params }).then((r) => r.data),
  checkConflict: (data: ScheduleConflictCheckDto) =>
    api.post<ApiResponse<ConflictCheckResultDto>>('/calendar/check-conflict', data).then((r) => r.data),
};

export const roomApi = {
  getAll: (params?: { branchId?: string; status?: number }) =>
    api.get<ApiResponse<RoomDto[]>>('/rooms', { params }).then((r) => r.data),
  getById: (id: string) => api.get<ApiResponse<RoomDto>>(`/rooms/${id}`).then((r) => r.data),
  create: (data: CreateRoomDto) => api.post<ApiResponse<RoomDto>>('/rooms', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateRoomDto>) => api.put<ApiResponse<RoomDto>>(`/rooms/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<boolean>>(`/rooms/${id}`).then((r) => r.data),
};

export const homeworkApi = {
  getByGroup: (groupId: string) => api.get<ApiResponse<HomeworkDto[]>>(`/homework/group/${groupId}`).then((r) => r.data),
  getById: (id: string) => api.get<ApiResponse<HomeworkDto>>(`/homework/${id}`).then((r) => r.data),
  create: (data: CreateHomeworkDto) => api.post<ApiResponse<HomeworkDto>>('/homework', data).then((r) => r.data),
  getSubmissions: (homeworkId: string) =>
    api.get<ApiResponse<HomeworkSubmissionDto[]>>(`/homework/${homeworkId}/submissions`).then((r) => r.data),
  gradeSubmission: (submissionId: string, data: GradeHomeworkDto) =>
    api.post<ApiResponse<HomeworkSubmissionDto>>(`/homework/submissions/${submissionId}/grade`, data).then((r) => r.data),
};

export const progressApi = {
  getStudentProgress: (studentId: string) =>
    api.get<ApiResponse<ChildProgressDetailDto>>(`/progress/student/${studentId}`).then((r) => r.data),
};

export const crmApi = {
  getLeads: (params?: { status?: number; search?: string }) =>
    api.get<ApiResponse<LeadDto[]>>('/crm/leads', { params }).then((r) => r.data),
  createLead: (data: CreateLeadDto) => api.post<ApiResponse<LeadDto>>('/crm/leads', data).then((r) => r.data),
  updateLeadStatus: (id: string, data: UpdateLeadStatusDto) =>
    api.put<ApiResponse<LeadDto>>(`/crm/leads/${id}/status`, data).then((r) => r.data),
  scheduleTrialLesson: (data: ScheduleTrialLessonDto) =>
    api.post<ApiResponse<TrialLessonDto>>('/crm/trial-lessons', data).then((r) => r.data),
  getTrialLessons: (params?: { date?: string }) =>
    api.get<ApiResponse<TrialLessonDto[]>>('/crm/trial-lessons', { params }).then((r) => r.data),
  enrollLead: (id: string, data: EnrollLeadDto) =>
    api.post<ApiResponse<Student>>(`/crm/leads/${id}/enroll`, data).then((r) => r.data),
};

export const riskApi = {
  getRisks: (params?: { riskLevel?: string; groupId?: string }) =>
    api.get<ApiResponse<StudentRiskDto[]>>('/risk/analysis', { params }).then((r) => r.data),
};

export const invoiceApi = {
  getAll: (params?: { status?: number; studentId?: string }) =>
    api.get<ApiResponse<InvoiceDto[]>>('/invoices', { params }).then((r) => r.data),
  create: (data: CreateInvoiceDto) => api.post<ApiResponse<InvoiceDto>>('/invoices', data).then((r) => r.data),
  getReceipt: (paymentId: string) =>
    api.get<ApiResponse<ReceiptDataDto>>(`/invoices/receipt/${paymentId}`).then((r) => r.data),
};

export const payrollApi = {
  getPayrolls: (params?: { year?: number; month?: number; teacherId?: string }) =>
    api.get<ApiResponse<TeacherPayrollDto[]>>('/payroll', { params }).then((r) => r.data),
  calculate: (data: CalculatePayrollRequestDto) =>
    api.post<ApiResponse<TeacherPayrollDto>>('/payroll/calculate', data).then((r) => r.data),
  markPaid: (id: string, notes?: string) =>
    api.post<ApiResponse<boolean>>(`/payroll/${id}/pay`, { notes }).then((r) => r.data),
};

export const certificateApi = {
  getAll: (params?: { studentId?: string; groupId?: string }) =>
    api.get<ApiResponse<CertificateDto[]>>('/certificates', { params }).then((r) => r.data),
  issue: (data: IssueCertificateDto) => api.post<ApiResponse<CertificateDto>>('/certificates', data).then((r) => r.data),
  verifyPublic: (code: string) =>
    api.get<ApiResponse<CertificateVerificationResultDto>>(`/certificates/verify/${code}`).then((r) => r.data),
};

export const searchApi = {
  search: (query: string, entityType?: string) =>
    api.get<ApiResponse<GlobalSearchResultDto>>('/search', { params: { query, entityType } }).then((r) => r.data),
};

export const branchApi = {
  getAll: () => api.get<ApiResponse<BranchDto[]>>('/branches').then((r) => r.data),
  create: (data: CreateBranchDto) => api.post<ApiResponse<BranchDto>>('/branches', data).then((r) => r.data),
};

export const feedbackApi = {
  getAll: () => api.get<ApiResponse<FeedbackDto[]>>('/feedback').then((r) => r.data),
  submit: (data: CreateFeedbackDto) => api.post<ApiResponse<FeedbackDto>>('/feedback', data).then((r) => r.data),
};

export const referralApi = {
  getMyCode: () => api.get<ApiResponse<ReferralCodeDto>>('/referrals/my-code').then((r) => r.data),
  getReferrals: () => api.get<ApiResponse<ReferralDto[]>>('/referrals').then((r) => r.data),
};

export const fileApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ fileUrl: string; originalName: string }>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export default api;
