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
import { useUserProfileStore } from '@/stores/user-profile-store';

export const ClientRootFeatures: FC<PropsWithChildren> = ({ children }) => {
  const {
    hasCompletedWalkthrough,
    openWalkthrough,
    isWalkthroughOpen,
    closeWalkthrough,
    setHasCompletedWalkthrough,
  } = useWalkthroughStore();
  
  const { loadUsernameFromStorage } = useUserProfileStore();
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [actualIntroductionSeen, setActualIntroductionSeen] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClientMounted(true);
    loadUsernameFromStorage(); // Load username into store
    setActualIntroductionSeen(getHasSeenIntroduction());

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'chilllearn_introductionSeen_v1') {
        setActualIntroductionSeen(getHasSeenIntroduction());
      }
      if (event.key === useUserProfileStore.persist.getOptions().name) { // Check if username storage changed
        loadUsernameFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadUsernameFromStorage]);

  useEffect(() => {
    if (isClientMounted) {
      const currentSeenStatus = getHasSeenIntroduction();
      setActualIntroductionSeen(currentSeenStatus);

      if (!currentSeenStatus && pathname !== '/introduction') {
        router.replace('/introduction');
      }
    }
  }, [isClientMounted, pathname, router]);

  useEffect(() => {
    if (isClientMounted && actualIntroductionSeen && !hasCompletedWalkthrough && pathname !== '/introduction' && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        openWalkthrough();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isClientMounted, actualIntroductionSeen, hasCompletedWalkthrough, openWalkthrough, pathname]);

  if (!isClientMounted || actualIntroductionSeen === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (actualIntroductionSeen === false && pathname !== '/introduction') {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname === '/introduction') {
    return <>{children}</>;
  }

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
      {isClientMounted && ( 
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
