
'use client';

import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getStoredUsername, storeUsername as persistUsernameToStorage,
  getStoredFavoriteTopics, storeFavoriteTopics as persistFavoriteTopicsToStorage,
  getStoredGoldenCoins, storeGoldenCoins as persistGoldenCoinsToStorage,
  getStoredUnlockedAchievements, storeUnlockedAchievements as persistUnlockedAchievementsToStorage
} from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { playAchievementUnlockedSound, playCoinsEarnedSound } from '@/lib/audio';
// Removed Image import as we use React.createElement

export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageSrc: string;
  iconAlt?: string;
  bonusCoins?: number;
  color?: string;
}

// Updated ACHIEVEMENTS_CONFIG with new, lower-tier achievements and adjusted progression
export const ACHIEVEMENTS_CONFIG: Achievement[] = [
  { id: "first_sparkle", name: "First Sparkle", description: "Earned your first 10 Golden Coins!", pointsRequired: 10, imageSrc: "/assets/images/star_emoji_illustration.png", iconAlt: "Star Emoji", bonusCoins: 2 },
  { id: "star_cadet", name: "Star Cadet", description: "Collected 25 Golden Coins!", pointsRequired: 25, imageSrc: "/assets/images/cute_smiling_star_illustration.png", iconAlt: "Cute Smiling Star", bonusCoins: 5 },
  { id: "coin_pouch", name: "Coin Pouch", description: "Gathered 35 Golden Coins!", pointsRequired: 35, imageSrc: "/assets/images/bag_of_gold_coins.png", iconAlt: "Bag of Gold Coins", bonusCoins: 3 },
  { id: "bronze_coin_collector", name: "Bronze Coin Collector", description: "Reached 50 Golden Coins!", pointsRequired: 50, imageSrc: "/assets/images/coin_with_clover_design.png", iconAlt: "Bronze Coin with Clover", bonusCoins: 5 },
  { id: "little_gem", name: "Little Gem", description: "Found a pretty Pink Diamond at 60 Coins!", pointsRequired: 60, imageSrc: "/assets/images/pink_diamond_gemstone.png", iconAlt: "Pink Diamond", bonusCoins: 5 },
  { id: "silver_pouch_hoarder", name: "Silver Pouch Hoarder", description: "Amassed 75 Golden Coins!", pointsRequired: 75, imageSrc: "/assets/images/pile_of_gold_coins_image.png", iconAlt: "Pile of Gold Coins", bonusCoins: 10 },
  { id: "shooting_star_award", name: "Shooting Star", description: "Spotted a Shooting Star at 85 Coins!", pointsRequired: 85, imageSrc: "/assets/images/shooting_star_illustration.png", iconAlt: "Shooting Star", bonusCoins: 5 },
  { id: "gemstone_novice", name: "Gemstone Novice", description: "Started your gem collection with 125 Golden Coins!", pointsRequired: 125, imageSrc: "/assets/images/blue_gem_icon.png", iconAlt: "Blue Gem Icon", bonusCoins: 10 },
  { id: "ruby_seeker", name: "Ruby Seeker", description: "Discovered a Ruby Gem with 175 Golden Coins!", pointsRequired: 175, imageSrc: "/assets/images/red_diamond_gem_illustration.png", iconAlt: "Red Diamond Gem", bonusCoins: 15 },
  { id: "diamond_finder", name: "Diamond Finder", description: "Unearthed a Blue Diamond with 225 Golden Coins!", pointsRequired: 225, imageSrc: "/assets/images/blue_diamond_cartoon_illustration.png", iconAlt: "Blue Diamond Illustration", bonusCoins: 20 },
  { id: "award_winner", name: "Award Winner", description: "Earned an Award Ribbon at 300 Golden Coins!", pointsRequired: 300, imageSrc: "/assets/images/yellow_award_ribbon_star_design.png", iconAlt: "Yellow Award Ribbon with Star", bonusCoins: 20 },
  { id: "treasure_chest_unlocker", name: "Treasure Chest Unlocker", description: "Unlocked a Treasure Chest with 400 Golden Coins!", pointsRequired: 400, imageSrc: "/assets/images/treasure_chest_with_gold_and_jewels.png", iconAlt: "Treasure Chest with Gold and Jewels", bonusCoins: 25 },
  { id: "chilllearn_tycoon", name: "ChillLearn Tycoon", description: "Achieved 500 Golden Coins! You're a tycoon!", pointsRequired: 500, imageSrc: "/assets/images/gold_trophy_with_laurel_wreath.png", iconAlt: "Gold Trophy with Laurel Wreath", bonusCoins: 30 },
];


interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenCoins: number;
  unlockedAchievements: string[];
  pendingClaimAchievements: Achievement[];
  lastBonusAwarded: { amount: number; key: string } | null;
  lastGameCoinsAwarded: { amount: number; key: string } | null;
  lastCoinsDeducted: { amount: number; key: string } | null;

  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenCoins: (amount: number, isAchievementBonus?: boolean) => void;
  deductGoldenCoins: (amount: number) => void;
  _triggerAchievementChecks: () => void;
  claimNextPendingAchievement: () => void;
  isAchievementUnlocked: (achievementId: string) => boolean;
  loadUserProfileFromStorage: () => void;
  resetUserProfile: () => void;
  clearLastBonusAwarded: () => void;
  clearLastGameCoinsAwarded: () => void;
  clearLastCoinsDeducted: () => void;
}

const initialUserProfileState: Omit<UserProfileState, 'setUsername' | 'setFavoriteTopics' | 'addGoldenCoins' | 'deductGoldenCoins' | '_triggerAchievementChecks' | 'claimNextPendingAchievement' | 'isAchievementUnlocked' | 'loadUserProfileFromStorage' | 'resetUserProfile' | 'clearLastBonusAwarded' | 'clearLastGameCoinsAwarded' | 'clearLastCoinsDeducted'> = {
  username: null,
  favoriteTopics: null,
  goldenCoins: 0,
  unlockedAchievements: [],
  pendingClaimAchievements: [],
  lastBonusAwarded: null,
  lastGameCoinsAwarded: null,
  lastCoinsDeducted: null,
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      ...initialUserProfileState,
      setUsername: (name) => {
        const newUsername = name && name.trim() !== '' ? name.trim() : null;
        set({ username: newUsername });
        persistUsernameToStorage(newUsername);
      },
      setFavoriteTopics: (topics) => {
        const newTopics = topics && topics.trim() !== '' ? topics.trim() : null;
        set({ favoriteTopics: newTopics });
        persistFavoriteTopicsToStorage(newTopics);
      },
      addGoldenCoins: (amount, isAchievementBonus = false) => {
        if (amount <= 0) return;
        const currentTotal = get().goldenCoins;
        const newTotal = currentTotal + amount;
        set({ goldenCoins: newTotal });
        persistGoldenCoinsToStorage(newTotal);

        if (!isAchievementBonus) {
          set({ lastGameCoinsAwarded: { amount, key: Date.now().toString() + Math.random() } });
        }
        setTimeout(() => get()._triggerAchievementChecks(), 0);
      },
      deductGoldenCoins: (amount) => {
        if (amount <= 0) return;
        const currentTotal = get().goldenCoins;
        const newTotal = Math.max(0, currentTotal - amount);
        set({ goldenCoins: newTotal });
        persistGoldenCoinsToStorage(newTotal);
        set({ lastCoinsDeducted: { amount, key: Date.now().toString() + Math.random() } });
      },
      _triggerAchievementChecks: () => {
        const currentCoins = get().goldenCoins;
        const alreadyUnlockedIds = get().unlockedAchievements;
        const currentlyPendingIds = get().pendingClaimAchievements.map(ach => ach.id);
        let newAchievementsToQueue: Achievement[] = [];

        ACHIEVEMENTS_CONFIG.forEach((achievement) => {
          if (
            currentCoins >= achievement.pointsRequired &&
            !alreadyUnlockedIds.includes(achievement.id) &&
            !currentlyPendingIds.includes(achievement.id)
          ) {
            newAchievementsToQueue.push(achievement);
          }
        });

        if (newAchievementsToQueue.length > 0) {
          set((state) => ({
            pendingClaimAchievements: [...state.pendingClaimAchievements, ...newAchievementsToQueue].sort((a,b) => a.pointsRequired - b.pointsRequired),
          }));
        }
      },
      claimNextPendingAchievement: () => {
        const pending = get().pendingClaimAchievements;
        if (pending.length === 0) return;

        const achievementToClaim = pending[0];

        if (achievementToClaim.bonusCoins && achievementToClaim.bonusCoins > 0) {
          get().addGoldenCoins(achievementToClaim.bonusCoins, true);
          set({ lastBonusAwarded: { amount: achievementToClaim.bonusCoins, key: Date.now().toString() + Math.random() } });
        }

        set((state) => ({
          unlockedAchievements: [...state.unlockedAchievements, achievementToClaim.id],
          pendingClaimAchievements: state.pendingClaimAchievements.slice(1),
        }));
        persistUnlockedAchievementsToStorage(get().unlockedAchievements);
        playAchievementUnlockedSound();

        const toastTitleContent = React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement('img', {
            src: achievementToClaim.imageSrc,
            alt: achievementToClaim.name,
            width: 24,
            height: 24,
            className: 'rounded-sm'
          }),
          'Achievement Unlocked!'
        );

        toast({
          variant: "success",
          title: toastTitleContent,
          description: `You've unlocked: ${achievementToClaim.name}! ${achievementToClaim.bonusCoins ? `+${achievementToClaim.bonusCoins} bonus coins!` : ''}`,
          duration: 7000,
        });
      },
      isAchievementUnlocked: (achievementId: string) => {
        return get().unlockedAchievements.includes(achievementId);
      },
      loadUserProfileFromStorage: () => {
        set({
          username: getStoredUsername(),
          favoriteTopics: getStoredFavoriteTopics(),
          goldenCoins: getStoredGoldenCoins(0),
          unlockedAchievements: getStoredUnlockedAchievements(),
          pendingClaimAchievements: [],
          lastBonusAwarded: null,
          lastGameCoinsAwarded: null,
          lastCoinsDeducted: null,
        });
        setTimeout(() => get()._triggerAchievementChecks(), 500);
      },
      resetUserProfile: () => {
        set(initialUserProfileState);
        persistUsernameToStorage(null);
        persistFavoriteTopicsToStorage(null);
        persistGoldenCoinsToStorage(0);
        persistUnlockedAchievementsToStorage([]);
      },
      clearLastBonusAwarded: () => set({ lastBonusAwarded: null }),
      clearLastGameCoinsAwarded: () => set({ lastGameCoinsAwarded: null }),
      clearLastCoinsDeducted: () => set({ lastCoinsDeducted: null }),
    }),
    {
      name: 'user-profile-storage-v5-coins',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        favoriteTopics: state.favoriteTopics,
        goldenCoins: state.goldenCoins,
        unlockedAchievements: state.unlockedAchievements,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => {
            state._triggerAchievementChecks();
          }, 500);
        }
      }
    }
  )
);
