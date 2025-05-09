
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lightbulb, Edit3, BookMarked, SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Learn', icon: Lightbulb },
  { href: '/spell', label: 'Spell', icon: Edit3 },
  { href: '/read', label: 'Read', icon: BookMarked },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-t-lg">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out w-1/4 h-full", // Changed w-1/3 to w-1/4
              pathname === item.href
                ? "text-primary bg-primary/10 scale-105"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <item.icon className={cn("h-6 w-6 mb-0.5 transition-transform duration-200", pathname === item.href ? "scale-110" : "")} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
