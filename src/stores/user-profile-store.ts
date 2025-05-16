
'use client';

import * as React from 'react'; // Import React for React.createElement
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// Removed: import Image from 'next/image'; // Not ideal to use next/image in a non-component .ts file for toast construction
import {
  getStoredUsername, storeUsername as persistUsernameToStorage,
  getStoredFavoriteTopics, storeFavoriteTopics as persistFavoriteTopicsToStorage,
  getStoredGoldenStars, storeGoldenStars as persistGoldenStarsToStorage,
  getStoredUnlockedAchievements, storeUnlockedAchievements as persistUnlockedAchievementsToStorage
} from '@/lib/storage';
import { achievementsList, type Achievement } from '@/app/profile/page'; // Assuming Achievement type is exported
import { toast } from '@/hooks/use-toast';
import { playAchievementUnlockedSound } from '@/lib/audio';

interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenStars: number;
  unlockedAchievements: string[]; // Array of achievement IDs
  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenStars: (amount: number) => void;
  deductGoldenStars: (amount: number) => void; // New function
  setGoldenStars: (amount: number) => void;
  _checkAndUnlockAchievements: () => void; // Renamed to avoid direct call expectation, made internal
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
        get()._checkAndUnlockAchievements(); // Check for new achievements after adding stars
      },
      deductGoldenStars: (amount) => {
        if (amount <= 0) return;
        const currentStars = get().goldenStars;
        const newTotal = Math.max(0, currentStars - amount); // Ensure stars don't go below 0
        set({ goldenStars: newTotal });
        persistGoldenStarsToStorage(newTotal);
        // Optionally, you might want to check if deducting points causes an achievement to be "lost",
        // though typically achievements are permanent once earned.
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

        achievementsList.forEach((achievement: Achievement) => {
          if (currentStars >= achievement.pointsRequired && !previouslyUnlocked.includes(achievement.id)) {
            if (!get().isAchievementUnlocked(achievement.id)) { // Double check, though previouslyUnlocked should cover it
              newAchievementsUnlockedThisCheck.push(achievement.id);
              
              const toastTitleContent = (
                React.createElement("div", { className: "flex items-center gap-2" },
                  React.createElement("img", { src: achievement.imageSrc, alt: achievement.name, width: 24, height: 24, style: { display: 'inline-block', borderRadius: '4px' } }), // Basic img tag
                  "Achievement Unlocked!"
                )
              );

              toast({
                variant: "success", // Or a custom 'achievement' variant if you style it
                title: toastTitleContent,
                description: `${achievement.name} - ${achievement.description} (+${achievement.bonusStars} Golden Stars!)`,
                duration: 8000,
              });
              playAchievementUnlockedSound();
              
              // Award bonus stars for unlocking the achievement
              const currentTotalAfterAchievement = get().goldenStars + achievement.bonusStars;
              set({ goldenStars: currentTotalAfterAchievement }); // This will call persistGoldenStarsToStorage internally
              persistGoldenStarsToStorage(currentTotalAfterAchievement); // And also trigger _checkAndUnlockAchievements again if needed
            }
          }
        });

        if (newAchievementsUnlockedThisCheck.length > 0) {
          const updatedUnlockedAchievements = [...previouslyUnlocked, ...newAchievementsUnlockedThisCheck];
          set({ unlockedAchievements: updatedUnlockedAchievements });
          persistUnlockedAchievementsToStorage(updatedUnlockedAchievements);
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
        // Call _checkAndUnlockAchievements after hydration to ensure any new achievements (if logic changed) are processed
        // or if points were manually adjusted in localStorage for testing.
        // This ensures the initial achievement state is correct based on loaded points.
        setTimeout(() => get()._checkAndUnlockAchievements(), 0);
      },
      resetUserProfile: () => {
        set(initialUserProfileState); // Reset to initial state values
        persistUsernameToStorage(null);
        persistFavoriteTopicsToStorage(null);
        persistGoldenStarsToStorage(0); // Persist the reset value
        persistUnlockedAchievementsToStorage([]); // Persist the reset value
      }
    }),
    {
      name: 'user-profile-storage-v3', // Incremented version for a fresh start
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ // Only persist these specific parts of the state
        username: state.username,
        favoriteTopics: state.favoriteTopics,
        goldenStars: state.goldenStars,
        unlockedAchievements: state.unlockedAchievements,
      }),
      onRehydrateStorage: () => (state) => {
        // This function is called when the store is rehydrated from localStorage
        // We can trigger the load function here to ensure defaults or migrations are handled
        if (state) {
          state.loadUserProfileFromStorage();
        }
      }
    }
  )
);
