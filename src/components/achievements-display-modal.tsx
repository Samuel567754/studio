
"use client";

import * as React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserProfileStore, type Achievement, ACHIEVEMENTS_CONFIG } from "@/stores/user-profile-store";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { playNotificationSound } from "@/lib/audio"; // Import sound effect
import { AchievementUnlockedModal } from "@/components/achievement-unlocked-modal"; // For viewing details

interface AchievementsDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementsDisplayModal({ isOpen, onClose }: AchievementsDisplayModalProps) {
  const { unlockedAchievements } = useUserProfileStore();
  const [achievementToView, setAchievementToView] = React.useState<Achievement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  const earnedAchievements = React.useMemo(() => {
    // Guard clause to prevent error if ACHIEVEMENTS_CONFIG is not yet available
    if (!ACHIEVEMENTS_CONFIG || !unlockedAchievements) {
      return [];
    }
    return ACHIEVEMENTS_CONFIG
      .filter(ach => unlockedAchievements.includes(ach.id))
      .sort((a, b) => a.pointsRequired - b.pointsRequired);
  }, [unlockedAchievements]);

  const handleViewAchievementDetail = (achievement: Achievement) => {
    setAchievementToView(achievement);
    setIsDetailModalOpen(true);
    playNotificationSound();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-yellow-500/50 shadow-2xl bg-gradient-to-br from-card via-card/95 to-secondary/10 achievement-unlocked-animation">
          <DialogHeader className="p-6 pb-4 border-b border-border/20 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/images/trophy_cup_illustration.png"
                alt="My Achievements"
                width={32}
                height={32}
                className="drop-shadow-sm"
              />
              <DialogTitle className="text-2xl font-bold text-gradient-primary-accent">
                My Achievements
              </DialogTitle>
            </div>
            {/* Close button is part of DialogContent via Radix UI */}
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-6">
              {earnedAchievements.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
                  <Image
                    src="/assets/images/star_emoji_illustration.png"
                    alt="No achievements yet"
                    width={80}
                    height={80}
                    className="mb-4 opacity-70"
                  />
                  <p className="text-lg font-medium">No Achievements Unlocked Yet!</p>
                  <p className="text-sm">Keep playing and earning Golden Coins to unlock cool badges and trophies.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {earnedAchievements.map((achievement) => (
                    <button
                      key={achievement.id}
                      onClick={() => handleViewAchievementDetail(achievement)}
                      className={cn(
                        "p-4 rounded-lg border flex flex-col items-center text-center transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
                        "bg-card/70 backdrop-blur-sm border-border/30 hover:border-accent/70 w-full text-left" // Make it behave like a button
                      )}
                      aria-label={`View details for ${achievement.name}`}
                    >
                      <div className="relative w-20 h-20 mb-3">
                        <Image
                          src={achievement.imageSrc}
                          alt={achievement.iconAlt || achievement.name}
                          width={80}
                          height={80}
                          className="drop-shadow-lg object-contain animate-achievement-image-rotate"
                        />
                      </div>
                      <h3 className={cn("text-md font-semibold mb-1", achievement.color || "text-foreground")}>
                        {achievement.name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-snug mb-1">
                        {achievement.description}
                      </p>
                      {achievement.bonusCoins && achievement.bonusCoins > 0 && (
                        <p className="text-xs text-yellow-500 dark:text-yellow-400 font-semibold">
                          + {achievement.bonusCoins} Bonus Coins!
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t border-border/20 bg-muted/30 sm:justify-center">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal for viewing a specific achievement's details */}
      {achievementToView && (
        <AchievementUnlockedModal
          achievement={achievementToView}
          isOpen={isDetailModalOpen}
          onClaim={() => setIsDetailModalOpen(false)} // "onClaim" here acts as "onClose"
        />
      )}
    </>
  );
}
