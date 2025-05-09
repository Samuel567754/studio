
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppSettingsState {
  soundEffectsEnabled: boolean;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  toggleSoundEffects: () => void;
  resetSoundSettings: () => void;
}

const initialAppSettingsState = {
  soundEffectsEnabled: true, // Default to enabled
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      ...initialAppSettingsState,
      setSoundEffectsEnabled: (enabled) => set({ soundEffectsEnabled: enabled }),
      toggleSoundEffects: () => set((state) => ({ soundEffectsEnabled: !state.soundEffectsEnabled })),
      resetSoundSettings: () => set(initialAppSettingsState),
    }),
    {
      name: 'app-settings-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Persist to localStorage
    }
  )
);
