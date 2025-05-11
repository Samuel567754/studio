
"use client";

import type { FC } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { useThemeStore } from '@/stores/theme-store';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const ThemeProvider: FC<ThemeProviderProps> = ({ children, ...props }) => {
  const fontSize = useThemeStore((state) => state.fontSize);
  const fontFamily = useThemeStore((state) => state.fontFamily);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  // useTheme must be called within a component that is a child of NextThemesProvider
  // So we create a small intermediate component.
  
  const ThemeHandler: FC = () => {
    const { theme, setTheme, resolvedTheme } = useTheme();

    useEffect(() => {
      if (isMounted && isMobile && theme === 'system') {
        // If on mobile and theme is 'system' (meaning no explicit user choice stored yet),
        // force it to dark.
        // If user explicitly chooses 'light' or 'dark' later, that will be respected.
        // If user chooses 'system' again on mobile, it will revert to dark.
        if (resolvedTheme !== 'dark') { // Only set if not already dark
           setTheme('dark');
        }
      }
    }, [isMobile, theme, setTheme, resolvedTheme, isMounted]);
    
    return null; // This component doesn't render anything itself
  }


  useEffect(() => {
    setIsMounted(true);
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
      document.documentElement.style.setProperty('--font-family-base', fontFamily);
      
      const fontClassesToRemove = ['font-sans-custom', 'font-serif-custom', 'font-mono-custom'];
      fontClassesToRemove.forEach(cls => document.documentElement.classList.remove(cls));

      if (fontFamily === 'var(--font-geist-sans)') {
        document.documentElement.classList.add('font-sans-custom');
      } else if (fontFamily === 'var(--font-serif-custom)') {
        document.documentElement.classList.add('font-serif-custom');
      } else if (fontFamily === 'var(--font-geist-mono)') {
        document.documentElement.classList.add('font-mono-custom');
      }
    }
  }, [fontSize, fontFamily]);


  return (
    <NextThemesProvider {...props}>
      {isMounted && <ThemeHandler />} 
      {children}
    </NextThemesProvider>
  );
};

