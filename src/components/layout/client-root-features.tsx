
"use client";

import type { FC, PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWalkthroughStore } from '@/stores/walkthrough-store';
import { WalkthroughGuide } from '@/components/walkthrough-guide';
import { getHasSeenIntroduction, getHasCompletedPersonalization } from '@/lib/storage';
import { MainNav } from '@/components/main-nav';
import { BottomNav } from '@/components/bottom-nav';
import { QuickLinkFAB } from '@/components/quicklink-fab';
import { Loader2 } from 'lucide-react';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { FloatingGoldenStars } from '@/components/floating-sparkle-points'; // New floating display
import { tutorialStepsData as walkthroughGuideSteps } from '@/components/tutorial/tutorial-data';

export const ClientRootFeatures: FC<PropsWithChildren> = ({ children }) => {
  const {
    hasCompletedWalkthrough,
    openWalkthrough,
    isWalkthroughOpen,
    closeWalkthrough,
    setHasCompletedWalkthrough,
    setCurrentStepIndex,
  } = useWalkthroughStore();

  const { loadUserProfileFromStorage } = useUserProfileStore();
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [actualIntroductionSeen, setActualIntroductionSeen] = useState<boolean | null>(null);
  const [actualPersonalizationCompleted, setActualPersonalizationCompleted] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClientMounted(true);
    loadUserProfileFromStorage();
    setActualIntroductionSeen(getHasSeenIntroduction());
    setActualPersonalizationCompleted(getHasCompletedPersonalization());

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'chilllearn_introductionSeen_v1') {
        setActualIntroductionSeen(getHasSeenIntroduction());
      }
      if (event.key === 'chilllearn_personalizationCompleted_v1') {
        setActualPersonalizationCompleted(getHasCompletedPersonalization());
      }
      if (event.key === useUserProfileStore.persist.getOptions().name) {
        loadUserProfileFromStorage();
      }
      if (event.key === useWalkthroughStore.persist.getOptions().name) {
        const store = useWalkthroughStore.getState();
        // This might not be strictly necessary as Zustand's persist rehydrates,
        // but explicitly updating component state if store state changes externally can be robust.
        if (store.hasCompletedWalkthrough !== hasCompletedWalkthrough) {
          // Component will re-render due to hook update
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadUserProfileFromStorage, hasCompletedWalkthrough]);

  useEffect(() => {
    if (isClientMounted) {
      const introSeen = getHasSeenIntroduction();
      const personalizationCompleted = getHasCompletedPersonalization();
      setActualIntroductionSeen(introSeen);
      setActualPersonalizationCompleted(personalizationCompleted);

      if (!introSeen && pathname !== '/introduction') {
        router.replace('/introduction');
      } else if (introSeen && !personalizationCompleted && pathname !== '/personalize' && pathname !== '/introduction') {
        router.replace('/personalize');
      }
    }
  }, [isClientMounted, pathname, router]);

  useEffect(() => {
    if (isClientMounted && actualIntroductionSeen && actualPersonalizationCompleted && !hasCompletedWalkthrough && pathname !== '/introduction' && pathname !== '/personalize' && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        if (!isWalkthroughOpen) {
          setCurrentStepIndex(0);
          openWalkthrough();
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isClientMounted, actualIntroductionSeen, actualPersonalizationCompleted, hasCompletedWalkthrough, openWalkthrough, pathname, isWalkthroughOpen, setCurrentStepIndex]);


  if (!isClientMounted || actualIntroductionSeen === null || (actualIntroductionSeen && actualPersonalizationCompleted === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname === '/introduction' || pathname === '/personalize') {
    return <>{children}</>;
  }

  if (!actualIntroductionSeen) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="sr-only">Redirecting to introduction...</p>
      </div>
    );
  }

  if (!actualPersonalizationCompleted) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="sr-only">Redirecting to personalization...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <FloatingGoldenStars /> {/* Add the floating display here */}
      <main
        data-tour-id="main-content-area"
        className="flex-grow container mx-auto px-4 py-6 md:px-6 md:py-8 pb-24 md:pb-10 pt-20 md:pt-24 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out relative"
      >
        {children}
      </main>
      <BottomNav />
      <QuickLinkFAB />
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30 hidden md:block">
         © {new Date().getFullYear()} ChillLearn AI. An AI-Powered Learning Adventure.
      </footer>
      {isClientMounted && (
        <WalkthroughGuide
          steps={walkthroughGuideSteps}
          isOpen={isWalkthroughOpen}
          onClose={() => { // Only closes the modal, doesn't mark as fully complete
            closeWalkthrough();
          }}
          onFinish={() => { // Marks as complete and closes
            setHasCompletedWalkthrough(true);
            closeWalkthrough();
          }}
        />
      )}
    </div>
  );
};
