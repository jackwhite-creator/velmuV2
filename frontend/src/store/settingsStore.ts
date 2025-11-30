import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  notifications: {
    enableSounds: boolean;
    enableDesktopNotifications: boolean; // Future proofing
  };
  toggleSoundNotifications: () => void;
  toggleDesktopNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: {
        enableSounds: true,
        enableDesktopNotifications: false,
      },
      toggleSoundNotifications: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            enableSounds: !state.notifications.enableSounds,
          },
        })),
      toggleDesktopNotifications: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            enableDesktopNotifications: !state.notifications.enableDesktopNotifications,
          },
        })),
    }),
    {
      name: 'velmu-settings-storage',
    }
  )
);
