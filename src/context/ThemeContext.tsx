import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export interface Theme {
  isDark: boolean;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    card: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#3be340',
    background: '#f6f8f6',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    border: 'rgba(59, 227, 64, 0.2)',
    card: '#ffffff',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#3be340',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#e5e7eb',
    textMuted: '#9ca3af',
    border: 'rgba(59, 227, 64, 0.3)',
    card: '#374151',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Get system theme preference
    const colorScheme: ColorSchemeName = Appearance.getColorScheme();
    setIsDark(colorScheme === 'dark');

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => subscription?.remove();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { lightTheme, darkTheme };
