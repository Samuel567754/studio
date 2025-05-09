
"use client";
import React, { FC, ReactNode, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { generateReadingPassage, type GenerateReadingPassageInput } from '@/ai/flows/generate-reading-passage';
import { Loader2, BookMarked, RefreshCcw, Info, Play, Pause, StopCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { useAppSettingsStore } from '@/stores/app-settings-store';


interface ReadingPracticeProps {
  wordsToPractice: string[];
  readingLevel: string;
}

interface SpokenWordInfo {
  charIndex: number;
  charLength: number;
}

export const ReadingPractice: FC<ReadingPracticeProps> = ({ wordsToPractice, readingLevel }) => {
  const [passage, setPassage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [currentSpokenWordInfo, setCurrentSpokenWordInfo] = useState<SpokenWordInfo | null>(null);
  
  const { toast } = useToast();
  const soundEffectsEnabled = useAppSettingsStore(state => state.soundEffectsEnabled);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // This will trigger 'onend' and potentially 'onerror' with 'canceled'
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null);
    setCurrentSpokenWordInfo(null); 
  }, []);

  const handleSpeechBoundary = useCallback((event: SpeechSynthesisEvent) => {
    if (event.name === 'word') {
      // console.log('Speech Boundary:', event.charIndex, event.charLength, passage?.substring(event.charIndex, event.charIndex + event.charLength));
      setCurrentSpokenWordInfo({ charIndex: event.charIndex, charLength: event.charLength });
    }
  }, [passage]); // Added passage because it's used in the (commented out) console.log

  const handleSpeechEnd = useCallback(() => {
    // This is called when the utterance finishes speaking naturally or is canceled.
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null);
    setCurrentSpokenWordInfo(null);
  }, []);
  
  const handleSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
      if (event.error === 'interrupted' || event.error === 'canceled') {
          console.warn("Speech synthesis event in ReadingPractice:", event.error);
          // For 'canceled' (e.g., by stopSpeech), onend will also fire and handle state reset.
          // For 'interrupted', if it's not a full cancel, we might not want to reset all state here,
          // but usually, it implies the speech cannot continue as intended with this utterance.
          // If 'interrupted' is triggered by `pause()`, that would be a browser bug. Pause shouldn't be an error.
      } else {
          console.error("Speech synthesis error in ReadingPractice:", event.error, passage?.substring(event.charIndex));
          toast({ variant: "destructive", title: "Audio Error", description: `Could not play audio: ${event.error}.` });
          playErrorSound();
          // Reset state for actual errors that prevent continuation
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentUtterance(null);
          setCurrentSpokenWordInfo(null);
      }
  }, [toast, passage]);


  const fetchPassage = useCallback(async () => {
    if (wordsToPractice.length === 0) {
      toast({
        title: "No Words to Practice",
        description: "Please get some word suggestions and select a word first.",
        variant: "info",
      });
      setPassage("Please get some word suggestions and select a word first. Then, try generating a passage.");
      return;
    }

    stopSpeech(); 
    setIsLoading(true);
    setPassage(null);
    try {
      const input: GenerateReadingPassageInput = { words: wordsToPractice, readingLevel };
      const result = await generateReadingPassage(input);
      if (result.passage) {
        setPassage(result.passage);
        toast({ variant: "success", title: "Passage Generated!", description: "Happy reading!" });
        playSuccessSound();
      } else {
        setPassage("Could not generate a passage with the current words and settings. Try again or change words.");
        toast({ variant: "info", title: "No Passage Generated", description: "Try different words or settings." });
        playNotificationSound(); 
      }
    } catch (error) {
      console.error("Error generating passage:", error);
      setPassage("An error occurred while generating the passage. Please try again.");
      toast({ variant: "destructive", title: "Generation Error", description: "Could not generate a passage at this time." });
      playErrorSound();
    } finally {
      setIsLoading(false);
    }
  }, [wordsToPractice, readingLevel, toast, stopSpeech]);

  const toggleSpeech = useCallback(() => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis || !passage) return;

    const speech = window.speechSynthesis;

    if (isSpeaking && !isPaused) { // Currently speaking, want to PAUSE
      speech.pause();
      setIsPaused(true);
      playNotificationSound();
    } else if (isSpeaking && isPaused) { // Currently paused, want to RESUME
      speech.resume();
      setIsPaused(false); // isSpeaking remains true
      playNotificationSound();
    } else { // Not speaking (or previous session ended), want to START
      // Ensure any remnants are cleared before starting anew (though speakText also calls cancel)
      speech.cancel(); 
      const utterance = speakText(passage, handleSpeechBoundary, handleSpeechEnd, handleSpeechError);
      if (utterance) {
        setCurrentUtterance(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
        // playNotificationSound(); // speakText might play its own notification or we might not want one on start
      } else {
        // Failed to create/start utterance
        setIsSpeaking(false);
        setIsPaused(false);
      }
    }
  }, [passage, isSpeaking, isPaused, soundEffectsEnabled, handleSpeechBoundary, handleSpeechEnd, handleSpeechError]);

  useEffect(() => {
    // Cleanup function to stop speech when the component unmounts
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const renderHighlightedPassage = (): ReactNode[] => {
    // console.log("Rendering with currentSpokenWordInfo:", currentSpokenWordInfo);
    if (!passage) return [];
  
    const elements: ReactNode[] = [];
    let keyCounter = 0;
  
    // This function processes a segment of text (before, spoken, after)
    // and styles practice words within it.
    // The `isCurrentlySpokenSegment` flag is true only for the "spoken" part.
    const processSegmentAndTokenize = (textSegment: string, isCurrentlySpokenSegment: boolean) => {
      if (!textSegment) return;
  
      // Tokenize by words and punctuation/spaces
      const tokens = textSegment.split(/(\b\w+\b|[^\w\s]+|\s+)/g).filter(Boolean);
  
      for (const token of tokens) {
        const isWordToken = /\b\w+\b/.test(token); // Check if the token is a word
        // Check if this word token (case-insensitive) is one of the practice words
        const isPracticeWord = isWordToken && wordsToPractice.some(pWord => pWord.toLowerCase() === token.toLowerCase());
        
        elements.push(
          <span
            key={`token-${keyCounter++}`}
            className={cn({
              // Style for the word that is currently being spoken by TTS (applies to tokens within the spoken segment)
              'bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-colors duration-100 ease-in-out': isCurrentlySpokenSegment && isWordToken,
              // Style for practice words that are NOT currently being spoken (applies to tokens in before/after segments, or non-spoken tokens in spoken segment)
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2': isPracticeWord && !isCurrentlySpokenSegment,
              // Style for practice words that ARE currently being spoken (combines both styles)
              // This condition ensures that if a practice word is the one being spoken, it gets both underlines and background highlight.
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2 bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-colors duration-100 ease-in-out': isPracticeWord && isCurrentlySpokenSegment && isWordToken,
            })}
          >
            {token}
          </span>
        );
      }
    };
  
    if (currentSpokenWordInfo && passage) {
      const { charIndex, charLength } = currentSpokenWordInfo;
      // Ensure charIndex and charLength are valid
      const validCharIndex = Math.max(0, charIndex);
      const validCharLength = Math.max(0, charLength);

      if (validCharIndex < passage.length) {
        const before = passage.substring(0, validCharIndex);
        const spoken = passage.substring(validCharIndex, Math.min(passage.length, validCharIndex + validCharLength));
        const after = passage.substring(Math.min(passage.length, validCharIndex + validCharLength));
    
        processSegmentAndTokenize(before, false);
        processSegmentAndTokenize(spoken, true); // This segment IS the currently spoken word(s)
        processSegmentAndTokenize(after, false);
      } else {
         // charIndex is out of bounds, treat entire passage as not spoken
        processSegmentAndTokenize(passage, false);
      }

    } else if (passage) {
      // No specific word is being spoken, just process the whole passage for practice words
      processSegmentAndTokenize(passage, false);
    }
  
    return elements;
  };


  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary">
          <BookMarked className="mr-2 h-5 w-5" /> Practice Reading
        </CardTitle>
        <CardDescription>
          Read a short passage generated by AI using some of your practice words. You can also listen to it. Current spoken words will be highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={fetchPassage} disabled={isLoading || wordsToPractice.length === 0} className="w-full sm:flex-1" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Generate New Passage
              </>
            )}
          </Button>
          {passage && !isLoading && soundEffectsEnabled && (
            <div className="flex gap-2">
              <Button onClick={toggleSpeech} variant="outline" size="lg" className="w-full sm:w-auto" aria-label={isSpeaking && !isPaused ? "Pause reading" : (isPaused ? "Resume reading" : "Read passage aloud")}>
                {isSpeaking && !isPaused ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isSpeaking && !isPaused ? 'Pause' : (isPaused ? 'Resume' : 'Read Aloud')}
              </Button>
              {isSpeaking && ( // Show stop button only if a speech session is active
                <Button onClick={stopSpeech} variant="destructive" size="lg" className="w-full sm:w-auto" aria-label="Stop reading">
                  <StopCircle className="mr-2 h-5 w-5" /> Stop
                </Button>
              )}
            </div>
          )}
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {passage && !isLoading && (
          <Alert variant="default" className="bg-card/50 dark:bg-card/30 border-primary/30 animate-in fade-in-0 zoom-in-95 duration-500">
             <AlertTitle className="text-lg font-semibold text-primary">Your Reading Passage:</AlertTitle>
            <AlertDescription className="text-base leading-relaxed text-foreground/90 dark:text-foreground/80 py-2 whitespace-pre-line">
              {renderHighlightedPassage().map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>)}
            </AlertDescription>
          </Alert>
        )}
        {!passage && !isLoading && wordsToPractice.length === 0 && (
           <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300">
             <Info className="h-5 w-5" />
             <AlertTitle>Ready to Read?</AlertTitle>
             <AlertDescription>
               First, get some word suggestions from the "AI Word Suggestions" panel and select a word. Once you have words in your practice list, you can generate a reading passage here.
             </AlertDescription>
           </Alert>
        )}
         {!passage && !isLoading && wordsToPractice.length > 0 && (
           <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300">
            <Info className="h-5 w-5" />
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
