
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { playCoinsEarnedSound, playCoinsDeductedSound, playNotificationSound } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { AchievementsDisplayModal } from '@/components/achievements-display-modal'; // Import the new modal

export function FloatingGoldenCoins() {
  const { goldenCoins } = useUserProfileStore();
  const [animatePointsChange, setAnimatePointsChange] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false); // State for modal
  const prevGoldenCoinsRef = useRef(goldenCoins);

  useEffect(() => {
    if (prevGoldenCoinsRef.current !== goldenCoins && prevGoldenCoinsRef.current !== undefined) { // Ensure prevGoldenCoinsRef is not undefined on first run
      if (goldenCoins > prevGoldenCoinsRef.current) {
        playCoinsEarnedSound();
      } else if (goldenCoins < prevGoldenCoinsRef.current) {
        playCoinsDeductedSound();
      }
      setAnimatePointsChange(true);
    }
    prevGoldenCoinsRef.current = goldenCoins;
  }, [goldenCoins]);

  const handlePointsAnimationEnd = () => {
    setAnimatePointsChange(false);
  };

  const handleOpenAchievementsModal = () => {
    playNotificationSound();
    setIsAchievementsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpenAchievementsModal}
        className={cn(
          "fixed top-[calc(var(--main-nav-height,64px)_+_0.75rem)] left-4 z-50 flex items-center gap-1.5 p-2.5 rounded-full shadow-xl transition-all duration-300 ease-out cursor-pointer hover:scale-105 active:scale-95",
          "bg-gradient-to-br from-yellow-600 via-amber-600 to-orange-700 text-white",
          "border-2 border-yellow-300/70",
          "md:left-5"
        )}
        aria-live="polite"
        aria-atomic="true"
        data-tour-id="floating-golden-coins"
        aria-label="View Golden Coins and Achievements"
      >
        <Image
          src="/assets/images/gold_star_icon.png"
          alt="Golden Coins"
          width={40}
          height={40}
          className="drop-shadow-md animate-coin-rotate"
        />
        <span
          className={cn(
            "text-2xl font-bold drop-shadow-md",
            animatePointsChange && "golden-coins-update-animation"
          )}
          onAnimationEnd={handlePointsAnimationEnd}
        >
          {goldenCoins}
        </span>
        <span className="sr-only">Golden Coins total</span>
      </button>
      <AchievementsDisplayModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
      />
    </>
  );
}
