
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Menu, X, SettingsIcon, User, Map, Sigma, HomeIcon, Puzzle, FileType2 as TextSelectIcon, Trash2, GraduationCap, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';
import { clearProgressStoredData } from '@/lib/storage';
import { useToast } from "@/hooks/use-toast";
import { playNotificationSound, playErrorSound } from '@/lib/audio';
import { useIsMobile } from '@/hooks/use-mobile';


const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/word-practice', label: 'Word Practice', icon: TextSelectIcon },
  { href: '/ai-games', label: 'AI Games', icon: Puzzle },
  { href: '/math', label: 'Math Zone', icon: Sigma },
  { href: '/tutorial', label: 'Tutorial', icon: Map },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const MainNav: FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const isMobile = useIsMobile();


  useEffect(() => {
    setIsMounted(true);
  }, []);


  const NavLinkItems: FC<{ isMobileSheet?: boolean }> = ({ isMobileSheet = false }) => (
    <>
      {navLinks.map((link) => {
        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
        let buttonVariant: "secondary" | "ghost" = isActive ? 'secondary' : 'ghost';
        let buttonClassName = cn(
          "justify-start w-full text-base md:text-sm md:w-auto",
          isMobileSheet ? "py-3 px-4" : "py-2 px-3 md:h-10"
        );

        if (isMobileSheet) { // Apply forced dark theme styles for mobile sheet items
          if (isActive) {
            // Active items in mobile sheet: use forced dark secondary colors
            buttonClassName = cn(buttonClassName, "font-semibold bg-[hsl(175_40%_25%)] text-[hsl(175_60%_75%)] hover:bg-[hsl(175_40%_30%)] hover:text-[hsl(175_60%_80%)]");
          } else {
            // Inactive (ghost) items in mobile sheet: use forced dark muted-foreground and dark muted hover
            buttonClassName = cn(buttonClassName, "text-[hsl(210_20%_65%)] hover:bg-[hsl(210_25%_20%)] hover:text-[hsl(40_20%_90%)]");
          }
        } else { // Desktop styles (rely on global theme)
          if (isActive) {
            buttonClassName = cn(buttonClassName, "font-semibold");
            // variant 'secondary' handles default light/dark theming
          }
          // variant 'ghost' handles default light/dark theming for inactive
        }

        return (
          <Button
            key={link.href}
            variant={buttonVariant}
            asChild
            className={buttonClassName}
            onClick={() => isMobileSheet && setIsMobileMenuOpen(false)}
          >
            <Link href={link.href} className="flex items-center gap-2" aria-current={isActive ? "page" : undefined}>
              <link.icon className="h-5 w-5" aria-hidden="true" />
              {link.label}
            </Link>
          </Button>
        );
      })}
    </>
  );

  const handleConfirmResetProgress = () => {
    if (typeof window !== 'undefined') {
        clearProgressStoredData();
        setIsMobileMenuOpen(false);
        toast({
            title: <div className="flex items-center gap-2"><Trash2 className="h-5 w-5" />Progress Reset</div>,
            description: "Your learning and app usage data has been cleared. You will see the introduction again.",
            variant: "destructive"
        });
        playErrorSound();
        window.location.href = '/introduction';
    }
    setIsConfirmResetOpen(false);
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
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm",
      isMobile ? "border-[hsl(210_25%_25%)]/40 bg-[hsl(210_30%_10%)]/95" : "border-border/40 bg-background/95"
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsMobileMenuOpen(false)}>
          <BookOpenText className={cn(
            "h-8 w-8 transition-colors duration-300 ease-in-out",
            isMobile ? "text-[hsl(175_70%_55%)] group-hover:text-[hsl(20_90%_65%)]" : "text-primary group-hover:text-accent"
          )} aria-hidden="true" />
          <h1 className={cn(
            "text-2xl font-bold transition-colors duration-300 ease-in-out hidden sm:block",
             isMobile ? "text-[hsl(175_70%_55%)] group-hover:text-[hsl(20_90%_65%)]" : "text-primary group-hover:text-accent"
          )}>ChillLearn</h1>
        </Link>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main navigation">
          <NavLinkItems />
          <Button variant="default" size="sm" className="ml-2 btn-glow md:h-10 md:px-4 md:py-2" asChild>
            <Link href="/learn">
              <GraduationCap className="mr-2 h-4 w-4" aria-hidden="true" /> Quick Learn
            </Link>
          </Button>
        </nav>

        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full aspect-square h-10 w-10 transition-colors duration-200",
                  isMobileMenuOpen
                    ? (isMobile ? "bg-[hsl(20_90%_65%)]/20 text-[hsl(20_90%_65%)]" : "bg-accent/20 text-accent")
                    : (isMobile ? "hover:bg-[hsl(210_25%_20%)]" : "hover:bg-accent/10")
                )}
                aria-label="Open main navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className={cn("h-8 w-8", isMobile ? "text-[hsl(40_20%_90%)]" : "text-foreground")} aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className={cn(
              "w-full max-w-xs p-0 flex flex-col backdrop-blur-md",
              isMobile ? "bg-[hsl(210_30%_15%)]/95 border-[hsl(210_25%_20%)]" : "bg-card/95 border-border"
            )}>
              <SheetHeader className={cn(
                "flex flex-row items-center justify-between p-4 border-b",
                isMobile ? "border-[hsl(210_25%_20%)]" : "border-border/30"
              )}>
                <SheetTitle asChild>
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <BookOpenText className={cn("h-7 w-7", isMobile ? "text-[hsl(175_70%_55%)]" : "text-primary")} aria-hidden="true"/>
                    <h1 className={cn("text-xl font-bold", isMobile ? "text-[hsl(175_70%_55%)]" : "text-primary")}>ChillLearn</h1>
                  </Link>
                </SheetTitle>
                 <SheetClose 
                  className={cn(
                    "rounded-full p-1.5 opacity-80 ring-offset-background transition-all hover:opacity-100",
                    isMobile ? "hover:bg-[hsl(210_25%_20%)] text-[hsl(40_20%_90%)]" : "hover:bg-muted/80 text-foreground"
                  )}
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </SheetClose>
              </SheetHeader>
              <SheetDescription className="sr-only">Main navigation menu for ChillLearn application.</SheetDescription>
              <nav className="flex flex-col gap-2 p-4" aria-label="Mobile navigation">
                <NavLinkItems isMobileSheet={true} />
                <Button
                  variant="default"
                  size="lg"
                  asChild
                  className={cn(
                    "mt-4 w-full btn-glow",
                    isMobile && "bg-[hsl(175_70%_55%)] text-[hsl(210_30%_10%)] hover:bg-[hsl(175_70%_55%)]/90 active:bg-[hsl(175_70%_55%)]/80"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/learn">
                    <GraduationCap className="mr-2 h-5 w-5" aria-hidden="true" /> Quick Learn
                  </Link>
                </Button>
              </nav>
               <div className={cn("mt-auto p-4 border-t", isMobile ? "border-[hsl(210_25%_20%)]" : "border-border/30")}>
                <AlertDialog open={isConfirmResetOpen} onOpenChange={setIsConfirmResetOpen}>
                  <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className={cn(
                          "w-full",
                          isMobile && "bg-[hsl(0_70%_55%)] text-[hsl(0_0%_95%)] hover:bg-[hsl(0_70%_55%)]/90 active:bg-[hsl(0_70%_55%)]/80"
                        )}
                      >
                          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Reset All Progress
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className={cn(isMobile && "bg-[hsl(210_30%_15%)] border-[hsl(210_25%_20%)] text-[hsl(40_20%_90%)]")}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className={cn("flex items-center gap-2", isMobile && "text-[hsl(0_70%_65%)]")}>
                         <ShieldAlert className="h-6 w-6 text-destructive" /> {/* Destructive icon will use global theme's destructive color */}
                         Confirm Full Reset
                      </AlertDialogTitle>
                      <AlertDialogDescription className={cn(isMobile && "text-[hsl(210_20%_65%)]")}>
                        This action is irreversible and will clear all your learning progress,
                        including your word lists, mastered words, reading level, word length preferences,
                        username, favorite topics, and tutorial completion status.
                        You will be taken back to the app introduction.
                        <br/><br/>
                        <strong>Are you absolutely sure you want to reset everything?</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className={cn(isMobile && "border-[hsl(210_25%_25%)] text-[hsl(40_20%_80%)] bg-[hsl(210_30%_20%)] hover:bg-[hsl(210_30%_25%)]")}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmResetProgress}
                        className={cn(
                          isMobile ? "bg-[hsl(0_70%_55%)] hover:bg-[hsl(0_70%_55%)]/90 text-[hsl(0_0%_95%)] active:bg-[hsl(0_70%_55%)]/80" : "bg-destructive hover:bg-destructive/90"
                        )}
                      >
                        Yes, Reset Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                  <p className={cn("text-xs mt-2 text-center", isMobile ? "text-[hsl(210_20%_45%)]" : "text-muted-foreground")}>This resets all learning data and app usage preferences. You will see the introduction again.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

