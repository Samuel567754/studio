
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Volume2, Play, Pause, CheckCircle, X, Smile, Compass, HomeIcon, FileType2 as TextSelectIcon, Puzzle, User, CheckCircle2 as CheckCircle2Icon } from 'lucide-react'; 
import { speakText } from '@/lib/audio';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useToast } from '@/hooks/use-toast';
import { playNotificationSound, playErrorSound } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { walkthroughModalSteps, type TutorialStep } from '@/components/tutorial/tutorial-data'; 

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

const getWalkthroughIconComponent = (iconName?: string): React.ElementType => {
  if (!iconName) return Compass; // Default fallback
  const icons: { [key: string]: React.ElementType } = {
    Smile: Smile,
    HomeIcon: HomeIcon,
    FileType2: TextSelectIcon, // Maps "FileType2" string to TextSelectIcon component
    Puzzle: Puzzle,
    User: User,
    CheckCircle2: CheckCircle2Icon, // Maps "CheckCircle2" string to CheckCircle2Icon component
    Compass: Compass,
    // Add any other icons used by name in walkthroughModalSteps here
  };
  return icons[iconName] || Compass; // Fallback to Compass if name not found
};


export const WalkthroughModal: FC<WalkthroughModalProps> = ({ isOpen, onClose, onFinish }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSpeakingStepId, setActiveSpeakingStepId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [currentSpeechUtterance, setCurrentSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [hasFirstStepAudioPlayed, setHasFirstStepAudioPlayed] = useState<boolean>(false);
  
  const { soundEffectsEnabled } = useAppSettingsStore();
  const { username } = useUserProfileStore();
  const { toast } = useToast();

  const currentStepData = walkthroughModalSteps[currentStepIndex];
  const currentTitle = currentStepData ? currentStepData.title(username) : "Walkthrough";


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

  const playStepAudio = useCallback((stepId: string, title: string, content: string) => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    stopCurrentSpeech(); 
    const fullTextToSpeak = `${title}. ${content}`;
    const utterance = speakText(fullTextToSpeak, undefined, handleSpeechEnd, handleSpeechError);
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
    const stepTitle = currentStepData.title(username); 
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
      playStepAudio(currentStepData.id, stepTitle, currentStepData.content);
    }
    playNotificationSound();
  }, [currentStepData, currentSpeechUtterance, activeSpeakingStepId, isAudioPlaying, isAudioPaused, playStepAudio, username]);


  const handleNextStep = () => {
    playNotificationSound();
    stopCurrentSpeech();
    if (currentStepIndex < walkthroughModalSteps.length - 1) {
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
    if (isOpen && currentStepIndex === 0 && soundEffectsEnabled && !isAudioPlaying && !currentSpeechUtterance && !hasFirstStepAudioPlayed && walkthroughModalSteps[0]) {
       setTimeout(() => {
           const firstStep = walkthroughModalSteps[0];
           playStepAudio(firstStep.id, firstStep.title(username), firstStep.content);
           setHasFirstStepAudioPlayed(true); 
       }, 300); 
    }
  }, [isOpen, currentStepIndex, soundEffectsEnabled, isAudioPlaying, currentSpeechUtterance, playStepAudio, hasFirstStepAudioPlayed, username]);

  useEffect(() => {
    return () => {
      stopCurrentSpeech();
    };
  }, [stopCurrentSpeech]);
  
  useEffect(() => {
    if (isOpen) {
        setCurrentStepIndex(0);
        setHasFirstStepAudioPlayed(false); 
    } else {
        stopCurrentSpeech();
    }
  }, [isOpen, stopCurrentSpeech]);


  if (!isOpen || !currentStepData) {
    return null;
  }
  
  const progressPercentage = ((currentStepIndex + 1) / walkthroughModalSteps.length) * 100;
  const IconComponent = getWalkthroughIconComponent(typeof currentStepData.icon === 'string' ? currentStepData.icon : undefined);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { stopCurrentSpeech(); onClose(); } }}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-2 border-b flex flex-row justify-between items-center">
          <DialogTitle id="walkthrough-title" className="text-xl font-semibold text-primary flex items-center gap-2">
             <IconComponent className="h-6 w-6 text-accent" />
             {currentTitle}
          </DialogTitle>
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
            {currentStepIndex < walkthroughModalSteps.length - 1 ? (
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
      </DialogContent>
    </Dialog>
  );
};
