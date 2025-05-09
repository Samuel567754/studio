
"use client";
import type { FC, ReactNode } from 'react';
import { useState, useCallback, useEffect } from 'react';
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
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null);
    setCurrentSpokenWordInfo(null); 
  }, []);

  const handleSpeechBoundary = useCallback((event: SpeechSynthesisEvent) => {
    if (event.name === 'word') {
      setCurrentSpokenWordInfo({ charIndex: event.charIndex, charLength: event.charLength });
    }
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null);
    setCurrentSpokenWordInfo(null);
  }, []);
  
  const handleSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
      if (event.error === 'interrupted' || event.error === 'canceled') {
          console.warn("Speech synthesis event in ReadingPractice:", event.error);
      } else {
          console.error("Speech synthesis error in ReadingPractice:", event.error);
          toast({ variant: "destructive", title: "Audio Error", description: "Could not play audio for the passage." });
          playErrorSound();
      }
      // Ensure UI state is reset
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentUtterance(null);
      setCurrentSpokenWordInfo(null);
  }, [toast]);


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

    if (isSpeaking && !isPaused) { 
      speech.pause();
      setIsPaused(true);
      playNotificationSound();
    } else if (isSpeaking && isPaused) { 
      speech.resume();
      setIsPaused(false);
      playNotificationSound();
    } else { 
      const utterance = speakText(passage, handleSpeechBoundary, handleSpeechEnd, handleSpeechError);
      if (utterance) {
        setCurrentUtterance(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
        // playNotificationSound(); // speakText might play its own notification or we might not want one on start
      }
    }
  }, [passage, isSpeaking, isPaused, soundEffectsEnabled, handleSpeechBoundary, handleSpeechEnd, handleSpeechError]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const renderHighlightedPassage = (): ReactNode[] => {
    if (!passage) return [];
  
    const elements: ReactNode[] = [];
    let keyCounter = 0;
  
    const processTextSegment = (textSegment: string, segmentContainsSpokenWord: boolean) => {
      if (!textSegment) return;
  
      // Regex to split by words while keeping delimiters.
      // It captures sequences of word characters, or sequences of non-word/non-space characters (punctuation), or sequences of spaces.
      const tokens = textSegment.split(/(\b\w+\b|[^\w\s]+|\s+)/g).filter(Boolean);
  
      let currentPosInSegment = 0;
      for (const token of tokens) {
        const isWordToken = /\b\w+\b/.test(token);
        const isPracticeWord = isWordToken && wordsToPractice.some(pWord => pWord.toLowerCase() === token.toLowerCase());
        
        // For overall spoken word highlight, we rely on segmentContainsSpokenWord passed from the main split.
        // The charIndex/charLength from onboundary refers to the original full passage string.
        // We are highlighting the entire word that onboundary identified, if that word is inside this current segment.
        
        // Here, segmentContainsSpokenWord means the *current token* being processed is the *exact word* returned by onboundary.
        // This is already handled by splitting the passage into before/spoken/after.
        // So, if segmentContainsSpokenWord is true, this *entire textSegment* is the spoken word.

        elements.push(
          <span
            key={`token-${keyCounter++}`}
            className={cn({
              // Style for the word that is currently being spoken by TTS
              'bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-all duration-100': segmentContainsSpokenWord && isWordToken,
              // Style for practice words that are NOT currently being spoken
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2': isPracticeWord && !segmentContainsSpokenWord,
              // Style for practice words that ARE currently being spoken (combines both)
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2 bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-all duration-100': isPracticeWord && segmentContainsSpokenWord && isWordToken,
            })}
          >
            {token}
          </span>
        );
        currentPosInSegment += token.length;
      }
    };
  
    if (currentSpokenWordInfo && passage) {
      const { charIndex, charLength } = currentSpokenWordInfo;
      const before = passage.substring(0, charIndex);
      const spoken = passage.substring(charIndex, charIndex + charLength);
      const after = passage.substring(charIndex + charLength);
  
      processTextSegment(before, false);
      processTextSegment(spoken, true); // This segment is the spoken word
      processTextSegment(after, false);
    } else if (passage) {
      processTextSegment(passage, false); // No specific word is being spoken, just process for practice words
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
              {isSpeaking && (
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
          <Alert variant="default" className="bg-card/50 dark:bg-card/30 border-primary/30">
             <AlertTitle className="text-lg font-semibold text-primary">Your Reading Passage:</AlertTitle>
            <AlertDescription className="text-base leading-relaxed text-foreground/90 dark:text-foreground/80 py-2 whitespace-pre-line">
              {renderHighlightedPassage().map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>)}
            </AlertDescription>
          </Alert>
        )}
        {!passage && !isLoading && wordsToPractice.length === 0 && (
           <Alert variant="info">
             <Info className="h-5 w-5" />
             <AlertTitle>Ready to Read?</AlertTitle>
             <AlertDescription>
               First, get some word suggestions from the "AI Word Suggestions" panel and select a word. Once you have words in your practice list, you can generate a reading passage here.
             </AlertDescription>
           </Alert>
        )}
         {!passage && !isLoading && wordsToPractice.length > 0 && (
           <Alert variant="info">
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
            <p className="text-xs text-muted-foreground">Passage generated by AI. Words from your list are <strong className="text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2">highlighted</strong>. Spoken words are <span className="bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded">highlighted like this</span>.</p>
        </CardFooter>
      )}
    </Card>
  );
};
