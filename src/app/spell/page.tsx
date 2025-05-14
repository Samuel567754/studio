
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
// import { WordDisplay } from '@/components/word-display'; // Removed WordDisplay
import { SpellingPractice } from '@/components/spelling-practice';
import { useToast } from "@/hooks/use-toast";
import { getStoredWordList, getStoredCurrentIndex, storeCurrentIndex } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, Pencil, ArrowLeft, Trophy, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { playNavigationSound, playCompletionSound, speakText } from '@/lib/audio';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';

export default function SpellingPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const { username } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();
  const { toast } = useToast();

  const [practicedWordsInSession, setPracticedWordsInSession] = useState<Set<string>>(new Set());
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);


  const loadWordData = useCallback((isRestart: boolean = false) => {
    const storedList = getStoredWordList();
    setWordList(storedList);

    if (isRestart) {
      setPracticedWordsInSession(new Set());
      setSessionCompleted(false);
    }
    

    if (storedList.length > 0) {
      const storedIndex = getStoredCurrentIndex();
      let validIndex = (storedIndex >= 0 && storedIndex < storedList.length) ? storedIndex : 0;
      
      if (isRestart) {
        validIndex = 0;
      }

      setCurrentIndex(validIndex);
      setCurrentWord(storedList[validIndex]);
      if (storedIndex !== validIndex || isRestart) { 
        storeCurrentIndex(validIndex); 
      }
    } else {
      setCurrentWord('');
      setCurrentIndex(0); 
    }
  }, []); 

  useEffect(() => {
    loadWordData();
    setIsMounted(true);
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'sightwords_wordList_v1' || event.key === 'sightwords_currentIndex_v1') {
        loadWordData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadWordData]);


  const navigateWord = (direction: 'next' | 'prev') => {
    if (wordList.length === 0 || sessionCompleted) return;
    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % wordList.length;
    } else {
      newIndex = (currentIndex - 1 + wordList.length) % wordList.length;
    }
    setCurrentIndex(newIndex);
    setCurrentWord(wordList[newIndex]);
    storeCurrentIndex(newIndex);
    playNavigationSound();
  };

  const handleCorrectSpell = () => {
    const currentWordLowerCase = currentWord.toLowerCase();
    const newPracticedWords = new Set(practicedWordsInSession).add(currentWordLowerCase);
    setPracticedWordsInSession(newPracticedWords);

    const afterCurrentWordAudio = () => {
        if (newPracticedWords.size === wordList.length && wordList.length > 0 && !sessionCompleted) {
            setSessionCompleted(true);
            toast({
                variant: "success",
                title: <div className="flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-400" />{username ? `Amazing, ${username}!` : 'Congratulations!'}</div>,
                description: "You've spelled all words in this session!",
                duration: 7000,
            });
            playCompletionSound();
            if (soundEffectsEnabled) {
                speakText(username ? `Amazing, ${username}! You've spelled all words in this session!` : "Congratulations! You've spelled all words in this session!");
            }
        } else if (wordList.length > 1 && !sessionCompleted) {
            navigateWord('next');
        } else if (wordList.length === 1 && !sessionCompleted) { 
             setSessionCompleted(true); 
             toast({
                variant: "success",
                title: <div className="flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-400" />{username ? `Fantastic, ${username}!` : 'Fantastic!'}</div>,
                description: "You've spelled the word! Add more to keep practicing.",
                duration: 7000,
            });
            playCompletionSound();
            if (soundEffectsEnabled) speakText(username ? `Fantastic, ${username}! You've spelled the word!` : "Fantastic! You've spelled the word!");
        }
    };
    
    if (soundEffectsEnabled) {
        setTimeout(afterCurrentWordAudio, 500); 
    } else {
       setTimeout(afterCurrentWordAudio, 1200); 
    }
  };
  
  if (!isMounted) {
    return (
      <div className="space-y-6 md:space-y-8" aria-live="polite" aria-busy="true">
        <Card className="shadow-lg animate-pulse">
            <CardHeader><div className="h-6 w-1/3 bg-muted rounded"></div></CardHeader>
            <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-6 min-h-[250px] md:min-h-[300px]">
            </CardContent>
        </Card>
        <Card className="shadow-lg animate-pulse">
            <CardHeader>
                <div className="h-6 w-1/2 bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded mt-2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-12 bg-muted rounded"></div>
                <div className="h-12 bg-primary/50 rounded"></div>
            </CardContent>
        </Card>
        <p className="sr-only">Loading spelling page...</p>
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
            src="https://images.unsplash.com/photo-1740479049022-5bc6d96cfc73?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHNwZWxsJTIwd29yZHN8ZW58MHx8MHx8fDA%3D" 
            alt="Keyboard letters for spelling practice"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="spell words keyboard" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Pencil className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Spelling Practice</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Sharpen your spelling and master words.</p>
          </div>
        </div>
      </header>
      
      {wordList.length === 0 ? (
         <Alert variant="info" className="max-w-xl mx-auto text-center bg-card shadow-md border-accent/20 animate-in fade-in-0 zoom-in-95 duration-500" aria-live="polite">
            <div className="flex flex-col items-center gap-4">
            <Image 
                src="https://plus.unsplash.com/premium_photo-1725400811474-0a8720cb0227?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8bGVhcm5pbmclMjB3b3Jkc3xlbnwwfHwwfHx8MA%3D%3D" 
                alt="Pencil and paper ready for spelling"
                width={200}
                height={150}
                className="rounded-lg shadow-md mb-3"
                data-ai-hint="pencil paper spelling"
            />
            <Info className="h-6 w-6 text-primary" aria-hidden="true" />
            <AlertTitle className="text-xl font-semibold mb-2">No Words to Spell!</AlertTitle>
            <AlertDescription className="text-base">
                Your spelling list is empty. Please go to the{' '}
                <Button variant="link" asChild className="p-0 h-auto text-base"><Link href="/learn">Learn Words</Link></Button>
                {' '}page to add some words.
            </AlertDescription>
            </div>
        </Alert>
      ) : (
        <>
            <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
              {sessionCompleted ? (
                 <Card className="shadow-lg w-full animate-in fade-in-0 zoom-in-95 duration-300">
                    <CardContent className="p-6">
                        <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50">
                            <div className="flex flex-col items-center gap-4 py-4">
                                <Trophy className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
                                <AlertTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {username ? `Great Work, ${username}!` : 'Session Complete!'}
                                </AlertTitle>
                                <AlertDescription className="text-base">
                                    You've successfully spelled all words in this session!
                                </AlertDescription>
                                <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-xs">
                                    <Button onClick={() => loadWordData(true)} variant="outline" className="w-full">
                                        <RefreshCcw className="mr-2 h-4 w-4" /> Play Again
                                    </Button>
                                    <Button asChild className="w-full">
                                        <Link href="/word-practice"><ArrowLeft className="mr-2 h-4 w-4" /> Word Practice Menu</Link>
                                    </Button>
                                </div>
                            </div>
                        </Alert>
                    </CardContent>
                 </Card>
              ) : (
                <SpellingPractice wordToSpell={currentWord} onCorrectSpell={handleCorrectSpell} />
              )}
            </div>
            
            {!sessionCompleted && wordList.length > 1 && (
                <Card className="shadow-md border-primary/10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-200">
                    <CardContent className="p-4 flex justify-between items-center gap-2 md:gap-4">
                    <Button variant="outline" size="lg" onClick={() => navigateWord('prev')} aria-label="Previous word" className="flex-1 md:flex-none">
                        <ChevronLeft className="mr-1 md:mr-2 h-5 w-5" aria-hidden="true" /> Previous
                    </Button>
                    <span className="text-muted-foreground text-sm whitespace-nowrap font-medium" aria-live="polite" aria-atomic="true">
                        Word {currentIndex + 1} / {wordList.length}
                    </span>
                    <Button variant="outline" size="lg" onClick={() => navigateWord('next')} aria-label="Next word" className="flex-1 md:flex-none">
                        Next <ChevronRight className="ml-1 md:ml-2 h-5 w-5" aria-hidden="true" />
                    </Button>
                    </CardContent>
                </Card>
            )}
        </>
      )}
    </div>
  );
}

