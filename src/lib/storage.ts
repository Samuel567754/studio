
'use client';

import { useWalkthroughStore } from '@/stores/walkthrough-store';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useThemeStore } from '@/stores/theme-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';

// Keys for localStorage items
const WORD_LIST_KEY = 'sightwords_wordList_v1';
const READING_LEVEL_KEY = 'sightwords_readingLevel_v1';
const WORD_LENGTH_KEY = 'sightwords_wordLength_v1';
const CURRENT_INDEX_KEY = 'sightwords_currentIndex_v1';
const MASTERED_WORDS_KEY = 'sightwords_masteredWords_v1';
const PROGRESSION_SUGGESTION_DISMISSED_KEY_PREFIX = 'sightwords_progressionSuggestionDismissed_v1_';
export const WALKTHROUGH_PERSIST_KEY = 'chilllearn_walkthroughState_v1';
const INTRODUCTION_SEEN_KEY = 'chilllearn_introductionSeen_v1';
const USERNAME_KEY = 'chilllearn_username_v1';
const PERSONALIZATION_COMPLETED_KEY = 'chilllearn_personalizationCompleted_v1';
const FAVORITE_TOPICS_KEY = 'chilllearn_favoriteTopics_v1';
const GOLDEN_COINS_KEY = 'chilllearn_goldenCoins_v1'; // Changed from GOLDEN_STARS_KEY
const UNLOCKED_ACHIEVEMENTS_KEY = 'chilllearn_unlockedAchievements_v1'; // Changed from _v3

// --- Golden Coins ---
export const getStoredGoldenCoins = (defaultValue = 0): number => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(GOLDEN_COINS_KEY);
    const value = stored ? parseInt(stored, 10) : defaultValue;
    return isNaN(value) ? defaultValue : value;
  } catch (error) {
    console.error("Error reading golden coins from localStorage:", error);
    return defaultValue;
  }
};

export const storeGoldenCoins = (coins: number): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GOLDEN_COINS_KEY, String(coins));
  } catch (error) {
    console.error("Error storing golden coins to localStorage:", error);
  }
};

// --- Unlocked Achievements ---
export const getStoredUnlockedAchievements = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(UNLOCKED_ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing unlocked achievements from localStorage:", error);
    return [];
  }
};

export const storeUnlockedAchievements = (achievementIds: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(UNLOCKED_ACHIEVEMENTS_KEY, JSON.stringify(achievementIds));
  } catch (error) {
    console.error("Error storing unlocked achievements to localStorage:", error);
  }
};


// --- Username ---
export const getStoredUsername = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(USERNAME_KEY);
  } catch (error) {
    console.error("Error reading username from localStorage:", error);
    return null;
  }
};

export const storeUsername = (username: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (username) {
      localStorage.setItem(USERNAME_KEY, username);
    } else {
      localStorage.removeItem(USERNAME_KEY);
    }
  } catch (error) {
    console.error("Error storing username to localStorage:", error);
  }
};

// --- Favorite Topics ---
export const getStoredFavoriteTopics = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(FAVORITE_TOPICS_KEY);
  } catch (error) {
    console.error("Error reading favorite topics from localStorage:", error);
    return null;
  }
};

export const storeFavoriteTopics = (topics: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (topics) {
      localStorage.setItem(FAVORITE_TOPICS_KEY, topics);
    } else {
      localStorage.removeItem(FAVORITE_TOPICS_KEY);
    }
  } catch (error) {
    console.error("Error storing favorite topics to localStorage:", error);
  }
};


// --- Introduction Seen ---
export const getHasSeenIntroduction = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(INTRODUCTION_SEEN_KEY);
    return stored === 'true';
  } catch (error) {
    console.error("Error reading introduction seen flag from localStorage:", error);
    return false;
  }
};

export const setHasSeenIntroduction = (seen: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INTRODUCTION_SEEN_KEY, seen ? 'true' : 'false');
  } catch (error) {
    console.error("Error storing introduction seen flag to localStorage:", error);
  }
};

// --- Personalization Completed ---
export const getHasCompletedPersonalization = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(PERSONALIZATION_COMPLETED_KEY);
    return stored === 'true';
  } catch (error) {
    console.error("Error reading personalization completed flag from localStorage:", error);
    return false;
  }
};

export const setHasCompletedPersonalization = (completed: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERSONALIZATION_COMPLETED_KEY, completed ? 'true' : 'false');
  } catch (error) {
    console.error("Error storing personalization completed flag to localStorage:", error);
  }
};


// --- Word List ---
export const getStoredWordList = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(WORD_LIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing word list from localStorage:", error);
    return [];
  }
};

export const storeWordList = (wordList: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORD_LIST_KEY, JSON.stringify(wordList));
  } catch (error) {
    console.error("Error storing word list to localStorage:", error);
  }
};

// --- Reading Level ---
export const getStoredReadingLevel = (defaultValue = "beginner"): string => {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(READING_LEVEL_KEY) || defaultValue;
};

export const storeReadingLevel = (level: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(READING_LEVEL_KEY, level);
};

// --- Word Length ---
export const getStoredWordLength = (defaultValue = 3): number => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(WORD_LENGTH_KEY);
  const value = stored ? parseInt(stored, 10) : defaultValue;
  return isNaN(value) ? defaultValue : value;
};

export const storeWordLength = (length: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WORD_LENGTH_KEY, String(length));
};

// --- Current Index (for word list navigation) ---
export const getStoredCurrentIndex = (defaultValue = 0): number => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(CURRENT_INDEX_KEY);
  const value = stored ? parseInt(stored, 10) : defaultValue;
  return isNaN(value) ? defaultValue : value;
};

export const storeCurrentIndex = (index: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_INDEX_KEY, String(index));
};

// --- Mastered Words ---
export const getStoredMasteredWords = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MASTERED_WORDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing mastered words from localStorage:", error);
    return [];
  }
};

export const storeMasteredWords = (words: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MASTERED_WORDS_KEY, JSON.stringify(words));
  } catch (error) {
    console.error("Error storing mastered words to localStorage:", error);
  }
};

export const addMasteredWord = (word: string): void => {
  if (typeof window === 'undefined') return;
  const masteredWords = getStoredMasteredWords();
  const lowerCaseWord = word.toLowerCase();
  if (!masteredWords.map(w => w.toLowerCase()).includes(lowerCaseWord)) {
    masteredWords.push(word);
    storeMasteredWords(masteredWords);
  }
};

// --- Progression Suggestion Dismissal ---
const getProgressionDismissalKey = (level: string, length: number): string => {
  return `${PROGRESSION_SUGGESTION_DISMISSED_KEY_PREFIX}${level}_${length}`;
};

export const getProgressionSuggestionDismissed = (level: string, length: number): boolean => {
  if (typeof window === 'undefined') return false;
  const key = getProgressionDismissalKey(level, length);
  return localStorage.getItem(key) === 'true';
};

export const storeProgressionSuggestionDismissed = (level: string, length: number, dismissed: boolean): void => {
  if (typeof window === 'undefined') return;
  const key = getProgressionDismissalKey(level, length);
  if (dismissed) {
    localStorage.setItem(key, 'true');
  } else {
    localStorage.removeItem(key);
  }
};


// --- Utility to clear only progress-related stored data ---
export const clearProgressStoredData = (): void => {
  if (typeof window === 'undefined') return;
  // Clear localStorage items
  localStorage.removeItem(WORD_LIST_KEY);
  localStorage.removeItem(READING_LEVEL_KEY);
  localStorage.removeItem(WORD_LENGTH_KEY);
  localStorage.removeItem(CURRENT_INDEX_KEY);
  localStorage.removeItem(MASTERED_WORDS_KEY);
  localStorage.removeItem(WALKTHROUGH_PERSIST_KEY);
  localStorage.removeItem(INTRODUCTION_SEEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(PERSONALIZATION_COMPLETED_KEY);
  localStorage.removeItem(FAVORITE_TOPICS_KEY);
  localStorage.removeItem(GOLDEN_COINS_KEY); // Updated
  localStorage.removeItem(UNLOCKED_ACHIEVEMENTS_KEY);

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(PROGRESSION_SUGGESTION_DISMISSED_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });

  try {
    // Explicitly reset Zustand stores to their initial states
    useUserProfileStore.getState().resetUserProfile();
    useWalkthroughStore.getState().setHasCompletedWalkthrough(false);
    useWalkthroughStore.getState().setCurrentStepIndex(0);
    useWalkthroughStore.getState().closeWalkthrough();
    useThemeStore.getState().resetThemeSettings();
    useAppSettingsStore.getState().resetAppSettings();
    console.log("Cleared all user progress-related stored data and reset Zustand stores to initial states.");
  } catch (error) {
    console.error("Error resetting Zustand stores during clearProgressStoredData:", error);
  }
};

    