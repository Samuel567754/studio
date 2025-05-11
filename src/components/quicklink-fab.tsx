
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Plus, HelpCircle, User, SettingsIcon, X, Sigma, HomeIcon, Puzzle, FileType2 as TextSelectIcon, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const fabNavLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/word-practice', label: 'Word Practice', icon: TextSelectIcon },
  { href: '/ai-games', label: 'AI Games', icon: Puzzle },
  { href: '/math', label: 'Math', icon: Sigma },
  { href: '/tutorial', label: 'Guide', icon: Map },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

// Helper to correctly check active path for FAB links
const isActivePath = (pathname: string, href: string) => {
  if (href === '/') {
    return pathname === href;
  }
  // For other main sections, check if the pathname starts with the href.
  // Avoids issues if there are sub-pages like /word-practice/learn
  const mainSections = ['/word-practice', '/ai-games', '/math', '/tutorial', '/profile', '/settings'];
  if (mainSections.includes(href)) {
    return pathname.startsWith(href);
  }
  return pathname === href;
};

export const QuickLinkFAB: FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className={cn(
            "fixed bottom-20 right-5 z-50 h-14 w-14 rounded-full shadow-xl md:hidden transition-transform duration-300 ease-out hover:scale-105 active:scale-95",
            "bg-gradient-to-br from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 dark:from-primary dark:to-accent dark:text-primary-foreground dark:hover:from-primary/90 dark:hover:to-accent/90"
          )}
          aria-label="Open quick navigation menu"
          aria-expanded={isOpen}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <LayoutGrid
              className={cn(
                "absolute h-6 w-6 transform transition-all duration-300 ease-in-out",
                isOpen ? "rotate-45 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
              )}
            />
            <X
              className={cn(
                "absolute h-6 w-6 transform transition-all duration-300 ease-in-out",
                isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-0 opacity-0"
              )}
            />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-2 md:hidden rounded-xl shadow-2xl border-[hsl(var(--nav-border-light))] dark:border-[hsl(var(--nav-border-dark))] bg-nav-gradient backdrop-blur-md"
        side="top"
        align="end"
        sideOffset={12}
      >
        <div className="flex flex-col gap-1.5">
          {fabNavLinks.map((link, index) => (
            <Button
              key={link.href}
              variant="ghost" // Using ghost and manually styling active/hover for better control on gradient
              asChild
              className={cn(
                "justify-start w-full text-md py-3 px-4 rounded-lg transition-all duration-150 ease-in-out group focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-popover animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                isActivePath(pathname, link.href)
                  ? "font-semibold bg-[hsl(var(--nav-active-indicator-dark))] text-[hsl(var(--nav-active-text-dark))]" // Use dark active style for popover
                  : "text-[hsl(var(--nav-text-dark))] hover:bg-[hsl(var(--nav-active-indicator-dark))]/50 hover:text-[hsl(var(--nav-active-text-dark))]",
                "focus-visible:ring-[hsl(var(--nav-text-dark))]"
              )}
              style={{ animationDelay: `${index * 40}ms` }} 
              onClick={() => setIsOpen(false)}
            >
              <Link href={link.href} className="flex items-center gap-3">
                <link.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActivePath(pathname, link.href) ? "text-[hsl(var(--nav-active-text-dark))]" : "text-[hsl(var(--nav-icon-dark))] group-hover:text-[hsl(var(--nav-active-text-dark))]"
                )} aria-hidden="true" />
                <span className={cn(
                    "transition-colors",
                     isActivePath(pathname, link.href) ? "text-[hsl(var(--nav-active-text-dark))]" : "text-[hsl(var(--nav-text-dark))] group-hover:text-[hsl(var(--nav-active-text-dark))]"
                )}>{link.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
