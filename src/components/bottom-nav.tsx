"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lightbulb, Edit3, BookMarked, SettingsIcon, User, HelpCircle } from 'lucide-react'; // Added HelpCircle
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Learn', icon: Lightbulb },
  { href: '/spell', label: 'Spell', icon: Edit3 },
  { href: '/read', label: 'Read', icon: BookMarked },
  { href: '/tutorial', label: 'Guide', icon: HelpCircle }, // Added Tutorial link with HelpCircle
  { href: '/profile', label: 'Profile', icon: User },
  // Removed settings from bottom nav to keep it to 5 items for better spacing
  // { href: '/settings', label: 'Settings', icon: SettingsIcon }, 
];

export const BottomNav: FC = () => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; 
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-t-lg" aria-label="Mobile bottom navigation">
      <div className="mx-auto flex h-16 max-w-full items-center justify-around px-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-200 ease-in-out flex-1 h-full text-center",
              pathname === item.href
                ? "text-primary bg-primary/10 scale-105"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <item.icon className={cn("h-5 w-5 mb-0.5 transition-transform duration-200", pathname === item.href ? "scale-110" : "")} aria-hidden="true" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};