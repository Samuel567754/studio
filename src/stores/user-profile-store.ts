
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStoredUsername, storeUsername as persistUsernameToStorage, getStoredFavoriteTopics, storeFavoriteTopics as persistFavoriteTopicsToStorage } from '@/lib/storage';

interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  loadUserProfileFromStorage: () => void;
  resetUserProfile: () => void;
}

const initialUserProfileState = {
  username: null,
  favoriteTopics: null,
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
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
      loadUserProfileFromStorage: () => {
        const storedName = getStoredUsername();
        const storedTopics = getStoredFavoriteTopics();
        set({ username: storedName, favoriteTopics: storedTopics });
      },
      resetUserProfile: () => {
        set({ username: null, favoriteTopics: null });
        persistUsernameToStorage(null);
        persistFavoriteTopicsToStorage(null);
      }
    }),
    {
      name: 'user-profile-storage', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ username: state.username, favoriteTopics: state.favoriteTopics }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loadUserProfileFromStorage();
        }
      }
    }
  )
);

