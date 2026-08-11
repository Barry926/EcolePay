import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'header' | 'floating';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'header' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const base =
    variant === 'floating'
      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#16A34A] dark:hover:text-[#16A34A]';

  return (
    <button
      onClick={toggleTheme}
      data-testid="theme-toggle-btn"
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className={`relative h-10 w-10 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 ${base}`}
    >
      <Sun
        className={`w-[18px] h-[18px] absolute transition-all duration-300 ${
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
      />
      <Moon
        className={`w-[18px] h-[18px] absolute transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
      />
    </button>
  );
};
