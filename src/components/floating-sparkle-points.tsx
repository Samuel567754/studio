
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { playCoinsEarnedSound } from '@/lib/audio'; // Changed from playStarsEarnedSound
import { cn } from '@/lib/utils';

export function FloatingGoldenCoins() { // Renamed component
  const { goldenCoins } = useUserProfileStore(); // Changed from goldenStars
  const [animatePoints, setAnimatePoints] = useState(false);
  const prevGoldenCoinsRef = useRef(goldenCoins); // Changed from goldenStars

  useEffect(() => {
    if (goldenCoins > prevGoldenCoinsRef.current) {
      setAnimatePoints(true);
      playCoinsEarnedSound(); // Changed
    } else if (goldenCoins < prevGoldenCoinsRef.current && goldenCoins === 0 && prevGoldenCoinsRef.current > 0) {
      setAnimatePoints(false);
    }
    prevGoldenCoinsRef.current = goldenCoins;
  }, [goldenCoins]);

  const handlePointsAnimationEnd = () => {
    setAnimatePoints(false);
  };

  return (
    <div
      className={cn(
        "fixed top-[calc(var(--main-nav-height,64px)_+_0.75rem)] left-4 z-50 flex items-center gap-2 p-2.5 rounded-full shadow-xl transition-all duration-300 ease-out",
        "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-white", 
        "border-2 border-yellow-300/70",
        "md:left-5" 
      )}
      aria-live="polite"
      aria-atomic="true"
      data-tour-id="floating-golden-coins" // Updated tour-id
    >
      <Image
        src="/assets/images/golden_star_coin.png" // Using a coin-like star
        alt="Golden Coins" // Changed alt text
        width={40} 
        height={40}
        className="drop-shadow-md"
      />
      <span
        className={cn(
          "text-2xl font-bold drop-shadow-md",
          animatePoints && "golden-coins-update-animation" // Changed animation class name
        )}
        onAnimationEnd={handlePointsAnimationEnd}
      >
        {goldenCoins}
      </span>
      <span className="sr-only">Golden Coins total</span>
    </div>
  );
}

    