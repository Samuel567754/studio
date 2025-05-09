
'use client';
import React, { FC, ReactNode, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { generateReadingPassage, type GenerateReadingPassageInput } from '@/ai/flows/generate-reading-passage';
import { Loader2, BookMarked, RefreshCcw, Info, Play, Pause, StopCircle, CheckCircle2, XCircle, HelpCircle, Eye, ClipboardCopy } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { useAppSettingsStore } from '@/stores/app-settings-store';


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
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [currentSpokenWordInfo, setCurrentSpokenWordInfo] = useState<SpokenWordInfo | null>(null);
  const [comprehensionQuestion, setComprehensionQuestion] = useState<string | null>(null);
  const [comprehensionAnswer, setComprehensionAnswer] = useState<string | null>(null);
  const [showComprehensionAnswer, setShowComprehensionAnswer] = useState(false);
  
  const { toast } = useToast();
  const soundEffectsEnabled = useAppSettingsStore(state => state.soundEffectsEnabled);

  const resetStateForNewPassage = () => {
    setPassage(null);
    setCurrentSpokenWordInfo(null);
    setComprehensionQuestion(null);
    setComprehensionAnswer(null);
    setShowComprehensionAnswer(false);
  };

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
          console.error("Speech synthesis error in ReadingPractice:", event.error, passage?.substring(event.charIndex));
          toast({ 
            variant: "destructive", 
            title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Audio Error</div>, 
            description: `Could not play audio: ${event.error}.` 
          });
          playErrorSound();
      }
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentUtterance(null);
      setCurrentSpokenWordInfo(null);
  }, [toast, passage]);


  const fetchPassage = useCallback(async () => {
    if (wordsToPractice.length === 0) {
      toast({
        variant: "info",
        title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />No Words to Practice</div>,
        description: "Please get some word suggestions and select a word first.",
      });
      setPassage("Please get some word suggestions and select a word first. Then, try generating a passage.");
      setComprehensionQuestion(null);
      setComprehensionAnswer(null);
      setShowComprehensionAnswer(false);
      return;
    }

    stopSpeech(); 
    setIsLoading(true);
    resetStateForNewPassage();

    try {
      const input: GenerateReadingPassageInput = { words: wordsToPractice, readingLevel, masteredWords };
      const result = await generateReadingPassage(input);
      if (result.passage) {
        setPassage(result.passage);
        setComprehensionQuestion(result.comprehensionQuestion || null);
        setComprehensionAnswer(result.comprehensionAnswer || null);
        setShowComprehensionAnswer(false);
        toast({ 
          variant: "success", 
          title: <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Passage Generated!</div>, 
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
  }, [wordsToPractice, readingLevel, masteredWords, toast, stopSpeech]);

  const toggleSpeech = useCallback(() => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis || !passage) return;

    const speech = window.speechSynthesis;

    if (currentUtterance && isSpeaking && !isPaused) { 
      speech.pause();
      setIsPaused(true);
      setIsSpeaking(true); // Keep isSpeaking true, but paused
      playNotificationSound();
    } else if (currentUtterance && isSpeaking && isPaused) { 
      speech.resume();
      setIsPaused(false); 
      setIsSpeaking(true); // Still speaking
      playNotificationSound();
    } else { 
      speech.cancel(); 
      const utterance = speakText(passage, handleSpeechBoundary, handleSpeechEnd, handleSpeechError);
      if (utterance) {
        setCurrentUtterance(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
      } else {
        // if speakText returns null (e.g. soundEffectsEnabled is false after check, or other error)
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentUtterance(null);
      }
    }
  }, [passage, currentUtterance, isSpeaking, isPaused, soundEffectsEnabled, handleSpeechBoundary, handleSpeechEnd, handleSpeechError]);
  
  const handleCopyPassage = useCallback(() => {
    if (passage && navigator.clipboard) {
      navigator.clipboard.writeText(passage)
        .then(() => {
          toast({
            variant: "success",
            title: <div className="flex items-center gap-2"><ClipboardCopy className="h-5 w-5" />Copied!</div>,
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
  }, [passage, toast]);


  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

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
  
    if (currentSpokenWordInfo && passage) {
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
                    {isSpeaking && !isPaused ? 'Pause' : (isPaused ? 'Resume' : 'Read Aloud')}
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
          <Alert variant="default" className="bg-card/50 dark:bg-card/30 border-primary/30 animate-in fade-in-0 zoom-in-95 duration-500" aria-live="polite">
             <AlertTitle className="text-lg font-semibold text-primary">Your Reading Passage:</AlertTitle>
            <AlertDescription className="text-base leading-relaxed text-foreground/90 dark:text-foreground/80 py-2 whitespace-pre-line">
              {renderHighlightedPassage().map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>)}
            </AlertDescription>
          </Alert>
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

        {/* Comprehension Check Section */}
        {comprehensionQuestion && !isLoading && (
          <Card className="mt-6 shadow-md border-accent/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-accent flex items-center">
                <HelpCircle className="mr-2 h-6 w-6" aria-hidden="true" /> Comprehension Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-foreground/90">{comprehensionQuestion}</p>
              {!showComprehensionAnswer ? (
                <Button 
                  onClick={() => { setShowComprehensionAnswer(true); playNotificationSound(); }} 
                  variant="outline" 
                  size="default"
                  className="hover:bg-accent/20 hover:text-accent-foreground"
                >
                  <Eye className="mr-2 h-5 w-5" aria-hidden="true" /> Show Answer
                </Button>
              ) : (
                comprehensionAnswer ? (
                  <Alert variant="info" className="bg-accent/10 border-accent/30 text-accent-foreground animate-in fade-in duration-300">
                    <AlertTitle className="font-semibold">Answer:</AlertTitle>
                    <AlertDescription className="text-base">{comprehensionAnswer}</AlertDescription>
                  </Alert>
                ) : (
                   <p className="text-sm text-muted-foreground">Answer not available for this question.</p>
                )
              )}
            </CardContent>
          </Card>
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
