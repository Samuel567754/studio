
'use client';

import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getStoredUsername, storeUsername as persistUsernameToStorage,
  getStoredFavoriteTopics, storeFavoriteTopics as persistFavoriteTopicsToStorage,
  getStoredGoldenCoins, storeGoldenCoins as persistGoldenCoinsToStorage, // Updated
  getStoredUnlockedAchievements, storeUnlockedAchievements as persistUnlockedAchievementsToStorage
} from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { playAchievementUnlockedSound, playCoinsEarnedSound } from '@/lib/audio'; // Updated sound
import Image from 'next/image'; // For use in achievement modal trigger

// Define Achievement structure
export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointsRequired: number; // Will represent Golden Coins
  imageSrc: string;
  bonusCoins?: number; // Changed from bonusStars
  color?: string; // For potential styling, not directly used in image
  iconAlt?: string;
}

// This list will be defined on the Profile Page, but used by reference here for logic.
// We'll define ACHIEVEMENTS_CONFIG in profile/page.tsx and pass it or use a shared import.
// For now, the logic will assume such a config exists.
import { ACHIEVEMENTS_CONFIG } from '@/app/profile/page'; // Assuming it's exported from profile page for now

interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenCoins: number; // Changed from goldenStars
  unlockedAchievements: string[]; // Stores IDs of *claimed* achievements
  pendingClaimAchievements: Achievement[]; // Stores *full achievement objects* for the "claim" modal

  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenCoins: (amount: number) => void; // Changed
  deductGoldenCoins: (amount: number) => void; // New, if needed
  _triggerAchievementChecks: () => void;
  claimNextPendingAchievement: () => void;
  isAchievementUnlocked: (achievementId: string) => boolean;
  loadUserProfileFromStorage: () => void;
  resetUserProfile: () => void;
}

const initialUserProfileState: Omit<UserProfileState, 'setUsername' | 'setFavoriteTopics' | 'addGoldenCoins' | 'deductGoldenCoins' | '_triggerAchievementChecks' | 'claimNextPendingAchievement' | 'isAchievementUnlocked' | 'loadUserProfileFromStorage' | 'resetUserProfile'> = {
  username: null,
  favoriteTopics: null,
  goldenCoins: 0, // Changed
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
      addGoldenCoins: (amount) => { // Changed
        if (amount <= 0) return;
        set((state) => ({ goldenCoins: state.goldenCoins + amount }));
        persistGoldenCoinsToStorage(get().goldenCoins);
        setTimeout(() => get()._triggerAchievementChecks(), 0);
      },
      deductGoldenCoins: (amount) => { // New
        if (amount <= 0) return;
        set((state) => ({ goldenCoins: Math.max(0, state.goldenCoins - amount) }));
        persistGoldenCoinsToStorage(get().goldenCoins);
        // No achievement check on deduction
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
            pendingClaimAchievements: [...state.pendingClaimAchievements, ...newAchievementsToQueue],
          }));
        }
      },
      claimNextPendingAchievement: () => {
        const pending = get().pendingClaimAchievements;
        if (pending.length === 0) return;

        const achievementToClaim = pending[0];
        
        if (achievementToClaim.bonusCoins && achievementToClaim.bonusCoins > 0) { // Changed
          get().addGoldenCoins(achievementToClaim.bonusCoins); // This will persist & trigger checks
        }
        
        set((state) => ({
          unlockedAchievements: [...state.unlockedAchievements, achievementToClaim.id],
          pendingClaimAchievements: state.pendingClaimAchievements.slice(1),
        }));

        persistUnlockedAchievementsToStorage(get().unlockedAchievements);
        playAchievementUnlockedSound();
      },
      isAchievementUnlocked: (achievementId: string) => {
        return get().unlockedAchievements.includes(achievementId);
      },
      loadUserProfileFromStorage: () => {
        set({
          username: getStoredUsername(),
          favoriteTopics: getStoredFavoriteTopics(),
          goldenCoins: getStoredGoldenCoins(), // Changed
          unlockedAchievements: getStoredUnlockedAchievements(),
          pendingClaimAchievements: [] 
        });
        setTimeout(() => get()._triggerAchievementChecks(), 100);
      },
      resetUserProfile: () => {
        set(initialUserProfileState);
        persistUsernameToStorage(null);
        persistFavoriteTopicsToStorage(null);
        persistGoldenCoinsToStorage(0); // Changed
        persistUnlockedAchievementsToStorage([]);
        set({ pendingClaimAchievements: [] });
      }
    }),
    {
      name: 'user-profile-storage-v5-coins', // Incremented version
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        favoriteTopics: state.favoriteTopics,
        goldenCoins: state.goldenCoins, // Changed
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

    