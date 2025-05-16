
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface StarsEarnedPopupProps {
  stars: number;
  show: boolean;
  onComplete?: () => void;
}

export function StarsEarnedPopup({ stars, show, onComplete }: StarsEarnedPopupProps) {
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

  if (!isVisible || stars <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60]",
        "flex items-center justify-center p-3 rounded-lg shadow-2xl",
        "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400",
        "border-2 border-yellow-200/80",
        "stars-earned-popup-animation" 
      )}
      aria-live="assertive"
    >
      <span className="text-2xl md:text-3xl font-bold text-yellow-900 drop-shadow-sm mr-2">
        +{stars}
      </span>
      <Image
        src="/assets/images/yellow_stars_firework_graphic.png" 
        alt="Stars Earned!"
        width={64} 
        height={64}
        className="drop-shadow-md"
      />
    </div>
  );
}
