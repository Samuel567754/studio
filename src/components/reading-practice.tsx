'use client';
import React, { FC, ReactNode, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { generateReadingPassage, type GenerateReadingPassageInput } from '@/ai/flows/generate-reading-passage';
import { Loader2, BookMarked, RefreshCcw, Info, Play, Pause, StopCircle, CheckCircle2, XCircle, ClipboardCopy, Smile } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useUserProfileStore } from '@/stores/user-profile-store';


interface ReadingPracticeProps {
  wordsToPractice: string[];
  readingLevel: string;
  masteredWords: string[];
}

interface SpokenWordInfo {
  charIndex: number;
  charLength: number;
}

export const ReadingPractice: FC<ReadingPracticeProps> = ({ wordsToPractice, readingLevel, masteredWords }) => {
  const [passage, setPassage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(isPaused);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [currentSpokenWordInfo, setCurrentSpokenWordInfo] = useState<SpokenWordInfo | null>(null);
  const { username } = useUserProfileStore();
  
  const { toast } = useToast();
  const soundEffectsEnabled = useAppSettingsStore(state => state.soundEffectsEnabled);

  const resetSpeechState = useCallback(() => {
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null);
    setCurrentSpokenWordInfo(null);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); 
    }
  }, []);


  const resetStateForNewPassage = () => {
    setPassage(null);
    setCurrentSpokenWordInfo(null);
    resetSpeechState();
  };


  const handleSpeechBoundary = useCallback((event: SpeechSynthesisEvent) => {
    if (event.name === 'word' && event.charLength > 0) {
      setCurrentSpokenWordInfo({ charIndex: event.charIndex, charLength: event.charLength });
    }
  }, []); 

  const handleSpeechEnd = useCallback(() => {
    resetSpeechState();
  }, [resetSpeechState]);
  
  const handleSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
      if (event.error && event.error !== 'interrupted' && event.error !== 'canceled') {
          console.error("Speech synthesis error in ReadingPractice:", event.error, passage?.substring(event.charIndex));
          toast({ 
            variant: "destructive", 
            title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Audio Error</div>, 
            description: `Could not play audio: ${event.error}.` 
          });
          playErrorSound();
      } else if (event.error) {
        console.warn("Speech synthesis event (interrupted/canceled) in ReadingPractice:", event.error);
      }
      resetSpeechState(); 
  }, [toast, passage, resetSpeechState]);


  const fetchPassage = useCallback(async () => {
    if (wordsToPractice.length === 0) {
      toast({
        variant: "info",
        title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />No Words to Practice</div>,
        description: "Please get some word suggestions and select a word first.",
      });
      setPassage("Please get some word suggestions and select a word first. Then, try generating a passage.");
      return;
    }

    if (isSpeaking) {
       stopSpeech(); 
    }
    setIsLoading(true);
    resetStateForNewPassage();

    try {
      const input: GenerateReadingPassageInput = { words: wordsToPractice, readingLevel, masteredWords };
      const result = await generateReadingPassage(input);
      if (result.passage) {
        setPassage(result.passage);
        toast({ 
          variant: "success", 
          title: <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />{username ? `Passage for ${username}!` : 'Passage Generated!'}</div>, 
          description: "Happy reading!" 
        });
        playSuccessSound();
      } else {
        setPassage("Could not generate a passage with the current words and settings. Try again or change words.");
        toast({ 
          variant: "info", 
          title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />No Passage Generated</div>, 
          description: "Try different words or settings." 
        });
        playNotificationSound(); 
      }
    } catch (error) {
      console.error("Error generating passage:", error);
      setPassage("An error occurred while generating the passage. Please try again.");
      toast({ 
        variant: "destructive", 
        title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Generation Error</div>, 
        description: "Could not generate a passage at this time." 
      });
      playErrorSound();
    } finally {
      setIsLoading(false);
    }
  }, [wordsToPractice, readingLevel, masteredWords, toast, stopSpeech, isSpeaking, username]);

  const toggleSpeech = useCallback(() => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis || !passage) {
        if (!passage && soundEffectsEnabled) {
             toast({ variant: "info", title: "No Passage", description: "Generate a passage first to read aloud." });
        }
        return;
    }

    const speech = window.speechSynthesis;

    if (isSpeaking) { 
        if (isPaused) { 
            speech.resume();
            setIsPaused(false);
            playNotificationSound();
        } else { 
            speech.pause();
            setIsPaused(true);
            playNotificationSound();
        }
    } else { 
      const utterance = speakText(passage, handleSpeechBoundary, handleSpeechEnd, handleSpeechError);
      if (utterance) {
        setCurrentUtterance(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
      } else {
        resetSpeechState();
      }
    }
  }, [passage, isSpeaking, isPaused, soundEffectsEnabled, handleSpeechBoundary, handleSpeechEnd, handleSpeechError, resetSpeechState, toast]);
  
  const handleCopyPassage = useCallback(() => {
    if (passage && navigator.clipboard) {
      navigator.clipboard.writeText(passage)
        .then(() => {
          toast({
            variant: "success",
            title: <div className="flex items-center gap-2"><ClipboardCopy className="h-5 w-5" />{username ? `${username}, copied!` : 'Copied!'}</div>,
            description: "Passage copied to clipboard.",
          });
          playSuccessSound();
        })
        .catch(err => {
          console.error("Failed to copy passage: ", err);
          toast({
            variant: "destructive",
            title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Copy Failed</div>,
            description: "Could not copy passage to clipboard.",
          });
          playErrorSound();
        });
    } else if (!navigator.clipboard) {
       toast({
            variant: "info",
            title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Copy Not Supported</div>,
            description: "Clipboard API not available in this browser or context.",
          });
    }
  }, [passage, toast, username]);


  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      resetSpeechState();
    };
  }, [resetSpeechState]);

  const renderHighlightedPassage = (): ReactNode[] => {
    if (!passage) return [];
  
    const elements: ReactNode[] = [];
    let keyCounter = 0;
  
    const processSegmentAndTokenize = (textSegment: string, isCurrentlySpokenSegment: boolean) => {
      if (!textSegment) return;
  
      const tokens = textSegment.split(/(\b\w+\b|[^\w\s]+|\s+)/g).filter(Boolean);
  
      for (const token of tokens) {
        const isWordToken = /\b\w+\b/.test(token);
        const isPracticeWord = isWordToken && wordsToPractice.some(pWord => pWord.toLowerCase() === token.toLowerCase());
        
        elements.push(
          <span
            key={`token-${keyCounter++}`}
            className={cn({
              'bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-colors duration-100 ease-in-out': isCurrentlySpokenSegment && isWordToken,
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2': isPracticeWord && !isCurrentlySpokenSegment,
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2 bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-colors duration-100 ease-in-out': isPracticeWord && isCurrentlySpokenSegment && isWordToken,
            })}
          >
            {token}
          </span>
        );
      }
    };
  
    if (isSpeaking && currentSpokenWordInfo && passage) { 
      const { charIndex, charLength } = currentSpokenWordInfo;
      const validCharIndex = Math.max(0, charIndex);
      const validCharLength = Math.max(0, charLength);

      if (validCharIndex < passage.length) {
        const before = passage.substring(0, validCharIndex);
        const spoken = passage.substring(validCharIndex, Math.min(passage.length, validCharIndex + validCharLength));
        const after = passage.substring(Math.min(passage.length, validCharIndex + validCharLength));
    
        processSegmentAndTokenize(before, false);
        processSegmentAndTokenize(spoken, true); 
        processSegmentAndTokenize(after, false);
      } else {
        processSegmentAndTokenize(passage, false);
      }

    } else if (passage) {
      processSegmentAndTokenize(passage, false);
    }
  
    return elements;
  };

  const getPlayPauseAriaLabel = () => {
    if (isSpeaking && !isPaused) return "Pause reading passage aloud";
    if (isSpeaking && isPaused) return "Resume reading passage aloud";
    return "Read passage aloud";
  };
  
  const playPauseButtonText = () => {
    if (isSpeaking && !isPaused) return 'Pause';
    if (isSpeaking && isPaused) return 'Resume';
    return 'Read Aloud';
  };

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary">
          <BookMarked className="mr-2 h-5 w-5" aria-hidden="true" /> Practice Reading
        </CardTitle>
        <CardDescription>
          Read a short passage generated by AI using some of your practice words. You can also listen to it. Current spoken words will be highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={fetchPassage} 
            disabled={isLoading || wordsToPractice.length === 0} 
            className="w-full sm:flex-1" 
            size="lg"
            aria-label={isLoading ? "Generating new passage" : "Generate new reading passage"}
            aria-disabled={isLoading || wordsToPractice.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Generate New Passage
              </>
            )}
          </Button>
          {passage && !isLoading && (
            <div className="flex flex-wrap gap-2">
              {soundEffectsEnabled && (
                <>
                  <Button 
                    onClick={toggleSpeech} 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto" 
                    aria-label={getPlayPauseAriaLabel()}
                    aria-pressed={isSpeaking && !isPaused}
                    disabled={!passage}
                  >
                    {isSpeaking && !isPaused ? <Pause className="mr-2 h-5 w-5" aria-hidden="true" /> : <Play className="mr-2 h-5 w-5" aria-hidden="true" />}
                    {playPauseButtonText()}
                  </Button>
                  {isSpeaking && ( 
                    <Button 
                      onClick={stopSpeech} 
                      variant="destructive" 
                      size="lg" 
                      className="w-full sm:w-auto" 
                      aria-label="Stop reading passage aloud"
                    >
                      <StopCircle className="mr-2 h-5 w-5" aria-hidden="true" /> Stop
                    </Button>
                  )}
                </>
              )}
              <Button onClick={handleCopyPassage} variant="outline" size="lg" className="w-full sm:w-auto" disabled={!passage}>
                <ClipboardCopy className="mr-2 h-5 w-5" /> Copy Text
              </Button>
            </div>
          )}
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center p-4" aria-live="polite" aria-busy="true">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Loading passage</span>
          </div>
        )}
        {passage && !isLoading && (
          <div className="space-y-4">
            <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden shadow-md">
              <Image 
                src="https://picsum.photos/600/400" 
                alt="Child reading a book"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
                data-ai-hint="child reading book"
              />
            </div>
            <Alert variant="default" className="bg-card/50 dark:bg-card/30 border-primary/30 animate-in fade-in-0 zoom-in-95 duration-500" aria-live="polite">
              <AlertTitle className="text-lg font-semibold text-primary">Your Reading Passage:</AlertTitle>
              <AlertDescription className="text-base leading-relaxed text-foreground/90 dark:text-foreground/80 py-2 whitespace-pre-line">
                {renderHighlightedPassage().map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>)}
              </AlertDescription>
            </Alert>
          </div>
        )}
        {!passage && !isLoading && wordsToPractice.length === 0 && (
           <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300" aria-live="polite">
             <Info className="h-5 w-5" aria-hidden="true" />
             <AlertTitle>Ready to Read?</AlertTitle>
             <AlertDescription>
               First, get some word suggestions from the "AI Word Suggestions" panel and select a word. Once you have words in your practice list, you can generate a reading passage here.
             </AlertDescription>
           </Alert>
        )}
         {!passage && !isLoading && wordsToPractice.length > 0 && (
           <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300" aria-live="polite">
            <Info className="h-5 w-5" aria-hidden="true"/>
             <AlertTitle>Generate a Passage</AlertTitle>
             <AlertDescription>
               Click the "Generate New Passage" button above to create a story with your practice words!
             </AlertDescription>
           </Alert>
        )}
      </CardContent>
      {passage && !isLoading && (
        <CardFooter>
            <p className="text-xs text-muted-foreground">Passage generated by AI. Words from your list are <strong className="text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2">highlighted like this</strong>. Spoken words are <span className="bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded">highlighted with a background</span>.</p>
        </CardFooter>
      )}
    </Card>
  );
};

