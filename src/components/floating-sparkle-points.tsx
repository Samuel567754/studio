"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { playCoinsEarnedSound } from '@/lib/audio';
import { cn } from '@/lib/utils';

export function FloatingGoldenCoins() {
  const { goldenCoins } = useUserProfileStore();
  const [animatePoints, setAnimatePoints] = useState(false);
  const prevGoldenCoinsRef = useRef(goldenCoins);

  useEffect(() => {
    if (goldenCoins > prevGoldenCoinsRef.current) {
      setAnimatePoints(true);
      playCoinsEarnedSound();
    }
    prevGoldenCoinsRef.current = goldenCoins;
  }, [goldenCoins]);

  const handlePointsAnimationEnd = () => setAnimatePoints(false);

  return (
    <div className={cn(
        "fixed top-[calc(var(--main-nav-height,64px)_+_0.75rem)] left-4 z-50",
        "flex items-center gap-2 p-2.5 rounded-full shadow-xl",
        "bg-gradient-to-br from-yellow-600 via-amber-600 to-orange-700 text-white",
        "border-2 border-yellow-300/70",
        "md:left-5"
      )} aria-live="polite" aria-atomic="true" data-tour-id="floating-golden-coins">

      {/* 3D rotating coin only */}
      <div className="coin-3d-wrapper">
        <Image
          src="/assets/images/golden_star_coin.png"
          alt="Golden Coins"
          width={40}
          height={40}
          className="drop-shadow-md coin-rotate-3d"
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
  );
}