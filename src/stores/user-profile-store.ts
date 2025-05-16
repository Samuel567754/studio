
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

// Define Achievement type directly here
export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageSrc: string;
  iconAlt?: string;
  bonusCoins?: number;
  color?: string; // Optional color for badge text or accents
}

// Define ACHIEVEMENTS_CONFIG directly here
// Normalized image paths (single .png, no trailing hyphens)
export const ACHIEVEMENTS_CONFIG: Achievement[] = [
  { id: "first_sparkle", name: "First Sparkle", description: "Earned your first 10 Golden Coins!", pointsRequired: 10, imageSrc: "/assets/images/star_emoji_illustration.png", iconAlt: "Star Emoji", bonusCoins: 2 },
  { id: "sparkling_start", name: "Sparkling Start", description: "Collected 20 Golden Coins!", pointsRequired: 20, imageSrc: "/assets/images/golden_glittery_sparkles.png", iconAlt: "Golden Glittery Sparkles", bonusCoins: 3 },
  { id: "star_cadet", name: "Star Cadet", description: "Collected 30 Golden Coins!", pointsRequired: 30, imageSrc: "/assets/images/cute_smiling_star_illustration.png", iconAlt: "Cute Smiling Star", bonusCoins: 5 },
  { id: "coin_dabbler", name: "Coin Dabbler", description: "Gathered 40 Golden Coins!", pointsRequired: 40, imageSrc: "/assets/images/three_golden_coins_sparkling.png", iconAlt: "Three Golden Coins Sparkling", bonusCoins: 3 },
  { id: "bronze_coin_collector", name: "Bronze Coin Collector", description: "Reached 50 Golden Coins!", pointsRequired: 50, imageSrc: "/assets/images/coin_with_clover_design.png", iconAlt: "Bronze Coin with Clover", bonusCoins: 5 },
  { id: "early_gem", name: "Early Gem", description: "Found your first Gem at 65 Coins!", pointsRequired: 65, imageSrc: "/assets/images/yellow_diamond_icon.png", iconAlt: "Yellow Diamond Icon", bonusCoins: 5 },
  { id: "silver_pouch_hoarder", name: "Silver Pouch Hoarder", description: "Amassed 75 Golden Coins!", pointsRequired: 75, imageSrc: "/assets/images/pile_of_gold_coins_image.png", iconAlt: "Pile of Gold Coins", bonusCoins: 10 },
  { id: "shooting_star", name: "Shooting Star", description: "Spotted a Shooting Star at 90 Coins!", pointsRequired: 90, imageSrc: "/assets/images/shooting_star_illustration.png", iconAlt: "Shooting Star Illustration", bonusCoins: 5 },
  { id: "ribbon_earned", name: "Ribbon Earned", description: "Earned a Yellow Ribbon at 110 Coins!", pointsRequired: 110, imageSrc: "/assets/images/yellow_award_ribbon.png", iconAlt: "Yellow Award Ribbon", bonusCoins: 7 },
  { id: "gemstone_novice", name: "Gemstone Novice", description: "Started your gem collection with 125 Golden Coins!", pointsRequired: 125, imageSrc: "/assets/images/blue_gem_icon.png", iconAlt: "Blue Gem Icon", bonusCoins: 10 },
  { id: "pink_gem_finder", name: "Pink Gem Finder", description: "Uncovered a Pink Gem at 150 Coins!", pointsRequired: 150, imageSrc: "/assets/images/pink_diamond_gemstone.png", iconAlt: "Pink Diamond Gemstone", bonusCoins: 12 },
  { id: "ruby_seeker", name: "Ruby Seeker", description: "Discovered a Ruby Gem with 175 Golden Coins!", pointsRequired: 175, imageSrc: "/assets/images/red_diamond_gem_illustration.png", iconAlt: "Red Diamond Gem", bonusCoins: 15 },
  { id: "crystal_cluster", name: "Crystal Cluster", description: "Found a Blue Crystal Cluster at 200 Coins!", pointsRequired: 200, imageSrc: "/assets/images/blue_crystal_cluster_illustration.png", iconAlt: "Blue Crystal Cluster", bonusCoins: 15 },
  { id: "diamond_finder", name: "Diamond Finder", description: "Unearthed a Blue Diamond with 225 Golden Coins!", pointsRequired: 225, imageSrc: "/assets/images/blue_diamond_cartoon_illustration.png", iconAlt: "Blue Diamond Illustration", bonusCoins: 20 },
  { id: "green_sparkler", name: "Green Sparkler", description: "Found a Green Diamond at 275 Coins!", pointsRequired: 275, imageSrc: "/assets/images/green_diamond_illustration.png", iconAlt: "Green Diamond Illustration", bonusCoins: 20 },
  { id: "award_winner", name: "Award Winner", description: "Earned a Star Award Ribbon at 300 Golden Coins!", pointsRequired: 300, imageSrc: "/assets/images/yellow_award_ribbon_star_design.png", iconAlt: "Yellow Award Ribbon with Star", bonusCoins: 20 },
  { id: "purple_orb", name: "Purple Orb Collector", description: "Collected a Purple Crystal Sphere at 350 Coins!", pointsRequired: 350, imageSrc: "/assets/images/geometric_purple_crystal_sphere.png", iconAlt: "Geometric Purple Crystal Sphere", bonusCoins: 25 },
  { id: "treasure_chest_unlocker", name: "Treasure Chest Unlocker", description: "Unlocked a Treasure Chest with 400 Golden Coins!", pointsRequired: 400, imageSrc: "/assets/images/treasure_chest_with_gold_and_jewels.png", iconAlt: "Treasure Chest with Gold and Jewels", bonusCoins: 25 },
  { id: "gold_splash", name: "Golden Splash", description: "Made a splash with 450 Coins!", pointsRequired: 450, imageSrc: "/assets/images/golden_coins_splash.png", iconAlt: "Golden Coins Splash", bonusCoins: 25 },
  { id: "chilllearn_tycoon", name: "ChillLearn Tycoon", description: "Achieved 500 Golden Coins! You're a tycoon!", pointsRequired: 500, imageSrc: "/assets/images/gold_trophy_with_laurel_wreath.png", iconAlt: "Gold Trophy with Laurel Wreath", bonusCoins: 30 },
  { id: "mystical_egg", name: "Mystical Egg Finder", description: "Found a Shiny Blue Mystical Egg at 600 Coins!", pointsRequired: 600, imageSrc: "/assets/images/shiny_blue_mystical_egg.png", iconAlt: "Shiny Blue Mystical Egg", bonusCoins: 35 },
  { id: "purple_geode", name: "Purple Geode Hunter", description: "Discovered a Purple Geode at 700 Coins!", pointsRequired: 700, imageSrc: "/assets/images/purple_geode_watercolor_painting.png", iconAlt: "Purple Geode Watercolor Painting", bonusCoins: 40 },
  { id: "grand_trophy", name: "Grand Trophy Winner", description: "Won a Grand Trophy at 850 Coins!", pointsRequired: 850, imageSrc: "/assets/images/golden_trophy_with_stars_illustration.png", iconAlt: "Golden Trophy with Stars", bonusCoins: 50 },
  { id: "cosmic_voyager", name: "Cosmic Voyager", description: "Embarked on a Cosmic Voyage at 1000 Coins!", pointsRequired: 1000, imageSrc: "/assets/images/comet_sketch_blue_pastel_artwork.png", iconAlt: "Comet Sketch Blue Pastel Artwork", bonusCoins: 60 },
  { id: "crystal_overlord", name: "Crystal Overlord", description: "Became a Crystal Overlord at 1200 Coins!", pointsRequired: 1200, imageSrc: "/assets/images/colorful_geometric_crystals_illustration.png", iconAlt: "Colorful Geometric Crystals Illustration", bonusCoins: 70 },
  { id: "legendary_learner", name: "Legendary Learner", description: "Reached Legendary Learner status at 1500 Coins!", pointsRequired: 1500, imageSrc: "/assets/images/winner_medal_ribbon_illustration.png", iconAlt: "Winner Medal Ribbon Illustration", bonusCoins: 100 },
];


interface UserProfileState {
  username: string | null;
  favoriteTopics: string | null;
  goldenCoins: number;
  unlockedAchievements: string[]; // Stores IDs of claimed achievements
  pendingClaimAchievements: Achievement[]; // Stores full achievement objects to be claimed
  lastBonusAwarded: { amount: number; key: string } | null;
  lastGameCoinsAwarded: { amount: number; key: string } | null;
  lastCoinsDeducted: { amount: number; key: string } | null;

  setUsername: (name: string | null) => void;
  setFavoriteTopics: (topics: string | null) => void;
  addGoldenCoins: (amount: number, isAchievementBonus?: boolean) => void;
  deductGoldenCoins: (amount: number) => void;
  _triggerAchievementChecks: () => void;
  claimNextPendingAchievement: () => void;
  isAchievementUnlocked: (achievementId: string) => boolean;
  loadUserProfileFromStorage: () => void;
  resetUserProfile: () => void;
  clearLastBonusAwarded: () => void;
  clearLastGameCoinsAwarded: () => void;
  clearLastCoinsDeducted: () => void;
}

const initialUserProfileState: Omit<UserProfileState, 'setUsername' | 'setFavoriteTopics' | 'addGoldenCoins' | 'deductGoldenCoins' | '_triggerAchievementChecks' | 'claimNextPendingAchievement' | 'isAchievementUnlocked' | 'loadUserProfileFromStorage' | 'resetUserProfile' | 'clearLastBonusAwarded' | 'clearLastGameCoinsAwarded' | 'clearLastCoinsDeducted'> = {
  username: null,
  favoriteTopics: null,
  goldenCoins: 0,
  unlockedAchievements: [],
  pendingClaimAchievements: [],
  lastBonusAwarded: null,
  lastGameCoinsAwarded: null,
  lastCoinsDeducted: null,
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
      addGoldenCoins: (amount, isAchievementBonus = false) => {
        if (amount <= 0) return;
        const currentTotal = get().goldenCoins;
        const newTotal = currentTotal + amount;
        set({ goldenCoins: newTotal });
        persistGoldenCoinsToStorage(newTotal);

        if (!isAchievementBonus) {
          set({ lastGameCoinsAwarded: { amount, key: Date.now().toString() + Math.random().toString() } });
        }
        // Defer achievement check slightly to ensure state update is processed
        setTimeout(() => get()._triggerAchievementChecks(), 0);
      },
      deductGoldenCoins: (amount) => {
        if (amount <= 0) return;
        const currentTotal = get().goldenCoins;
        const newTotal = Math.max(0, currentTotal - amount); // Ensure coins don't go below 0
        set({ goldenCoins: newTotal });
        persistGoldenCoinsToStorage(newTotal);
        set({ lastCoinsDeducted: { amount, key: Date.now().toString() + Math.random().toString() }});
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
          newAchievementsToQueue.sort((a, b) => a.pointsRequired - b.pointsRequired);
          set((state) => ({
            pendingClaimAchievements: [...state.pendingClaimAchievements, ...newAchievementsToQueue]
              .sort((a,b) => a.pointsRequired - b.pointsRequired)
              .filter((ach, index, self) => index === self.findIndex(t => t.id === ach.id))
          }));
        }
      },
      claimNextPendingAchievement: () => {
        const pending = get().pendingClaimAchievements;
        if (pending.length === 0) return;

        const achievementToClaim = pending[0];

        if (achievementToClaim.bonusCoins && achievementToClaim.bonusCoins > 0) {
          get().addGoldenCoins(achievementToClaim.bonusCoins, true);
          set({ lastBonusAwarded: { amount: achievementToClaim.bonusCoins, key: Date.now().toString() + Math.random().toString() } });
        }

        set((state) => ({
          unlockedAchievements: [...state.unlockedAchievements, achievementToClaim.id],
          pendingClaimAchievements: state.pendingClaimAchievements.slice(1),
        }));
        persistUnlockedAchievementsToStorage(get().unlockedAchievements);
        playAchievementUnlockedSound();
        
        // Using React.createElement for toast title to avoid JSX parsing issues in .ts file
        const toastTitleContent = React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement('img', {
            src: achievementToClaim.imageSrc,
            alt: achievementToClaim.name,
            width: 24,
            height: 24,
            style: { borderRadius: '4px' }
          }),
          'Achievement Unlocked!'
        );

        toast({
            variant: "success",
            title: toastTitleContent,
            description: `You've unlocked: ${achievementToClaim.name}! ${achievementToClaim.bonusCoins ? `+${achievementToClaim.bonusCoins} bonus coins!` : ''}`,
            duration: 7000,
        });
      },
      isAchievementUnlocked: (achievementId: string) => {
        return get().unlockedAchievements.includes(achievementId);
      },
      loadUserProfileFromStorage: () => {
        set({
          username: getStoredUsername(),
          favoriteTopics: getStoredFavoriteTopics(),
          goldenCoins: getStoredGoldenCoins(0),
          unlockedAchievements: getStoredUnlockedAchievements(),
          pendingClaimAchievements: [],
          lastBonusAwarded: null,
          lastGameCoinsAwarded: null,
          lastCoinsDeducted: null,
        });
         setTimeout(() => {
            get()._triggerAchievementChecks();
        }, 500); 
      },
      resetUserProfile: () => {
        set(initialUserProfileState);
        persistUsernameToStorage(null);
        persistFavoriteTopicsToStorage(null);
        persistGoldenCoinsToStorage(0);
        persistUnlockedAchievementsToStorage([]);
      },
      clearLastBonusAwarded: () => set({ lastBonusAwarded: null }),
      clearLastGameCoinsAwarded: () => set({ lastGameCoinsAwarded: null }),
      clearLastCoinsDeducted: () => set({ lastCoinsDeducted: null }),
    }),
    {
      name: 'user-profile-storage-v5-coins', // Updated store name
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        favoriteTopics: state.favoriteTopics,
        goldenCoins: state.goldenCoins,
        unlockedAchievements: state.unlockedAchievements,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => {
            state._triggerAchievementChecks();
          }, 500);
        }
      }
    }
  )
);
