
"use client";

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Award, Sparkles, CheckCircle } from 'lucide-react';
import type { Achievement } from '@/stores/user-profile-store';
import { cn } from '@/lib/utils';

interface AchievementUnlockedModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClaim: () => void;
}

export function AchievementUnlockedModal({ achievement, isOpen, onClaim }: AchievementUnlockedModalProps) {
  if (!isOpen || !achievement) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClaim(); /* Claim if closed by clicking overlay or X */ }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden achievement-unlocked-animation border-yellow-400 shadow-2xl bg-gradient-to-br from-background via-card to-secondary/20">
        <DialogHeader className="p-6 pb-4 text-center items-center bg-gradient-to-b from-accent/20 to-transparent">
          <div className="relative w-28 h-28 mb-3">
            <Image
              src={achievement.imageSrc}
              alt={achievement.name}
              width={96} // Larger image for the modal
              height={96}
              className="drop-shadow-lg rounded-md object-contain"
            />
            <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 fill-yellow-300 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gradient-primary-accent">
            Achievement Unlocked!
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0 text-center">
          <DialogDescription className="text-lg font-semibold text-foreground mb-1">
            {achievement.name}
          </DialogDescription>
          <p className="text-sm text-muted-foreground mb-3">
            {achievement.description}
          </p>
          {achievement.bonusStars && achievement.bonusStars > 0 && (
            <p className="text-md font-semibold text-yellow-500 dark:text-yellow-400 flex items-center justify-center gap-1">
              <Image src="/assets/images/gold_star_icon.png" alt="Bonus Stars" width={20} height={20} />
              + {achievement.bonusStars} Bonus Golden Stars!
            </p>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 border-t bg-muted/30">
          <Button onClick={onClaim} className="w-full btn-glow text-lg py-3 bg-primary hover:bg-primary/90">
            <CheckCircle className="mr-2 h-5 w-5" />
            Awesome!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
