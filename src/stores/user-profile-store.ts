
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
import { playAchievementUnlockedSound, playCoinsEarnedSound } from '@/lib/audio'; // Changed from playStarsEarnedSound

// Define Achievement type directly here
export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageSrc: string;
  iconAlt?: string;
  bonusCoins?: number; // Changed from bonusStars
  color?: string; // Optional color for badge text or accents
}

// Define ACHIEVEMENTS_CONFIG directly here
export const ACHIEVEMENTS_CONFIG: Achievement[] = [
  { id: "first_sparkle", name: "First Sparkle", description: "Earned your first 10 Golden Coins!", pointsRequired: 10, imageSrc: "/assets/images/star_emoji_illustration.png", iconAlt: "Star Emoji", bonusCoins: 2 },
  { id: "sparkling_start", name: "Sparkling Start", description: "Collected 20 Golden Coins!", pointsRequired: 20, imageSrc: "/assets/images/golden_glittery_sparkles.png", iconAlt: "Golden Glittery Sparkles", bonusCoins: 3 },
  { id: "star_cadet", name: "Star Cadet", description: "Collected 30 Golden Coins!", pointsRequired: 30, imageSrc: "/assets/images/cute_smiling_star_illustration.png", iconAlt: "Cute Smiling Star", bonusCoins: 5 },
  { id: "coin_dabbler", name: "Coin Dabbler", description: "Gathered 40 Golden Coins!", pointsRequired: 40, imageSrc: "/assets/images/three_golden_coins_sparkling.png", iconAlt: "Three Golden Coins Sparkling", bonusCoins: 3 },
  { id: "bronze_coin_collector", name: "Bronze Coin Collector", description: "Reached 50 Golden Coins!", pointsRequired: 50, imageSrc: "/assets/images/coin_with_clover_design.png", iconAlt: "Bronze Coin with Clover", bonusCoins: 5 },
  { id: "early_gem", name: "Early Gem", description: "Found your first Gem at 65 Coins!", pointsRequired: 65, imageSrc: "/assets/images/yellow_diamond_icon.png", iconAlt: "Yellow Diamond Icon", bonusCoins: 5 },
  { id: "silver_pouch_hoarder", name: "Silver Pouch Hoarder", description: "Amassed 75 Golden Coins!", pointsRequired: 75, imageSrc: "/assets/images/pile_of_gold_coins_image.png", iconAlt: "Pile of Gold Coins", bonusCoins: 10 },
  { id: "shooting_star", name: "Shooting Star", description: "Spotted a Shooting Star at 90 Coins!", pointsRequired: 90, imageSrc: "/assets/images/shooting_star_illustration.png", iconAlt: "Shooting Star Illustration", bonusCoins: 5 },
  { id: "ribbon_earned", name: "Ribbon Earned", description: "Earned a Yellow Ribbon at 110 Coins!", pointsRequired: 110, imageSrc: "/assets/images/yellow_award_ribbon.png", iconAlt: "Yellow Award Ribbon", bonusCoins: 7 },
  { id: "gemstone_novice", name: "Gemstone Novice", description: "Started your gem collection with 125 Golden Coins!", pointsRequired: 125, imageSrc: "/assets/images/blue_gem_icon.png", iconAlt: "Blue Gem Icon", bonusCoins: 10 },
  { id: "ruby_seeker", name: "Ruby Seeker", description: "Discovered a Ruby Gem with 175 Golden Coins!", pointsRequired: 175, imageSrc: "/assets/images/red_diamond_gem_illustration.png", iconAlt: "Red Diamond Gem", bonusCoins: 15 },
  { id: "crystal_cluster", name: "Crystal Cluster", description: "Found a Blue Crystal Cluster at 200 Coins!", pointsRequired: 200, imageSrc: "/assets/images/blue_crystal_cluster_illustration.png", iconAlt: "Blue Crystal Cluster", bonusCoins: 15 },
  { id: "diamond_finder", name: "Diamond Finder", description: "Unearthed a Blue Diamond with 225 Golden Coins!", pointsRequired: 225, imageSrc: "/assets/images/blue_diamond_cartoon_illustration.png", iconAlt: "Blue Diamond Illustration", bonusCoins: 20 },
  { id: "award_winner", name: "Award Winner", description: "Earned a Star Award Ribbon at 300 Golden Coins!", pointsRequired: 300, imageSrc: "/assets/images/yellow_award_ribbon_star_design.png", iconAlt: "Yellow Award Ribbon with Star", bonusCoins: 20 },
  { id: "treasure_chest_unlocker", name: "Treasure Chest Unlocker", description: "Unlocked a Treasure Chest with 400 Golden Coins!", pointsRequired: 400, imageSrc: "/assets/images/treasure_chest_with_gold_and_jewels.png", iconAlt: "Treasure Chest with Gold and Jewels", bonusCoins: 25 },
  { id: "chilllearn_tycoon", name: "ChillLearn Tycoon", description: "Achieved 500 Golden Coins! You're a tycoon!", pointsRequired: 500, imageSrc: "/assets/images/gold_trophy_with_laurel_wreath.png", iconAlt: "Gold Trophy with Laurel Wreath", bonusCoins: 30 },
];


interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenCoins: number; // Changed from goldenStars
  unlockedAchievements: string[];
  pendingClaimAchievements: Achievement[]; // To queue achievements for modal display
  lastBonusAwarded: { amount: number; key: string } | null; // For achievement bonus popup
  lastGameCoinsAwarded: { amount: number; key: string } | null; // For regular game coin popup
  lastCoinsDeducted: { amount: number; key: string } | null; // For coin deduction popup


  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenCoins: (amount: number, isAchievementBonus?: boolean) => void; // Changed
  deductGoldenCoins: (amount: number) => void; // Added
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
  goldenCoins: 0, // Changed
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
      addGoldenCoins: (amount, isAchievementBonus = false) => { // Changed
        if (amount <= 0) return;
        const currentTotal = get().goldenCoins; // Changed
        const newTotal = currentTotal + amount;
        set({ goldenCoins: newTotal }); // Changed
        persistGoldenCoinsToStorage(newTotal); // Changed

        if (!isAchievementBonus) {
          set({ lastGameCoinsAwarded: { amount, key: Date.now().toString() + Math.random() } });
        }
        // Defer achievement check slightly to ensure state update is processed
        setTimeout(() => get()._triggerAchievementChecks(), 0);
      },
      deductGoldenCoins: (amount) => { // Added
        if (amount <= 0) return;
        const currentTotal = get().goldenCoins;
        const newTotal = Math.max(0, currentTotal - amount);
        set({ goldenCoins: newTotal });
        persistGoldenCoinsToStorage(newTotal);
        set({ lastCoinsDeducted: { amount, key: Date.now().toString() + Math.random() }});
      },
      _triggerAchievementChecks: () => {
        const currentCoins = get().goldenCoins; // Changed
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
          // Sort to ensure they are queued by pointsRequired,
          // although the modal will show them one by one from the start of the array
          newAchievementsToQueue.sort((a, b) => a.pointsRequired - b.pointsRequired);
          set((state) => ({
            pendingClaimAchievements: [...state.pendingClaimAchievements, ...newAchievementsToQueue]
              .sort((a,b) => a.pointsRequired - b.pointsRequired) // Re-sort entire pending queue
              .filter((ach, index, self) => index === self.findIndex(t => t.id === ach.id)) // Ensure unique
          }));
        }
      },
      claimNextPendingAchievement: () => {
        const pending = get().pendingClaimAchievements;
        if (pending.length === 0) return;

        const achievementToClaim = pending[0]; // Always claim the first one in the sorted queue

        // Add bonus coins if any
        if (achievementToClaim.bonusCoins && achievementToClaim.bonusCoins > 0) {
          get().addGoldenCoins(achievementToClaim.bonusCoins, true); // Mark as achievement bonus
          // Signal for the bonus coin popup
          set({ lastBonusAwarded: { amount: achievementToClaim.bonusCoins, key: Date.now().toString() + Math.random() } });
        }

        set((state) => ({
          unlockedAchievements: [...state.unlockedAchievements, achievementToClaim.id],
          pendingClaimAchievements: state.pendingClaimAchievements.slice(1),
        }));
        persistUnlockedAchievementsToStorage(get().unlockedAchievements);
        playAchievementUnlockedSound();
        
        // Define JSX for toast title
        const toastTitleContent = React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement('img', { // Using standard img for simplicity in .ts file
            src: achievementToClaim.imageSrc,
            alt: achievementToClaim.name,
            width: 24, // Ensure this is a number
            height: 24, // Ensure this is a number
            style: { borderRadius: '4px' } // Example style
          }),
          'Achievement Unlocked!'
        );

        toast({
            variant: "success", // Or a custom 'achievement' variant if you style it
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
          goldenCoins: getStoredGoldenCoins(0), // Changed
          unlockedAchievements: getStoredUnlockedAchievements(),
          pendingClaimAchievements: [], // Reset pending on load, rely on _triggerAchievementChecks
          lastBonusAwarded: null,
          lastGameCoinsAwarded: null,
          lastCoinsDeducted: null,
        });
        // Trigger checks after a short delay to ensure store is fully hydrated
        setTimeout(() => {
            get()._triggerAchievementChecks();
        }, 500); // Increased delay slightly
      },
      resetUserProfile: () => {
        set(initialUserProfileState);
        persistUsernameToStorage(null);
        persistFavoriteTopicsToStorage(null);
        persistGoldenCoinsToStorage(0); // Changed
        persistUnlockedAchievementsToStorage([]);
      },
      clearLastBonusAwarded: () => set({ lastBonusAwarded: null }),
      clearLastGameCoinsAwarded: () => set({ lastGameCoinsAwarded: null }),
      clearLastCoinsDeducted: () => set({ lastCoinsDeducted: null }),
    }),
    {
      name: 'user-profile-storage-v5-coins', // Updated store name
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        favoriteTopics: state.favoriteTopics,
        goldenCoins: state.goldenCoins, // Changed
        unlockedAchievements: state.unlockedAchievements,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Defer achievement check until after rehydration and potential initial state setup
          setTimeout(() => {
            state._triggerAchievementChecks();
          }, 500); // Increased delay
        }
      }
    }
  )
);
