import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string; expectedRole?: number }) => Promise<User | undefined>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isSuperAdmin: boolean;
  isCenterAdmin: boolean;
  isTeacher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('eduflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('eduflow_token');
      const storedUser = localStorage.getItem('eduflow_user');
      const storedOrg = localStorage.getItem('eduflow_org');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          if (storedOrg) setOrganization(JSON.parse(storedOrg));
          setToken(storedToken);

          // Verify token validity in background
          const meRes = await authApi.getMe();
          if (meRes.success && meRes.data) {
            setUser(meRes.data);
            localStorage.setItem('eduflow_user', JSON.stringify(meRes.data));
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string; expectedRole?: number }) => {
    const res = await authApi.login(credentials);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      setOrganization(res.data.organization);
      localStorage.setItem('eduflow_token', res.data.token);
      localStorage.setItem('eduflow_user', JSON.stringify(res.data.user));
      localStorage.setItem('eduflow_org', JSON.stringify(res.data.organization));
      return res.data.user;
    }
    throw new Error(res?.message || "Login yoki parol noto'g'ri.");
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      setOrganization(res.data.organization);
      localStorage.setItem('eduflow_token', res.data.token);
      localStorage.setItem('eduflow_user', JSON.stringify(res.data.user));
      localStorage.setItem('eduflow_org', JSON.stringify(res.data.organization));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('eduflow_token');
    localStorage.removeItem('eduflow_user');
    localStorage.removeItem('eduflow_org');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('eduflow_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        isSuperAdmin: user?.role === 1,
        isCenterAdmin: user?.role === 2,
        isTeacher: user?.role === 3,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
