
"use client";

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image'; // Import Image component
import { BookOpenText, Menu, X, SettingsIcon, User, Map, Sigma, HomeIcon, Puzzle, FileType2 as TextSelectIcon, Trash2, GraduationCap, ShieldAlert, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader as AlertDialogHeaderPrimitive,
  AlertDialogTitle as AlertDialogTitlePrimitive,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';
import { clearProgressStoredData } from '@/lib/storage';
import { useToast } from "@/hooks/use-toast";
import { playNotificationSound, playErrorSound } from '@/lib/audio';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfileStore } from '@/stores/user-profile-store';


const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/word-practice', label: 'Word Practice', icon: TextSelectIcon },
  { href: '/ai-games', label: 'AI Games', icon: Puzzle },
  { href: '/math', label: 'Math Zone', icon: Sigma },
  { href: '/tutorial', label: 'Guide', icon: Map },
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
  const { goldenStars } = useUserProfileStore(); // Get goldenStars for mobile sheet


  useEffect(() => {
    setIsMounted(true);
  }, []);


  const NavLinkItems: FC<{ isMobileSheet?: boolean }> = ({ isMobileSheet = false }) => (
    <>
      {navLinks.map((link) => {
        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
        
        let buttonClassName = cn(
          "justify-start w-full text-base md:text-sm md:w-auto group transition-colors duration-200 ease-in-out",
          "text-[hsl(var(--nav-text-light))]", 
          isMobileSheet ? "py-3 px-4 rounded-lg" : "py-2 px-3 rounded-md md:h-10"
        );

        if (isActive) {
          buttonClassName = cn(
            buttonClassName,
            "font-semibold",
            "bg-[hsl(var(--nav-active-indicator-light))] text-[hsl(var(--nav-active-text-light))]" 
          );
        } else {
           buttonClassName = cn(
            buttonClassName,
            "hover:bg-[hsl(var(--nav-active-indicator-light))]/50 hover:text-[hsl(var(--nav-active-text-light))]" 
          );
        }
        
        const IconComp = link.icon;

        return (
          <Button
            key={link.href}
            variant="ghost" 
            asChild
            className={buttonClassName}
            onClick={() => isMobileSheet && setIsMobileMenuOpen(false)}
          >
            <Link href={link.href} className="flex items-center gap-2" aria-current={isActive ? "page" : undefined}>
              <IconComp className={cn("h-5 w-5", 
                isActive 
                  ? "text-[hsl(var(--nav-active-text-light))]" 
                  : "text-[hsl(var(--nav-icon-light))] group-hover:text-[hsl(var(--nav-active-text-light))]"
              )} aria-hidden="true" />
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
      <header className="sticky top-0 z-50 w-full h-16 bg-muted animate-pulse">
        <div className="container mx-auto flex h-full items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-background/50 rounded-full"></div>
                <div className="h-7 w-28 bg-background/50 rounded-md hidden sm:block"></div>
            </div>
            <div className="md:hidden">
                 <div className="h-10 w-10 bg-background/50 rounded-full"></div>
            </div>
            <div className="hidden md:flex items-center gap-1">
                {/* Removed old points display placeholder */}
            </div>
        </div>
      </header>
    );
  }

  const navBarBaseClasses = "sticky top-0 z-40 w-full bg-nav-gradient shadow-nav-bottom border-b"; // z-index reduced for floating points
  const navBarBorderColor = "border-[hsl(var(--nav-border-light))]"; 

  return (
    <header className={cn(navBarBaseClasses, navBarBorderColor )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsMobileMenuOpen(false)}>
          <BookOpenText className={cn(
            "h-8 w-8 transition-colors duration-300 ease-in-out text-[hsl(var(--nav-icon-light))] group-hover:text-accent"
          )} aria-hidden="true" />
          <h1 className={cn(
            "text-2xl font-bold transition-colors duration-300 ease-in-out hidden sm:block text-[hsl(var(--nav-text-light))] group-hover:text-accent"
          )}>ChillLearn</h1>
        </Link>

        {/* Desktop Navigation - Removed direct points display from here */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main navigation">
          <NavLinkItems />
          <Button 
            variant="default" 
            size="sm" 
            className="ml-2 btn-glow md:h-10 md:px-4 md:py-2 bg-primary text-primary-foreground hover:bg-primary/90" 
            asChild
          >
            <Link href="/learn">
              <GraduationCap className="mr-2 h-4 w-4" aria-hidden="true" /> Quick Learn
            </Link>
          </Button>
        </nav>

        {/* Mobile Hamburger Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full aspect-square h-12 w-12 transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0", 
                  "text-[hsl(var(--nav-icon-light))]", 
                  "hover:bg-[hsl(var(--nav-active-indicator-light))]/50",
                  isMobileMenuOpen && "bg-[hsl(var(--nav-active-indicator-light))]"
                )}
                aria-label="Open main navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className={cn("h-7 w-7", "text-[hsl(var(--nav-icon-light))]", isMobileMenuOpen && "hidden")} aria-hidden="true" />
                <X
                  className={cn("h-7 w-7",
                    isMobileMenuOpen ? "text-[hsl(var(--nav-active-text-light))]" : "text-[hsl(var(--nav-icon-light))]",
                    !isMobileMenuOpen && "hidden")}
                  aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className={cn(
                "w-full max-w-xs p-0 flex flex-col bg-nav-gradient border-l border-[hsl(var(--nav-border-light))]" 
              )}
            >
              <SheetHeader className={cn(
                "flex flex-row items-center justify-between p-4 border-b border-[hsl(var(--nav-border-light))]" 
              )}>
                <SheetTitle asChild>
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <BookOpenText className={cn("h-7 w-7 text-[hsl(var(--nav-icon-light))]")}/>
                    <h1 className={cn("text-xl font-bold text-[hsl(var(--nav-text-light))]")}>ChillLearn</h1>
                  </Link>
                </SheetTitle>
                 <SheetClose className={cn("rounded-full p-1.5 opacity-80 ring-offset-background transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-transparent",
                    "hover:bg-[hsl(var(--nav-active-indicator-light))]/50 hover:text-[hsl(var(--nav-active-text-light))]",
                    isMobileMenuOpen ? "text-[hsl(var(--nav-active-text-light))]" : "text-[hsl(var(--nav-icon-light))]"
                  )}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                  </SheetClose>
              </SheetHeader>
              <SheetDescription className="sr-only">Main navigation menu for ChillLearn application.</SheetDescription>
              
              {/* Points display for mobile sheet */}
              <div className={cn("flex items-center justify-center gap-1.5 p-2 my-2 mx-4 rounded-lg bg-[hsl(var(--nav-active-indicator-light))]/30 shadow-inner text-[hsl(var(--nav-text-light))]")}>
                  <Image 
                    src="/assets/images/gold_star_icon.png" 
                    alt="Golden Star" 
                    width={20} 
                    height={20} 
                    className="drop-shadow-sm"
                  />
                  <span className="font-semibold text-sm">{goldenStars}</span>
                  <span className="text-xs opacity-80">Stars</span>
              </div>

              <nav className="flex flex-col gap-2 p-4" aria-label="Mobile navigation">
                <NavLinkItems isMobileSheet={true} />
                <Button
                  variant="default"
                  size="lg"
                  asChild
                  className={cn(
                    "mt-4 w-full btn-glow bg-primary text-primary-foreground hover:bg-primary/90" 
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/learn">
                    <GraduationCap className="mr-2 h-5 w-5" aria-hidden="true" /> Quick Learn
                  </Link>
                </Button>
              </nav>
               <div className={cn("mt-auto p-4 border-t", "border-[hsl(var(--nav-border-light))]")}> 
                <AlertDialog open={isConfirmResetOpen} onOpenChange={setIsConfirmResetOpen}>
                  <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className={cn(
                          "w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        )}
                      >
                          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Reset All Progress
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className={cn("bg-[hsl(var(--nav-gradient-from-light))] border-[hsl(var(--nav-border-light))] text-[hsl(var(--nav-text-light))]")}> 
                    <AlertDialogHeaderPrimitive>
                      <AlertDialogTitlePrimitive className={cn("flex items-center gap-2 text-destructive")}>
                         <ShieldAlert className="h-6 w-6 text-destructive" />
                         Confirm Full Reset
                      </AlertDialogTitlePrimitive>
                      <AlertDialogDescription className={cn("text-[hsl(var(--nav-text-light))]/80")}>
                        This action is irreversible and will clear all your learning progress,
                        including your word lists, mastered words, reading level, word length preferences,
                        username, favorite topics, golden stars, and tutorial completion status.
                        You will be taken back to the app introduction.
                        <br/><br/>
                        <strong>Are you absolutely sure you want to reset everything?</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeaderPrimitive>
                    <AlertDialogFooter>
                      <AlertDialogCancel className={cn("border-[hsl(var(--nav-border-light))] text-[hsl(var(--nav-text-light))] bg-transparent hover:bg-[hsl(var(--nav-active-indicator-light))]/50")}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmResetProgress}
                        className={cn(
                          "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        )}
                      >
                        Yes, Reset Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                  <p className={cn("text-xs mt-2 text-center text-[hsl(var(--nav-text-light))]/70")}>This resets all learning data and app usage preferences. You will see the introduction again.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
