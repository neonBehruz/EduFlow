import React, { createContext, useContext, useState, useEffect } from 'react';
import { playThemeSound } from '../utils/themeSound';

export type ThemeMode = 'morning' | 'night' | 'auto';
export type ActiveTheme = 'morning' | 'night';

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isMorning: boolean;
  isNight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'eduflow_theme_mode';

function getSystemOrTimeTheme(): ActiveTheme {
  const currentHour = new Date().getHours();
  // 06:00 dan 18:59 gacha - Tong / Kunduz nuri (Morning)
  // 19:00 dan 05:59 gacha - Tun / Kechki sokinlik (Night)
  if (currentHour >= 6 && currentHour < 19) {
    return 'morning';
  }
  return 'night';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return saved || 'auto';
  });

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(() => {
    if (themeMode === 'auto') {
      return getSystemOrTimeTheme();
    }
    return themeMode;
  });

  // Calculate and apply theme whenever mode changes or time passes
  useEffect(() => {
    const computeTheme = (): ActiveTheme => {
      if (themeMode === 'auto') {
        return getSystemOrTimeTheme();
      }
      return themeMode;
    };

    const newActive = computeTheme();
    setActiveTheme(newActive);

    // Apply to DOM
    document.documentElement.setAttribute('data-theme', newActive);
    if (newActive === 'night') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    // Auto check time every minute if mode is 'auto'
    if (themeMode === 'auto') {
      const interval = setInterval(() => {
        const checked = getSystemOrTimeTheme();
        setActiveTheme((prev) => {
          if (prev !== checked) {
            document.documentElement.setAttribute('data-theme', checked);
            if (checked === 'night') {
              document.documentElement.classList.add('dark');
              document.documentElement.classList.remove('light');
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
            }
            return checked;
          }
          return prev;
        });
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    const targetTheme = mode === 'auto' ? getSystemOrTimeTheme() : mode;
    playThemeSound(targetTheme);
    setThemeModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  const toggleTheme = () => {
    const next: ThemeMode = activeTheme === 'morning' ? 'night' : 'morning';
    setThemeMode(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeTheme,
        setThemeMode,
        toggleTheme,
        isMorning: activeTheme === 'morning',
        isNight: activeTheme === 'night',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme ThemeProvider ichida ishlatilishi kerak');
  }
  return context;
};
