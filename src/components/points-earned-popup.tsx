
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CoinsEarnedPopupProps {
  coins: number;
  show: boolean;
  onComplete?: () => void;
}

export function CoinsEarnedPopup({ coins, show, onComplete }: CoinsEarnedPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 1800); // Should match CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible || coins <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-24 left-5 sm:left-6 z-[60]", // Adjusted positioning to be below FloatingGoldenCoins
        "flex items-center justify-center rounded-full px-6 py-3 shadow-2xl", // Oval shape with padding
        "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400", // Reduced opacity
        "border-2 border-yellow-200",
        "coins-earned-popup-animation"
      )}
      aria-live="assertive"
    >
      <span className="text-xl md:text-2xl font-bold text-white drop-shadow-sm mr-2">
        +{coins}
      </span>
      <Image
        src="/assets/images/animated_gold_coins_with_dollar_signs.png"
        alt="Coins Earned!"
        width={48} // Slightly smaller image for a more compact oval
        height={48}
        className="drop-shadow-md"
      />
    </div>
  );
}
