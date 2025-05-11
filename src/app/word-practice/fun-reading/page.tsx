
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // Added import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { generateReadingPassage, type GenerateReadingPassageInput } from '@/ai/flows/generate-reading-passage';
import { Loader2, BookMarked, RefreshCcw, Info, Play, Pause, StopCircle, CheckCircle2, XCircle, ClipboardCopy, Smile, Sparkles, Palette } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { getStoredWordList, getStoredReadingLevel, getStoredMasteredWords } from '@/lib/storage';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SpokenWordInfo {
  charIndex: number;
  charLength: number;
}

export default function FunReadingPage() {
  const [passage, setPassage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false); 
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [currentSpokenWordInfo, setCurrentSpokenWordInfo] = useState<SpokenWordInfo | null>(null);
  
  const [wordList, setWordList] = useState<string[]>([]);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);
  const [readingLevel, setReadingLevel] = useState<string>('beginner');
  const [isMounted, setIsMounted] = useState(false);

  const { username, favoriteTopics } = useUserProfileStore();
  const { toast } = useToast();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const loadPracticeData = useCallback(() => {
    setWordList(getStoredWordList());
    setMasteredWords(getStoredMasteredWords());
    setReadingLevel(getStoredReadingLevel("beginner"));
  }, []);

  useEffect(() => {
    loadPracticeData();
    setIsMounted(true);
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'sightwords_wordList_v1' || 
          event.key === 'sightwords_readingLevel_v1' ||
          event.key === 'sightwords_masteredWords_v1') {
        loadPracticeData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [loadPracticeData]);

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
    resetSpeechState();
  }, [resetSpeechState]);

  const resetStateForNewPassage = () => {
    setPassage(null);
    setCurrentSpokenWordInfo(null);
    stopSpeech(); // Ensure speech stops before fetching new passage
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
        console.error("Speech synthesis error on Fun Reading Page:", event.error, passage?.substring(event.charIndex));
        toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Audio Error</div>, description: `Could not play audio: ${event.error}.` });
        playErrorSound();
    }
    resetSpeechState(); 
  }, [toast, passage, resetSpeechState]);

  const fetchPassage = useCallback(async () => {
    if (wordList.length === 0 && isMounted) {
      toast({ variant: "info", title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />No Words</div>, description: "Add words to your practice list to generate a story." });
      setPassage("Please add words to your practice list first, then generate a story!");
      return;
    }

    setIsLoading(true);
    resetStateForNewPassage(); // Call this to stop any ongoing speech.

    try {
      const input: GenerateReadingPassageInput = { 
        words: wordList, 
        readingLevel, 
        masteredWords,
        favoriteTopics: favoriteTopics || undefined 
      };
      const result = await generateReadingPassage(input);
      if (result.passage) {
        setPassage(result.passage);
        toast({ variant: "success", title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />Story Time!</div>, description: "Your fun reading passage is ready!" });
        playSuccessSound();
      } else {
        setPassage("Could not generate a passage. Try different words or settings.");
        toast({ variant: "info", title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />No Passage</div>, description: "Try again or adjust your word list." });
        playNotificationSound(); 
      }
    } catch (error) {
      console.error("Error generating passage for fun reading:", error);
      setPassage("An error occurred. Please try again.");
      toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Error</div>, description: "Failed to generate passage." });
      playErrorSound();
    } finally {
      setIsLoading(false);
    }
  }, [wordList, readingLevel, masteredWords, favoriteTopics, toast, stopSpeech, isMounted]); // Added stopSpeech and isMounted

  const toggleSpeech = useCallback(() => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis || !passage) {
      if (!passage && soundEffectsEnabled) {
        toast({ variant: "info", title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />No Story</div>, description: "Generate a story first to read it aloud." });
      }
      return;
    }

    const speech = window.speechSynthesis;
    if (currentUtterance && isSpeaking) { 
      if (isPaused) { 
        speech.resume(); setIsPaused(false); playNotificationSound();
      } else { 
        speech.pause(); setIsPaused(true); playNotificationSound();
      }
    } else { 
      const utterance = speakText(passage, handleSpeechBoundary, handleSpeechEnd, handleSpeechError);
      if (utterance) {
        setCurrentUtterance(utterance); setIsSpeaking(true); setIsPaused(false);
      } else {
        resetSpeechState(); 
      }
    }
  }, [passage, isSpeaking, isPaused, soundEffectsEnabled, handleSpeechBoundary, handleSpeechEnd, handleSpeechError, resetSpeechState, toast, currentUtterance]);
  
  const handleCopyPassage = useCallback(() => {
    if (passage && navigator.clipboard) {
      navigator.clipboard.writeText(passage)
        .then(() => {
          toast({ variant: "success", title: <div className="flex items-center gap-2"><ClipboardCopy className="h-5 w-5" />Copied!</div>, description: "Passage copied to clipboard." });
          playSuccessSound();
        })
        .catch(err => {
          console.error("Failed to copy passage: ", err);
          toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Copy Failed</div>, description: "Could not copy passage." });
          playErrorSound();
        });
    } else if (!navigator.clipboard) {
       toast({ variant: "info", title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Not Supported</div>, description: "Clipboard API not available." });
    }
  }, [passage, toast]);

  const renderHighlightedPassage = (): React.ReactNode[] => {
    if (!passage) return [];
    const elements: React.ReactNode[] = [];
    let keyCounter = 0;
    const processSegment = (textSegment: string, isSpoken: boolean) => {
      if (!textSegment) return;
      const tokens = textSegment.split(/(\b\w+\b|[^\w\s]+|\s+)/g).filter(Boolean);
      for (const token of tokens) {
        const isPractice = /\b\w+\b/.test(token) && wordList.some(pWord => pWord.toLowerCase() === token.toLowerCase());
        elements.push(
          <span
            key={`token-${keyCounter++}`}
            className={cn({
              'bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-colors duration-100 ease-in-out': isSpoken && /\b\w+\b/.test(token),
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2': isPractice && !isSpoken,
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2 bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-colors duration-100 ease-in-out': isPractice && isSpoken && /\b\w+\b/.test(token),
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
        processSegment(passage.substring(0, validCharIndex), false);
        processSegment(passage.substring(validCharIndex, Math.min(passage.length, validCharIndex + validCharLength)), true); 
        processSegment(passage.substring(Math.min(passage.length, validCharIndex + validCharLength)), false);
      } else {
        processSegment(passage, false);
      }
    } else if (passage) {
      processSegment(passage, false);
    }
    return elements;
  };

  if (!isMounted) {
    return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGZ1biUyMHJlYWRpbmd8ZW58MHx8MHx8fDA%3D"
            alt="Kids having fun reading a storybook"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="fun reading kids" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Sparkles className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Fun AI Reading Time!</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Enjoy interactive stories generated by AI.</p>
          </div>
        </div>
      </header>

      <Card className="shadow-xl border-primary/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-primary">
            <BookMarked className="mr-3 h-6 w-6" /> Your Story Playground
          </CardTitle>
          <CardDescription>
            Generate a unique story, listen along, and see your practice words highlighted!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={fetchPassage} 
              disabled={isLoading || (wordList.length === 0 && isMounted)} 
              className="w-full sm:flex-1 btn-glow" 
              size="lg"
              aria-label={isLoading ? "Generating new story" : "Generate new story"}
            >
              {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Thinking...</> : <><RefreshCcw className="mr-2 h-5 w-5" /> New Story</>}
            </Button>
            {passage && !isLoading && (
              <>
                {soundEffectsEnabled && (
                  <Button 
                    onClick={toggleSpeech} 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto" 
                    aria-label={isSpeaking && !isPaused ? "Pause reading" : "Read story aloud"}
                    aria-pressed={isSpeaking && !isPaused}
                  >
                    {isSpeaking && !isPaused ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                    {isSpeaking && !isPaused ? 'Pause' : (isSpeaking && isPaused ? 'Resume' : 'Read Aloud')}
                  </Button>
                )}
                {isSpeaking && ( 
                  <Button onClick={stopSpeech} variant="destructive" size="lg" className="w-full sm:w-auto" aria-label="Stop reading">
                    <StopCircle className="mr-2 h-5 w-5" /> Stop
                  </Button>
                )}
              </>
            )}
          </div>
          
          {isLoading && (
            <div className="flex flex-col justify-center items-center p-8 min-h-[200px] bg-muted/30 rounded-lg">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Brewing a fantastic tale for you...</p>
            </div>
          )}

          {!passage && !isLoading && wordList.length === 0 && isMounted && (
            <Alert variant="info" className="bg-card">
                <Info className="h-5 w-5" />
                <AlertTitle>Ready for an Adventure?</AlertTitle>
                <AlertDescription>
                Please add some words to your practice list on the <Link href="/learn" className="font-semibold text-primary hover:underline">Learn Words</Link> page. Then, come back here to generate a fun story!
                </AlertDescription>
            </Alert>
          )}
          {!passage && !isLoading && wordList.length > 0 && isMounted && (
            <Alert variant="info" className="bg-card">
                <Palette className="h-5 w-5" />
                <AlertTitle>Let's Create a Story!</AlertTitle>
                <AlertDescription>
                Click the "New Story" button above to generate an AI-powered reading passage featuring your practice words.
                </AlertDescription>
            </Alert>
          )}

          {passage && !isLoading && (
            <Card className="bg-background/70 border-border shadow-inner">
              <CardHeader>
                 <CardTitle className="text-xl text-accent">Story Time!</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72 w-full rounded-md border p-4 bg-background/80 shadow-sm">
                  <p className="text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-line">
                    {renderHighlightedPassage().map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>)}
                  </p>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleCopyPassage} variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Story
                </Button>
              </CardFooter>
            </Card>
          )}
        </CardContent>
        {passage && !isLoading && (
          <CardFooter className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Passage generated by AI. Words from your practice list are <strong className="text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2">highlighted like this</strong>. 
                {soundEffectsEnabled && " Spoken words get a temporary background."}
              </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

