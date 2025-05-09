"use client";
import type { FC, ReactNode } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { generateReadingPassage, type GenerateReadingPassageInput } from '@/ai/flows/generate-reading-passage';
import { Loader2, BookMarked, RefreshCcw, Info, Play, Pause, StopCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { playSuccessSound, playErrorSound, playNotificationSound } from '@/lib/audio';

interface ReadingPracticeProps {
  wordsToPractice: string[];
  readingLevel: string;
}

const highlightWords = (text: string, words: string[]): ReactNode[] => {
  if (!words.length || !text) return [text];
  const sortedWords = [...words].sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${sortedWords.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`, 'gi');
  
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  text.replace(regex, (match, ...args) => {
    const offset = args[args.length - 2]; 
    if (offset > lastIndex) {
      parts.push(text.substring(lastIndex, offset));
    }
    parts.push(
      <strong key={`match-${offset}`} className="text-primary font-bold underline decoration-wavy decoration-primary/50 underline-offset-2">
        {match}
      </strong>
    );
    lastIndex = offset + match.length;
    return match; 
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text]; 
};


export const ReadingPractice: FC<ReadingPracticeProps> = ({ wordsToPractice, readingLevel }) => {
  const [passage, setPassage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

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

    stopSpeech(); // Stop any ongoing speech before fetching new passage
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
    if (typeof window === 'undefined' || !window.speechSynthesis || !passage) return;

    const speech = window.speechSynthesis;

    if (isSpeaking && !isPaused) { // Currently speaking, so pause
      speech.pause();
      setIsPaused(true);
      playNotificationSound();
    } else if (isSpeaking && isPaused) { // Currently paused, so resume
      speech.resume();
      setIsPaused(false);
      playNotificationSound();
    } else { // Not speaking, so start
      speech.cancel(); // Clear any previous queue
      const utterance = new SpeechSynthesisUtterance(passage);
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        playNotificationSound();
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onpause = () => {
        // This might be triggered by external factors, ensure state consistency
        if (speech.speaking) { // If speech.pause() was called, speech.speaking is still true
             setIsPaused(true);
        } else { // If speech was cancelled or finished abruptly
            setIsSpeaking(false);
            setIsPaused(false);
        }
      };
      utterance.onresume = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onerror = (event) => {
        // "interrupted" and "canceled" are often due to user action (e.g., stopping speech, fetching new passage)
        // and might not need an aggressive error display.
        if (event.error === 'interrupted' || event.error === 'canceled') {
          console.warn("Speech synthesis event:", event.error);
        } else {
          console.error("Speech synthesis error:", event.error);
          toast({ variant: "destructive", title: "Audio Error", description: "Could not play audio for the passage." });
          playErrorSound();
        }
        // Always reset state regardless of error type to ensure UI consistency
        setIsSpeaking(false);
        setIsPaused(false);
      };
      speech.speak(utterance);
    }
  }, [passage, isSpeaking, isPaused, toast]);

  useEffect(() => {
    // Cleanup speech synthesis on component unmount
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary">
          <BookMarked className="mr-2 h-5 w-5" /> Practice Reading
        </CardTitle>
        <CardDescription>
          Read a short passage generated by AI using some of your practice words. You can also listen to it.
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
          {passage && !isLoading && (
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
            <AlertDescription className="text-base leading-relaxed text-foreground/90 dark:text-foreground/80 py-2">
              {highlightWords(passage, wordsToPractice).map((part, index) => (
                <span key={index}>{part}</span>
              ))}
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
            <p className="text-xs text-muted-foreground">Passage generated by AI. Words from your list are <strong className="text-primary">highlighted</strong>.</p>
        </CardFooter>
      )}
    </Card>
  );
};
