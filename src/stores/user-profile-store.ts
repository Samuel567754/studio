
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
import type { Achievement } from '@/app/profile/page'; // Assuming Achievement type is exported from profile
import { ACHIEVEMENTS_CONFIG } from '@/app/profile/page';

interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenCoins: number;
  unlockedAchievements: string[];
  pendingClaimAchievements: Achievement[];

  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenCoins: (amount: number) => void;
  deductGoldenCoins: (amount: number) => void; // New action
  _triggerAchievementChecks: () => void;
  claimNextPendingAchievement: () => void;
  isAchievementUnlocked: (achievementId: string) => boolean;
  loadUserProfileFromStorage: () => void;
  resetUserProfile: () => void;
}

const initialUserProfileState: Omit<UserProfileState, 'setUsername' | 'setFavoriteTopics' | 'addGoldenCoins' | 'deductGoldenCoins' | '_triggerAchievementChecks' | 'claimNextPendingAchievement' | 'isAchievementUnlocked' | 'loadUserProfileFromStorage' | 'resetUserProfile'> = {
  username: null,
  favoriteTopics: null,
  goldenCoins: 0,
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
      addGoldenCoins: (amount) => {
        if (amount <= 0) return;
        set((state) => ({ goldenCoins: state.goldenCoins + amount }));
        persistGoldenCoinsToStorage(get().goldenCoins);
        // Use setTimeout to ensure state update is processed before triggering checks
        setTimeout(() => get()._triggerAchievementChecks(), 0);
      },
      deductGoldenCoins: (amount) => {
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
        
        if (achievementToClaim.bonusCoins && achievementToClaim.bonusCoins > 0) {
          get().addGoldenCoins(achievementToClaim.bonusCoins); 
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
          goldenCoins: getStoredGoldenCoins(),
          unlockedAchievements: getStoredUnlockedAchievements(),
          pendingClaimAchievements: [] 
        });
        // Initial check for achievements based on loaded coins
        setTimeout(() => get()._triggerAchievementChecks(), 100);
      },
      resetUserProfile: () => {
        set(initialUserProfileState);
        persistUsernameToStorage(null);
        persistFavoriteTopicsToStorage(null);
        persistGoldenCoinsToStorage(0);
        persistUnlockedAchievementsToStorage([]);
        set({ pendingClaimAchievements: [] }); // Clear pending claims on reset
      }
    }),
    {
      name: 'user-profile-storage-v5-coins', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        favoriteTopics: state.favoriteTopics,
        goldenCoins: state.goldenCoins,
        unlockedAchievements: state.unlockedAchievements,
        // pendingClaimAchievements is intentionally not persisted here,
        // it should be recalculated on load based on goldenCoins and unlockedAchievements
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Call loadUserProfileFromStorage to ensure all derived states and checks are run
          setTimeout(() => {
            state.loadUserProfileFromStorage();
          }, 0);
        }
      }
    }
  )
);
