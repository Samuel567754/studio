
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SettingsIcon, User, HelpCircle, Sigma, HomeIcon, Puzzle, FileType2 as TextSelectIcon, Brain, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/word-practice', label: 'Words', icon: TextSelectIcon },
  { href: '/ai-games', label: 'AI Games', icon: Puzzle },
  { href: '/math', label: 'Math', icon: Sigma },
  { href: '/tutorial', label: 'Guide', icon: Map },
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
    return <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border/40 bg-background/95" aria-label="Mobile bottom navigation loading placeholder"></nav>;
  }

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-nav-gradient shadow-nav-top border-t border-[hsl(var(--nav-border-light))] dark:border-[hsl(var(--nav-border-dark))]" 
      aria-label="Mobile bottom navigation"
    >
      <div className="mx-auto h-16 max-w-full overflow-x-auto whitespace-nowrap no-scrollbar">
        <div className="flex h-full items-stretch px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg transition-colors duration-200 ease-in-out text-center px-2 py-1 flex-shrink-0 min-w-[64px] group",
                  isActive
                    ? "bg-[hsl(var(--nav-active-indicator-light))] dark:bg-[hsl(var(--nav-active-indicator-dark))] text-[hsl(var(--nav-active-text-light))] dark:text-[hsl(var(--nav-active-text-dark))]"
                    : "text-[hsl(var(--nav-text-light))] dark:text-[hsl(var(--nav-text-dark))] hover:bg-[hsl(var(--nav-active-indicator-light))]/50 dark:hover:bg-[hsl(var(--nav-active-indicator-dark))]/50 hover:text-[hsl(var(--nav-active-text-light))] dark:hover:text-[hsl(var(--nav-active-text-dark))]"
                )}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <item.icon className={cn("h-5 w-5 mb-0.5", 
                  isActive 
                    ? "text-[hsl(var(--nav-active-text-light))] dark:text-[hsl(var(--nav-active-text-dark))]" 
                    : "text-[hsl(var(--nav-icon-light))] dark:text-[hsl(var(--nav-icon-dark))] group-hover:text-[hsl(var(--nav-active-text-light))] dark:group-hover:text-[hsl(var(--nav-active-text-dark))]"
                )} aria-hidden="true" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
