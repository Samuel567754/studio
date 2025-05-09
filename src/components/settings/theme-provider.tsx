
"use client";

import type { FC } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { useThemeStore } from '@/stores/theme-store';
import { useEffect } from 'react';

export const ThemeProvider: FC<ThemeProviderProps> = ({ children, ...props }) => {
  const fontSize = useThemeStore((state) => state.fontSize);
  const fontFamily = useThemeStore((state) => state.fontFamily);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
      document.documentElement.style.setProperty('--font-family-base', fontFamily);
      
      // Remove previous font classes
      const fontClassesToRemove = ['font-sans-custom', 'font-serif-custom', 'font-mono-custom'];
      fontClassesToRemove.forEach(cls => document.documentElement.classList.remove(cls));

      // Add specific class for font family
      if (fontFamily === 'var(--font-geist-sans)') {
        document.documentElement.classList.add('font-sans-custom');
      } else if (fontFamily === 'var(--font-serif-custom)') {
        document.documentElement.classList.add('font-serif-custom');
      } else if (fontFamily === 'var(--font-geist-mono)') {
        document.documentElement.classList.add('font-mono-custom');
      }
    }
  }, [fontSize, fontFamily]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
};
