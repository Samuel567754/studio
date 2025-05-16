
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { playStarsEarnedSound } from '@/lib/audio';
import { cn } from '@/lib/utils';

export function FloatingGoldenStars() {
  const { goldenStars } = useUserProfileStore();
  const [animatePoints, setAnimatePoints] = useState(false);
  const prevGoldenStarsRef = useRef(goldenStars);
  const pointsDisplayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (goldenStars > prevGoldenStarsRef.current) {
      setAnimatePoints(true);
      playStarsEarnedSound();
    }
    prevGoldenStarsRef.current = goldenStars;
  }, [goldenStars]);

  const handlePointsAnimationEnd = () => {
    setAnimatePoints(false);
  };

  return (
    <div
      className={cn(
        "fixed top-[calc(var(--main-nav-height,64px)_+_0.75rem)] left-4 z-50 flex items-center gap-2 p-2.5 rounded-full shadow-xl transition-all duration-300 ease-out", // Adjusted top position
        "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-white",
        "border-2 border-yellow-300/70",
        "md:left-5" // Consistent left padding for desktop
      )}
      aria-live="polite"
      aria-atomic="true"
      data-tour-id="floating-golden-stars"
    >
      <Image
        src="/assets/images/gold_star_icon.png"
        alt="Golden Stars"
        width={32}
        height={32}
        className="drop-shadow-md"
      />
      <span
        ref={pointsDisplayRef}
        className={cn(
          "text-xl font-bold drop-shadow-md",
          animatePoints && "golden-stars-update-animation" // Apply animation class
        )}
        onAnimationEnd={handlePointsAnimationEnd} // Reset animation state
      >
        {goldenStars}
      </span>
      <span className="sr-only">Golden Stars</span>
    </div>
  );
}
