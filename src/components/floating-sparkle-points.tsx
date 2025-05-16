
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
    }
    prevGoldenStarsRef.current = goldenStars;
  }, [goldenStars]);

  const handlePointsAnimationEnd = () => {
    setAnimatePoints(false);
  };

  return (
    <div
      className={cn(
        "fixed top-20 left-5 z-50 flex items-center gap-2 p-2.5 rounded-full shadow-xl transition-all duration-300 ease-out",
        "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-white", // Vibrant background
        "border-2 border-yellow-300/70", // Border for definition
        "md:top-24 md:left-6" // Adjusted for potentially taller navbar
      )}
      aria-live="polite"
      aria-atomic="true"
      data-tour-id="floating-golden-stars" // For walkthrough guide
    >
      <Image
        src="/assets/images/gold_star_icon.png" // Primary star icon
        alt="Golden Stars"
        width={32} // Increased size
        height={32}
        className="drop-shadow-md" // Added drop shadow for depth
      />
      <span
        className={cn(
          "text-xl font-bold drop-shadow-md", // Increased font size and shadow
          animatePoints && "golden-stars-update-animation"
        )}
        onAnimationEnd={handlePointsAnimationEnd}
      >
        {goldenStars}
      </span>
      <span className="sr-only">Golden Stars</span>
    </div>
  );
}
