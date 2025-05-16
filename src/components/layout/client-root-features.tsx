
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
import { useUserProfileStore, type Achievement } from '@/stores/user-profile-store';
import { FloatingGoldenCoins } from '@/components/floating-sparkle-points';
import { tutorialStepsData as walkthroughGuideSteps } from '@/components/tutorial/tutorial-data';
import { AchievementUnlockedModal } from '@/components/achievement-unlocked-modal';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup'; // Import CoinsLostPopup

export const ClientRootFeatures: FC<PropsWithChildren> = ({ children }) => {
  const {
    hasCompletedWalkthrough,
    openWalkthrough,
    isWalkthroughOpen,
    closeWalkthrough,
    setHasCompletedWalkthrough,
    setCurrentStepIndex,
  } = useWalkthroughStore();

  const {
    loadUserProfileFromStorage,
    pendingClaimAchievements,
    claimNextPendingAchievement,
    lastBonusAwarded,
    clearLastBonusAwarded,
    lastGameCoinsAwarded,
    clearLastGameCoinsAwarded,
    lastCoinsDeducted, // Get new state
    clearLastCoinsDeducted, // Get new action
  } = useUserProfileStore();

  const [isClientMounted, setIsClientMounted] = useState(false);
  const [actualIntroductionSeen, setActualIntroductionSeen] = useState<boolean | null>(null);
  const [actualPersonalizationCompleted, setActualPersonalizationCompleted] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [showAchievementBonusPopup, setShowAchievementBonusPopup] = useState(false);
  const [currentAchievementBonusAmount, setCurrentAchievementBonusAmount] = useState(0);

  const [showGameCoinsPopup, setShowGameCoinsPopup] = useState(false);
  const [currentGameCoinsAmount, setCurrentGameCoinsAmount] = useState(0);

  const [showCoinsLostPopupDisplay, setShowCoinsLostPopupDisplay] = useState(false); // New state for CoinsLostPopup
  const [currentCoinsLostAmount, setCurrentCoinsLostAmount] = useState(0); // New state for CoinsLostPopup

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
        // Zustand handles re-hydration
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadUserProfileFromStorage]);

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
        if (!isWalkthroughOpen && pendingClaimAchievements.length === 0 && !showAchievementBonusPopup && !showGameCoinsPopup && !showCoinsLostPopupDisplay) {
          setCurrentStepIndex(0);
          openWalkthrough();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isClientMounted, actualIntroductionSeen, actualPersonalizationCompleted, hasCompletedWalkthrough, openWalkthrough, pathname, isWalkthroughOpen, setCurrentStepIndex, pendingClaimAchievements, showAchievementBonusPopup, showGameCoinsPopup, showCoinsLostPopupDisplay]);

  useEffect(() => {
    if (lastBonusAwarded && lastBonusAwarded.amount > 0) {
      setCurrentAchievementBonusAmount(lastBonusAwarded.amount);
      setShowAchievementBonusPopup(true);
      clearLastBonusAwarded();
    }
  }, [lastBonusAwarded, clearLastBonusAwarded]);

  useEffect(() => {
    if (lastGameCoinsAwarded && lastGameCoinsAwarded.amount > 0) {
      setCurrentGameCoinsAmount(lastGameCoinsAwarded.amount);
      setShowGameCoinsPopup(true);
      clearLastGameCoinsAwarded();
    }
  }, [lastGameCoinsAwarded, clearLastGameCoinsAwarded]);

  // Effect for CoinsLostPopup
  useEffect(() => {
    if (lastCoinsDeducted && lastCoinsDeducted.amount > 0) {
      setCurrentCoinsLostAmount(lastCoinsDeducted.amount);
      setShowCoinsLostPopupDisplay(true);
      clearLastCoinsDeducted();
    }
  }, [lastCoinsDeducted, clearLastCoinsDeducted]);


  if (!isClientMounted || actualIntroductionSeen === null || (actualIntroductionSeen && actualPersonalizationCompleted === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if ((pathname === '/introduction' || pathname === '/personalize') && !actualIntroductionSeen && !actualPersonalizationCompleted) {
     return <>{children}</>;
  }
  
  if (!actualIntroductionSeen && pathname !== '/introduction') {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="sr-only">Redirecting to introduction...</p>
      </div>
    );
  }

  if (actualIntroductionSeen && !actualPersonalizationCompleted && pathname !== '/personalize' && pathname !== '/introduction') {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="sr-only">Redirecting to personalization...</p>
      </div>
    );
  }
  
  const currentAchievementToClaim = pendingClaimAchievements.length > 0 ? pendingClaimAchievements[0] : null;

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <FloatingGoldenCoins />
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
          onClose={() => { 
            closeWalkthrough();
            setHasCompletedWalkthrough(true); // Mark as complete if user closes it manually
          }}
          onFinish={() => { 
            setHasCompletedWalkthrough(true);
            closeWalkthrough();
          }}
        />
      )}
      {currentAchievementToClaim && (
        <AchievementUnlockedModal
          achievement={currentAchievementToClaim}
          isOpen={true} 
          onClaim={() => {
            claimNextPendingAchievement(); 
          }}
        />
      )}
      {showAchievementBonusPopup && currentAchievementBonusAmount > 0 && (
        <CoinsEarnedPopup
          coins={currentAchievementBonusAmount}
          show={showAchievementBonusPopup}
          onComplete={() => setShowAchievementBonusPopup(false)}
        />
      )}
      {showGameCoinsPopup && currentGameCoinsAmount > 0 && (
        <CoinsEarnedPopup
          coins={currentGameCoinsAmount}
          show={showGameCoinsPopup}
          onComplete={() => setShowGameCoinsPopup(false)}
        />
      )}
      {showCoinsLostPopupDisplay && currentCoinsLostAmount > 0 && ( // Render CoinsLostPopup
        <CoinsLostPopup
          coins={currentCoinsLostAmount}
          show={showCoinsLostPopupDisplay}
          onComplete={() => setShowCoinsLostPopupDisplay(false)}
        />
      )}
    </div>
  );
};
