
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
import Image from 'next/image'; // Keep for toast content if needed

export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageSrc: string;
  iconAlt?: string;
  bonusCoins?: number;
  color?: string; // Optional color for badge styling
}

// Moved from profile/page.tsx to be globally accessible by the store
export const ACHIEVEMENTS_CONFIG: Achievement[] = [
  { id: "bronze_coin_collector", name: "Bronze Coin Collector", description: "Collected your first 25 Golden Coins!", pointsRequired: 25, imageSrc: "/assets/images/coin_with_clover_design.png", iconAlt: "Bronze Coin with Clover", bonusCoins: 5 },
  { id: "silver_pouch_hoarder", name: "Silver Pouch Hoarder", description: "Amassed 75 Golden Coins!", pointsRequired: 75, imageSrc: "/assets/images/pile_of_gold_coins_image.png", iconAlt: "Pile of Gold Coins", bonusCoins: 10 },
  { id: "gemstone_novice", name: "Gemstone Novice", description: "Found 150 Golden Coins & started your gem collection!", pointsRequired: 150, imageSrc: "/assets/images/blue_gem_icon.png", iconAlt: "Blue Gem Icon", bonusCoins: 15 },
  { id: "ruby_seeker", name: "Ruby Seeker", description: "Discovered 225 Golden Coins and a ruby!", pointsRequired: 225, imageSrc: "/assets/images/red_diamond_gem_illustration.png", iconAlt: "Red Diamond Gem", bonusCoins: 20 },
  { id: "diamond_finder", name: "Diamond Finder", description: "Unearthed 350 Golden Coins and a sparkling diamond!", pointsRequired: 350, imageSrc: "/assets/images/blue_diamond_cartoon_illustration.png", iconAlt: "Blue Diamond Illustration", bonusCoins: 25 },
  { id: "treasure_chest_unlocker", name: "Treasure Chest Unlocker", description: "Filled your chest with 500 Golden Coins!", pointsRequired: 500, imageSrc: "/assets/images/treasure_chest_with_gold_and_jewels.png", iconAlt: "Treasure Chest with Gold and Jewels", bonusCoins: 30 },
  { id: "chilllearn_tycoon", name: "ChillLearn Tycoon", description: "Achieved 750 Golden Coins! You're a tycoon!", pointsRequired: 750, imageSrc: "/assets/images/gold_trophy_with_laurel_wreath.png", iconAlt: "Gold Trophy with Laurel Wreath", bonusCoins: 50 },
];


interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenCoins: number;
  unlockedAchievements: string[];
  pendingClaimAchievements: Achievement[];
  lastBonusAwarded: { amount: number; key: string } | null; // For achievement bonus popups
  lastGameCoinsAwarded: { amount: number; key: string } | null; // For general game coin popups

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
}

const initialUserProfileState: Omit<UserProfileState, 'setUsername' | 'setFavoriteTopics' | 'addGoldenCoins' | 'deductGoldenCoins' | '_triggerAchievementChecks' | 'claimNextPendingAchievement' | 'isAchievementUnlocked' | 'loadUserProfileFromStorage' | 'resetUserProfile' | 'clearLastBonusAwarded' | 'clearLastGameCoinsAwarded'> = {
  username: null,
  favoriteTopics: null,
  goldenCoins: 0,
  unlockedAchievements: [],
  pendingClaimAchievements: [],
  lastBonusAwarded: null,
  lastGameCoinsAwarded: null,
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
        set({ goldenCoins: currentTotal + amount });
        persistGoldenCoinsToStorage(get().goldenCoins);

        if (!isAchievementBonus) {
          set({ lastGameCoinsAwarded: { amount, key: Date.now().toString() + Math.random() } });
        }
        // setTimeout is used to ensure state update is processed before triggering checks,
        // especially if addGoldenCoins is called multiple times in quick succession.
        setTimeout(() => get()._triggerAchievementChecks(), 0);
      },
      deductGoldenCoins: (amount) => {
        if (amount <= 0) return;
        const currentTotal = get().goldenCoins;
        set({ goldenCoins: Math.max(0, currentTotal - amount) });
        persistGoldenCoinsToStorage(get().goldenCoins);
        // Optionally, trigger a "coins lost" specific popup via the store if needed, similar to lastGameCoinsAwarded
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
          // Add bonus coins and mark it as an achievement bonus to prevent re-triggering general game coin popup
          get().addGoldenCoins(achievementToClaim.bonusCoins, true);
          // Signal for the achievement bonus popup specifically
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
          React.createElement(Image, {
            src: achievementToClaim.imageSrc,
            alt: achievementToClaim.name,
            width: 24,
            height: 24,
          }),
          'Achievement Unlocked!'
        );

        toast({
          // Ensure you have a variant or styling for 'achievement' or use 'success'
          variant: "success", // Or your custom 'achievement' variant
          title: toastTitleContent,
          description: `You've unlocked: ${achievementToClaim.name}! ${achievementToClaim.bonusCoins ? `+${achievementToClaim.bonusCoins} bonus coins!` : ''}`,
          duration: 5000,
        });
      },
      isAchievementUnlocked: (achievementId: string) => {
        return get().unlockedAchievements.includes(achievementId);
      },
      loadUserProfileFromStorage: () => {
        set({
          username: getStoredUsername(),
          favoriteTopics: getStoredFavoriteTopics(),
          goldenCoins: getStoredGoldenCoins(0), // Ensure default value is 0
          unlockedAchievements: getStoredUnlockedAchievements(),
          pendingClaimAchievements: [],
          lastBonusAwarded: null,
          lastGameCoinsAwarded: null,
        });
        setTimeout(() => get()._triggerAchievementChecks(), 100);
      },
      resetUserProfile: () => {
        set(initialUserProfileState); // Resets all states including pending/last awarded
        // Persisted values are cleared by clearProgressStoredData in lib/storage.ts
      },
      clearLastBonusAwarded: () => set({ lastBonusAwarded: null }),
      clearLastGameCoinsAwarded: () => set({ lastGameCoinsAwarded: null }),
    }),
    {
      name: 'user-profile-storage-v5-coins', // Incremented version name
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
            state.loadUserProfileFromStorage();
          }, 0);
        }
      }
    }
  )
);
