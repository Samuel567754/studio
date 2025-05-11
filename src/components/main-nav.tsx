
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Menu, X, SettingsIcon, User, HelpCircle, Sigma, HomeIcon, Puzzle, TextSelect, Brain, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { clearProgressStoredData } from '@/lib/storage';
import { useToast } from "@/hooks/use-toast";
import { playNotificationSound } from '@/lib/audio';


const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/word-practice', label: 'Word Practice', icon: TextSelect },
  { href: '/ai-games', label: 'AI Word Games', icon: Puzzle },
  { href: '/math', label: 'Math Zone', icon: Sigma },
  { href: '/tutorial', label: 'Tutorial', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const MainNav: FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const NavLinkItems: FC<{ isMobile?: boolean }> = ({ isMobile = false }) => (
    <>
      {navLinks.map((link) => (
        <Button
          key={link.href}
          variant={pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/') ? 'secondary' : 'ghost'}
          asChild
          className={cn(
            "justify-start w-full text-base md:text-sm md:w-auto",
            isMobile ? "py-3 px-4" : "py-2 px-3 md:h-10", // Ensure desktop links have consistent height
            (pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/')) && "font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
          )}
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
        >
          <Link href={link.href} className="flex items-center gap-2" aria-current={pathname === link.href ? "page" : undefined}>
            <link.icon className="h-5 w-5" aria-hidden="true" />
            {link.label}
          </Link>
        </Button>
      ))}
    </>
  );
  
  const handleResetProgress = () => {
    if (typeof window !== 'undefined') {
        if(confirm("This will clear your learned words, mastered words, reading level, word length preferences, introduction and walkthrough status, username, and favorite topics. Are you sure?")) {
            clearProgressStoredData(); 
            setIsMobileMenuOpen(false);
            toast({
                title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Progress Reset</div>,
                description: "Your learning and app usage data has been cleared. You will see the introduction again.",
                variant: "info"
            });
            playNotificationSound();
             window.location.href = '/introduction'; 
        }
    }
  };


  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                <div className="h-7 w-28 bg-muted rounded-md animate-pulse hidden sm:block"></div>
            </div>
            <div className="flex items-center gap-2 md:hidden">
                 <div className="h-9 w-9 bg-muted rounded-full animate-pulse"></div>
            </div>
            <div className="hidden md:flex items-center gap-1">
                {[...Array(navLinks.length)].map((_, i) => (
                   <div key={i} className="h-8 w-24 bg-muted rounded-md animate-pulse"></div>
                ))}
                <div className="h-9 w-28 bg-primary/50 rounded-md animate-pulse ml-2"></div>
            </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsMobileMenuOpen(false)}>
          <BookOpenText className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300 ease-in-out" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-primary group-hover:text-accent transition-colors duration-300 ease-in-out hidden sm:block">ChillLearn</h1>
        </Link>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main navigation">
          <NavLinkItems />
          <Button variant="default" size="sm" className="ml-2 btn-glow md:h-10 md:px-4 md:py-2" asChild>
            <Link href="/learn">
              <Brain className="mr-2 h-4 w-4" aria-hidden="true" /> Quick Learn
            </Link>
          </Button>
        </nav>

        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full aspect-square h-10 w-10 hover:bg-accent/20" aria-label="Open main navigation menu" aria-expanded={isMobileMenuOpen}>
                <Menu className="h-6 w-6 text-foreground" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs p-0 flex flex-col bg-card/95 backdrop-blur-md">
              <SheetHeader className="flex flex-row items-center justify-between p-4 border-b border-border/30">
                <SheetTitle asChild>
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <BookOpenText className="h-7 w-7 text-primary" aria-hidden="true"/>
                    <h1 className="text-xl font-bold text-primary">ChillLearn</h1>
                  </Link>
                </SheetTitle>
                {/* The SheetContent component itself renders a close button, so no need for an explicit one here */}
              </SheetHeader>
              <SheetDescription className="sr-only">Main navigation menu for ChillLearn application.</SheetDescription>
              <nav className="flex flex-col gap-2 p-4" aria-label="Mobile navigation">
                <NavLinkItems isMobile />
                <Button variant="default" size="lg" asChild className="mt-4 w-full btn-glow">
                  <Link href="/learn" onClick={() => setIsMobileMenuOpen(false)}>
                    <Brain className="mr-2 h-5 w-5" aria-hidden="true" /> Quick Learn
                  </Link>
                </Button>
              </nav>
               <div className="mt-auto p-4 border-t border-border/30">
                  <Button variant="destructive" className="w-full" onClick={handleResetProgress}>
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      Reset All Progress
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">This resets all learning data and app usage preferences. You will see the introduction again.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

