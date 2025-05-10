
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
  const [introductionSeen, setIntroductionSeen] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClientMounted(true);
    setIntroductionSeen(getHasSeenIntroduction());
  }, []);

  useEffect(() => {
    if (isClientMounted && introductionSeen === false && pathname !== '/introduction') {
      router.replace('/introduction');
    }
  }, [isClientMounted, introductionSeen, pathname, router]);

  useEffect(() => {
    if (isClientMounted && introductionSeen && !hasCompletedWalkthrough && pathname !== '/introduction' && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        openWalkthrough();
      }, 2500); // Delay walkthrough if intro was just seen, or show after normal delay
      return () => clearTimeout(timer);
    }
  }, [isClientMounted, introductionSeen, hasCompletedWalkthrough, openWalkthrough, pathname]);

  if (!isClientMounted || introductionSeen === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (introductionSeen === false && pathname !== '/introduction') {
    // Still redirecting, show loader
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname === '/introduction') {
    return <>{children}</>; // Render only children for the introduction page
  }

  // Render full layout for other pages if introduction has been seen
  if (introductionSeen === true) {
    return (
      <div className="flex flex-col min-h-screen">
        <MainNav />
        <main className="flex-grow container mx-auto px-4 py-6 md:px-6 md:py-8 pb-40 md:pb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out">
          {children}
        </main>
        <BottomNav />
        <QuickLinkFAB />
        <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30 hidden md:block">
           © {new Date().getFullYear()} ChillLearn App. AI-Powered Learning.
        </footer>
        {isClientMounted && ( // Walkthrough modal only if intro seen
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
  }
  
  // Fallback if introductionSeen is true but path is /introduction (should not happen due to above logic)
  // or if introductionSeen is still null (covered by initial loader)
  return null; 
};
