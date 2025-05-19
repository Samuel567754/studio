
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CoinsLostPopupProps {
  coins: number; // Should be a positive number representing the amount lost
  show: boolean;
  onComplete?: () => void;
}

export function CoinsLostPopup({ coins, show, onComplete }: CoinsLostPopupProps) {
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
        "fixed top-24 left-5 sm:left-6 z-[60]", // Adjusted positioning, same as earned popup
        "flex items-center justify-center rounded-full px-6 py-3 shadow-2xl", // Oval shape with padding
        "bg-gradient-to-br from-red-400/90 via-red-500/90 to-rose-600/90", // Reduced opacity
        "border-2 border-red-300/70",
        "coins-lost-popup-animation"
      )}
      aria-live="assertive"
    >
      <span className="text-xl md:text-2xl font-bold text-white drop-shadow-sm mr-2">
        -{coins}
      </span>
      <Image
        src="/assets/images/golden_coin_two_group.png"
        alt="Coins Lost!"
        width={48} // Slightly smaller image for a more compact oval
        height={48}
        className="drop-shadow-md opacity-90"
      />
    </div>
  );
}
