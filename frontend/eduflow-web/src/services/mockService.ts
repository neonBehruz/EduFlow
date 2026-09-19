import {
  ApiResponse,
  AuthResponse,
  DashboardStats,
  ExtendedDashboardStats,
  Group,
  GroupDetail,
  PagedResult,
  Student,
  StudentDetail,
  Subject,
  Teacher,
  User,
  Organization,
  Lesson,
  Payment,
  Grade,
  SubscriptionPlan,
  SuperAdminStats,
  LeadDto,
  RoomDto,
  BranchDto,
  InvoiceDto,
  TeacherPayrollDto,
  StudentRiskDto,
  AttendanceReport,
  PaymentReport,
  StudentReport,
  FinanceSetting,
  FinanceSummaryReport,
  CenterExpense,
  TeacherSalaryReportItem,
  CalendarEventDto,
  Subscription,
  CertificateDto,
  HomeworkDto,
  AvailableTeacherDto,
  StudentAttendanceSummaryDto,
  ParentDashboardDto,
  StudentPortalDashboardDto,
} from '../types';

const DEMO_ORG: Organization = {
  id: 'org-demo-1',
  name: 'SmartEdu O\'quv Markazi',
  phone: '+998 71 200 00 01',
  email: 'info@smartedu.uz',
  address: 'Toshkent sh., Yunusobod t., Amir Temur shox ko\'chasi 45',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const DEMO_PLANS: SubscriptionPlan[] = [
  { id: 'plan-1', name: 'FREE', monthlyPrice: 0, maxStudents: 20, maxTeachers: 2, maxGroups: 3, hasTelegram: false, hasReports: false, hasAdvancedAnalytics: false },
  { id: 'plan-2', name: 'STARTER', monthlyPrice: 190000, maxStudents: 100, maxTeachers: 8, maxGroups: 15, hasTelegram: true, hasReports: true, hasAdvancedAnalytics: false },
  { id: 'plan-3', name: 'PRO', monthlyPrice: 390000, maxStudents: 500, maxTeachers: 30, maxGroups: 50, hasTelegram: true, hasReports: true, hasAdvancedAnalytics: true },
];

const DEMO_SUBSCRIPTION: Subscription = {
  id: 'sub-demo-1',
  organizationId: 'org-demo-1',
  subscriptionPlanId: 'plan-3',
  planName: 'PRO',
  startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
  endDate: new Date(Date.now() + 335 * 86400000).toISOString(),
  status: 2,
  autoRenew: true,
  currentStudentsCount: 48,
  currentTeachersCount: 6,
  currentGroupsCount: 8,
  plan: DEMO_PLANS[2],
};

const DEMO_USERS_LIST: User[] = [
  { id: 'usr-admin-1', organizationId: 'org-demo-1', firstName: 'Behruz', lastName: 'Admin', email: 'admin@smartedu.uz', phoneNumber: '+998 90 123 45 67', role: 1, isActive: true },
  { id: 'usr-teacher-1', organizationId: 'org-demo-1', firstName: 'Rustam', lastName: 'Ahmedov', email: 'teacher@smartedu.uz', phoneNumber: '+998 93 555 44 33', role: 3, isActive: true },
  { id: 'usr-teacher-2', organizationId: 'org-demo-1', firstName: 'Dilshod', lastName: 'Yusupov', email: 'dilshod@smartedu.uz', phoneNumber: '+998 90 111 22 33', role: 3, isActive: true },
  { id: 'usr-teacher-3', organizationId: 'org-demo-1', firstName: 'Zarina', lastName: 'Umarova', email: 'zarina@smartedu.uz', phoneNumber: '+998 91 222 33 44', role: 3, isActive: true },
  { id: 'usr-parent-1', organizationId: 'org-demo-1', firstName: 'Sobir', lastName: 'Qodirov', email: 'parent@eduflow.uz', phoneNumber: '+998 90 999 11 22', role: 4, isActive: true },
  { id: 'usr-student-1', organizationId: 'org-demo-1', firstName: 'Alisher', lastName: 'Qodirov', email: 'student@eduflow.uz', phoneNumber: '+998 97 777 88 99', role: 5, isActive: true },
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'subj-1', organizationId: 'org-demo-1', name: 'Ingliz tili (General English)', description: 'Boshlang\'ichdan B2 darajagacha', isActive: true, durationWeeks: 24, price: 450000, groupsCount: 4 },
  { id: 'subj-2', organizationId: 'org-demo-1', name: 'IELTS Intensive', description: '7.5+ ball uchun intensiv tayyorlov', isActive: true, durationWeeks: 12, price: 650000, groupsCount: 3 },
  { id: 'subj-3', organizationId: 'org-demo-1', name: 'Matematika & Mental arifmetika', description: 'Prezident maktabiga tayyorgarlik', isActive: true, durationWeeks: 36, price: 400000, groupsCount: 3 },
  { id: 'subj-4', organizationId: 'org-demo-1', name: 'Frontend Web Dasturlash (React)', description: 'HTML, CSS, JS, TypeScript, React', isActive: true, durationWeeks: 24, price: 800000, groupsCount: 2 },
];

const INITIAL_TEACHERS: Teacher[] = [
  { id: 'usr-teacher-1', organizationId: 'org-demo-1', fullName: 'Rustam Ahmedov', phoneNumber: '+998 93 555 44 33', specialization: 'IELTS Instructor (Band 8.5)', groupsCount: 4 },
  { id: 'usr-teacher-2', organizationId: 'org-demo-1', fullName: 'Dilshod Yusupov', phoneNumber: '+998 90 111 22 33', specialization: 'Senior Frontend Developer', groupsCount: 3 },
  { id: 'usr-teacher-3', organizationId: 'org-demo-1', fullName: 'Zarina Umarova', phoneNumber: '+998 91 222 33 44', specialization: 'Matematika fani o\'qituvchisi', groupsCount: 3 },
];

const INITIAL_GROUPS: Group[] = [
  { id: 'grp-1', organizationId: 'org-demo-1', name: 'IELTS Band 7.0+', subjectId: 'subj-2', subjectName: 'IELTS Intensive', teacherId: 'usr-teacher-1', teacherName: 'Rustam Ahmedov', room: '204-xona', scheduleDescription: 'Dush-Chor-Jum 14:00 - 16:00', maxStudents: 15, enrolledStudentsCount: 12, isActive: true, monthlyFee: 650000 },
  { id: 'grp-2', organizationId: 'org-demo-1', name: 'General English Intermediate', subjectId: 'subj-1', subjectName: 'Ingliz tili (General English)', teacherId: 'usr-teacher-1', teacherName: 'Rustam Ahmedov', room: '102-xona', scheduleDescription: 'Sesh-Pay-Shan 10:00 - 12:00', maxStudents: 14, enrolledStudentsCount: 14, isActive: true, monthlyFee: 450000 },
  { id: 'grp-3', organizationId: 'org-demo-1', name: 'React Frontend Bootcamp', subjectId: 'subj-4', subjectName: 'Frontend Web Dasturlash (React)', teacherId: 'usr-teacher-2', teacherName: 'Dilshod Yusupov', room: 'Lab-1', scheduleDescription: 'Dush-Chor-Jum 18:30 - 20:30', maxStudents: 12, enrolledStudentsCount: 11, isActive: true, monthlyFee: 800000 },
  { id: 'grp-4', organizationId: 'org-demo-1', name: 'Prezident Maktabi Tayyorgarlik', subjectId: 'subj-3', subjectName: 'Matematika & Mental arifmetika', teacherId: 'usr-teacher-3', teacherName: 'Zarina Umarova', room: '105-xona', scheduleDescription: 'Sesh-Pay-Shan 15:00 - 17:00', maxStudents: 15, enrolledStudentsCount: 11, isActive: true, monthlyFee: 400000 },
];

const INITIAL_STUDENTS: Student[] = [
  { id: 'std-1', organizationId: 'org-demo-1', firstName: 'Alisher', lastName: 'Qodirov', fullName: 'Alisher Qodirov', phoneNumber: '+998 97 777 88 99', birthDate: '2008-04-12', enrollmentDate: '2025-09-01', parentName: 'Sobir Qodirov', parentPhone: '+998 90 999 11 22', isActive: true, averageGrade: 92, attendancePercentage: 96, currentPaymentStatus: 2, groupNames: ['IELTS Band 7.0+'] },
  { id: 'std-2', organizationId: 'org-demo-1', firstName: 'Malika', lastName: 'Karimova', fullName: 'Malika Karimova', phoneNumber: '+998 90 234 56 78', birthDate: '2007-11-20', enrollmentDate: '2025-10-15', parentName: 'Gulnora Karimova', parentPhone: '+998 90 234 56 70', isActive: true, averageGrade: 88, attendancePercentage: 92, currentPaymentStatus: 2, groupNames: ['React Frontend Bootcamp'] },
  { id: 'std-3', organizationId: 'org-demo-1', firstName: 'Bobur', lastName: 'Mirzayev', fullName: 'Bobur Mirzayev', phoneNumber: '+998 93 345 67 89', birthDate: '2009-02-05', enrollmentDate: '2025-08-20', parentName: 'Anvar Mirzayev', parentPhone: '+998 93 345 67 80', isActive: true, averageGrade: 79, attendancePercentage: 84, currentPaymentStatus: 3, groupNames: ['Prezident Maktabi Tayyorgarlik'] },
  { id: 'std-4', organizationId: 'org-demo-1', firstName: 'Jasur', lastName: 'Rahimov', fullName: 'Jasur Rahimov', phoneNumber: '+998 94 456 78 90', birthDate: '2008-07-18', enrollmentDate: '2025-11-01', parentName: 'Nodir Rahimov', parentPhone: '+998 94 456 78 00', isActive: true, averageGrade: 95, attendancePercentage: 98, currentPaymentStatus: 2, groupNames: ['IELTS Band 7.0+', 'React Frontend Bootcamp'] },
  { id: 'std-5', organizationId: 'org-demo-1', firstName: 'Nilufar', lastName: 'Saidova', fullName: 'Nilufar Saidova', phoneNumber: '+998 99 567 89 01', birthDate: '2009-09-30', enrollmentDate: '2025-12-10', parentName: 'Shahlo Saidova', parentPhone: '+998 99 567 89 00', isActive: true, averageGrade: 85, attendancePercentage: 90, currentPaymentStatus: 1, groupNames: ['General English Intermediate'] },
  { id: 'std-6', organizationId: 'org-demo-1', firstName: 'Sardor', lastName: 'Ergashev', fullName: 'Sardor Ergashev', phoneNumber: '+998 91 678 90 12', birthDate: '2008-01-14', enrollmentDate: '2026-01-05', parentName: 'Botir Ergashev', parentPhone: '+998 91 678 90 00', isActive: true, averageGrade: 90, attendancePercentage: 94, currentPaymentStatus: 2, groupNames: ['React Frontend Bootcamp'] },
];

const INITIAL_LESSONS: Lesson[] = [
  { id: 'les-1', groupId: 'grp-1', groupName: 'IELTS Band 7.0+', subjectName: 'IELTS Intensive', teacherName: 'Rustam Ahmedov', startTime: '14:00', endTime: '16:00', topic: 'Task 2 Essay Writing & Cohesion', status: 1, totalStudents: 12, presentCount: 11, absentCount: 1 },
  { id: 'les-2', groupId: 'grp-3', groupName: 'React Frontend Bootcamp', subjectName: 'Frontend Web Dasturlash', teacherName: 'Dilshod Yusupov', startTime: '18:30', endTime: '20:30', topic: 'Zustand & React Query State Management', status: 1, totalStudents: 11, presentCount: 10, absentCount: 1 },
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: 'pay-1', studentId: 'std-1', studentName: 'Alisher Qodirov', amount: 650000, paidAmount: 650000, debtAmount: 0, groupName: 'IELTS Band 7.0+', status: 2, dueDate: '2026-03-25', createdAt: new Date().toISOString() },
  { id: 'pay-2', studentId: 'std-2', studentName: 'Malika Karimova', amount: 800000, paidAmount: 800000, debtAmount: 0, groupName: 'React Frontend Bootcamp', status: 2, dueDate: '2026-03-25', createdAt: new Date().toISOString() },
  { id: 'pay-3', studentId: 'std-3', studentName: 'Bobur Mirzayev', amount: 400000, paidAmount: 0, debtAmount: 400000, groupName: 'Prezident Maktabi Tayyorgarlik', status: 3, dueDate: '2026-03-10', createdAt: new Date().toISOString() },
];

const INITIAL_ROOMS: RoomDto[] = [
  { id: 'rm-1', name: '101-Auditoriya', number: '101', capacity: 18, type: 1, status: 1, equipment: 'Smart Doska, Konditsioner' },
  { id: 'rm-2', name: '102-Auditoriya', number: '102', capacity: 16, type: 1, status: 1, equipment: 'Proyektor, Wi-Fi' },
  { id: 'rm-3', name: 'Lab-1 IT Laboratoriya', number: '201', capacity: 15, type: 2, status: 1, equipment: '15 ta iMac, Yuqori tezlikdagi internet' },
  { id: 'rm-4', name: '204-Auditoriya', number: '204', capacity: 20, type: 1, status: 1, equipment: 'Akustik tizim, Proyektor' },
];

const INITIAL_BRANCHES: BranchDto[] = [
  { id: 'br-1', name: 'Bosh Filial (Amir Temur)', address: 'Toshkent sh., Amir Temur shox ko\'chasi 45', phone: '+998 71 200 00 01', isActive: true, roomsCount: 4, groupsCount: 8 },
  { id: 'br-2', name: 'Chilonzor Filiali', address: 'Toshkent sh., Chilonzor 9-mavze, 12-uy', phone: '+998 71 200 00 02', isActive: true, roomsCount: 2, groupsCount: 4 },
];

const INITIAL_LEADS: LeadDto[] = [
  { id: 'lead-1', fullName: 'Javohir Toshmatov', phoneNumber: '+998 90 123 00 11', interestedSubjectId: 'subj-2', interestedSubjectName: 'IELTS Intensive', status: 1, source: 1, createdAt: new Date().toISOString(), trialLessonsCount: 0 },
  { id: 'lead-2', fullName: 'Shaxnoza Aliyeva', phoneNumber: '+998 93 456 00 22', interestedSubjectId: 'subj-4', interestedSubjectName: 'Frontend Web Dasturlash (React)', status: 2, source: 2, createdAt: new Date().toISOString(), trialLessonsCount: 1 },
  { id: 'lead-3', fullName: 'Kamron Usmonov', phoneNumber: '+998 97 789 00 33', interestedSubjectId: 'subj-1', interestedSubjectName: 'Ingliz tili (General English)', status: 3, source: 1, createdAt: new Date().toISOString(), trialLessonsCount: 1 },
];

const INITIAL_INVOICES: InvoiceDto[] = [
  { id: 'inv-1', invoiceNumber: 'INV-2026-001', studentId: 'std-1', studentName: 'Alisher Qodirov', groupName: 'IELTS Band 7.0+', amount: 650000, billingPeriod: '2026-03', issueDate: '2026-03-01', dueDate: '2026-03-25', status: 2, paidDate: '2026-03-05' },
  { id: 'inv-2', invoiceNumber: 'INV-2026-002', studentId: 'std-2', studentName: 'Malika Karimova', groupName: 'React Frontend Bootcamp', amount: 800000, billingPeriod: '2026-03', issueDate: '2026-03-01', dueDate: '2026-03-25', status: 2, paidDate: '2026-03-04' },
  { id: 'inv-3', invoiceNumber: 'INV-2026-003', studentId: 'std-3', studentName: 'Bobur Mirzayev', groupName: 'Prezident Maktabi Tayyorgarlik', amount: 400000, billingPeriod: '2026-03', issueDate: '2026-03-01', dueDate: '2026-03-10', status: 3 },
];

const INITIAL_RISKS: StudentRiskDto[] = [
  {
    studentId: 'std-3',
    studentName: 'Bobur Mirzayev',
    phoneNumber: '+998 93 345 67 89',
    groupNames: ['Prezident Maktabi Tayyorgarlik'],
    riskLevel: 'HIGH',
    attendanceRate: 72,
    unexcusedAbsences: 3,
    averageGrade: 68,
    overduePaymentDays: 14,
    riskReasons: ["Ketma-ket 3 ta dars qoldirilgan", "To'lov muddati 14 kunga o'tgan", "O'rtacha baho pasaygan (68 ball)"],
    lastAttendedDate: '2026-03-05',
  },
  {
    studentId: 'std-5',
    studentName: 'Nilufar Saidova',
    phoneNumber: '+998 99 567 89 01',
    groupNames: ['General English Intermediate'],
    riskLevel: 'MEDIUM',
    attendanceRate: 85,
    unexcusedAbsences: 1,
    averageGrade: 78,
    overduePaymentDays: 0,
    riskReasons: ["So'nggi darsda qatnashmagan", "Uyga vazifalar kechikmoqda"],
    lastAttendedDate: '2026-03-12',
  },
];

const INITIAL_PAYROLLS: TeacherPayrollDto[] = [
  { id: 'pr-1', teacherId: 'usr-teacher-1', teacherName: 'Rustam Ahmedov', year: 2026, month: 3, calculationType: 2, lessonsTaught: 24, studentsCount: 38, totalRevenue: 22500000, sharePercentage: 25, calculatedSalary: 5625000, paidAmount: 5625000, remainingAmount: 0, paidDate: '2026-03-05' },
  { id: 'pr-2', teacherId: 'usr-teacher-2', teacherName: 'Dilshod Yusupov', year: 2026, month: 3, calculationType: 2, lessonsTaught: 24, studentsCount: 26, totalRevenue: 18400000, sharePercentage: 30, calculatedSalary: 5520000, paidAmount: 0, remainingAmount: 5520000 },
  { id: 'pr-3', teacherId: 'usr-teacher-3', teacherName: 'Zarina Umarova', year: 2026, month: 3, calculationType: 2, lessonsTaught: 24, studentsCount: 24, totalRevenue: 9600000, sharePercentage: 20, calculatedSalary: 1920000, paidAmount: 0, remainingAmount: 1920000 },
];

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(`eduflow_mock_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

export function handleMockApiRequest(url: string, method: string, data?: any): any | null {
  const normUrl = url.replace(/^\/api/, '').split('?')[0];
  const m = method.toLowerCase();

  // 1. Auth: Login
  if (normUrl === '/auth/login' && m === 'post') {
    const req = typeof data === 'string' ? JSON.parse(data) : data || {};
    const email = (req.email || req.login || '').toLowerCase().trim();

    const matchedUser = DEMO_USERS_LIST.find((u) => u.email.toLowerCase() === email) || DEMO_USERS_LIST[0];
    const resp: ApiResponse<AuthResponse> = {
      success: true,
      message: 'Muvaffaqiyatli kirdingiz (Demo rejim)',
      errors: [],
      data: {
        token: `demo-jwt-token-${matchedUser.role}-${Date.now()}`,
        refreshToken: 'demo-refresh-token',
        user: matchedUser,
        organization: DEMO_ORG,
      },
    };
    return { data: resp, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  // 2. Auth: Me
  if (normUrl === '/auth/me') {
    const storedUser = localStorage.getItem('eduflow_user');
    const user: User = storedUser ? JSON.parse(storedUser) : DEMO_USERS_LIST[0];
    return {
      data: { success: true, message: '', errors: [], data: user },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 3. Dashboard Stats (/dashboard or /dashboard/stats)
  if (normUrl === '/dashboard' || normUrl === '/dashboard/stats') {
    const stats: DashboardStats = {
      studentsCount: 48,
      teachersCount: 6,
      groupsCount: 8,
      todayLessonsCount: 6,
      presentToday: 42,
      absentToday: 2,
      lateToday: 1,
      pendingPaymentsCount: 5,
      overduePaymentsCount: 3,
      monthlyRevenue: 24800000,
      attendanceRate: 94,
      todayLessons: INITIAL_LESSONS,
      recentPayments: INITIAL_PAYMENTS,
      overduePayments: INITIAL_PAYMENTS.filter((p) => p.status === 3),
      monthlyRevenueChart: [
        { month: 'Okt', amount: 18500000 },
        { month: 'Noy', amount: 20100000 },
        { month: 'Dek', amount: 22400000 },
        { month: 'Yan', amount: 21800000 },
        { month: 'Fev', amount: 23600000 },
        { month: 'Mart', amount: 24800000 },
      ],
      studentGrowthChart: [
        { month: 'Okt', count: 32 },
        { month: 'Noy', count: 36 },
        { month: 'Dek', count: 40 },
        { month: 'Yan', count: 42 },
        { month: 'Fev', count: 45 },
        { month: 'Mart', count: 48 },
      ],
    };
    return {
      data: { success: true, message: '', errors: [], data: stats },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 4. Extended Dashboard Stats
  if (normUrl === '/extended-dashboard' || normUrl === '/dashboard/extended') {
    const extStats: ExtendedDashboardStats = {
      periodLabel: 'Oxirgi 30 kun',
      startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
      endDate: new Date().toISOString(),
      totalStudentsCount: 48,
      activeStudentsCount: 45,
      newEnrolledInPeriod: 8,
      churnedStudentsCount: 1,
      teachersCount: 6,
      activeGroupsCount: 8,
      totalLessonsInPeriod: 96,
      completedLessonsInPeriod: 94,
      attendanceRatePercentage: 94,
      averageStudentGrade: 88,
      totalExpectedRevenue: 26500000,
      totalCollectedRevenue: 24800000,
      totalOutstandingDebt: 1700000,
      totalTeacherPayrollPaid: 9500000,
      centerNetRevenue: 15300000,
      openLeadsCount: 12,
      trialLessonsCount: 2,
      conversionRatePercentage: 68,
      highRiskStudentsCount: 2,
      roomsCount: 6,
      roomOccupancyRatePercentage: 78,
      revenueTrend: [
        { date: '2026-03-01', label: '1-hafta', amount: 5800000 },
        { date: '2026-03-08', label: '2-hafta', amount: 6200000 },
        { date: '2026-03-15', label: '3-hafta', amount: 6500000 },
        { date: '2026-03-22', label: '4-hafta', amount: 6300000 },
      ],
      attendanceTrend: [
        { date: '2026-03-01', label: 'Dush', rate: 96 },
        { date: '2026-03-02', label: 'Sesh', rate: 92 },
        { date: '2026-03-03', label: 'Chor', rate: 95 },
        { date: '2026-03-04', label: 'Pay', rate: 91 },
        { date: '2026-03-05', label: 'Jum', rate: 97 },
      ],
      studentGrowthTrend: [
        { date: '2026-01', label: 'Yan', count: 42 },
        { date: '2026-02', label: 'Fev', count: 45 },
        { date: '2026-03', label: 'Mart', count: 48 },
      ],
    };
    return {
      data: { success: true, message: '', errors: [], data: extStats },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 5. SuperAdmin Stats & Organizations
  if (normUrl === '/admin/stats') {
    const sStats: SuperAdminStats = {
      totalOrganizations: 14,
      activeOrganizations: 13,
      trialOrganizations: 1,
      totalStudents: 1540,
      totalMonthlyRevenue: 42800000,
      recentOrganizations: [
        { id: 'org-demo-1', name: 'SmartEdu O\'quv Markazi', email: 'info@smartedu.uz', phone: '+998 71 200 00 01', isActive: true, planName: 'PRO', subscriptionStatus: 2, createdAt: '2025-01-15' },
        { id: 'org-demo-2', name: 'Cambridge Education Center', email: 'cambridge@edu.uz', phone: '+998 90 123 45 67', isActive: true, planName: 'PRO', subscriptionStatus: 2, createdAt: '2025-03-20' },
      ],

    };
    return {
      data: { success: true, message: '', errors: [], data: sStats },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl === '/admin/organizations') {
    const orgs = [
      { id: 'org-demo-1', name: 'SmartEdu O\'quv Markazi', email: 'info@smartedu.uz', phone: '+998 71 200 00 01', planName: 'PRO', isActive: true, createdAt: '2025-01-15' },
      { id: 'org-demo-2', name: 'Cambridge Education Center', email: 'cambridge@edu.uz', phone: '+998 90 123 45 67', planName: 'PRO', isActive: true, createdAt: '2025-03-20' },
      { id: 'org-demo-3', name: 'Genius Kids Academy', email: 'genius@edu.uz', phone: '+998 93 234 56 78', planName: 'STARTER', isActive: true, createdAt: '2025-06-10' },
      { id: 'org-demo-4', name: 'IT Park School Tashkent', email: 'itschool@edu.uz', phone: '+998 99 345 67 89', planName: 'PRO', isActive: true, createdAt: '2025-09-01' },
      { id: 'org-demo-5', name: 'FastTrack English Studio', email: 'fasttrack@edu.uz', phone: '+998 97 456 78 90', planName: 'FREE', isActive: false, createdAt: '2025-11-18' },
    ];
    return { data: orgs, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  // 6. Settings: Plans, Organization, Subscription
  if (normUrl === '/settings/plans') {
    return { data: DEMO_PLANS, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  if (normUrl === '/settings/organization') {
    return {
      data: { success: true, message: '', errors: [], data: DEMO_ORG },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl === '/settings/subscription') {
    return {
      data: { success: true, message: '', errors: [], data: DEMO_SUBSCRIPTION },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 7. Users Management (/users)
  if (normUrl === '/users' && m === 'get') {
    const users = getStored<User[]>('users', DEMO_USERS_LIST);
    const paged: PagedResult<User> = {
      items: users,
      totalCount: users.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return { data: paged, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  // 8. Students
  if (normUrl === '/students' && m === 'get') {
    const students = getStored<Student[]>('students', INITIAL_STUDENTS);
    const paged: PagedResult<Student> = {
      items: students,
      totalCount: students.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return { data: paged, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  if (normUrl.startsWith('/students/') && m === 'get') {
    const id = normUrl.replace('/students/', '');
    const students = getStored<Student[]>('students', INITIAL_STUDENTS);
    const std = students.find((s) => s.id === id) || students[0];
    const stdDetail: StudentDetail = {
      ...std,
      parent: {
        id: 'parent-1',
        fullName: std.parentName || 'Sobir Qodirov',
        phoneNumber: std.parentPhone || '+998 90 999 11 22',
        isTelegramConnected: true,
      },
      groups: [
        { id: 'grp-1', name: std.groupNames[0] || 'IELTS Band 7.0+', subjectName: 'Ingliz tili', teacherName: 'Rustam Ahmedov' },
      ],
      recentAttendances: [
        { id: 'att-1', lessonId: 'les-1', studentId: std.id, studentName: std.fullName, status: 1, lessonDate: '2026-03-16T14:00:00Z', comment: 'Darsda faol qatnashdi' },
        { id: 'att-2', lessonId: 'les-2', studentId: std.id, studentName: std.fullName, status: 1, lessonDate: '2026-03-14T14:00:00Z', comment: '' },
      ],
      recentGrades: [
        { id: 'grd-1', lessonId: 'les-1', studentId: std.id, studentName: std.fullName, subjectName: 'Ingliz tili', score: 95, comment: 'Lug\'at testi', createdAt: '2026-03-16T15:30:00Z' },
        { id: 'grd-2', lessonId: 'les-2', studentId: std.id, studentName: std.fullName, subjectName: 'Ingliz tili', score: 90, comment: 'Speaking amaliyoti', createdAt: '2026-03-14T15:30:00Z' },
      ],
      recentPayments: [
        { id: 'pay-1', studentId: std.id, studentName: std.fullName, amount: 650000, paidAmount: 650000, debtAmount: 0, status: 2, dueDate: '2026-03-25', description: 'Mart oyi to\'lovi', createdAt: '2026-03-05' },
      ],
    };
    return {
      data: {
        success: true,
        message: '',
        errors: [],
        data: stdDetail,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 9. Groups
  if (normUrl === '/groups' && m === 'get') {
    const groups = getStored<Group[]>('groups', INITIAL_GROUPS);
    const paged: PagedResult<Group> = {
      items: groups,
      totalCount: groups.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return { data: paged, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  if (normUrl.startsWith('/groups/') && m === 'get') {
    const sub = normUrl.replace('/groups/', '');
    if (sub.includes('/students')) {
      const students = getStored<Student[]>('students', INITIAL_STUDENTS);
      return { data: students, status: 200, statusText: 'OK', headers: {}, config: {} };
    }
    const id = sub.split('/')[0];
    const groups = getStored<Group[]>('groups', INITIAL_GROUPS);
    const grp = groups.find((g) => g.id === id) || groups[0];
    const detail: GroupDetail = {
      ...grp,
      students: INITIAL_STUDENTS.slice(0, 4),
      recentLessons: INITIAL_LESSONS,
    };
    return {
      data: { success: true, message: '', errors: [], data: detail },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 10. Teachers
  if (normUrl === '/teachers' && m === 'get') {
    const teachers = getStored<Teacher[]>('teachers', INITIAL_TEACHERS);
    const paged: PagedResult<Teacher> = {
      items: teachers,
      totalCount: teachers.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return { data: paged, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  // 11. Subjects / Courses
  if (normUrl === '/subjects' || normUrl === '/courses') {
    const subjects = getStored<Subject[]>('subjects', INITIAL_SUBJECTS);
    return { data: subjects, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  // 12. Lessons
  if (normUrl.includes('/lessons')) {
    if (normUrl === '/lessons/today') {
      return { data: INITIAL_LESSONS, status: 200, statusText: 'OK', headers: {}, config: {} };
    }
    const paged: PagedResult<Lesson> = {
      items: INITIAL_LESSONS,
      totalCount: INITIAL_LESSONS.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return { data: paged, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  // 13. Attendance
  if (normUrl.includes('/attendance')) {
    const att = INITIAL_STUDENTS.map((st, idx) => ({
      id: `att-${idx}`,
      lessonId: 'les-1',
      studentId: st.id,
      studentName: st.fullName,
      status: idx === 2 ? 2 : 1, // 1: Present, 2: Absent
      recordedAt: new Date().toISOString(),
    }));
    return { data: att, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  // 14. Grades
  if (normUrl.startsWith('/grades')) {
    const grades: Grade[] = INITIAL_STUDENTS.map((st, i) => ({
      id: `grd-${i}`,
      lessonId: 'les-1',
      studentId: st.id,
      studentName: st.fullName,
      subjectName: 'IELTS Intensive',
      score: 85 + ((i * 3) % 15),
      comment: 'Yaxshi faollik',
      createdAt: new Date().toISOString(),
    }));
    return { data: grades, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  // 15. Homework
  if (normUrl.startsWith('/homework')) {
    const hws: HomeworkDto[] = [
      {
        id: 'hw-1',
        groupId: 'grp-1',
        groupName: 'IELTS Band 7.0+',
        teacherId: 'usr-teacher-1',
        teacherName: 'Rustam Ahmedov',
        title: 'Writing Task 2: Opinion Essay',
        description: 'Mavzu: "Some people believe that university education should be free for all students." Kamida 250 so\'z.',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        maxScore: 100,
        submissionsCount: 8,
        gradedCount: 6,
      },
      {
        id: 'hw-2',
        groupId: 'grp-3',
        groupName: 'React Frontend Bootcamp',
        teacherId: 'usr-teacher-2',
        teacherName: 'Dilshod Yusupov',
        title: 'TypeScript va React Hooks amaliyoti',
        description: 'Custom useLocalStorage va useDebounce hooklarini yozish va formda sinab ko\'rish.',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        maxScore: 100,
        submissionsCount: 10,
        gradedCount: 9,
      },
    ];
    return {
      data: { success: true, message: '', errors: [], data: hws },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 16. Certificates
  if (normUrl.startsWith('/certificates') && m === 'get') {
    const certs: CertificateDto[] = [
      {
        id: 'cert-1',
        certificateNumber: 'EDU-2026-001',
        verificationCode: 'VERIFY-78901',
        studentId: 'std-1',
        studentName: 'Alisher Qodirov',
        courseName: 'IELTS Intensive (Band 7.5)',
        levelName: 'Advanced (C1)',
        finalGrade: 92,
        issueDate: '2026-03-01',
        qrCodeData: '',
      },
      {
        id: 'cert-2',
        certificateNumber: 'EDU-2026-002',
        verificationCode: 'VERIFY-78902',
        studentId: 'std-2',
        studentName: 'Malika Karimova',
        courseName: 'Frontend Web Dasturlash (React)',
        levelName: 'Professional',
        finalGrade: 95,
        issueDate: '2026-02-28',
        qrCodeData: '',
      },
    ];
    return {
      data: { success: true, message: '', errors: [], data: certs },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 17. Certificate Verification
  if (normUrl.startsWith('/verify/') || normUrl.includes('/certificates/verify/')) {
    const code = normUrl.split('/').pop() || 'VERIFY-78901';
    return {
      data: {
        success: true,
        message: '',
        errors: [],
        data: {
          isValid: true,
          certificateNumber: 'EDU-2026-001',
          verificationCode: code,
          studentName: 'Alisher Qodirov',
          courseName: 'IELTS Intensive (Band 7.5)',
          levelName: 'Advanced (C1)',
          finalGrade: 92,
          issueDate: '2026-03-01',
          organizationName: 'SmartEdu O\'quv Markazi',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 18. Payments
  if (normUrl === '/payments') {
    const paged: PagedResult<Payment> = {
      items: INITIAL_PAYMENTS,
      totalCount: INITIAL_PAYMENTS.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    return { data: paged, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  if (normUrl === '/payments/overdue') {
    return { data: INITIAL_PAYMENTS.filter((p) => p.status === 3), status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  if (normUrl === '/payments/upcoming') {
    return { data: INITIAL_PAYMENTS, status: 200, statusText: 'OK', headers: {}, config: {} };
  }

  // 19. CRM: Leads
  if (normUrl.includes('/crm/leads')) {
    return {
      data: { success: true, message: '', errors: [], data: INITIAL_LEADS },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 20. Rooms & Branches
  if (normUrl.includes('/rooms')) {
    return {
      data: { success: true, message: '', errors: [], data: INITIAL_ROOMS },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/branches')) {
    return {
      data: { success: true, message: '', errors: [], data: INITIAL_BRANCHES },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 21. Invoices
  if (normUrl.includes('/invoices')) {
    return {
      data: { success: true, message: '', errors: [], data: INITIAL_INVOICES },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 22. Payroll
  if (normUrl.includes('/payroll')) {
    return {
      data: { success: true, message: '', errors: [], data: INITIAL_PAYROLLS },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 23. Risk Analysis
  if (normUrl.includes('/risk')) {
    return {
      data: { success: true, message: '', errors: [], data: INITIAL_RISKS },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 24. Reports
  if (normUrl.includes('/reports/attendance')) {
    const attReport: AttendanceReport = {
      totalLessons: 96,
      totalPresent: 864,
      totalAbsent: 48,
      totalLate: 24,
      totalExcused: 12,
      attendancePercentage: 94,
      groupSummaries: [
        { groupId: 'grp-1', groupName: 'IELTS Band 7.0+', totalRecords: 240, presentCount: 230, percentage: 96 },
        { groupId: 'grp-2', groupName: 'General English Intermediate', totalRecords: 280, presentCount: 260, percentage: 93 },
        { groupId: 'grp-3', groupName: 'React Frontend Bootcamp', totalRecords: 220, presentCount: 210, percentage: 95 },
      ],
    };
    return {
      data: { success: true, message: '', errors: [], data: attReport },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/reports/payments')) {
    const payReport: PaymentReport = {
      totalPaid: 24800000,
      totalPending: 2400000,
      totalOverdue: 1200000,
      paidTransactionsCount: 38,
      pendingTransactionsCount: 4,
      overdueTransactionsCount: 2,
      monthlyTrend: [
        { month: 'Okt', amount: 18500000 },
        { month: 'Noy', amount: 20100000 },
        { month: 'Dek', amount: 22400000 },
        { month: 'Yan', amount: 21800000 },
        { month: 'Fev', amount: 23600000 },
        { month: 'Mart', amount: 24800000 },
      ],
    };
    return {
      data: { success: true, message: '', errors: [], data: payReport },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/reports/students')) {
    const stReport: StudentReport = {
      totalStudents: 54,
      activeStudents: 48,
      inactiveStudents: 6,
      averageOverallGrade: 88,
      averageOverallAttendance: 94,
      students: INITIAL_STUDENTS,
    };
    return {
      data: { success: true, message: '', errors: [], data: stReport },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 25. Calendar Events
  if (normUrl.includes('/calendar')) {
    const events: CalendarEventDto[] = [
      { id: 'ev-1', title: 'IELTS Band 7.0+ (Dars)', start: new Date().toISOString(), end: new Date(Date.now() + 7200000).toISOString(), teacherName: 'Rustam Ahmedov', roomName: '204-xona', groupName: 'IELTS Band 7.0+', eventType: 'lesson', status: 1 },
      { id: 'ev-2', title: 'React Frontend Bootcamp', start: new Date(Date.now() + 14400000).toISOString(), end: new Date(Date.now() + 21600000).toISOString(), teacherName: 'Dilshod Yusupov', roomName: 'Lab-1', groupName: 'React Frontend', eventType: 'lesson', status: 1 },
    ];
    return {
      data: { success: true, message: '', errors: [], data: events },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 26. Finance: Settings, Summary, Expenses, Salaries, Preview
  if (normUrl === '/finance/settings') {
    const fSetting: FinanceSetting = {
      id: 'fs-1',
      organizationId: 'org-demo-1',
      defaultTeacherSharePercentage: 25,
      familyDiscount2ndStudent: 10,
      familyDiscount3rdStudent: 15,
      familyDiscount4thPlusStudent: 20,
      discountConflictRule: 1,
      excusedAbsenceRefundEnabled: true,
    };
    return {
      data: { success: true, message: '', errors: [], data: fSetting },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl === '/finance/summary') {
    const fSum: FinanceSummaryReport = {
      totalExpectedRevenue: 26500000,
      totalCollectedRevenue: 24800000,
      totalDebtAmount: 1700000,
      totalTeacherShares: 9500000,
      centerGrossMargin: 15300000,
      totalCenterExpenses: 4200000,
      netProfit: 11100000,
      teacherSalaries: [],
      recentExpenses: [],
    };
    return {
      data: { success: true, message: '', errors: [], data: fSum },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/finance/expenses')) {
    const expenses: CenterExpense[] = [
      { id: 'exp-1', organizationId: 'org-demo-1', category: 'Ijara haqi', amount: 8000000, expenseDate: '2026-03-01', description: 'Markaz binosi oylik ijara to\'lovi' },
      { id: 'exp-2', organizationId: 'org-demo-1', category: 'Elektr va kommunal', amount: 1200000, expenseDate: '2026-03-05', description: 'Elektr energiya va suv to\'lovlari' },
      { id: 'exp-3', organizationId: 'org-demo-1', category: 'Internet va texnika', amount: 800000, expenseDate: '2026-03-03', description: 'Optik tolali internet va kantselyariya' },
    ];
    return {
      data: { success: true, message: '', errors: [], data: expenses },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/finance/salaries')) {
    const salaries: TeacherSalaryReportItem[] = INITIAL_PAYROLLS.map((p) => ({
      teacherId: p.teacherId,
      teacherName: p.teacherName,
      phoneNumber: '+998 90 123 45 67',
      sharePercentage: p.sharePercentage,
      activeGroupsCount: 3,
      totalStudentsCount: p.studentsCount,
      totalCourseFees: p.totalRevenue,
      totalCollectedFromStudents: p.totalRevenue,
      teacherSalaryAmount: p.calculatedSalary,
      centerRetainedAmount: p.totalRevenue - p.calculatedSalary,
    }));
    return {
      data: { success: true, message: '', errors: [], data: salaries },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/finance/preview')) {
    return {
      data: {
        success: true,
        message: '',
        errors: [],
        data: {
          baseAmount: 650000,
          discountAmount: 0,
          finalAmount: 650000,
          familyDiscountPercent: 0,
          customDiscountPercent: 0,
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 27. Student Portal
  if (normUrl.includes('/portal/student/dashboard')) {
    const sDash: StudentPortalDashboardDto = {
      studentId: 'std-1',
      studentName: 'Alisher Qodirov',
      fullName: 'Alisher Qodirov',
      attendanceRate: 96,
      averageGrade: 92,
      pendingHomeworkCount: 1,
      todayLessons: [],
      upcomingLessons: [],
      enrolledGroups: [
        { id: 'grp-1', name: 'IELTS Band 7.0+', subjectName: 'IELTS Intensive', teacherName: 'Rustam Ahmedov' }
      ],
    };
    return {
      data: {
        success: true,
        message: '',
        errors: [],
        data: sDash,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/portal/student/homework')) {
    const hws: HomeworkDto[] = [
      {
        id: 'hw-1',
        groupId: 'grp-1',
        groupName: 'IELTS Band 7.0+',
        teacherId: 'usr-teacher-1',
        teacherName: 'Rustam Ahmedov',
        title: 'Writing Task 2: Opinion Essay',
        description: 'Mavzu: "Some people believe that university education should be free for all students." Kamida 250 so\'z.',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        maxScore: 100,
        submissionsCount: 8,
        gradedCount: 6,
        userSubmission: {
          id: 'sub-1',
          homeworkId: 'hw-1',
          studentId: 'std-1',
          studentName: 'Alisher Qodirov',
          content: 'Education is the foundation of economic prosperity...',
          submittedAt: new Date().toISOString(),
          score: 92,
          feedback: 'Ajoyib fikrlar va boy so\'z boyligi!',
          status: 2,
        },
      },
    ];
    return {
      data: { success: true, message: '', errors: [], data: hws },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/portal/student/attendance')) {
    const attSum: StudentAttendanceSummaryDto = {
      totalLessons: 24,
      presentCount: 22,
      absentCount: 1,
      lateCount: 1,
      excusedCount: 0,
      attendancePercentage: 96,
      items: [
        { attendanceId: 'ath-1', lessonId: 'les-1', lessonTopic: 'Task 2 Essay Writing', lessonStartTime: '14:00', lessonEndTime: '16:00', groupId: 'grp-1', groupName: 'IELTS Band 7.0+', status: 1, comment: 'Darsda qatnashdi' },
        { attendanceId: 'ath-2', lessonId: 'les-2', lessonTopic: 'Speaking Practice', lessonStartTime: '14:00', lessonEndTime: '16:00', groupId: 'grp-1', groupName: 'IELTS Band 7.0+', status: 1, comment: 'Vazifani bajargan' },
        { attendanceId: 'ath-3', lessonId: 'les-3', lessonTopic: 'Reading Speed', lessonStartTime: '14:00', lessonEndTime: '16:00', groupId: 'grp-1', groupName: 'IELTS Band 7.0+', status: 3, comment: '10 daqiqa kechikdi' },
      ],
    };
    return {
      data: { success: true, message: '', errors: [], data: attSum },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/portal/student/available-teachers')) {
    const teachersWithGroups: AvailableTeacherDto[] = INITIAL_TEACHERS.map((t) => ({
      id: t.id,
      fullName: t.fullName,
      specialization: t.specialization,
      phoneNumber: t.phoneNumber,
      groups: INITIAL_GROUPS.filter((g) => g.teacherId === t.id).map((g) => ({
        id: g.id,
        name: g.name,
        subjectId: g.subjectId,
        subjectName: g.subjectName,
        monthlyFee: g.monthlyFee,
        scheduleDescription: g.scheduleDescription,
        enrolledStudentsCount: g.enrolledStudentsCount,
        maxStudents: g.maxStudents,
        enrolledCount: g.enrolledStudentsCount,
        isEnrolled: false,
      })),
    }));
    return {
      data: { success: true, message: '', errors: [], data: teachersWithGroups },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 28. Parent Portal
  if (normUrl.includes('/portal/parent/dashboard') || normUrl.includes('/portal/parent')) {
    const pDash: ParentDashboardDto = {
      parentId: 'parent-1',
      parentName: 'Sobir Qodirov',
      children: [
        {
          id: 'std-1',
          fullName: 'Alisher Qodirov',
          groupName: 'IELTS Band 7.0+',
          averageGrade: 92,
          attendancePercentage: 96,
          paymentStatus: 2,
          monthlyFee: 650000,
          pendingDebt: 0,
        },
      ],
    };
    return {
      data: {
        success: true,
        message: '',
        errors: [],
        data: pDash,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 29. Notifications & Global Search
  if (normUrl.includes('/notifications')) {
    return {
      data: { success: true, message: '', errors: [], data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  if (normUrl.includes('/search')) {
    return {
      data: {
        success: true,
        message: '',
        errors: [],
        data: {
          students: INITIAL_STUDENTS.slice(0, 3),
          teachers: INITIAL_TEACHERS.slice(0, 3),
          groups: INITIAL_GROUPS.slice(0, 3),
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // Generic fallback for any GET request that expects ApiResponse or Array
  if (m === 'get') {
    return {
      data: { success: true, message: 'Demo data', errors: [], data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // Generic fallback for any POST/PUT/DELETE
  return {
    data: { success: true, message: 'Operatsiya bajarildi (Demo rejim)', errors: [], data: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  };
}
