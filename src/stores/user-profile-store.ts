'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStoredUsername, storeUsername as persistUsernameToStorage } from '@/lib/storage';

interface UserProfileState {
  username: string | null;
  setUsername: (name: string | null) => void;
  loadUsernameFromStorage: () => void;
  resetUsername: () => void;
}

const initialUserProfileState = {
  username: null,
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      ...initialUserProfileState,
      setUsername: (name) => {
        const newUsername = name && name.trim() !== '' ? name.trim() : null;
        set({ username: newUsername });
        // Persist directly to localStorage to ensure it's saved even if persist middleware has delays
        persistUsernameToStorage(newUsername); 
      },
      loadUsernameFromStorage: () => {
        const storedName = getStoredUsername();
        set({ username: storedName });
      },
      resetUsername: () => {
        set({ username: null });
        persistUsernameToStorage(null);
      }
    }),
    {
      name: 'user-profile-storage', 
      storage: createJSONStorage(() => localStorage),
      // Only persist the username field from the store
      partialize: (state) => ({ username: state.username }),
       // Custom onRehydrateStorage to ensure store is updated from localStorage on init
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loadUsernameFromStorage();
        }
      }
    }
  )
);
