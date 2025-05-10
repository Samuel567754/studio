
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WalkthroughState {
  hasCompletedWalkthrough: boolean;
  isWalkthroughOpen: boolean;
  setHasCompletedWalkthrough: (completed: boolean) => void;
  openWalkthrough: () => void;
  closeWalkthrough: () => void;
}

const WALKTHROUGH_PERSIST_KEY = 'chilllearn_walkthroughState_v1';

export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set) => ({
      hasCompletedWalkthrough: false, // Default: assumes not completed, will be hydrated from localStorage
      isWalkthroughOpen: false,     // Default: modal is closed
      setHasCompletedWalkthrough: (completed) => {
        set({ hasCompletedWalkthrough: completed });
        if (completed) {
          set({ isWalkthroughOpen: false }); // Automatically close modal when marked as complete
        }
      },
      openWalkthrough: () => set({ isWalkthroughOpen: true }),
      closeWalkthrough: () => set({ isWalkthroughOpen: false }),
    }),
    {
      name: WALKTHROUGH_PERSIST_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist the 'hasCompletedWalkthrough' flag
      partialize: (state) => ({ hasCompletedWalkthrough: state.hasCompletedWalkthrough }),
    }
  )
);
