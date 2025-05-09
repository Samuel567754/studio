
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppSettingsState {
  soundEffectsEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  selectedVoiceURI: string | null;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  toggleSoundEffects: () => void;
  setSpeechRate: (rate: number) => void;
  setSpeechPitch: (pitch: number) => void;
  setSelectedVoiceURI: (uri: string | null) => void;
  resetAppSettings: () => void;
}

const initialAppSettingsState = {
  soundEffectsEnabled: true, // Default to enabled
  speechRate: 1, // Default rate (0.1 to 10)
  speechPitch: 1, // Default pitch (0 to 2)
  selectedVoiceURI: null, // Default (system default voice)
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      ...initialAppSettingsState,
      setSoundEffectsEnabled: (enabled) => set({ soundEffectsEnabled: enabled }),
      toggleSoundEffects: () => set((state) => ({ soundEffectsEnabled: !state.soundEffectsEnabled })),
      setSpeechRate: (rate) => set({ speechRate: Math.max(0.1, Math.min(rate, 10)) }), // Clamp rate
      setSpeechPitch: (pitch) => set({ speechPitch: Math.max(0, Math.min(pitch, 2)) }), // Clamp pitch
      setSelectedVoiceURI: (uri) => set({ selectedVoiceURI: uri }),
      resetAppSettings: () => set(initialAppSettingsState),
    }),
    {
      name: 'app-settings-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Persist to localStorage
    }
  )
);

