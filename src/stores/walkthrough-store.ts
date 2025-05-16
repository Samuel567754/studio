
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WalkthroughState {
  hasCompletedWalkthrough: boolean;
  isWalkthroughOpen: boolean;
  currentStepIndex: number; // Added
  setHasCompletedWalkthrough: (completed: boolean) => void;
  openWalkthrough: () => void;
  closeWalkthrough: () => void;
  setCurrentStepIndex: (index: number) => void; // Added
  nextStep: () => void; // Added
  prevStep: () => void; // Added
}

const WALKTHROUGH_PERSIST_KEY = 'chilllearn_walkthroughState_v1';

export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set) => ({
      hasCompletedWalkthrough: false, // Default: assumes not completed, will be hydrated from localStorage
      isWalkthroughOpen: false,     // Default: modal is closed
      currentStepIndex: 0,         // Initialize currentStepIndex
      setHasCompletedWalkthrough: (completed) => {
        set({ hasCompletedWalkthrough: completed });
        if (completed) {
          set({ isWalkthroughOpen: false }); // Automatically close modal when marked as complete
        }
      },
      openWalkthrough: () => set({ isWalkthroughOpen: true, currentStepIndex: 0 }), // Reset step on open
      closeWalkthrough: () => set({ isWalkthroughOpen: false }),
      setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
      nextStep: () => set((state) => ({ currentStepIndex: state.currentStepIndex + 1 })),
      prevStep: () => set((state) => ({ currentStepIndex: Math.max(0, state.currentStepIndex - 1) })),
    }),
    {
      name: WALKTHROUGH_PERSIST_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist the 'hasCompletedWalkthrough' flag.
      // currentStepIndex will reset each time the app loads or walkthrough is opened.
      partialize: (state) => ({ 
        hasCompletedWalkthrough: state.hasCompletedWalkthrough,
      }),
    }
  )
);
