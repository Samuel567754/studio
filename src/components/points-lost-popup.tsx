
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
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60]",
        "flex items-center justify-center p-3 rounded-lg shadow-2xl",
        "bg-gradient-to-br from-red-400 via-red-500 to-rose-600", // Red gradient for loss
        "border-2 border-red-300/70",
        "coins-lost-popup-animation" // Use a specific animation for losing points
      )}
      aria-live="assertive"
    >
      <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm mr-2">
        -{coins} 
      </span>
      <Image
        src="/assets/images/red_crystal_cluster_illustration.png" // Example: a "broken" or "faded" coin/star, or a distinct "loss" icon
        alt="Coins Lost!"
        width={64} 
        height={64}
        className="drop-shadow-md opacity-80" // Slightly faded
      />
    </div>
  );
}
