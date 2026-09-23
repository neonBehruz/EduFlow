import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { DashboardLayout, AuthLayout, ProtectedRoleRoute } from './layouts/Layouts';
import { ErrorBoundary } from './components/common/ErrorBoundary';


// Clean up demo course applications from localStorage if present
try {
  if (!localStorage.getItem('eduflow_data_reset_v1')) {
    localStorage.removeItem('eduflow_course_applications');
    localStorage.setItem('eduflow_data_reset_v1', 'true');
  }
} catch (e) {}

// Pages
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { StudentsPage } from './pages/students/StudentsPage';
import { StudentDetailPage } from './pages/students/StudentDetailPage';
import { TeachersPage } from './pages/teachers/TeachersPage';
import { GroupsPage } from './pages/groups/GroupsPage';
import { GroupDetailPage } from './pages/groups/GroupDetailPage';
import { SubjectsPage } from './pages/subjects/SubjectsPage';
import { AttendancePage, LessonsPage } from './pages/attendance/AttendancePage';
import { GradesPage } from './pages/grades/GradesPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SuperAdminPage } from './pages/admin/SuperAdminPage';
import { UsersPage } from './pages/users/UsersPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotFoundPage, ForbiddenPage, ServerErrorPage } from './pages/errors/ErrorPages';

import { ParentPortalPage } from './pages/portal/ParentPortalPage';
import { MyChildrenPage } from './pages/portal/MyChildrenPage';
import { StudentPortalPage } from './pages/portal/StudentPortalPage';
import { StudentHomeworkPage } from './pages/portal/StudentHomeworkPage';
import { StudentPaymentsPage } from './pages/portal/StudentPaymentsPage';
import { StudentCalendarPage } from './pages/portal/StudentCalendarPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { RoomsPage } from './pages/rooms/RoomsPage';
import { HomeworkPage } from './pages/homework/HomeworkPage';
import { CrmPage } from './pages/crm/CrmPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { PayrollPage } from './pages/payroll/PayrollPage';
import { RiskAnalysisPage } from './pages/risk/RiskAnalysisPage';
import { CertificatesPage } from './pages/certificates/CertificatesPage';
import { CertificateVerifyPage } from './pages/certificates/CertificateVerifyPage';
import { BranchesPage } from './pages/branches/BranchesPage';
import { FeedbackPage } from './pages/feedback/FeedbackPage';
import { AnimatedEntrance } from './components/common/AnimatedEntrance';

// Smart Role Redirectors for generic paths
const RoleDashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language.toLowerCase();
  if (user?.role === 1) return <Navigate to={`/${lang}/admin`} replace />;
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/dashboard`} replace />;
  if (user?.role === 4) return <Navigate to={`/${lang}/parent/dashboard`} replace />;
  if (user?.role === 5) return <Navigate to={`/${lang}/student/dashboard`} replace />;
  return <DashboardPage />;
};

const RoleLessonsRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language.toLowerCase();
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/lessons`} replace />;
  return <LessonsPage />;
};

const RoleCalendarRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language.toLowerCase();
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/lessons`} replace />;
  if (user?.role === 5) return <Navigate to={`/${lang}/student/calendar`} replace />;
  return <Navigate to={`/${lang}/lessons`} replace />;
};

const RoleAttendanceRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language.toLowerCase();
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/attendance`} replace />;
  return <AttendancePage />;
};

const RoleAttendanceDetailRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { lessonId } = useParams<{ lessonId: string }>();
  const lang = language.toLowerCase();
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/attendance/${lessonId}`} replace />;
  return <AttendancePage />;
};

const RoleRoomsRedirect: React.FC = () => {
  return <RoomsPage />;
};

const RoleCertificatesRedirect: React.FC = () => {
  return <CertificatesPage />;
};

const RoleBranchesRedirect: React.FC = () => {
  return <BranchesPage />;
};

const RoleGradesRedirect: React.FC = () => {
  return <GradesPage />;
};

const RoleHomeworkRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language.toLowerCase();
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/homework`} replace />;
  if (user?.role === 5) return <Navigate to={`/${lang}/student/homework`} replace />;
  return <HomeworkPage />;
};


const RoleGroupsRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language.toLowerCase();
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/groups`} replace />;
  return <GroupsPage />;
};

const RoleGroupDetailRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const lang = language.toLowerCase();
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/groups/${id}`} replace />;
  return <GroupDetailPage />;
};

const RolePayrollRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language.toLowerCase();
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/payroll`} replace />;
  return <PayrollPage />;
};

const RolePaymentsRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language.toLowerCase();
  if (user?.role === 5) return <Navigate to={`/${lang}/student/payments`} replace />;
  return <PaymentsPage />;
};

const RoleSettingsRedirect: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language.toLowerCase();
  if (user?.role === 3) return <Navigate to={`/${lang}/teacher/settings`} replace />;
  if (user?.role === 4) return <Navigate to={`/${lang}/parent/settings`} replace />;
  if (user?.role === 5) return <Navigate to={`/${lang}/student/settings`} replace />;
  return <SettingsPage />;
};

// Universal Fallback & Redirector (handles un-prefixed URLs like /lessons, /teacher/dashboard, etc.)
const UniversalRedirector: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const lang = language.toLowerCase();
  const pathname = location.pathname;

  // Check if URL already has a valid language prefix and wasn't matched by any route
  const match = pathname.match(/^\/(uz|ru|en)(\/.*|$)/i);
  if (match) {
    return <NotFoundPage />;
  }

  // Teacher role redirects for un-prefixed URLs
  if (user?.role === 3) {
    if (pathname.includes('lesson')) return <Navigate to={`/${lang}/teacher/lessons`} replace />;
    if (pathname.includes('calendar')) return <Navigate to={`/${lang}/teacher/lessons`} replace />;
    if (pathname.includes('attendance')) {
      const parts = pathname.split('/').filter(Boolean);
      const lessonId = parts[1];
      return <Navigate to={lessonId ? `/${lang}/teacher/attendance/${lessonId}` : `/${lang}/teacher/attendance`} replace />;
    }
    if (pathname.includes('grade')) return <Navigate to={`/${lang}/teacher/dashboard`} replace />;
    if (pathname.includes('homework')) return <Navigate to={`/${lang}/teacher/homework`} replace />;
    if (pathname.includes('group')) {
      const parts = pathname.split('/').filter(Boolean);
      const id = parts[1];
      return <Navigate to={id ? `/${lang}/teacher/groups/${id}` : `/${lang}/teacher/groups`} replace />;
    }
    if (pathname.includes('payroll')) return <Navigate to={`/${lang}/teacher/payroll`} replace />;
    if (pathname.includes('setting')) return <Navigate to={`/${lang}/teacher/settings`} replace />;
    return <Navigate to={`/${lang}/teacher/dashboard`} replace />;
  }

  // Parent role redirects for un-prefixed URLs
  if (user?.role === 4) {
    if (pathname.includes('child')) return <Navigate to={`/${lang}/parent/children`} replace />;
    if (pathname.includes('payment')) return <Navigate to={`/${lang}/parent/payments`} replace />;
    if (pathname.includes('feedback')) return <Navigate to={`/${lang}/parent/feedback`} replace />;
    if (pathname.includes('setting')) return <Navigate to={`/${lang}/parent/settings`} replace />;
    return <Navigate to={`/${lang}/parent/dashboard`} replace />;
  }

  // Student role redirects for un-prefixed URLs
  if (user?.role === 5) {
    if (pathname.includes('homework')) return <Navigate to={`/${lang}/student/homework`} replace />;
    if (pathname.includes('cert')) return <Navigate to={`/${lang}/student/dashboard`} replace />;
    if (pathname.includes('feedback')) return <Navigate to={`/${lang}/student/feedback`} replace />;
    if (pathname.includes('setting')) return <Navigate to={`/${lang}/student/settings`} replace />;
    return <Navigate to={`/${lang}/student/dashboard`} replace />;
  }

  // SuperAdmin un-prefixed redirect
  if (user?.role === 1) {
    return <Navigate to={`/${lang}/admin`} replace />;
  }

  // Admin or unauthenticated
  if (pathname === '/' || pathname === '') {
    return <Navigate to={`/${lang}/dashboard`} replace />;
  }

  return <Navigate to={`/${lang}${pathname.startsWith('/') ? pathname : '/' + pathname}`} replace />;
};

export const App: React.FC = () => {
  const [showEntrance, setShowEntrance] = React.useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('intro') === '1') return true;
    return !sessionStorage.getItem('eduflow_entrance_played');
  });

  const handleEntranceComplete = () => {
    sessionStorage.setItem('eduflow_entrance_played', 'true');
    setShowEntrance(false);
  };

  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          {showEntrance && <AnimatedEntrance onComplete={handleEntranceComplete} />}
          <AuthProvider>
            <ErrorBoundary>
              <Routes>
              {/* Public Certificate Verification (No auth required) */}
              <Route path="/verify/:code" element={<CertificateVerifyPage />} />
              <Route path="/:lang/verify/:code" element={<CertificateVerifyPage />} />

              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/:lang/login" element={<LoginPage />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />
                <Route path="/:lang/register" element={<Navigate to="/login" replace />} />
              </Route>

              {/* Protected Dashboard Routes */}
              <Route element={<DashboardLayout />}>
                {/* Teacher specific routes with :lang */}
                <Route path="/:lang/teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="/:lang/teacher/lessons" element={<LessonsPage />} />
                <Route path="/:lang/teacher/calendar" element={<Navigate to="../lessons" replace />} />
                <Route path="/:lang/teacher/attendance" element={<AttendancePage />} />
                <Route path="/:lang/teacher/attendance/:lessonId" element={<AttendancePage />} />
                <Route path="/:lang/teacher/grades" element={<Navigate to="../dashboard" replace />} />
                <Route path="/:lang/teacher/homework" element={<HomeworkPage />} />
                <Route path="/:lang/teacher/groups" element={<GroupsPage />} />
                <Route path="/:lang/teacher/groups/:id" element={<GroupDetailPage />} />
                <Route path="/:lang/teacher/payroll" element={<PayrollPage />} />
                <Route path="/:lang/teacher/settings" element={<SettingsPage />} />
                <Route path="/:lang/teacher" element={<Navigate to="../teacher/dashboard" replace />} />

                {/* Parent specific routes with :lang */}
                <Route path="/:lang/parent/dashboard" element={<ParentPortalPage />} />
                <Route path="/:lang/parent/children" element={<MyChildrenPage />} />
                <Route path="/:lang/parent/payments" element={<ParentPortalPage />} />
                <Route path="/:lang/parent/feedback" element={<FeedbackPage />} />
                <Route path="/:lang/parent/settings" element={<SettingsPage />} />
                <Route path="/:lang/parent" element={<Navigate to="../parent/dashboard" replace />} />

                {/* Student specific routes with :lang */}
                <Route path="/:lang/student/dashboard" element={<StudentPortalPage />} />
                <Route path="/:lang/student/calendar" element={<StudentCalendarPage />} />
                <Route path="/:lang/student/homework" element={<StudentHomeworkPage />} />
                <Route path="/:lang/student/payments" element={<StudentPaymentsPage />} />
                <Route path="/:lang/student/certificates" element={<Navigate to="../dashboard" replace />} />
                <Route path="/:lang/student/feedback" element={<FeedbackPage />} />
                <Route path="/:lang/student/settings" element={<SettingsPage />} />
                <Route path="/:lang/student" element={<Navigate to="../student/dashboard" replace />} />

                {/* Shared / Admin routes with :lang */}
                <Route path="/:lang/dashboard" element={<RoleDashboardRedirect />} />
                <Route path="/:lang/crm" element={<CrmPage />} />
                <Route path="/:lang/calendar" element={<RoleCalendarRedirect />} />
                <Route path="/:lang/rooms" element={<RoleRoomsRedirect />} />
                <Route path="/:lang/students" element={<StudentsPage />} />
                <Route path="/:lang/students/:id" element={<StudentDetailPage />} />
                <Route path="/:lang/teachers" element={<TeachersPage />} />
                <Route path="/:lang/groups" element={<RoleGroupsRedirect />} />
                <Route path="/:lang/groups/:id" element={<RoleGroupDetailRedirect />} />
                <Route
                  path="/:lang/users"
                  element={
                    <ProtectedRoleRoute allowedRoles={[1, 2]}>
                      <UsersPage />
                    </ProtectedRoleRoute>
                  }
                />
                <Route path="/:lang/courses" element={<SubjectsPage />} />
                <Route path="/:lang/subjects" element={<SubjectsPage />} />
                <Route path="/:lang/profile" element={<ProfilePage />} />
                <Route path="/:lang/403" element={<ForbiddenPage />} />
                <Route path="/:lang/404" element={<NotFoundPage />} />
                <Route path="/:lang/500" element={<ServerErrorPage />} />
                <Route path="/:lang/lessons" element={<RoleLessonsRedirect />} />
                <Route path="/:lang/attendance" element={<RoleAttendanceRedirect />} />
                <Route path="/:lang/attendance/:lessonId" element={<RoleAttendanceDetailRedirect />} />
                <Route path="/:lang/grades" element={<RoleGradesRedirect />} />
                <Route path="/:lang/homework" element={<RoleHomeworkRedirect />} />
                <Route path="/:lang/payments" element={<RolePaymentsRedirect />} />
                <Route path="/:lang/invoices" element={<InvoicesPage />} />
                <Route path="/:lang/payroll" element={<RolePayrollRedirect />} />
                <Route path="/:lang/risk" element={<RiskAnalysisPage />} />
                <Route path="/:lang/certificates" element={<RoleCertificatesRedirect />} />
                <Route path="/:lang/branches" element={<RoleBranchesRedirect />} />
                <Route path="/:lang/reports" element={<ReportsPage />} />
                <Route path="/:lang/settings" element={<RoleSettingsRedirect />} />
                <Route path="/:lang/feedback" element={<FeedbackPage />} />
                <Route path="/:lang/children" element={<MyChildrenPage />} />

                {/* SuperAdmin Only */}
                <Route
                  path="/:lang/admin"
                  element={
                    <ProtectedRoleRoute allowedRoles={[1]}>
                      <SuperAdminPage />
                    </ProtectedRoleRoute>
                  }
                />
                <Route
                  path="/:lang/admin/:tab"
                  element={
                    <ProtectedRoleRoute allowedRoles={[1]}>
                      <SuperAdminPage />
                    </ProtectedRoleRoute>
                  }
                />
              </Route>

              {/* Catch-all and non-prefixed redirector */}
              <Route path="*" element={<UniversalRedirector />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
