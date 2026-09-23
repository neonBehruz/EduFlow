import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sidebar, Header, MobileBottomNav } from '../components/layout/Navigation';
import { LoadingSpinner } from '../components/common/UIComponents';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { ThemeAtmosphere } from '../components/common/ThemeAtmosphere';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();
  const langPrefix = '/' + language.toLowerCase();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <LoadingSpinner text="EduFlow tizimi yuklanmoqda..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`${langPrefix}/login`} replace />;
  }

  return (
    <div className="min-h-screen bg-transparent flex relative overflow-x-hidden">
      <ThemeAtmosphere withShader={false} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:pl-64 3xl:pl-72 min-w-0 relative z-10 transition-all duration-300">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-3 sm:px-5 md:px-6 lg:px-8 3xl:px-12 pt-3 sm:pt-5 md:pt-6 lg:pt-8 3xl:pt-10 pb-28 sm:pb-32 md:pb-36 lg:pb-16 max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[2100px] 4xl:max-w-[2800px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile & Tablet Bottom Navigation Bar (< 1024px / lg:hidden) */}
      <MobileBottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
};

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { language } = useLanguage();
  const langPrefix = '/' + language.toLowerCase();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    const dest =
      user?.role === 3 ? `${langPrefix}/teacher/dashboard` :
      user?.role === 4 ? `${langPrefix}/parent/dashboard` :
      user?.role === 5 ? `${langPrefix}/student/dashboard` :
      `${langPrefix}/dashboard`;
    return <Navigate to={dest} replace />;
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
      <ThemeAtmosphere withShader={true} />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
};

export const ProtectedRoleRoute: React.FC<{ allowedRoles: number[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const langPrefix = '/' + language.toLowerCase();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={`${langPrefix}/403`} replace />;
  }

  return <>{children}</>;
};
