
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Volume2, Play, Pause, StopCircle, X, CheckCircle } from 'lucide-react';
import { speakText } from '@/lib/audio';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useToast } from '@/hooks/use-toast';
import { playNotificationSound, playErrorSound } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface WalkthroughStep {
  id: string;
  title: string;
  content: string;
  ariaLabel: string;
}

const walkthroughSteps: WalkthroughStep[] = [
  { id: 'intro', title: 'Welcome to ChillLearn!', content: "Let's take a quick tour of the app. You can use the audio button to have these steps read aloud.", ariaLabel: 'Introduction to the app walkthrough.' },
  { id: 'learn', title: '1. Learn Words', content: "Start on the 'Learn' page. Set your reading level and word length, then get AI-suggested words. Click words to add them to your practice list.", ariaLabel: 'Guide for the Learn Words page.' },
  { id: 'spell', title: '2. Spell Practice', content: "Go to 'Spell' to practice words from your list. Correct spellings mark words as mastered!", ariaLabel: 'Guide for the Spell Practice page.' },
  { id: 'identify', title: '3. Identify Words', content: "Play the 'Identify' game! Listen to a word and pick the correct option from the choices.", ariaLabel: 'Guide for the Identify Word game page.' },
  { id: 'read', title: '4. Read Passages', content: "On the 'Read' page, generate AI stories using your practice words. Read them yourself or listen along.", ariaLabel: 'Guide for the Read Passages page.' },
  { id: 'math', title: '5. Math Zone', content: "Explore the 'Math Zone' for fun arithmetic games, times table practice, number comparison, and sequencing challenges.", ariaLabel: 'Guide for the Math Zone page.' },
  { id: 'profile', title: '6. Your Profile', content: "Check your 'Profile' to see your learning progress, mastered words, and current preferences.", ariaLabel: 'Guide for the Profile page.' },
  { id: 'settings', title: '7. Customize Settings', content: "Visit 'Settings' to change themes, fonts, and audio/speech preferences.", ariaLabel: 'Guide for the Settings page.' },
  { id: 'navigation', title: '8. Navigation', content: "Use the top (desktop) or bottom (mobile) navigation bars. The floating button on mobile also provides quick links!", ariaLabel: 'Guide for navigating the app.' },
  { id: 'finish', title: "You're All Set!", content: "Enjoy learning with ChillLearn AI! You can revisit the full tutorial from the 'Guide' page anytime.", ariaLabel: 'End of the walkthrough.' }
];

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

export const WalkthroughModal: FC<WalkthroughModalProps> = ({ isOpen, onClose, onFinish }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSpeakingStepId, setActiveSpeakingStepId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [currentSpeechUtterance, setCurrentSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  
  const { soundEffectsEnabled } = useAppSettingsStore();
  const { toast } = useToast();

  const currentStepData = walkthroughSteps[currentStepIndex];

  const handleSpeechEnd = useCallback(() => {
    setActiveSpeakingStepId(null);
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
    setCurrentSpeechUtterance(null);
  }, []);

  const handleSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error("Walkthrough speech error:", event.error);
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><X className="h-5 w-5" />Audio Error</div>,
        description: `Could not play audio for this step: ${event.error}.`,
      });
      playErrorSound();
    }
    handleSpeechEnd();
  }, [toast, handleSpeechEnd]);

  const stopCurrentSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    handleSpeechEnd();
  }, [handleSpeechEnd]);

  const playStepAudio = useCallback((stepId: string, content: string) => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    stopCurrentSpeech(); // Stop any previous speech

    const utterance = speakText(content, undefined, handleSpeechEnd, handleSpeechError);
    if (utterance) {
      setCurrentSpeechUtterance(utterance);
      setActiveSpeakingStepId(stepId);
      setIsAudioPlaying(true);
      setIsAudioPaused(false);
    } else {
      handleSpeechEnd();
    }
  }, [soundEffectsEnabled, stopCurrentSpeech, handleSpeechEnd, handleSpeechError]);

  const handleToggleSpeech = useCallback(() => {
    if (!currentStepData) return;
    if (currentSpeechUtterance && activeSpeakingStepId === currentStepData.id) {
      if (isAudioPlaying && !isAudioPaused) {
        window.speechSynthesis.pause();
        setIsAudioPaused(true);
        setIsAudioPlaying(false);
      } else if (isAudioPaused) {
        window.speechSynthesis.resume();
        setIsAudioPaused(false);
        setIsAudioPlaying(true);
      }
    } else {
      playStepAudio(currentStepData.id, currentStepData.content);
    }
    playNotificationSound();
  }, [currentStepData, currentSpeechUtterance, activeSpeakingStepId, isAudioPlaying, isAudioPaused, playStepAudio]);


  const handleNextStep = () => {
    playNotificationSound();
    stopCurrentSpeech();
    if (currentStepIndex < walkthroughSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePreviousStep = () => {
    playNotificationSound();
    stopCurrentSpeech();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    playNotificationSound();
    stopCurrentSpeech();
    onFinish(); 
  };
  
  const handleFinish = () => {
    playNotificationSound();
    stopCurrentSpeech();
    onFinish();
  };

  useEffect(() => {
    // Automatically read the first step when modal opens, if enabled
    if (isOpen && currentStepIndex === 0 && soundEffectsEnabled && !isAudioPlaying && !currentSpeechUtterance) {
       setTimeout(() => playStepAudio(walkthroughSteps[0].id, walkthroughSteps[0].content), 300); // Small delay
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, soundEffectsEnabled]);

  // Cleanup speech on unmount or when modal is closed externally
  useEffect(() => {
    return () => {
      stopCurrentSpeech();
    };
  }, [stopCurrentSpeech]);

  if (!isOpen || !currentStepData) {
    return null;
  }
  
  const progressPercentage = ((currentStepIndex + 1) / walkthroughSteps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { stopCurrentSpeech(); onClose(); } }}>
      <DialogContent className="sm:max-w-md p-0" aria-labelledby="walkthrough-title" aria-describedby="walkthrough-description">
        <DialogHeader className="p-6 pb-2 border-b flex flex-row justify-between items-center">
          <DialogTitle id="walkthrough-title" className="text-xl font-semibold text-primary">{currentStepData.title}</DialogTitle>
          {soundEffectsEnabled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSpeech}
              className={cn(activeSpeakingStepId === currentStepData.id && isAudioPlaying && "text-accent animate-pulse")}
              aria-label={activeSpeakingStepId === currentStepData.id && isAudioPlaying && !isAudioPaused ? "Pause audio" : "Play audio for this step"}
            >
              {activeSpeakingStepId === currentStepData.id && isAudioPlaying && !isAudioPaused ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          )}
        </DialogHeader>
        
        <Progress value={progressPercentage} className="w-full h-1.5 rounded-none bg-muted" indicatorClassName="bg-primary transition-all duration-300 ease-linear" />

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <DialogDescription id="walkthrough-description" className="text-base text-foreground/80 whitespace-pre-line leading-relaxed" aria-label={currentStepData.ariaLabel}>
            {currentStepData.content}
          </DialogDescription>
        </div>

        <DialogFooter className="p-4 border-t flex flex-col sm:flex-row justify-between gap-2">
          <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto">
            Skip Tutorial
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handlePreviousStep}
              disabled={currentStepIndex === 0}
              className="flex-1 sm:flex-initial"
              aria-label="Previous step"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {currentStepIndex < walkthroughSteps.length - 1 ? (
              <Button onClick={handleNextStep} className="flex-1 sm:flex-initial btn-glow" aria-label="Next step">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white btn-glow" aria-label="Finish tutorial">
                <CheckCircle className="mr-2 h-4 w-4" /> Finish
              </Button>
            )}
          </div>
        </DialogFooter>
         <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground md:hidden">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
