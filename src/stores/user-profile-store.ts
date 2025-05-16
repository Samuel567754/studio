
'use client';

import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getStoredUsername, storeUsername as persistUsernameToStorage,
  getStoredFavoriteTopics, storeFavoriteTopics as persistFavoriteTopicsToStorage,
  getStoredGoldenStars, storeGoldenStars as persistGoldenStarsToStorage,
  getStoredUnlockedAchievements, storeUnlockedAchievements as persistUnlockedAchievementsToStorage
} from '@/lib/storage';
import type { Achievement } from '@/app/profile/page'; // Import Achievement type
import { toast } from '@/hooks/use-toast';
import { playAchievementUnlockedSound } from '@/lib/audio';

// Ensure this list is defined or imported if achievementsList is used here.
// For now, assuming achievementsList is primarily used in profile/page.tsx
// and _checkAndUnlockAchievements will receive it or a similar structure.
// We need to get achievementsList definition from profile/page.tsx
// This is a placeholder, ideally this list is in a shared location.
const getAchievementsList = (): Achievement[] => {
  // In a real scenario, this might fetch from a config or be statically imported
  // For now, this needs to match the structure in profile/page.tsx
  // This is a simplified version for store logic.
  // The actual display logic is in profile/page.tsx.
  // We need the pointsRequired and id for unlocking.
  return [
    { id: "star_cadet", name: "Star Cadet", description: "Collected your first 25 Golden Stars!", pointsRequired: 25, imageSrc: "/assets/images/cute_smiling_star_illustration.png", iconAlt: "Smiling Star Badge", color: "text-yellow-400", bonusStars: 5 },
    { id: "coin_collector_1", name: "Coin Collector I", description: "Amassed 75 Golden Stars!", pointsRequired: 75, imageSrc: "/assets/images/pile_of_gold_coins_image.png", iconAlt: "Pile of Gold Coins", color: "text-amber-500", bonusStars: 10 },
    { id: "gem_seeker_1", name: "Gem Seeker I", description: "Discovered 150 Golden Stars!", pointsRequired: 150, imageSrc: "/assets/images/multicolored_geometric_crystal_shape.png", iconAlt: "Colorful Crystal Shape", color: "text-fuchsia-500", bonusStars: 15 },
    { id: "treasure_finder", name: "Treasure Discoverer", description: "Unearthed 300 Golden Stars!", pointsRequired: 300, imageSrc: "/assets/images/treasure_chest_with_gold_and_jewels.png", iconAlt: "Treasure Chest", color: "text-orange-500", bonusStars: 20 },
    { id: "chill_master", name: "ChillLearn Master", description: "Achieved 500 Golden Stars overall!", pointsRequired: 500, imageSrc: "/assets/images/gold_trophy_with_laurel_wreath.png", iconAlt: "Laurel Wreath Trophy", color: "text-green-500", bonusStars: 25 },
  ];
};


interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenStars: number;
  unlockedAchievements: string[]; // Array of achievement IDs
  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenStars: (amount: number) => void;
  deductGoldenStars: (amount: number) => void;
  setGoldenStars: (amount: number) => void;
  _checkAndUnlockAchievements: () => void;
  isAchievementUnlocked: (achievementId: string) => boolean;
  loadUserProfileFromStorage: () => void;
  resetUserProfile: () => void;
}

const initialUserProfileState: Omit<UserProfileState, 'setUsername' | 'setFavoriteTopics' | 'addGoldenStars' | 'deductGoldenStars' | 'setGoldenStars' | '_checkAndUnlockAchievements' | 'isAchievementUnlocked' | 'loadUserProfileFromStorage' | 'resetUserProfile'> = {
  username: null,
  favoriteTopics: null,
  goldenStars: 0,
  unlockedAchievements: [],
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
      addGoldenStars: (amount) => {
        if (amount <= 0) return;
        const currentStars = get().goldenStars;
        const newTotal = currentStars + amount;
        set({ goldenStars: newTotal });
        persistGoldenStarsToStorage(newTotal);
        get()._checkAndUnlockAchievements();
      },
      deductGoldenStars: (amount) => {
        if (amount <= 0) return;
        const currentStars = get().goldenStars;
        const newTotal = Math.max(0, currentStars - amount);
        set({ goldenStars: newTotal });
        persistGoldenStarsToStorage(newTotal);
      },
      setGoldenStars: (amount) => {
        const newTotal = Math.max(0, amount);
        set({ goldenStars: newTotal });
        persistGoldenStarsToStorage(newTotal);
        get()._checkAndUnlockAchievements();
      },
      _checkAndUnlockAchievements: () => {
        const currentStars = get().goldenStars;
        const previouslyUnlocked = get().unlockedAchievements;
        let newAchievementsUnlockedThisCheck: string[] = [];
        const achievementsListLocal = getAchievementsList(); // Get the list

        achievementsListLocal.forEach((achievement: Achievement) => {
          if (currentStars >= achievement.pointsRequired && !previouslyUnlocked.includes(achievement.id)) {
            if (!get().isAchievementUnlocked(achievement.id)) {
              newAchievementsUnlockedThisCheck.push(achievement.id);
              
              const toastTitleContent = (
                React.createElement("div", { className: "flex items-center gap-2" },
                  React.createElement("img", { src: achievement.imageSrc, alt: achievement.name, width: 24, height: 24, style: { display: 'inline-block', borderRadius: '4px' } }),
                  "Achievement Unlocked!"
                )
              );

              toast({
                variant: "success",
                title: toastTitleContent,
                description: `${achievement.name} - ${achievement.description} (+${achievement.bonusStars} Golden Stars!)`,
                duration: 8000,
              });
              playAchievementUnlockedSound();
              
              const currentTotalAfterAchievement = get().goldenStars + achievement.bonusStars;
              set({ goldenStars: currentTotalAfterAchievement });
              persistGoldenStarsToStorage(currentTotalAfterAchievement);
            }
          }
        });

        if (newAchievementsUnlockedThisCheck.length > 0) {
          const updatedUnlockedAchievements = [...previouslyUnlocked, ...newAchievementsUnlockedThisCheck];
          set({ unlockedAchievements: updatedUnlockedAchievements });
          persistUnlockedAchievementsToStorage(updatedUnlockedAchievements);
          // Recursively check if bonus stars unlocked further achievements
          // This is important if an achievement bonus pushes stars over the threshold for another
          setTimeout(() => get()._checkAndUnlockAchievements(), 0);
        }
      },
      isAchievementUnlocked: (achievementId: string) => {
        return get().unlockedAchievements.includes(achievementId);
      },
      loadUserProfileFromStorage: () => {
        const storedName = getStoredUsername();
        const storedTopics = getStoredFavoriteTopics();
        const storedStars = getStoredGoldenStars();
        const storedAchievements = getStoredUnlockedAchievements();
        set({
          username: storedName,
          favoriteTopics: storedTopics,
          goldenStars: storedStars,
          unlockedAchievements: storedAchievements
        });
        setTimeout(() => get()._checkAndUnlockAchievements(), 0);
      },
      resetUserProfile: () => {
        set(initialUserProfileState);
        persistUsernameToStorage(null);
        persistFavoriteTopicsToStorage(null);
        persistGoldenStarsToStorage(0);
        persistUnlockedAchievementsToStorage([]);
      }
    }),
    {
      name: 'user-profile-storage-v4', // Incremented version for Golden Stars
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        favoriteTopics: state.favoriteTopics,
        goldenStars: state.goldenStars,
        unlockedAchievements: state.unlockedAchievements,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loadUserProfileFromStorage();
        }
      }
    }
  )
);
