import { create } from 'zustand';

type Theme = 'dark' | 'light' | 'amoled';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('velmu-theme') as Theme) || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('velmu-theme', theme);
    document.documentElement.className = `theme-${theme}`;
    set({ theme });
  },
}));

// Initialize theme on load
const storedTheme = localStorage.getItem('velmu-theme') || 'dark';
document.documentElement.className = `theme-${storedTheme}`;
