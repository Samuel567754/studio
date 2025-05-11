
"use client";

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Play, Pause, StopCircle, HelpCircle, XCircle, CheckCircle2, Compass, Puzzle, BookOpenCheck, Lightbulb, Edit3, Target, BookMarked, Sigma, User, SettingsIcon, HomeIcon, Map } from 'lucide-react'; // Updated icon
import { speakText } from '@/lib/audio';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { playErrorSound, playNotificationSound } from '@/lib/audio';
import { useWalkthroughStore } from '@/stores/walkthrough-store';
import { tutorialStepsData, type TutorialStep } from '@/components/tutorial/tutorial-data'; // Import tutorial data
import { useUserProfileStore } from '@/stores/user-profile-store'; // Import user profile store

// Helper to map string icon names from data to actual Lucide components
const getIconComponent = (iconName?: string): React.ElementType | undefined => {
  if (!iconName) return undefined;
  const icons: { [key: string]: React.ElementType } = {
    Puzzle, BookOpenCheck, Lightbulb, Edit3, Target, BookMarked, Sigma, User, SettingsIcon, HomeIcon, HelpCircle, Map, Compass
  };
  return icons[iconName] || HelpCircle; // Default to HelpCircle if not found
};


export default function TutorialPage() {
  const [activeSpeakingSectionId, setActiveSpeakingSectionId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [currentSpeechUtterance, setCurrentSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { soundEffectsEnabled } = useAppSettingsStore();
  const { openWalkthrough } = useWalkthroughStore();
  const { toast } = useToast();
  const { username } = useUserProfileStore(); // Get username

  useEffect(() => {
    setIsMounted(true);
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
    handleSpeechEnd(); 
  }, [toast, handleSpeechEnd]);

  const playSectionAudio = useCallback((sectionId: string, title: string, content: string) => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        variant: "info",
        title: <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />Audio Disabled</div>,
        description: "Sound effects or speech synthesis is not available or disabled in settings.",
      });
      return;
    }

    window.speechSynthesis.cancel(); 

    const utterance = speakText(`${title}. ${content}`, undefined, handleSpeechEnd, handleSpeechError);
    if (utterance) {
      setCurrentSpeechUtterance(utterance);
      setActiveSpeakingSectionId(sectionId);
      setIsAudioPlaying(true);
      setIsAudioPaused(false);
    } else {
      handleSpeechEnd();
    }
  }, [soundEffectsEnabled, handleSpeechEnd, handleSpeechError, toast]);

  const handleToggleSpeech = useCallback((sectionId: string, title: string, content: string) => {
    if (currentSpeechUtterance && activeSpeakingSectionId === sectionId) {
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
      playSectionAudio(sectionId, title, content);
    }
  }, [currentSpeechUtterance, activeSpeakingSectionId, isAudioPlaying, isAudioPaused, playSectionAudio]);

  const handleStopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    handleSpeechEnd(); // Ensure state is reset
  }, [handleSpeechEnd]);

  const handleLaunchWalkthrough = () => {
    playNotificationSound();
    openWalkthrough();
  }

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
      <header className="text-center space-y-4 mb-10 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
           <Image 
            src="https://plus.unsplash.com/premium_photo-1722156533662-f58d3e13c07c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjV8fGFwcCUyMHdhbGslMjB0aHJvdWdofGVufDB8fDB8fHww"
            alt="Abstract representation of a guided app walkthrough or tutorial"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="app walkthrough guide" 
          />
          <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent flex flex-col items-center justify-center p-4">
             <Map className="h-16 w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
             <h1 className="text-4xl font-bold text-gradient-primary-accent mt-3 drop-shadow-md">App Tutorial & Guide</h1>
             <p className="text-lg text-gray-100 drop-shadow-sm mt-1">Learn how to use ChillLearn AI effectively.</p>
          </div>
        </div>
      </header>

      <Button onClick={handleLaunchWalkthrough} className="w-full btn-glow mb-8" size="lg" aria-label="Launch interactive app walkthrough">
        <Compass className="mr-2 h-5 w-5" /> Launch Interactive Walkthrough
      </Button>

      {currentSpeechUtterance && (isAudioPlaying || isAudioPaused) && (
        <Card className="mb-6 sticky top-20 z-30 shadow-xl border-accent bg-card animate-in fade-in-0 zoom-in-95 duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-accent">
              Reading: {tutorialStepsData.find(s => s.id === activeSpeakingSectionId)?.title(username) || "Tutorial Section"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button 
              onClick={() => {
                const currentSection = tutorialStepsData.find(s => s.id === activeSpeakingSectionId);
                if (currentSection) {
                  handleToggleSpeech(currentSection.id, currentSection.title(username), currentSection.content)
                }
              }} 
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

      {tutorialStepsData.map((section, index) => {
        const IconComponent = getIconComponent(section.icon as unknown as string);
        const sectionTitle = section.title(username);
        return (
          <Card 
            key={section.id} 
            className="shadow-lg border-border/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out"
            style={{ animationDelay: `${100 + index * 100}ms` }}
            aria-labelledby={`section-title-${section.id}`}
          >
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <CardTitle id={`section-title-${section.id}`} className="text-2xl font-semibold text-primary flex items-center gap-2">
                  {IconComponent && <IconComponent className="h-6 w-6 text-primary/80" />}
                  {sectionTitle}
                </CardTitle>
                {soundEffectsEnabled && (
                  <Button
                    onClick={() => handleToggleSpeech(section.id, sectionTitle, section.content)}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "flex-shrink-0 rounded-full p-2 transition-colors",
                      activeSpeakingSectionId === section.id && isAudioPlaying && "text-accent animate-pulse",
                      activeSpeakingSectionId === section.id && isAudioPaused && "text-muted-foreground"
                    )}
                    aria-label={
                      activeSpeakingSectionId === section.id 
                        ? (isAudioPaused ? `Resume reading ${sectionTitle}` : `Pause reading ${sectionTitle}`) 
                        : `Read ${sectionTitle} section aloud`
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
        );
      })}
    </div>
  );
}




