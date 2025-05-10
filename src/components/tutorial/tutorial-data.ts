
import type { Puzzle, BookOpenCheck, TextSelect } from 'lucide-react'; // Example, adjust as needed

export interface TutorialStep {
  id: string;
  title: (username?: string | null) => string;
  content: string;
  ariaLabel: string;
  icon?: React.ElementType; // For an icon in the step if desired
  targetElementSelector?: string; // For interactive walkthrough targeting
}

export const tutorialStepsData: TutorialStep[] = [
  {
    id: 'welcome',
    title: (username) => username ? `Welcome, ${username}!` : 'Welcome to ChillLearn!',
    content: "This guide will walk you through the main features of the ChillLearn application, helping you make the most of your learning experience. Let's get started! You can also launch an interactive walkthrough using the button above.",
    ariaLabel: 'Welcome section introduction',
    targetElementSelector: '#main-header', 
  },
  {
    id: 'word-practice-hub',
    title: () => "Word Practice Zone (Your Literacy Hub - '/word-practice')",
    content: "The 'Word Practice' page (found at /word-practice) is your central hub for all word-related activities.\n\nFrom here, you can access:\n- Learn New Words: Get AI suggestions, set your reading level, and build your crucial practice list.\n- Spelling Practice: Master words from your list with interactive exercises.\n- Identify Words: Test your recognition by choosing the correct word from options.\n- Reading Adventures: Read AI-generated stories featuring your practice words.",
    ariaLabel: "Explanation of the Word Practice Zone, linking to Learn, Spell, Identify, and Read sections.",
    icon: "TextSelect" as any,
    targetElementSelector: '[href="/word-practice"]',
  },
  {
    id: 'ai-games',
    title: () => 'AI Word Games (Interactive Fun - /ai-games)',
    content: "Visit the 'AI Games' section for more engaging ways to practice your vocabulary.\n\n- Fill in the Blank: Read an AI-generated sentence and choose the correct word to complete it.\n- Word Definition Match: Test your understanding by matching words to their AI-generated definitions.",
    ariaLabel: "Overview of the AI Word Games section, featuring Fill in the Blank and Definition Match.",
    icon: "Puzzle" as any, 
    targetElementSelector: '[href="/ai-games"]',
  },
  {
    id: 'math',
    title: () => 'Math Zone (Explore Numeracy - /math)',
    content: "The 'Math Zone' is your hub for various math activities:\n\n- AI Word Problems & Story Problems: Solve math challenges created by AI.\n- Arithmetic Games: Tackle addition, subtraction, multiplication, and division.\n- Times Table Practice: Master your multiplication facts.\n- Number Comparison & Sequencing: Test your number sense.\nMany games feature audio read-aloud and voice input options!",
    ariaLabel: "Overview of the Math Zone and its various game sections.",
    targetElementSelector: '[href="/math"]',
  },
  {
    id: 'profile',
    title: () => 'Profile Page (Track Your Progress - /profile)',
    content: "Visit your 'Profile' page for a snapshot of your learning journey.\nHere you'll find:\n- Your name and favorite topics (editable!).\n- Statistics on practice words and mastered words.\n- Your current learning preferences.",
    ariaLabel: "Overview of the Profile page.",
    targetElementSelector: '[href="/profile"]',
  },
  {
    id: 'settings',
    title: () => 'Settings Page (Customize Your App - /settings)',
    content: "Tailor the ChillLearn app on the 'Settings' page.\nAdjust:\n- Theme: Light, dark, or system default.\n- Font: Family and size.\n- Audio: Sound effects, speech voice, rate, and pitch.",
    ariaLabel: "Details on the Settings page.",
    targetElementSelector: '[href="/settings"]',
  },
  {
    id: 'navigation',
    title: () => 'Navigating the App',
    content: "Getting around is easy:\n- Main Homepage ('/'): Your dashboard for quick access to all learning areas (Word Practice, AI Games, Math Zone).\n- Desktop/Tablet: Use the navigation links at the top.\n- Mobile: A bottom navigation bar and a Quick Link FAB (Floating Action Button) provide fast access.\n- Quick Learn Button: Takes you directly to the 'Learn New Words' section within 'Word Practice'.",
    ariaLabel: "How to navigate the application on different devices.",
    targetElementSelector: '[data-tour-id="main-navigation"]', // Assuming main-nav has this
  },
];

export const walkthroughModalSteps: TutorialStep[] = [
 { id: 'intro-modal', title: (username) => username ? `Hi ${username}, Welcome!` : 'Welcome to ChillLearn!', content: "Let's quickly see where everything is. This tour will highlight key sections.", ariaLabel: 'Modal: Introduction', targetElementSelector: 'body' },
  { id: 'home-modal', title: () => "Homepage", content: "This is your main dashboard. From here, you can jump to any learning activity zone like Word Practice, AI Games, or the Math Zone.", ariaLabel: 'Modal: Homepage', targetElementSelector: '[data-tour-id="main-content-area"]' },
  { id: 'word-practice-modal', title: () => "Word Practice Zone", content: "Go to 'Word Practice' (from the top or bottom nav) to learn new words, practice spelling, identify words, and read stories. Remember to visit 'Learn New Words' within this zone first to build your practice list!", ariaLabel: 'Modal: Word Practice Zone', targetElementSelector: '[href="/word-practice"]' },
  { id: 'ai-math-modal', title: () => "AI Games & Math Zone", content: "Explore 'AI Games' for fun vocabulary challenges and the 'Math Zone' for various numerical activities. These use words from your practice list where applicable.", ariaLabel: 'Modal: AI Games and Math Zone', targetElementSelector: '[href="/ai-games"]' }, 
  { id: 'profile-settings-modal', title: () => "Profile & Settings", content: "Check your 'Profile' to see progress and update your name/topics. In 'Settings', you can change the app's look and sound.", ariaLabel: 'Modal: Profile and Settings', targetElementSelector: '[href="/profile"]'},
  { id: 'finish-modal', title: () => "You're Ready!", content: "That's the basics! Explore and have fun learning. You can find this full guide on the 'Guide' page if you need a refresher.", ariaLabel: 'Modal: End of tour', targetElementSelector: 'body' }
];
