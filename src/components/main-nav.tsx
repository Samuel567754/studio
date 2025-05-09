"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Menu, X, Lightbulb, Edit3, BookMarked, Brain, Trash2, SettingsIcon, User, Info } from 'lucide-react'; // Added Info
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { clearProgressStoredData } from '@/lib/storage';
import { useToast } from "@/hooks/use-toast";


const navLinks = [
  { href: '/', label: 'Learn Words', icon: Lightbulb },
  { href: '/spell', label: 'Spell Practice', icon: Edit3 },
  { href: '/read', label: 'Read Passages', icon: BookMarked },
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
          variant={pathname === link.href ? 'secondary' : 'ghost'}
          asChild
          className={cn(
            "justify-start w-full text-base md:text-sm md:w-auto",
            isMobile ? "py-3 px-4" : "py-2 px-3",
            pathname === link.href && "font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
          )}
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
        >
          <Link href={link.href} className="flex items-center gap-2">
            <link.icon className="h-5 w-5" />
            {link.label}
          </Link>
        </Button>
      ))}
    </>
  );
  
  const handleResetProgress = () => {
    if (typeof window !== 'undefined') {
        if(confirm("This will clear your learned words, mastered words, reading level, and word length preferences. Are you sure?")) {
            clearProgressStoredData(); 
            setIsMobileMenuOpen(false);
            toast({
                title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Progress Reset</div>,
                description: "Your learning data (learned words, mastered words, reading level, and word length preferences) has been cleared.",
                variant: "info"
            });
             window.location.href = '/'; 
        }
    }
  };


  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
                <div className="h-7 w-7 bg-muted rounded-full animate-pulse"></div>
                <div className="h-6 w-24 bg-muted rounded-md animate-pulse hidden sm:block"></div>
            </div>
            <div className="flex items-center gap-2 md:hidden">
                 <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
            </div>
            <div className="hidden md:flex items-center gap-2">
                <div className="h-8 w-20 bg-muted rounded-md animate-pulse"></div>
                <div className="h-8 w-20 bg-muted rounded-md animate-pulse"></div>
                <div className="h-8 w-20 bg-muted rounded-md animate-pulse"></div>
                <div className="h-8 w-20 bg-muted rounded-md animate-pulse"></div>
                <div className="h-8 w-20 bg-muted rounded-md animate-pulse"></div> {/* Added for profile */}
                <div className="h-8 w-24 bg-muted rounded-md animate-pulse ml-2"></div>
            </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <BookOpenText className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-primary hidden sm:block">SightWords</h1>
        </Link>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <NavLinkItems />
          <Button variant="default" size="sm" asChild className="ml-2">
            <Link href="/">
              <Brain className="mr-2 h-4 w-4" /> Quick Learn
            </Link>
          </Button>
        </nav>

        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full aspect-square">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs p-0 flex flex-col">
              <SheetHeader className="flex flex-row items-center justify-between p-4 border-b">
                <SheetTitle asChild>
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <BookOpenText className="h-7 w-7 text-primary" />
                    <h1 className="text-xl font-bold text-primary">SightWords</h1>
                  </Link>
                </SheetTitle>
                <SheetClose asChild>
                   <Button variant="ghost" size="icon" className="rounded-full aspect-square">
                      <X className="h-6 w-6" />
                      <span className="sr-only">Close navigation menu</span>
                    </Button>
                </SheetClose>
              </SheetHeader>
              <SheetDescription className="sr-only">Main navigation menu for SightWords application.</SheetDescription>
              <nav className="flex flex-col gap-2 p-4">
                <NavLinkItems isMobile />
                <Button variant="default" size="lg" asChild className="mt-4 w-full">
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <Brain className="mr-2 h-5 w-5" /> Quick Learn
                  </Link>
                </Button>
              </nav>
               <div className="mt-auto p-4 border-t">
                  <Button variant="destructive" className="w-full" onClick={handleResetProgress}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reset Learning Progress
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">This resets learned words, mastered words, reading level, and word length preferences. Theme and sound settings remain unchanged.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};