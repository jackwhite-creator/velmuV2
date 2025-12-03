import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'amoled' | 'christmas' | 'pink';

interface ThemeState {
  theme: Theme;
  showHearts: boolean;
  setTheme: (theme: Theme) => void;
  setShowHearts: (show: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      showHearts: false,
      setTheme: (theme) => set({ theme }),
      setShowHearts: (showHearts) => set({ showHearts }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
