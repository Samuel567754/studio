"use client";

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Play, Pause, StopCircle, HelpCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { speakText } from '@/lib/audio';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { playErrorSound, playNotificationSound } from '@/lib/audio';

interface TutorialSection {
  id: string;
  title: string;
  content: string;
  ariaLabel: string;
}

const tutorialSections: TutorialSection[] = [
  {
    id: 'welcome',
    title: 'Welcome to SightWords AI!',
    content: "This guide will walk you through the main features of the SightWords AI application, helping you make the most of your learning experience. Let's get started!",
    ariaLabel: 'Welcome section introduction'
  },
  {
    id: 'learn',
    title: 'Learn Words Page (Your Starting Point)',
    content: "The 'Learn' page is where your literacy journey begins.\n\n1. AI Word Suggestions: Set your desired reading level (e.g., beginner, intermediate) and preferred word length.\n2. Get Ideas: Click 'Get New Word Ideas', and our AI will suggest words tailored to your settings.\n3. Build Your List: See a word you like? Click on it! It'll be added to 'Your Practice Word List' below.\nThis list is crucial as it populates words for your spelling and reading practices.",
    ariaLabel: "Explanation of the Learn Words page features including AI suggestions and practice list."
  },
  {
    id: 'spell',
    title: 'Spell Practice Page (Sharpen Your Skills)',
    content: "Navigate to the 'Spell' page to practice spelling words from your list.\n\n1. Current Word: The word you need to spell is displayed prominently.\n2. Your Turn: Type your spelling attempt into the input field.\n3. Check It: Click 'Check Spelling'. If you're correct, the word is marked as 'mastered', and you'll automatically move to the next word in your list. If not, you'll get a hint to try again!",
    ariaLabel: "Guide to the Spell Practice page, how to input spellings and what happens on correct or incorrect attempts."
  },
  {
    id: 'read',
    title: 'Read Passages Page (Reading in Context)',
    content: "The 'Read' page brings your learned words to life!\n\n1. Generate Story: Click 'Generate New Passage'. The AI will create a short story using words from your practice list and suited to your reading level.\n2. Read or Listen: You can read the passage yourself or click 'Read Aloud' to hear it narrated. Words from your practice list and the currently spoken word will be highlighted.",
    ariaLabel: "Instructions for the Read Passages page, covering passage generation and read aloud features."
  },
  {
    id: 'profile',
    title: 'Profile Page (Track Your Progress)',
    content: "Visit your 'Profile' page for a snapshot of your learning journey.\nHere you'll find:\n- Number of words in your practice list.\n- Count of words you've successfully mastered.\n- Your currently set reading level and word length preferences for suggestions.",
    ariaLabel: "Overview of the Profile page and the learning statistics it displays."
  },
  {
    id: 'settings',
    title: 'Settings Page (Customize Your App)',
    content: "Tailor the SightWords AI app to your liking on the 'Settings' page.\nYou can adjust:\n- Theme: Choose between light, dark, or system default.\n- Font: Select your preferred font family and size.\n- Audio: Enable or disable sound effects, and fine-tune speech settings like voice, rate, and pitch for the read-aloud features.",
    ariaLabel: "Details on the Settings page for customizing appearance and audio preferences."
  },
  {
    id: 'navigation',
    title: 'Navigating the App',
    content: "Getting around is easy:\n- Desktop/Tablet: Use the navigation links at the top of the page.\n- Mobile: A handy bottom navigation bar provides quick access to all sections.\n- Quick Learn: The 'Quick Learn' button (often in the main navigation) takes you directly to the word learning page to jump back into practice.",
    ariaLabel: "How to navigate the application on different devices using the navigation bars."
  },
];

export default function TutorialPage() {
  const [activeSpeakingSectionId, setActiveSpeakingSectionId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [currentSpeechUtterance, setCurrentSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { soundEffectsEnabled } = useAppSettingsStore();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    // Cleanup speech synthesis on component unmount
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setActiveSpeakingSectionId(null);
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
    setCurrentSpeechUtterance(null);
  }, []);

  const handleSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error("Tutorial speech error:", event.error, event.utterance?.text.substring(event.charIndex));
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Audio Error</div>,
        description: `Could not play audio for the tutorial: ${event.error}.`,
      });
      playErrorSound();
    }
    handleSpeechEnd(); // Ensure state is reset
  }, [toast, handleSpeechEnd]);

  const playSectionAudio = useCallback((sectionId: string, content: string) => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        variant: "info",
        title: <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />Audio Disabled</div>,
        description: "Sound effects or speech synthesis is not available or disabled in settings.",
      });
      return;
    }

    window.speechSynthesis.cancel(); // Stop any current speech

    const utterance = speakText(content, undefined, handleSpeechEnd, handleSpeechError);
    if (utterance) {
      setCurrentSpeechUtterance(utterance);
      setActiveSpeakingSectionId(sectionId);
      setIsAudioPlaying(true);
      setIsAudioPaused(false);
    } else {
      handleSpeechEnd(); // Reset if speech didn't start
    }
  }, [soundEffectsEnabled, handleSpeechEnd, handleSpeechError, toast]);

  const handleToggleSpeech = useCallback((sectionId: string, content: string) => {
    if (currentSpeechUtterance && activeSpeakingSectionId === sectionId) {
      // Current section is active, toggle play/pause
      if (isAudioPlaying && !isAudioPaused) {
        window.speechSynthesis.pause();
        setIsAudioPaused(true);
        setIsAudioPlaying(false);
        playNotificationSound();
      } else if (isAudioPaused) {
        window.speechSynthesis.resume();
        setIsAudioPaused(false);
        setIsAudioPlaying(true);
        playNotificationSound();
      }
    } else {
      // Different section or no active speech, play new section
      playSectionAudio(sectionId, content);
    }
  }, [currentSpeechUtterance, activeSpeakingSectionId, isAudioPlaying, isAudioPaused, playSectionAudio]);

  const handleStopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // onEnd/onError will be called by cancel, which resets state via handleSpeechEnd
  }, []);


  if (!isMounted) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-7 w-3/4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted rounded mb-2"></div>
              <div className="h-4 w-5/6 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
        <p className="sr-only">Loading tutorial page...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="text-center space-y-2 mb-10 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <HelpCircle className="h-16 w-16 mx-auto text-primary animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
        <h1 className="text-4xl font-bold text-gradient-primary-accent">App Tutorial & Guide</h1>
        <p className="text-lg text-muted-foreground">Learn how to use SightWords AI effectively.</p>
      </header>

      {currentSpeechUtterance && (isAudioPlaying || isAudioPaused) && (
        <Card className="mb-6 sticky top-20 z-30 shadow-xl border-accent bg-card animate-in fade-in-0 zoom-in-95 duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-accent">
              Reading: {tutorialSections.find(s => s.id === activeSpeakingSectionId)?.title || "Tutorial Section"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button 
              onClick={() => handleToggleSpeech(activeSpeakingSectionId!, tutorialSections.find(s => s.id === activeSpeakingSectionId)!.content)} 
              variant="outline"
              size="sm"
              aria-label={isAudioPaused ? "Resume reading" : "Pause reading"}
            >
              {isAudioPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
              {isAudioPaused ? "Resume" : "Pause"}
            </Button>
            <Button onClick={handleStopSpeech} variant="destructive" size="sm" aria-label="Stop reading">
              <StopCircle className="mr-2 h-4 w-4" /> Stop
            </Button>
          </CardContent>
        </Card>
      )}

      {tutorialSections.map((section, index) => (
        <Card 
          key={section.id} 
          className="shadow-lg border-border/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out"
          style={{ animationDelay: `${100 + index * 100}ms` }}
          aria-labelledby={`section-title-${section.id}`}
        >
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle id={`section-title-${section.id}`} className="text-2xl font-semibold text-primary flex-grow">
                {section.title}
              </CardTitle>
              {soundEffectsEnabled && (
                <Button
                  onClick={() => handleToggleSpeech(section.id, section.content)}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "flex-shrink-0 rounded-full p-2 transition-colors",
                    activeSpeakingSectionId === section.id && isAudioPlaying && "text-accent animate-pulse",
                    activeSpeakingSectionId === section.id && isAudioPaused && "text-muted-foreground"
                  )}
                  aria-label={
                    activeSpeakingSectionId === section.id 
                      ? (isAudioPaused ? `Resume reading ${section.title}` : `Pause reading ${section.title}`) 
                      : `Read ${section.title} section aloud`
                  }
                  aria-pressed={activeSpeakingSectionId === section.id && isAudioPlaying}
                >
                  {activeSpeakingSectionId === section.id && isAudioPlaying && !isAudioPaused ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-foreground/90 dark:text-foreground/80 whitespace-pre-line leading-relaxed" aria-label={section.ariaLabel}>
              {section.content}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}