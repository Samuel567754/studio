
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  getStoredUsername, storeUsername as persistUsernameToStorage, 
  getStoredFavoriteTopics, storeFavoriteTopics as persistFavoriteTopicsToStorage,
  getStoredGoldenStars, storeGoldenStars as persistGoldenStarsToStorage
} from '@/lib/storage';

interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenStars: number; // New points system
  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenStars: (amount: number) => void;
  setGoldenStars: (amount: number) => void; // For direct setting if needed
  loadUserProfileFromStorage: () => void;
  resetUserProfile: () => void;
}

const initialUserProfileState = {
  username: null,
  favoriteTopics: null,
  goldenStars: 0,
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
        const newTotal = Math.max(0, get().goldenStars + amount);
        set({ goldenStars: newTotal });
        persistGoldenStarsToStorage(newTotal);
      },
      setGoldenStars: (amount) => { // New setter
        const newTotal = Math.max(0, amount);
        set({ goldenStars: newTotal });
        persistGoldenStarsToStorage(newTotal);
      },
      loadUserProfileFromStorage: () => {
        const storedName = getStoredUsername();
        const storedTopics = getStoredFavoriteTopics();
        const storedStars = getStoredGoldenStars();
        set({ username: storedName, favoriteTopics: storedTopics, goldenStars: storedStars });
      },
      resetUserProfile: () => {
        set({ username: null, favoriteTopics: null, goldenStars: 0 });
        persistUsernameToStorage(null);
        persistFavoriteTopicsToStorage(null);
        persistGoldenStarsToStorage(0);
      }
    }),
    {
      name: 'user-profile-storage-v3', // Incremented version for fresh start
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        username: state.username, 
        favoriteTopics: state.favoriteTopics,
        goldenStars: state.goldenStars 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure that onRehydrateStorage also calls loadUserProfileFromStorage
          // or directly sets the state if the persisted state might be partial.
          // For simplicity here, we rely on the initial load from useEffect in ClientRootFeatures,
          // but a more robust rehydration could directly use getStored functions.
          state.loadUserProfileFromStorage();
        }
      }
    }
  )
);
