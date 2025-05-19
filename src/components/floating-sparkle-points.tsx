"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { playCoinsEarnedSound, playNotificationSound } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { AchievementsDisplayModal } from '@/components/achievements-display-modal';

// Map points thresholds to image filenames
const POINTS_IMAGE_MAP = [
  { threshold: 5000, src: '/assets/images/20250518_113441_0000.png', alt: 'Mega Gold Reward' },
  { threshold: 300,  src: '/assets/images/Untitled design3.png',      alt: 'Large Gold Reward' },
  { threshold: 175,  src: '/assets/images/Untitled design2.png',      alt: 'Premium Gold Reward' },
  { threshold: 100,  src: '/assets/images/Untitled design.png',       alt: 'Hundred Gold Reward' },
  { threshold: 25,   src: '/assets/images/20250518_114212_0000.png',  alt: 'Twenty Five Gold Reward' },
  { threshold: 10,   src: '/assets/images/Untitled design1.png',      alt: 'Ten Gold Reward' },
  { threshold: 4,    src: '/assets/images/four_gold_coins.png',       alt: 'Four Gold Coins' },
  { threshold: 2,    src: '/assets/images/golden_coin_two_group.png',alt: 'Two Gold Coins' },
  { threshold: 1,    src: '/assets/images/golden_star_coin.png',     alt: 'Single Gold Coin' },
  { threshold: 0,    src: '/assets/images/empty_gold_chest.png',     alt: 'Empty Gold Chest' },
];

/**
 * Returns the correct image data (src & alt) based on the given points.
 * Falls back to default coin if no threshold matches.
 */
function getImageForPoints(points: number) {
  for (const { threshold, src, alt } of POINTS_IMAGE_MAP) {
    if (points >= threshold) {
      return { src, alt };
    }
  }

  // Default image
  return {
    src: '/assets/images/golden_star_coin.png',
    alt: 'Golden Star Coin',
  };
}

export function FloatingGoldenCoins() {
  const { goldenCoins } = useUserProfileStore();
  const [animatePoints, setAnimatePoints] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const prevGoldenCoinsRef = useRef(goldenCoins);

  useEffect(() => {
    if (goldenCoins > prevGoldenCoinsRef.current) {
      setAnimatePoints(true);
      playCoinsEarnedSound();
    }
    prevGoldenCoinsRef.current = goldenCoins;
  }, [goldenCoins]);

  const handlePointsAnimationEnd = () => setAnimatePoints(false);

  const handleOpenAchievementsModal = () => {
    playNotificationSound();
    setIsAchievementsModalOpen(true);
  };

  // Determine which image to show based on current goldenCoins
  const { src: displaySrc, alt: displayAlt } = getImageForPoints(goldenCoins);

  return (
    <>
      <div
        className={cn(
          "fixed top-[calc(var(--main-nav-height,64px)_+_0.75rem)] left-4 z-50",
          "flex items-center gap-2 p-2.5 rounded-full shadow-xl",
          "bg-gradient-to-br from-yellow-600 via-amber-600 to-orange-700 text-white",
          "border-2 border-yellow-300/70",
          "md:left-5",
          "cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
        )}
        onClick={handleOpenAchievementsModal}
        role="button"
        tabIndex={0}
        aria-label="View Golden Coins and Achievements"
        data-tour-id="floating-golden-coins"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Dynamic reward icon based on points */}
        <div className="coin-3d-wrapper">
          <Image
            src={displaySrc}
            alt={displayAlt}
            width={40}
            height={40}
            className={cn(
              "drop-shadow-md",
              animatePoints ? 'golden-coins-update-animation' : 'coin-rotate-3d'
            )}
            onAnimationEnd={handlePointsAnimationEnd}
          />
        </div>

        <span
          className={cn(
            "text-2xl font-bold drop-shadow-md",
            animatePoints && "golden-coins-update-animation"
          )}
          onAnimationEnd={handlePointsAnimationEnd}
        >
          {goldenCoins}
        </span>
        <span className="sr-only">Golden Coins total</span>
      </div>

      <AchievementsDisplayModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
      />
    </>
  );
}
