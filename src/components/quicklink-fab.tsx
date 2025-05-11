
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
          className="fixed bottom-20 right-5 z-50 h-14 w-14 rounded-full shadow-xl md:hidden btn-glow transition-transform duration-300 ease-out hover:scale-105 active:scale-95"
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
        className="w-72 p-3 md:hidden bg-popover/90 backdrop-blur-sm border-border shadow-2xl rounded-xl"
        side="top"
        align="end"
        sideOffset={12} // Increased offset for a more floating feel
      >
        <div className="flex flex-col gap-1.5">
          {fabNavLinks.map((link, index) => (
            <Button
              key={link.href}
              variant={isActivePath(pathname, link.href) ? 'secondary' : 'ghost'}
              asChild
              className={cn(
                "justify-start w-full text-md py-3.5 px-4 rounded-lg transition-all duration-150 ease-in-out group",
                isActivePath(pathname, link.href)
                  ? "font-semibold bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary"
                  : "hover:bg-primary/10",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-popover animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              )}
              style={{ animationDelay: `${index * 40}ms` }} // Staggered animation for items
              onClick={() => setIsOpen(false)}
            >
              <Link href={link.href} className="flex items-center gap-3">
                <link.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActivePath(pathname, link.href) ? "text-primary" : "text-foreground/70 group-hover:text-primary/90"
                )} aria-hidden="true" />
                <span className={cn(
                    "transition-colors",
                    isActivePath(pathname, link.href) ? "text-primary" : "text-foreground group-hover:text-primary/90"
                )}>{link.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
