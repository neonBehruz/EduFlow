import {
  ApiResponse,
  AuthResponse,
  DashboardStats,
  ExtendedDashboardStats,
  Group,
  PagedResult,
  Student,
  Subject,
  Teacher,
  User,
  Organization,
  Lesson,
  Payment,
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

const DEMO_USERS: Record<string, { user: User; pass: string }> = {
  'admin@smartedu.uz': {
    pass: 'admin123',
    user: {
      id: 'usr-admin-1',
      organizationId: 'org-demo-1',
      firstName: 'Behruz',
      lastName: 'Admin',
      email: 'admin@smartedu.uz',
      phoneNumber: '+998 90 123 45 67',
      role: 1,
      isActive: true,
    },
  },
  'teacher@smartedu.uz': {
    pass: 'admin123',
    user: {
      id: 'usr-teacher-1',
      organizationId: 'org-demo-1',
      firstName: 'Rustam',
      lastName: 'Ahmedov',
      email: 'teacher@smartedu.uz',
      phoneNumber: '+998 93 555 44 33',
      role: 3,
      isActive: true,
    },
  },
  'student@eduflow.uz': {
    pass: 'admin123',
    user: {
      id: 'usr-student-1',
      organizationId: 'org-demo-1',
      firstName: 'Alisher',
      lastName: 'Qodirov',
      email: 'student@eduflow.uz',
      phoneNumber: '+998 97 777 88 99',
      role: 5,
      isActive: true,
    },
  },
  'parent@eduflow.uz': {
    pass: 'admin123',
    user: {
      id: 'usr-parent-1',
      organizationId: 'org-demo-1',
      firstName: 'Sobir',
      lastName: 'Qodirov',
      email: 'parent@eduflow.uz',
      phoneNumber: '+998 90 999 11 22',
      role: 4,
      isActive: true,
    },
  },
};

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

  // 1. Auth: Login
  if (normUrl === '/auth/login' && method.toLowerCase() === 'post') {
    const req = typeof data === 'string' ? JSON.parse(data) : data || {};
    const email = (req.email || req.login || '').toLowerCase().trim();
    const pass = req.password || '';

    // Match demo user or accept demo passwords
    let match = DEMO_USERS[email];
    if (!match) {
      if (email.includes('admin')) match = DEMO_USERS['admin@smartedu.uz'];
      else if (email.includes('teacher')) match = DEMO_USERS['teacher@smartedu.uz'];
      else if (email.includes('parent')) match = DEMO_USERS['parent@eduflow.uz'];
      else if (email.includes('student')) match = DEMO_USERS['student@eduflow.uz'];
    }

    if (match) {
      const resp: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Muvaffaqiyatli kirdingiz (Demo rejim)',
        errors: [],
        data: {
          token: `demo-jwt-token-${match.user.role}-${Date.now()}`,
          refreshToken: 'demo-refresh-token',
          user: match.user,
          organization: DEMO_ORG,
        },
      };
      return { data: resp, status: 200, statusText: 'OK', headers: {}, config: {} };
    }

    // Default fallback to Admin if admin123 is entered
    if (pass === 'admin123' || pass === 'EduFlow2026!') {
      const resp: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Muvaffaqiyatli kirdingiz (Demo rejim)',
        errors: [],
        data: {
          token: `demo-jwt-token-admin-${Date.now()}`,
          refreshToken: 'demo-refresh-token',
          user: DEMO_USERS['admin@smartedu.uz'].user,
          organization: DEMO_ORG,
        },
      };
      return { data: resp, status: 200, statusText: 'OK', headers: {}, config: {} };
    }
  }

  // 2. Auth: Me
  if (normUrl === '/auth/me') {
    const storedUser = localStorage.getItem('eduflow_user');
    const user: User = storedUser ? JSON.parse(storedUser) : DEMO_USERS['admin@smartedu.uz'].user;
    return {
      data: { success: true, message: '', errors: [], data: user },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 3. Dashboard Stats
  if (normUrl === '/dashboard/stats') {
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
  if (normUrl === '/dashboard/extended') {
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

  // 5. Students
  if (normUrl === '/students' && method.toLowerCase() === 'get') {
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

  if (normUrl.startsWith('/students/') && method.toLowerCase() === 'get') {
    const id = normUrl.replace('/students/', '');
    const students = getStored<Student[]>('students', INITIAL_STUDENTS);
    const std = students.find((s) => s.id === id) || students[0];
    return {
      data: {
        success: true,
        message: '',
        errors: [],
        data: {
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
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 6. Groups
  if (normUrl === '/groups') {
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

  // 7. Teachers
  if (normUrl === '/teachers') {
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

  // 8. Subjects
  if (normUrl === '/subjects') {
    const subjects = getStored<Subject[]>('subjects', INITIAL_SUBJECTS);
    return {
      data: { success: true, message: '', errors: [], data: subjects },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 9. Lessons / Today
  if (normUrl.includes('/lessons')) {
    return {
      data: { success: true, message: '', errors: [], data: INITIAL_LESSONS },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 10. Student Portal
  if (normUrl.includes('/portal/student/dashboard')) {
    return {
      data: {
        success: true,
        message: '',
        errors: [],
        data: {
          studentName: 'Alisher Qodirov',
          groupName: 'IELTS Band 7.0+',
          averageGrade: 92,
          attendancePercentage: 96,
          pendingHomeworkCount: 1,
          nextLesson: {
            id: 'les-1',
            date: new Date().toLocaleDateString('uz-UZ'),
            time: '14:00 - 16:00',
            topic: 'Task 2 Essay Writing',
            room: '204-xona',
          },
          todayLessons: [],
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // 11. Parent Portal
  if (normUrl.includes('/portal/parent/dashboard') || normUrl.includes('/portal/parent')) {
    return {
      data: {
        success: true,
        message: '',
        errors: [],
        data: {
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
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  // Generic fallback for any GET request that expects ApiResponse
  if (method.toLowerCase() === 'get') {
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
