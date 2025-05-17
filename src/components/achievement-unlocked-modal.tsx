// AchievementUnlockedModal.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import type { Achievement } from "@/stores/user-profile-store";
import { cn } from "@/lib/utils";

interface AchievementUnlockedModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClaim: () => void;
}

export function AchievementUnlockedModal({
  achievement,
  isOpen,
  onClaim,
}: AchievementUnlockedModalProps) {
  if (!isOpen || !achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClaim()}>
      <DialogContent
        className={cn(
          "sm:max-w-md p-0 overflow-hidden border-yellow-400 shadow-2xl bg-gradient-to-br from-background via-card to-secondary/20",
          "achievement-unlocked-animation",
          "flex flex-col items-center justify-center text-center"
        )}
      >
        {/* Header */}
        <DialogHeader className="w-full p-6 pb-4 bg-gradient-to-b from-accent/20 to-transparent flex flex-col items-center">
          <div className="relative w-28 h-28 mb-3">
            <div className="medal-entrance">
              <Image
                src="/assets/images/winner_medal_ribbon_illustration.png"
                alt="Achievement Unlocked"
                width={96}
                height={96}
                className="drop-shadow-lg rounded-md object-contain medal-idle"
                priority
              />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-gradient-primary-accent">
            Achievement Unlocked!
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 pt-0 flex flex-col items-center">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src={achievement.imageSrc}
              alt={achievement.iconAlt || achievement.name}
              width={80}
              height={80}
              className="drop-shadow-lg rounded-md object-contain animate-achievement-image-rotate glow-pulse"
            />
          </div>
          <DialogDescription className="text-lg font-semibold text-foreground mb-2">
            {achievement.name}
          </DialogDescription>
          <p className="text-sm text-muted-foreground mb-4">
            {achievement.description}
          </p>
          {achievement.bonusCoins && achievement.bonusCoins > 0 && (
            <p className="flex items-center justify-center gap-1 text-md font-semibold text-yellow-500 dark:text-yellow-400 mb-4">
              <Image
                src="/assets/images/golden_star_coin.png"
                alt="Bonus Coins"
                width={20}
                height={20}
              />
              +{achievement.bonusCoins} Bonus Golden Coins!
            </p>
          )}
        </div>

  
        <DialogFooter
          className={cn(
            "w-full p-6 pt-4 border-t bg-muted/30",
            // full-width flex container
            "flex !justify-center"
          )}
        >
          <Button
            onClick={onClaim}
            className="btn-glow text-lg py-3 px-8 bg-primary hover:bg-primary/90"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Awesome!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
