
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
import { toast } from '@/hooks/use-toast';
import { playAchievementUnlockedSound } from '@/lib/audio'; // playStarsEarnedSound is handled by components
import Image from 'next/image'; // For use in achievement modal trigger

// Define Achievement structure
export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointsRequired: number; // Using 'pointsRequired' for Golden Stars
  imageSrc: string;
  bonusStars?: number;
  color?: string;
  iconAlt?: string;
}

// This list should ideally be in a shared config file or imported
// For now, it's defined here for the store's internal logic.
// Ensure image paths are correct and files exist in public/assets/images/
// Normalizing filenames to single .png
const ACHIEVEMENTS_CONFIG: Achievement[] = [
  { id: "star_cadet", name: "Star Cadet", description: "Collected your first 25 Golden Stars!", pointsRequired: 25, imageSrc: "/assets/images/cute_smiling_star_illustration.png", bonusStars: 5 },
  { id: "coin_collector_1", name: "Coin Collector I", description: "Amassed 75 Golden Stars!", pointsRequired: 75, imageSrc: "/assets/images/pile_of_gold_coins_image.png", bonusStars: 10 },
  { id: "gem_seeker_1", name: "Gem Seeker I", description: "Discovered 150 Golden Stars!", pointsRequired: 150, imageSrc: "/assets/images/multicolored_geometric_crystal_shape.png", bonusStars: 15 },
  { id: "treasure_finder", name: "Treasure Discoverer", description: "Unearthed 300 Golden Stars!", pointsRequired: 300, imageSrc: "/assets/images/treasure_chest_with_gold_and_jewels.png", bonusStars: 20 },
  { id: "chill_master", name: "ChillLearn Master", description: "Achieved 500 Golden Stars overall!", pointsRequired: 500, imageSrc: "/assets/images/gold_trophy_with_laurel_wreath.png", bonusStars: 25 },
];

interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenStars: number;
  unlockedAchievements: string[]; // Stores IDs of *claimed* achievements
  pendingClaimAchievements: Achievement[]; // Stores *full achievement objects* for the "claim" modal

  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenStars: (amount: number) => void;
  _triggerAchievementChecks: () => void;
  claimNextPendingAchievement: () => void;
  isAchievementUnlocked: (achievementId: string) => boolean;
  loadUserProfileFromStorage: () => void;
  resetUserProfile: () => void;
}

const initialUserProfileState: Omit<UserProfileState, 'setUsername' | 'setFavoriteTopics' | 'addGoldenStars' | '_triggerAchievementChecks' | 'claimNextPendingAchievement' | 'isAchievementUnlocked' | 'loadUserProfileFromStorage' | 'resetUserProfile'> = {
  username: null,
  favoriteTopics: null,
  goldenStars: 0,
  unlockedAchievements: [],
  pendingClaimAchievements: [],
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
        set((state) => ({ goldenStars: state.goldenStars + amount }));
        persistGoldenStarsToStorage(get().goldenStars);
        // Defer achievement check slightly to ensure state update completes
        setTimeout(() => get()._triggerAchievementChecks(), 0);
      },
      _triggerAchievementChecks: () => {
        const currentStars = get().goldenStars;
        const alreadyUnlockedIds = get().unlockedAchievements;
        const currentlyPendingIds = get().pendingClaimAchievements.map(ach => ach.id);
        
        let newAchievementsToQueue: Achievement[] = [];

        ACHIEVEMENTS_CONFIG.forEach((achievement) => {
          if (
            currentStars >= achievement.pointsRequired &&
            !alreadyUnlockedIds.includes(achievement.id) &&
            !currentlyPendingIds.includes(achievement.id)
          ) {
            newAchievementsToQueue.push(achievement);
          }
        });

        if (newAchievementsToQueue.length > 0) {
          set((state) => ({
            pendingClaimAchievements: [...state.pendingClaimAchievements, ...newAchievementsToQueue],
          }));
        }
      },
      claimNextPendingAchievement: () => {
        const pending = get().pendingClaimAchievements;
        if (pending.length === 0) return;

        const achievementToClaim = pending[0];
        
        // Award bonus stars *before* adding to unlocked achievements
        // to prevent re-triggering the same achievement with its own bonus.
        if (achievementToClaim.bonusStars && achievementToClaim.bonusStars > 0) {
          get().addGoldenStars(achievementToClaim.bonusStars); // This will call persist & _triggerAchievementChecks
        }
        
        set((state) => ({
          unlockedAchievements: [...state.unlockedAchievements, achievementToClaim.id],
          pendingClaimAchievements: state.pendingClaimAchievements.slice(1),
        }));

        persistUnlockedAchievementsToStorage(get().unlockedAchievements);
        playAchievementUnlockedSound();
        
        // The AchievementUnlockedModal will handle its own dismissal.
        // A toast can still be shown here or directly in the modal component after claiming.
        // For now, the primary notification is the modal itself.
      },
      isAchievementUnlocked: (achievementId: string) => {
        return get().unlockedAchievements.includes(achievementId);
      },
      loadUserProfileFromStorage: () => {
        set({
          username: getStoredUsername(),
          favoriteTopics: getStoredFavoriteTopics(),
          goldenStars: getStoredGoldenStars(),
          unlockedAchievements: getStoredUnlockedAchievements(),
          pendingClaimAchievements: [] // Reset pending on load, they'll be re-evaluated
        });
        setTimeout(() => get()._triggerAchievementChecks(), 100); // Slightly longer delay on load
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
      name: 'user-profile-storage-v4-goldenstars', // New version for Golden Stars system
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        favoriteTopics: state.favoriteTopics,
        goldenStars: state.goldenStars,
        unlockedAchievements: state.unlockedAchievements,
        // pendingClaimAchievements is not persisted.
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
