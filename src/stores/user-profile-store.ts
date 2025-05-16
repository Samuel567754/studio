
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
import Image from 'next/image'; // Keep for potential future direct JSX in toast

// Define Achievement interface and ACHIEVEMENTS_CONFIG here
export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageSrc: string;
  iconAlt?: string;
  bonusCoins?: number;
  color?: string; // Optional color for styling the badge/text
}

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
  unlockedAchievements: string[]; // Stores IDs of claimed achievements
  pendingClaimAchievements: Achievement[]; // Stores full achievement objects to be claimed
  lastBonusAwarded: { amount: number; key: string } | null; // For achievement bonus coin popup
  lastGameCoinsAwarded: { amount: number; key: string } | null; // For general game coin popup
  lastCoinsDeducted: { amount: number; key: string } | null;

  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenCoins: (amount: number, isAchievementBonus?: boolean) => void;
  deductGoldenCoins: (amount: number) => void;
  _triggerAchievementChecks: () => void; // Underscore indicates it's primarily for internal use
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
        // Always check for achievements after adding coins
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
          get().addGoldenCoins(achievementToClaim.bonusCoins, true); // true indicates it's an achievement bonus
          set({ lastBonusAwarded: { amount: achievementToClaim.bonusCoins, key: Date.now().toString() + Math.random() } });
        }

        set((state) => ({
          unlockedAchievements: [...state.unlockedAchievements, achievementToClaim.id],
          pendingClaimAchievements: state.pendingClaimAchievements.slice(1),
        }));
        persistUnlockedAchievementsToStorage(get().unlockedAchievements);
        playAchievementUnlockedSound();

        // Define JSX for toast title using React.createElement
        const toastTitleContent = React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement('img', { // Using standard img tag here for simplicity within store
            src: achievementToClaim.imageSrc, // Assuming imageSrc is a path like '/assets/images/...'
            alt: achievementToClaim.name,
            width: 24,
            height: 24,
            className: 'rounded-sm' // Add any necessary styling
          }),
          'Achievement Unlocked!'
        );

        toast({
          variant: "success",
          title: toastTitleContent,
          description: `You've unlocked: ${achievementToClaim.name}! ${achievementToClaim.bonusCoins ? `+${achievementToClaim.bonusCoins} bonus coins!` : ''}`,
          duration: 7000, // Longer duration for achievements
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
        setTimeout(() => get()._triggerAchievementChecks(), 100); // Check achievements after loading
      },
      resetUserProfile: () => {
        set(initialUserProfileState);
        // Persist the reset state immediately
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
      name: 'user-profile-storage-v5-coins', // Updated version name
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        favoriteTopics: state.favoriteTopics,
        goldenCoins: state.goldenCoins,
        unlockedAchievements: state.unlockedAchievements,
        // pendingClaimAchievements is intentionally not persisted; it rebuilds on load
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Trigger achievement checks after rehydration
          setTimeout(() => {
            state._triggerAchievementChecks();
          }, 150); // Slightly longer delay to ensure goldenCoins is fully rehydrated
        }
      }
    }
  )
);
