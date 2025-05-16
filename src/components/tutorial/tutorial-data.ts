
import type { Puzzle, BookOpenCheck, TextSelect, Map, Sigma, User, SettingsIcon, HomeIcon, HelpCircle, Compass, FileType2 as TextSelectIconLucide, Star, CheckCircle2 } from 'lucide-react'; // Added Star, CheckCircle2

export interface TutorialStep {
  id: string;
  title: (username?: string | null) => string;
  content: string;
  ariaLabel: string;
  icon?: React.ElementType | string; 
  targetElementSelector?: string; 
  imageSrc?: string;
  imageAlt?: string;
  aiHint?: string;
  linkHref?: string;
  linkText?: string;
}

export const tutorialStepsData: TutorialStep[] = [
  {
    id: 'welcome',
    title: (username) => username ? `Welcome, ${username}!` : 'Welcome to ChillLearn!',
    content: "This guide will walk you through the main features of the ChillLearn application, helping you make the most of your learning experience. Let's get started! You can also launch an interactive walkthrough using the button above.",
    ariaLabel: 'Welcome section introduction',
    icon: "HelpCircle", 
    targetElementSelector: '#main-header', // Example, adjust if your header has a different ID or no ID
    imageSrc: "https://images.unsplash.com/photo-1662967221311-1153979919a6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTY0fHxsZWFybmluZyUyMGFwcHxlbnwwfHwwfHx8MA%3D%3D",
    imageAlt: "Children interacting with colorful learning tools",
    aiHint: "learning app children",
  },
  {
    id: 'word-practice-hub',
    title: () => "Word Practice Zone (Your Literacy Hub)",
    content: "The 'Word Practice' page is your central hub for all word-related activities.\n\nFrom here, you can access:\n- Learn New Words: Get AI suggestions, set your reading level, and build your crucial practice list.\n- Spelling Practice: Master words from your list with interactive exercises.\n- Identify Words: Test your recognition by choosing the correct word from options.\n- Reading Adventures: Read AI-generated stories featuring your practice words.",
    ariaLabel: "Explanation of the Word Practice Zone, linking to Learn, Spell, Identify, and Read sections.",
    icon: "FileType2", 
    targetElementSelector: '[href="/word-practice"]',
    imageSrc: "https://plus.unsplash.com/premium_photo-1683749808835-6f8f186a903e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fHdvcmQlMjBwcmFjdGljZXxlbnwwfHwwfHx8MA%3D%3D",
    imageAlt: "Colorful letters and learning tools for word practice",
    aiHint: "children letters learning",
    linkHref: "/word-practice",
    linkText: "Go to Word Practice Zone"
  },
  {
    id: 'ai-games',
    title: () => 'AI Word Games (Interactive Fun)',
    content: "Visit the 'AI Games' section for more engaging ways to practice your vocabulary.\n\n- Fill in the Blank: Read an AI-generated sentence and choose the correct word to complete it.\n- Word Definition Match: Test your understanding by matching words to their AI-generated definitions.",
    ariaLabel: "Overview of the AI Word Games section, featuring Fill in the Blank and Definition Match.",
    icon: "Puzzle", 
    targetElementSelector: '[href="/ai-games"]',
    imageSrc: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YWl8ZW58MHx8MHx8fDA%3D",
    imageAlt: "Abstract AI patterns representing word games",
    aiHint: "AI games abstract",
    linkHref: "/ai-games",
    linkText: "Play AI Word Games"
  },
  {
    id: 'math',
    title: () => 'Math Zone (Explore Numeracy)',
    content: "The 'Math Zone' is your hub for various math activities:\n\n- AI Word Problems & Story Problems: Solve math challenges created by AI.\n- Arithmetic Games: Tackle addition, subtraction, multiplication, and division.\n- Times Table Practice: Master your multiplication facts.\n- Number Comparison & Sequencing: Test your number sense.\nMany games feature audio read-aloud and voice input options!",
    ariaLabel: "Overview of the Math Zone and its various game sections.",
    icon: "Sigma",
    targetElementSelector: '[href="/math"]',
    imageSrc: "https://images.unsplash.com/photo-1718306201865-cae4a08311fe?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fGNoaWxkcmVuJTIwbWF0aGVtYXRpY3MlMjBiYWNrZ3JvdW5kfGVufDB8fDB8fHww",
    imageAlt: "Abstract math background with numbers and shapes",
    aiHint: "math background",
    linkHref: "/math",
    linkText: "Explore Math Zone"
  },
  {
    id: 'profile',
    title: () => 'Profile Page (Track Your Progress)',
    content: "Visit your 'Profile' page for a snapshot of your learning journey.\nHere you'll find:\n- Your name and favorite topics (editable!).\n- Statistics on practice words and mastered words.\n- Your current learning preferences and earned Golden Stars and Badges.",
    ariaLabel: "Overview of the Profile page.",
    icon: "User",
    targetElementSelector: '[href="/profile"]',
    imageSrc: "https://images.unsplash.com/photo-1731877818770-820faabe2d4c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTIyfHxhcHAlMjBiYWNrZ3JvdW5kc3xlbnwwfHwwfHx8MA%3D%3D",
    imageAlt: "User profile abstract background",
    aiHint: "abstract pattern profile",
    linkHref: "/profile",
    linkText: "View Your Profile"
  },
  {
    id: 'settings',
    title: () => 'Settings Page (Customize Your App)',
    content: "Tailor the ChillLearn app on the 'Settings' page.\nAdjust:\n- Theme: Light, dark, or system default.\n- Font: Family and size.\n- Audio: Sound effects, speech voice, rate, and pitch.",
    ariaLabel: "Details on the Settings page.",
    icon: "SettingsIcon",
    targetElementSelector: '[href="/settings"]',
    imageSrc: "https://images.unsplash.com/photo-1690743300330-d190ad8f97dc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTE1fHxhcHAlMjBiYWNrZ3JvdW5kc3xlbnwwfHwwfHx8MA%3D%3D",
    imageAlt: "Settings page abstract background",
    aiHint: "app background settings",
    linkHref: "/settings",
    linkText: "Go to Settings"
  },
  {
    id: 'navigation',
    title: () => 'Navigating the App',
    content: "Getting around is easy:\n- Main Homepage ('/'): Your dashboard for quick access to all learning areas (Word Practice, AI Games, Math Zone).\n- Desktop/Tablet: Use the navigation links at the top.\n- Mobile: A bottom navigation bar and a Quick Link FAB (Floating Action Button) provide fast access.\n- Quick Learn Button: Takes you directly to the 'Learn New Words' section within 'Word Practice'.",
    ariaLabel: "How to navigate the application on different devices.",
    icon: "Compass",
    targetElementSelector: '[data-tour-id="main-navigation"]', 
    imageSrc: "https://plus.unsplash.com/premium_photo-1722156533662-f58d3e13c07c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjV8fGFwcCUyMHdhbGslMjB0aHJvdWdofGVufDB8fDB8fHww",
    imageAlt: "Abstract representation of app navigation",
    aiHint: "app walkthrough guide",
    linkHref: "/",
    linkText: "Go to Homepage"
  },
  {
    id: 'golden-stars',
    title: () => 'Golden Stars & Rewards!',
    content: "As you play games and learn, you'll earn Golden Stars! Keep an eye on your star count (it floats on screen!).\nCheck your Profile page to see the cool Trophies & Badges you can unlock by collecting more stars. Have fun learning and earning!",
    ariaLabel: "Explanation of Golden Stars and achievements system.",
    icon: "Star", 
    targetElementSelector: '[data-tour-id="floating-golden-stars"]',
    imageSrc: "https://plus.unsplash.com/premium_photo-1729000546925-495988819fdd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGdvbGRlbiUyMHN0YXJzJTIwYW5kJTIwcmV3YXJkc3xlbnwwfHwwfHx8MA%3D%3D",
    imageAlt: "Golden stars and reward elements",
    aiHint: "golden stars rewards"
  },
  {
    id: 'final-welcome',
    title: (username) => `You're All Set, ${username || 'Learner'}!`,
    content: "You've now seen the main features of ChillLearn AI. We hope you have a fantastic time learning and exploring. Remember, you can always revisit this full guide from the 'Guide' page. Happy learning!",
    ariaLabel: "Final welcoming message for the tutorial.",
    icon: "CheckCircle2",
    targetElementSelector: 'body', 
    imageSrc: "https://plus.unsplash.com/premium_photo-1686865496874-88f234809983?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNvbmdyYXR1bGF0aW9uc3xlbnwwfHwwfHx8MA%3D%3D",
    imageAlt: "Celebratory image with confetti or abstract happy design",
    aiHint: "celebration congratulations"
  }
];

// walkthroughModalSteps can also be updated similarly if needed for consistency,
// but the primary request is for the main tutorial guide page.
export const walkthroughModalSteps: TutorialStep[] = [
 { 
    id: 'intro-modal', 
    title: (username) => username ? `Hi ${username}, Welcome!` : 'Welcome to ChillLearn!', 
    content: "Let's quickly see where everything is. This tour will highlight key sections.", 
    ariaLabel: 'Modal: Introduction', 
    icon: "Star", 
    targetElementSelector: 'body' 
  },
  { 
    id: 'home-modal', 
    title: () => "Homepage", 
    content: "This is your main dashboard. From here, you can jump to any learning activity zone like Word Practice, AI Games, or the Math Zone.", 
    ariaLabel: 'Modal: Homepage', 
    icon: "HomeIcon", 
    targetElementSelector: '[data-tour-id="main-content-area"]' 
  },
  { 
    id: 'word-practice-modal', 
    title: () => "Word Practice Zone", 
    content: "Go to 'Word Practice' (from the top or bottom nav) to learn new words, practice spelling, identify words, and read stories. Remember to visit 'Learn New Words' within this zone first to build your practice list!", 
    ariaLabel: 'Modal: Word Practice Zone', 
    icon: "FileType2", 
    targetElementSelector: '[href="/word-practice"]' 
  },
  { 
    id: 'ai-games-modal', 
    title: () => "AI Word Games", 
    content: "Explore 'AI Games' for fun vocabulary challenges like Fill-in-the-Blank and Definition Match.", 
    ariaLabel: 'Modal: AI Word Games', 
    icon: "Puzzle", 
    targetElementSelector: '[href="/ai-games"]' 
  },
  { 
    id: 'math-zone-modal', 
    title: () => "Math Zone", 
    content: "Visit the 'Math Zone' for number games, AI problem solving, and arithmetic practice.", 
    ariaLabel: 'Modal: Math Zone', 
    icon: "Sigma", 
    targetElementSelector: '[href="/math"]' 
  }, 
  { 
    id: 'golden-stars-modal',
    title: () => 'Golden Stars!',
    content: "As you play, you'll earn Golden Stars! Watch your total grow (it floats on screen!). Check your Profile for cool Trophies & Badges.",
    ariaLabel: "Modal: Explanation of Golden Stars.",
    icon: "Star",
    targetElementSelector: '[data-tour-id="floating-golden-stars"]'
  },
  { 
    id: 'profile-settings-modal', 
    title: () => "Profile & Settings", 
    content: "Check your 'Profile' to see progress and update your name/topics. In 'Settings', you can change the app's look and sound.", 
    ariaLabel: 'Modal: Profile and Settings', 
    icon: "User",
    targetElementSelector: '[href="/profile"]'
  },
  { 
    id: 'finish-modal', 
    title: (username) => username ? `You're Ready, ${username}!` : "You're Ready!", 
    content: "That's the basics! Explore and have fun learning. You can find this full guide on the 'Guide' page if you need a refresher.", 
    ariaLabel: 'Modal: End of tour', 
    icon: "CheckCircle2", 
    targetElementSelector: 'body' 
  }
];


    