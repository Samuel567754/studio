
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
        "fixed top-20 left-5 z-50 flex items-center gap-2 p-3 rounded-full shadow-xl transition-all duration-300 ease-out",
        "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-white",
        "border-2 border-yellow-300/70",
        "md:top-24 md:left-6" // Adjust position for desktop to be under main nav
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <Image 
        src="/assets/images/golden_star_coin.png" 
        alt="Golden Star Coin" 
        width={40}  // Increased size
        height={40} // Increased size
        className="drop-shadow-md" 
      />
      <span 
        className={cn(
          "text-2xl font-bold drop-shadow-sm", // Increased size
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
