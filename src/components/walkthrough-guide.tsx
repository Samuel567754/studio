
"use client";

import type { FC } from 'react';
import { useEffect, useCallback, useState, useRef } from 'react';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Volume2, Play, Pause, X, HelpCircle, Compass, HomeIcon, FileType2 as TextSelectIcon, Puzzle, User, SettingsIcon, Map, Sigma, Edit3, BookMarked, Lightbulb, BookOpenCheck, CheckCircle2, Target } from 'lucide-react';
import { speakText, playNotificationSound, playErrorSound } from '@/lib/audio';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useWalkthroughStore } from '@/stores/walkthrough-store';
import type { TutorialStep } from '@/components/tutorial/tutorial-data';
import { useUserProfileStore } from '@/stores/user-profile-store';
import Image from 'next/image';

interface WalkthroughGuideProps {
  steps: TutorialStep[];
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

const getWalkthroughIconComponent = (iconName?: string): React.ElementType => {
  if (!iconName) return Compass;
  const icons: { [key: string]: React.ElementType } = {
    Puzzle, BookOpenCheck, Lightbulb, Edit3, Target, BookMarked, Sigma, User, SettingsIcon, HomeIcon, HelpCircle, Map, Compass, FileType2: TextSelectIcon, CheckCircle2, Smile: HelpCircle // Defaulting Smile to HelpCircle as Smile icon might not be consistently available
  };
  return icons[iconName] || Compass;
};

export const WalkthroughGuide: FC<WalkthroughGuideProps> = ({ steps, isOpen, onClose, onFinish }) => {
  const { currentStepIndex, setCurrentStepIndex, nextStep, prevStep } = useWalkthroughStore();
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const { soundEffectsEnabled } = useAppSettingsStore();
  const { username } = useUserProfileStore();
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const currentStepData = steps[currentStepIndex];

  const updateHighlightedElement = useCallback(() => {
    if (highlightedElement) {
      highlightedElement.classList.remove('walkthrough-highlight-target');
      setHighlightedElement(null);
      setPopoverPosition(null);
    }
    if (isOpen && currentStepData?.targetElementSelector) {
      try {
        const element = document.querySelector(currentStepData.targetElementSelector) as HTMLElement;
        if (element) {
          element.classList.add('walkthrough-highlight-target');
          setHighlightedElement(element);
          const rect = element.getBoundingClientRect();
          setPopoverPosition({
            top: rect.bottom + window.scrollY + 10, // Position below the element
            left: rect.left + window.scrollX + rect.width / 2, // Center horizontally
            width: rect.width,
            height: rect.height,
          });
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } else {
          console.warn(`Walkthrough target element not found: ${currentStepData.targetElementSelector}`);
          setPopoverPosition(null); // Fallback to center if element not found
        }
      } catch (e) {
        console.error("Error selecting walkthrough target:", e);
        setPopoverPosition(null);
      }
    } else if (isOpen) {
        // If no target selector, center the popover (or place it at bottom of screen)
        setPopoverPosition({
            top: window.innerHeight * 0.75 + window.scrollY, // Default to bottom-ish of viewport
            left: window.innerWidth / 2,
            width: 0,
            height: 0,
        });
    }
  }, [isOpen, currentStepData, highlightedElement]);

  useEffect(() => {
    updateHighlightedElement();
    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('walkthrough-highlight-target');
      }
    };
  }, [currentStepIndex, isOpen, updateHighlightedElement]);


  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null);
  }, []);

  const handleSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><X className="h-5 w-5" />Audio Error</div>,
        description: `Could not play audio: ${event.error}.`,
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

  const playStepAudio = useCallback(() => {
    if (!currentStepData || !soundEffectsEnabled) return;
    const title = currentStepData.title(username);
    const content = currentStepData.content;
    stopCurrentSpeech();
    const utterance = speakText(`${title}. ${content}`, undefined, handleSpeechEnd, handleSpeechError);
    if (utterance) {
      setCurrentUtterance(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
    } else {
      handleSpeechEnd();
    }
  }, [currentStepData, soundEffectsEnabled, username, stopCurrentSpeech, handleSpeechEnd, handleSpeechError]);

  useEffect(() => {
    if (isOpen && currentStepData) {
      playStepAudio();
    } else {
      stopCurrentSpeech();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStepIndex]); // Rerun when step changes or guide opens/closes


  const handleNext = () => {
    stopCurrentSpeech();
    playNotificationSound();
    if (currentStepIndex < steps.length - 1) {
      nextStep();
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    stopCurrentSpeech();
    playNotificationSound();
    prevStep();
  };

  const handleSkip = () => {
    stopCurrentSpeech();
    playNotificationSound();
    onClose();
  };

  const toggleSpeechPlayback = () => {
    if (!currentStepData) return;
    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      playStepAudio();
    }
    playNotificationSound();
  };


  if (!isOpen || !currentStepData) {
    return null;
  }

  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;
  const IconComponent = getWalkthroughIconComponent(currentStepData.icon as string);

  const popoverStyle: React.CSSProperties = popoverPosition
  ? {
      position: 'fixed',
      top: `${popoverPosition.top}px`,
      left: `${popoverPosition.left}px`,
      transform: 'translateX(-50%)', // Center the popover horizontally
      zIndex: 10000,
      maxWidth: 'calc(100vw - 32px)', // Ensure it fits on screen
      width: '350px', // Default width
    }
  : { // Fallback if position can't be determined (e.g. centered on screen)
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10000,
      maxWidth: 'calc(100vw - 32px)',
      width: '350px',
    };


  return (
    <>
      <div className="walkthrough-overlay" onClick={onClose} />
      <div style={popoverStyle}>
        <Popover open={true}> {/* Controlled by parent isOpen */}
          <PopoverContent
            className="walkthrough-step-card w-full shadow-2xl border-accent bg-card p-0"
            side="top"
            align="center"
            avoidCollisions={true}
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                {IconComponent && <IconComponent className="h-5 w-5 text-accent" />}
                {currentStepData.title(username)}
              </h3>
            </div>

            <Progress value={progressPercentage} className="w-full h-1 rounded-none bg-muted" indicatorClassName="bg-primary transition-all duration-300 ease-linear" />
            
            <div className="p-4 max-h-[40vh] overflow-y-auto text-sm text-foreground/80">
              {currentStepData.imageSrc && (
                <div className="relative w-full h-32 rounded-md overflow-hidden mb-3 shadow-sm">
                  <Image src={currentStepData.imageSrc} alt={currentStepData.imageAlt || "Walkthrough step image"} layout="fill" objectFit="cover" data-ai-hint={currentStepData.aiHint || "guide"} />
                </div>
              )}
              {currentStepData.content}
            </div>

            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                {soundEffectsEnabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSpeechPlayback}
                    className={cn(isSpeaking && !isPaused && "text-accent animate-pulse")}
                    aria-label={isSpeaking && !isPaused ? "Pause audio" : "Play audio"}
                  >
                    {isSpeaking && !isPaused ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                )}
                 <span className="text-xs text-muted-foreground">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="flex-1 sm:flex-initial"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Prev</span>
                </Button>
                {currentStepIndex < steps.length - 1 ? (
                  <Button onClick={handleNext} className="flex-1 sm:flex-initial btn-glow">
                    <span className="hidden sm:inline">Next</span><ArrowRight className="h-4 w-4 sm:ml-2" />
                  </Button>
                ) : (
                  <Button onClick={onFinish} className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white btn-glow">
                    Finish
                  </Button>
                )}
              </div>
            </div>
             <Button variant="ghost" size="sm" onClick={handleSkip} className="absolute top-2 right-2 p-1 h-auto text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4"/>
                <span className="sr-only">Skip tutorial</span>
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};
