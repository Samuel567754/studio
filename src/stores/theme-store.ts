
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThemeState {
  fontSize: number;
  fontFamily: string;
  setFontSize: (size: number) => void;
  setFontFamily: (font: string) => void;
  resetThemeSettings: () => void;
}

const initialThemeState = {
  fontSize: 16, // Default font size
  fontFamily: 'var(--font-geist-sans)', // Default font family
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      ...initialThemeState,
      setFontSize: (size) => set({ fontSize: size }),
      setFontFamily: (font) => set({ fontFamily: font }),
      resetThemeSettings: () => set(initialThemeState),
    }),
    {
      name: 'theme-settings-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Persist to localStorage
    }
  )
);
