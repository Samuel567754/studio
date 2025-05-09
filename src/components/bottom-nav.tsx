
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lightbulb, Edit3, BookMarked, SettingsIcon, User, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Learn', icon: Lightbulb },
  { href: '/spell', label: 'Spell', icon: Edit3 },
  { href: '/read', label: 'Read', icon: BookMarked },
  { href: '/tutorial', label: 'Guide', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: SettingsIcon }, 
];

export const BottomNav: FC = () => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // For SSR, return a placeholder or null to avoid layout shifts if possible,
    // though for a fixed bottom nav, null is fine as it appears on client.
    return <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border/40 bg-background/95" aria-label="Mobile bottom navigation loading placeholder"></nav>;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-t-lg" aria-label="Mobile bottom navigation">
      <div className="mx-auto h-16 max-w-full overflow-x-auto whitespace-nowrap no-scrollbar">
        <div className="flex h-full items-stretch px-1"> {/* items-stretch for full height links, px-1 for padding at ends */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg transition-colors duration-200 ease-in-out text-center px-2 py-1 flex-shrink-0 min-w-[64px] hover:bg-primary/5",
                pathname === item.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
              )}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5")} aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
