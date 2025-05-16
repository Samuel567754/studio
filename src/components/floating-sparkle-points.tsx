
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

  useEffect(() => {
    if (goldenStars > prevGoldenStarsRef.current) {
      setAnimatePoints(true);
      playStarsEarnedSound();
    } else if (goldenStars < prevGoldenStarsRef.current && goldenStars === 0 && prevGoldenStarsRef.current > 0) {
      setAnimatePoints(false);
    }
    prevGoldenStarsRef.current = goldenStars;
  }, [goldenStars]);

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
      data-tour-id="floating-golden-stars" // For walkthrough
    >
      <Image
        src="/assets/images/gold_star_icon.png" 
        alt="Golden Stars"
        width={40} 
        height={40}
        className="drop-shadow-md"
      />
      <span
        className={cn(
          "text-2xl font-bold drop-shadow-md", // Larger text
          animatePoints && "golden-stars-update-animation" 
        )}
        onAnimationEnd={handlePointsAnimationEnd}
      >
        {goldenStars}
      </span>
      <span className="sr-only">Golden Stars total</span>
    </div>
  );
}
