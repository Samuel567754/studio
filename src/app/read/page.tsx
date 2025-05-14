
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ReadingPractice } from '@/components/reading-practice';
import { getStoredWordList, getStoredReadingLevel, getStoredMasteredWords } from '@/lib/storage';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Info, Loader2, ArrowLeft, Trophy, RefreshCcw } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { playCompletionSound, speakText } from '@/lib/audio';
import { useToast } from '@/hooks/use-toast';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';

export default function ReadingPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);
  const [readingLevel, setReadingLevel] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false); 
  const [lastScore, setLastScore] = useState<{ score: number; total: number } | null>(null);

  const { username } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();
  const { toast } = useToast();

  const loadReadingData = useCallback((isRestart: boolean = false) => {
    setWordList(getStoredWordList());
    setMasteredWords(getStoredMasteredWords());
    setReadingLevel(getStoredReadingLevel("beginner"));
    if (isRestart) {
      setSessionCompleted(false);
      setLastScore(null);
    }
  }, []);
  
  useEffect(() => {
    loadReadingData();
    setIsMounted(true);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'sightwords_wordList_v1' || 
          event.key === 'sightwords_readingLevel_v1' ||
          event.key === 'sightwords_masteredWords_v1') {
        loadReadingData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadReadingData]);

  const handleSessionCompletion = (score: number, totalQuestions: number) => {
    setSessionCompleted(true); 
    setLastScore({ score, total: totalQuestions });

    const greeting = username ? `Well done, ${username}!` : 'Session Complete!';
    const scoreAnnouncement = `You scored ${score} out of ${totalQuestions}.`;
    const encouragement = score > (totalQuestions / 2) ? "Keep up the great reading!" : "That was a good effort, keep practicing!";
    
    const fullToastMessage = `${greeting} ${scoreAnnouncement}`;

    toast({
      variant: "success",
      title: <div className="flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-400" />{greeting}</div>,
      description: scoreAnnouncement,
      duration: 7000,
    });

    setTimeout(() => {
      if (soundEffectsEnabled) {
        playCompletionSound();
        speakText(`${greeting} ${scoreAnnouncement} ${encouragement}`);
      }
    }, 150); 
  };

  if (!isMounted) {
     return (
      <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
        <header className="text-center space-y-4 animate-pulse">
            <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg bg-muted shadow-lg"></div>
        </header>
        <Card className="shadow-lg animate-pulse">
            <div className="p-6">
                <div className="h-6 w-1/2 bg-muted rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
            </div>
            <div className="p-6 space-y-4">
                <div className="h-12 bg-primary/50 rounded"></div>
                <div className="h-40 bg-muted rounded"></div>
            </div>
        </Card>
         <div className="flex justify-center items-center min-h-[100px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="sr-only">Loading reading page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="group">
          <Link href="/word-practice">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Word Practice
          </Link>
        </Button>
      </div>
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://images.unsplash.com/photo-1604342162684-0cb7869cc445?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzl8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D" 
            alt="Child reading an adventure book"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="reading adventure child" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <BookOpen className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Standard Reading Practice</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Read AI-generated stories & test comprehension.</p>
          </div>
        </div>
      </header>

      {wordList.length === 0 && !sessionCompleted ? (
        <Card className="w-full max-w-xl mx-auto shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-500 rounded-lg">
          <div className="relative h-80 md:h-96 w-full">
            <Image 
              src="https://plus.unsplash.com/premium_photo-1684743539425-5f726aa89394?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bGVhcm5pbmclMjB3b3Jkc3xlbnwwfHwwfHx8MA%3D%3D" 
              alt="An empty storybook with a curious child peeking"
              layout="fill"
              objectFit="cover"
              className="absolute inset-0"
              data-ai-hint="empty book child"
            />
            <div className="absolute inset-0 bg-black/70" /> 
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
              <Info className="h-12 w-12 text-primary mb-4" aria-hidden="true" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">No Words for Reading!</h2>
              <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-md">
                To generate a reading passage, add words to your practice list.
              </p>
              <Button asChild variant="secondary" size="lg" className="btn-glow text-base md:text-lg px-6 py-3">
                <Link href="/learn">Go to Learn Words</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : sessionCompleted ? (
         <Card className="shadow-lg w-full animate-in fade-in-0 zoom-in-95 duration-300">
            <CardHeader className="text-center">
                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Session Complete!
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
                <p className="text-lg">
                    {username ? `Great reading, ${username}!` : "Great reading!"} You've finished this session.
                </p>
                {lastScore && (
                    <p className="text-xl font-semibold">Your Score: <span className="text-accent">{lastScore.score} / {lastScore.total}</span></p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button onClick={() => loadReadingData(true)} size="lg" className="w-full sm:w-auto">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Play Again (New Story)
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                    <Link href="/word-practice">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Word Practice
                    </Link>
                    </Button>
                </div>
            </CardContent>
         </Card>
      ) : (
        <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out">
            <ReadingPractice 
                wordsToPractice={wordList} 
                readingLevel={readingLevel} 
                masteredWords={masteredWords} 
                onSessionComplete={handleSessionCompletion}
            />
        </div>
      )}
    </div>
  );
}

