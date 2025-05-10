
"use client";

import type { FC, PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWalkthroughStore } from '@/stores/walkthrough-store';
import { WalkthroughModal } from '@/components/walkthrough-modal';
import { getHasSeenIntroduction } from '@/lib/storage';
import { MainNav } from '@/components/main-nav';
import { BottomNav } from '@/components/bottom-nav';
import { QuickLinkFAB } from '@/components/quicklink-fab';
import { Loader2 } from 'lucide-react';

export const ClientRootFeatures: FC<PropsWithChildren> = ({ children }) => {
  const {
    hasCompletedWalkthrough,
    openWalkthrough,
    isWalkthroughOpen,
    closeWalkthrough,
    setHasCompletedWalkthrough,
  } = useWalkthroughStore();
  
  const [isClientMounted, setIsClientMounted] = useState(false);
  // This state reflects the most up-to-date knowledge of whether intro has been seen,
  // fetched from localStorage on mount and on pathname changes.
  const [actualIntroductionSeen, setActualIntroductionSeen] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClientMounted(true);
    // Initial check on mount
    setActualIntroductionSeen(getHasSeenIntroduction());

    // Optional: Listen for storage events to catch changes made by other tabs/windows.
    // For this specific flow, re-checking on pathname change (in the next effect) is primary.
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'chilllearn_introductionSeen_v1') {
        setActualIntroductionSeen(getHasSeenIntroduction());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // This effect handles re-checking intro status on pathname changes
  // AND handles redirection if intro is not seen.
  useEffect(() => {
    if (isClientMounted) {
      // Always get the latest status from localStorage when pathname changes
      const currentSeenStatus = getHasSeenIntroduction();
      setActualIntroductionSeen(currentSeenStatus);

      if (!currentSeenStatus && pathname !== '/introduction') {
        router.replace('/introduction');
      }
    }
  }, [isClientMounted, pathname, router]); // Effect runs when pathname changes

  // Walkthrough logic (uses actualIntroductionSeen)
  useEffect(() => {
    if (isClientMounted && actualIntroductionSeen && !hasCompletedWalkthrough && pathname !== '/introduction' && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        openWalkthrough();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isClientMounted, actualIntroductionSeen, hasCompletedWalkthrough, openWalkthrough, pathname]);

  // Render loading state until client is mounted and intro status is determined
  if (!isClientMounted || actualIntroductionSeen === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If intro hasn't been seen and we are NOT on the intro page,
  // the effect above will handle redirection. Show loader while redirecting.
  if (actualIntroductionSeen === false && pathname !== '/introduction') {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If on the introduction page, render only its children (the intro page content)
  if (pathname === '/introduction') {
    return <>{children}</>;
  }

  // If intro has been seen (or we are past the redirect logic for unseen intro), render full layout
  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-grow container mx-auto px-4 py-6 md:px-6 md:py-8 pb-40 md:pb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out">
        {children}
      </main>
      <BottomNav />
      <QuickLinkFAB />
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30 hidden md:block">
         © {new Date().getFullYear()} ChillLearn AI. An AI-Powered Learning Adventure.
      </footer>
      {isClientMounted && ( // Walkthrough modal only if intro seen and client mounted
        <WalkthroughModal
          isOpen={isWalkthroughOpen}
          onClose={closeWalkthrough}
          onFinish={() => {
            setHasCompletedWalkthrough(true);
            closeWalkthrough();
          }}
        />
      )}
    </div>
  );
};
