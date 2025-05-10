
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Plus, Lightbulb, Edit3, BookMarked, HelpCircle, User, SettingsIcon, X, Target, Sigma, HomeIcon, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const fabNavLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/learn', label: 'Learn', icon: Lightbulb },
  { href: '/spell', label: 'Spell', icon: Edit3 },
  { href: '/identify', label: 'Identify', icon: Target },
  { href: '/read', label: 'Read', icon: BookMarked },
  { href: '/ai-games', label: 'AI Games', icon: Puzzle },
  { href: '/math', label: 'Math', icon: Sigma },
  { href: '/tutorial', label: 'Guide', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const QuickLinkFAB: FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-20 right-5 z-50 h-14 w-14 rounded-full shadow-xl md:hidden btn-glow"
          aria-label="Open quick navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-6 w-6" /> : <LayoutGrid className="h-6 w-6" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-2 md:hidden" 
        side="top" 
        align="end"
        sideOffset={10}
      >
        <div className="flex flex-col gap-1">
          {fabNavLinks.map((link) => (
            <Button
              key={link.href}
              variant={pathname === link.href ? 'secondary' : 'ghost'}
              asChild
              className={cn(
                "justify-start w-full text-base py-3 px-4",
                pathname === link.href && "font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Link href={link.href} className="flex items-center gap-3">
                <link.icon className="h-5 w-5" aria-hidden="true" />
                {link.label}
              </Link>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
