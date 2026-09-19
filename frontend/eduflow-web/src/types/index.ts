export type UserRole = 1 | 2 | 3 | 4 | 5; // 1: SuperAdmin, 2: CenterAdmin, 3: Teacher, 4: Parent, 5: Student
export type AttendanceStatus = 1 | 2 | 3 | 4; // 1: Present, 2: Absent, 3: Late, 4: Excused
export type PaymentStatus = 1 | 2 | 3 | 4 | 5; // 1: Pending, 2: Paid, 3: Overdue, 4: Cancelled, 5: Partial
export type PaymentMethod = 1 | 2 | 3 | 4; // 1: Cash, 2: Payme, 3: Click, 4: BankTransfer
export type LessonStatus = 1 | 2 | 3; // 1: Scheduled, 2: Completed, 3: Cancelled
export type SubscriptionStatus = 1 | 2 | 3 | 4; // 1: Trial, 2: Active, 3: Expired, 4: Cancelled

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  organization: Organization;
}

export interface Student {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  birthDate?: string;
  enrollmentDate: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  isActive: boolean;
  averageGrade: number;
  attendancePercentage: number;
  currentPaymentStatus: PaymentStatus;
  groupNames: string[];
}

export interface StudentDetail extends Student {
  parent?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    telegramChatId?: string;
    isTelegramConnected: boolean;
  };
  groups: {
    id: string;
    name: string;
    subjectName?: string;
    teacherName?: string;
  }[];
  recentAttendances: Attendance[];
  recentGrades: Grade[];
  recentPayments: Payment[];
}

export interface Teacher {
  id: string;
  organizationId: string;
  userId?: string;
  fullName: string;
  phoneNumber: string;
  specialization?: string;
  groupsCount: number;
}

export interface Subject {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  price: number;
  durationWeeks: number;
  isActive: boolean;
  groupsCount: number;
}

export type Course = Subject;

export interface Group {
  id: string;
  organizationId: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  subjectId?: string;
  subjectName?: string;
  monthlyFee: number;
  maxStudents: number;
  enrolledStudentsCount: number;
  scheduleDescription?: string;
  room?: string;
  isActive: boolean;
}

export interface GroupDetail extends Group {
  students: Student[];
  recentLessons: Lesson[];
}

export interface Lesson {
  id: string;
  groupId: string;
  groupName: string;
  subjectName?: string;
  teacherName?: string;
  startTime: string;
  endTime: string;
  topic: string;
  status: LessonStatus;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
}

export interface Attendance {
  id: string;
  lessonId: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  comment?: string;
  lessonDate: string;
}

export interface Grade {
  id: string;
  lessonId: string;
  studentId: string;
  studentName: string;
  subjectName?: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  idempotencyKey?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  amount: number;
  basePrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  finalAmount?: number;
  paidAmount?: number;
  debtAmount?: number;
  teacherSharePercent?: number;
  teacherShareAmount?: number;
  centerShareAmount?: number;
  groupId?: string;
  groupName?: string;
  teacherId?: string;
  teacherName?: string;
  paymentDate?: string;
  dueDate: string;
  status: PaymentStatus;
  description?: string;
  createdAt: string;
  transactions?: PaymentTransaction[];
}

export interface FinanceSetting {
  id: string;
  organizationId: string;
  defaultTeacherSharePercentage: number;
  familyDiscount2ndStudent: number;
  familyDiscount3rdStudent: number;
  familyDiscount4thPlusStudent: number;
  discountConflictRule: 1 | 2;
  excusedAbsenceRefundEnabled: boolean;
}

export interface StudentDiscount {
  id: string;
  studentId: string;
  studentName: string;
  discountPercentage: number;
  startDate: string;
  endDate?: string;
  reason: string;
  isActive: boolean;
}

export interface CenterExpense {
  id: string;
  organizationId: string;
  category: string;
  amount: number;
  expenseDate: string;
  description: string;
}

export interface PaymentCalculationPreview {
  studentId: string;
  studentName: string;
  groupId?: string;
  groupName?: string;
  teacherId?: string;
  teacherName?: string;
  basePrice: number;
  familyStudentOrder: number;
  familyDiscountPercent: number;
  individualDiscountPercent: number;
  appliedDiscountPercent: number;
  discountType: string;
  discountAmount: number;
  finalAmount: number;
  teacherSharePercent: number;
  estimatedTeacherShare: number;
  estimatedCenterShare: number;
}

export interface TeacherSalaryReportItem {
  teacherId: string;
  teacherName: string;
  phoneNumber?: string;
  sharePercentage: number;
  activeGroupsCount: number;
  totalStudentsCount: number;
  totalCourseFees: number;
  totalCollectedFromStudents: number;
  teacherSalaryAmount: number;
  centerRetainedAmount: number;
}

export interface FinanceSummaryReport {
  totalExpectedRevenue: number;
  totalCollectedRevenue: number;
  totalDebtAmount: number;
  totalTeacherShares: number;
  centerGrossMargin: number;
  totalCenterExpenses: number;
  netProfit: number;
  teacherSalaries: TeacherSalaryReportItem[];
  recentExpenses: CenterExpense[];
}

export interface DashboardStats {
  studentsCount: number;
  teachersCount: number;
  groupsCount: number;
  todayLessonsCount: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  pendingPaymentsCount: number;
  overduePaymentsCount: number;
  monthlyRevenue: number;
  attendanceRate: number;
  todayLessons: Lesson[];
  recentPayments: Payment[];
  overduePayments: Payment[];
  monthlyRevenueChart: { month: string; amount: number }[];
  studentGrowthChart: { month: string; count: number }[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  maxStudents: number;
  maxTeachers: number;
  maxGroups: number;
  hasTelegram: boolean;
  hasReports: boolean;
  hasAdvancedAnalytics: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  subscriptionPlanId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  currentStudentsCount: number;
  currentTeachersCount: number;
  currentGroupsCount: number;
  plan: SubscriptionPlan;
}

export interface AttendanceReport {
  totalLessons: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  attendancePercentage: number;
  groupSummaries: {
    groupId: string;
    groupName: string;
    totalRecords: number;
    presentCount: number;
    percentage: number;
  }[];
}

export interface PaymentReport {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paidTransactionsCount: number;
  pendingTransactionsCount: number;
  overdueTransactionsCount: number;
  monthlyTrend: { month: string; amount: number }[];
}

export interface StudentReport {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  averageOverallGrade: number;
  averageOverallAttendance: number;
  students: Student[];
}

export interface SuperAdminStats {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  totalStudents: number;
  totalMonthlyRevenue: number;
  recentOrganizations: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    planName: string;
    subscriptionStatus: SubscriptionStatus;
    createdAt: string;
  }[];
}

// ---------------- PRODUCTION FEATURES DTOs ----------------

export interface ExtendedDashboardStats {
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  totalStudentsCount: number;
  activeStudentsCount: number;
  newEnrolledInPeriod: number;
  churnedStudentsCount: number;
  teachersCount: number;
  activeGroupsCount: number;
  totalLessonsInPeriod: number;
  completedLessonsInPeriod: number;
  attendanceRatePercentage: number;
  averageStudentGrade: number;
  totalExpectedRevenue: number;
  totalCollectedRevenue: number;
  totalOutstandingDebt: number;
  totalTeacherPayrollPaid: number;
  centerNetRevenue: number;
  openLeadsCount: number;
  trialLessonsCount: number;
  conversionRatePercentage: number;
  highRiskStudentsCount: number;
  roomsCount: number;
  roomOccupancyRatePercentage: number;
  revenueTrend: { date: string; label: string; amount: number }[];
  attendanceTrend: { date: string; label: string; rate: number }[];
  studentGrowthTrend: { date: string; label: string; count: number }[];
}

export interface ChildOverviewDto {
  studentId: string;
  fullName: string;
  phoneNumber?: string;
  birthDate?: string;
  attendanceRate: number;
  averageGrade: number;
  pendingPaymentAmount?: number;
  enrolledGroupsCount?: number;
  groupNames?: string[] | string;
}

export interface ParentDashboardDto {
  parentId: string;
  parentName?: string;
  parentFullName?: string;
  children: any[];
  todayLessons?: Lesson[];
  upcomingLessons?: Lesson[];
  recentAttendance?: Attendance[];
  recentGrades?: Grade[];
  pendingHomework?: HomeworkDto[];
  invoices?: InvoiceDto[];
  notifications?: any[];
  totalOutstandingDebt?: number;
  unreadNotificationsCount?: number;
}

export interface ParentChildProfileDto {
  studentInfo: Student;
  currentGroups: Group[];
  schedule: Lesson[];
  attendancePercentage: number;
  grades: Grade[];
  homeworkSubmissions: HomeworkSubmissionDto[];
  progress?: any;
  paymentHistory: Payment[];
  invoices: InvoiceDto[];
}

export interface ChildProgressDetailDto {
  studentId: string;
  fullName: string;
  attendanceRate: number;
  averageGrade: number;
  homeworkCompletionRate: number;
  attendedLessons: number;
  totalLessons: number;
  absentLessons: number;
  lateLessons: number;
  excusedLessons: number;
  recentAttendances: Attendance[];
  recentGrades: Grade[];
  recentPayments: Payment[];
  pendingHomeworks: HomeworkDto[];
  skillProgress: StudentSkillProgressDto[];
}

export interface StudentSkillProgressDto {
  skillName: string;
  proficiencyLevel: number;
  maxScore: number;
  category: string;
  lastAssessedAt: string;
}

export interface StudentPortalDashboardDto {
  studentId: string;
  studentName?: string;
  fullName?: string;
  groups?: any[];
  enrolledGroups?: any[];
  todayLessons?: any[];
  upcomingLessons?: any[];
  courses?: any[];
  pendingHomework?: any[];
  pendingHomeworkCount?: number;
  attendanceRate: number;
  averageGrade: number;
  grades?: any[];
  certificates?: any[];
  notifications?: any[];
  progress?: any;
  outstandingBalance?: number;
  skills?: StudentSkillProgressDto[];
}

export interface StudentAttendanceHistoryItemDto {
  attendanceId: string;
  lessonId: string;
  lessonTopic: string;
  lessonStartTime: string;
  lessonEndTime: string;
  groupId: string;
  groupName: string;
  subjectName?: string;
  teacherName?: string;
  status: number | AttendanceStatus;
  comment?: string;
  gradeScore?: number;
}

export interface StudentAttendanceSummaryDto {
  totalLessons: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  items: StudentAttendanceHistoryItemDto[];
}

export interface StudentFinanceDto {
  studentId: string;
  studentName: string;
  totalPaid: number;
  totalDebt: number;
  nextDueDate?: string | null;
  invoices: InvoiceDto[];
  payments: Payment[];
}

export interface CalendarEventDto {
  id: string;
  title?: string;
  topic?: string;
  start: string;
  end: string;
  startTime?: string;
  endTime?: string;
  eventType?: 'lesson' | 'triallesson' | 'exam';
  groupId?: string;
  groupName?: string;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  roomId?: string;
  roomName?: string;
  roomNumber?: string;
  branchId?: string;
  branchName?: string;
  status: string | number;
  color?: string;
  notes?: string;
}

export interface ScheduleConflictCheckDto {
  teacherId?: string;
  roomId?: string;
  groupId?: string;
  startTime: string;
  endTime: string;
  excludeLessonId?: string;
}

export interface ConflictCheckResultDto {
  hasConflict: boolean;
  conflictType?: 'Teacher' | 'Room' | 'Group';
  message?: string;
  conflictingEventTitle?: string;
}

export interface RoomDto {
  id: string;
  branchId?: string;
  branchName?: string;
  name: string;
  number: string;
  capacity: number;
  type: number; // 1: Standard, 2: Lab, 3: Lecture, 4: Conference
  status: number; // 1: Available, 2: Occupied, 3: Maintenance
  equipment?: string;
  currentOccupancy?: string;
}

export interface CreateRoomDto {
  branchId?: string;
  name: string;
  number: string;
  capacity: number;
  type: number;
  status?: number;
  equipment?: string;
}

export interface HomeworkDto {
  id: string;
  groupId: string;
  groupName: string;
  lessonId?: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  attachmentUrls?: string;
  submissionsCount: number;
  gradedCount: number;
  userSubmission?: HomeworkSubmissionDto;
}

export interface HomeworkSubmissionDto {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content?: string;
  attachmentUrls?: string;
  score?: number;
  feedback?: string;
  status: number; // 1: Assigned, 2: Submitted, 3: Late, 4: Reviewed
  reviewedAt?: string;
}

export interface CreateHomeworkDto {
  groupId: string;
  lessonId?: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore?: number;
  attachmentUrls?: string;
}

export interface SubmitHomeworkDto {
  content?: string;
  attachmentUrls?: string;
}

export interface GradeHomeworkDto {
  score: number;
  feedback?: string;
}

export interface LeadDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  interestedSubjectId?: string;
  interestedSubjectName?: string;
  source: number; // 1: Instagram, 2: Telegram, 3: Website, 4: Referral, 5: WalkIn, 6: Other
  assignedUserId?: string;
  assignedUserName?: string;
  notes?: string;
  status: number; // 1: New, 2: Contacted, 3: Trial, 4: Interested, 5: Enrolled, 6: Lost
  convertedStudentId?: string;
  createdAt: string;
  trialLessonsCount: number;
}

export interface CreateLeadDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  interestedSubjectId?: string;
  source?: number;
  assignedUserId?: string;
  notes?: string;
}

export interface UpdateLeadStatusDto {
  status: number;
  notes?: string;
}

export interface TrialLessonDto {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  roomId?: string;
  roomName?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: number; // 1: Scheduled, 2: Completed, 3: Cancelled, 4: Interested, 5: Enrolled, 6: NotInterested, 7: FollowUp
  notes?: string;
}

export interface ScheduleTrialLessonDto {
  leadId: string;
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface EnrollLeadDto {
  groupId: string;
  firstPaymentAmount?: number;
  paymentMethod?: number;
  notes?: string;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  parentId?: string;
  parentName?: string;
  groupId?: string;
  groupName?: string;
  paymentId?: string;
  billingPeriod: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: number; // 1: Draft, 2: Issued, 3: Paid, 4: Overdue, 5: Cancelled
  notes?: string;
}

export interface CreateInvoiceDto {
  studentId: string;
  groupId?: string;
  paymentId?: string;
  amount: number;
  billingPeriod: string;
  dueDate: string;
  notes?: string;
}

export interface ReceiptDataDto {
  receiptNumber: string;
  organizationName: string;
  organizationPhone: string;
  organizationAddress: string;
  studentName: string;
  groupName?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  cashierOrAdmin: string;
  notes?: string;
}

export interface TeacherPayrollDto {
  id: string;
  teacherId: string;
  teacherName: string;
  year: number;
  month: number;
  calculationType: number; // 1: FixedSalary, 2: Percentage, 3: PerLesson, 4: Combined
  lessonsTaught: number;
  studentsCount: number;
  totalRevenue: number;
  sharePercentage: number;
  calculatedSalary: number;
  paidAmount: number;
  remainingAmount: number;
  paidDate?: string;
  notes?: string;
}

export interface CalculatePayrollRequestDto {
  teacherId: string;
  year: number;
  month: number;
  calculationType: number;
  baseSalary?: number;
  customRate?: number;
}

export interface StudentRiskDto {
  studentId: string;
  studentName: string;
  phoneNumber?: string;
  groupNames: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  attendanceRate: number;
  unexcusedAbsences: number;
  averageGrade: number;
  overduePaymentDays: number;
  riskReasons: string[];
  lastAttendedDate?: string;
}

export interface CertificateDto {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  studentId: string;
  studentName: string;
  subjectId?: string;
  subjectName?: string;
  groupId?: string;
  groupName?: string;
  courseName: string;
  levelName: string;
  issueDate: string;
  finalGrade?: number;
  qrCodeData?: string;
}

export interface IssueCertificateDto {
  studentId: string;
  groupId?: string;
  subjectId?: string;
  courseName: string;
  levelName?: string;
  finalGrade?: number;
}

export interface CertificateVerificationResultDto {
  isValid: boolean;
  certificateNumber: string;
  studentName: string;
  courseName: string;
  organizationName: string;
  issueDate: string;
  levelName?: string;
  finalGrade?: number;
  message: string;
}

export interface SearchResultItemDto {
  id: string;
  entityType: string;
  title: string;
  subtitle?: string;
  url: string;
  metadata?: string;
}

export interface GlobalSearchResultDto {
  query: string;
  totalMatches: number;
  results: SearchResultItemDto[];
}

export interface BranchDto {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  roomsCount: number;
  groupsCount: number;
}

export interface CreateBranchDto {
  name: string;
  address: string;
  phone: string;
}

export interface FeedbackDto {
  id: string;
  studentId?: string;
  studentName?: string;
  parentId?: string;
  parentName?: string;
  teacherId?: string;
  teacherName?: string;
  rating: number;
  comment?: string;
  category: string;
  createdAt: string;
}

export interface CreateFeedbackDto {
  studentId?: string;
  parentId?: string;
  teacherId?: string;
  subjectId?: string;
  rating: number;
  comment: string;
  category: string;
}

export interface ReferralCodeDto {
  id: string;
  studentId: string;
  studentName: string;
  code: string;
  rewardPercentage: number;
  isActive: boolean;
  totalReferrals: number;
  totalRewardsEarned: number;
}

export interface ReferralDto {
  id: string;
  referralCode: string;
  referrerStudentName: string;
  referredStudentName: string;
  rewardAmount: number;
  isRewardApplied: boolean;
  createdAt: string;
}

export interface AvailableGroupDto {
  id: string;
  name: string;
  subjectId?: string;
  subjectName?: string;
  monthlyFee: number;
  maxStudents: number;
  enrolledCount: number;
  scheduleDescription?: string;
  room?: string;
  isEnrolled: boolean;
}

export interface AvailableTeacherDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  specialization?: string;
  groups: AvailableGroupDto[];
}


