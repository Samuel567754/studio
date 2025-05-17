
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SpellingPractice } from '@/components/spelling-practice';
import { useToast } from "@/hooks/use-toast";
import { getStoredWordList, getStoredCurrentIndex, storeCurrentIndex } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, Pencil, ArrowLeft, Trophy, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { playNavigationSound, playCompletionSound, speakText, playCoinsEarnedSound, playCoinsDeductedSound } from '@/lib/audio';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup';

// Standardized points
const POINTS_PER_CORRECT_ANSWER = 1;
const POINTS_DEDUCTED_PER_WRONG_ANSWER = 1;
const SESSION_COMPLETION_BONUS_BASE = 5;
const PENALTY_PER_WRONG_FOR_BONUS = 1;

export default function SpellingPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const { username, addGoldenCoins, deductGoldenCoins } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();
  const { toast } = useToast();

  const [practicedWordsInSession, setPracticedWordsInSession] = useState<Set<string>>(new Set());
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [sessionIncorrectAnswersCount, setSessionIncorrectAnswersCount] = useState(0); // Track incorrect first attempts for bonus

  const [showCoinsEarnedPopup, setShowCoinsEarnedPopup] = useState(false);
  const [lastAwardedCoins, setLastAwardedCoins] = useState(0);
  const [showCoinsLostPopup, setShowCoinsLostPopup] = useState(false);
  const [lastDeductedCoins, setLastDeductedCoins] = useState(0);


  const loadWordData = useCallback((isRestart: boolean = false) => {
    const storedList = getStoredWordList();
    setWordList(storedList);

    if (isRestart) {
      setPracticedWordsInSession(new Set());
      setSessionCompleted(false);
      setSessionIncorrectAnswersCount(0);
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
    if(soundEffectsEnabled) playNavigationSound();
  };

  // Updated to receive info about whether the first attempt was correct
  const handleWordSpelled = (wasFirstAttemptCorrect: boolean) => {
    const currentWordLowerCase = currentWord.toLowerCase();
    const newPracticedWords = new Set(practicedWordsInSession).add(currentWordLowerCase);
    setPracticedWordsInSession(newPracticedWords);

    let newSessionIncorrectCount = sessionIncorrectAnswersCount;
    if (!wasFirstAttemptCorrect) { 
      newSessionIncorrectCount++;
      setSessionIncorrectAnswersCount(newSessionIncorrectCount);
    }

    const afterCurrentWordAudio = () => {
        if (newPracticedWords.size === wordList.length && wordList.length > 0 && !sessionCompleted) {
            setSessionCompleted(true);
            const calculatedBonus = Math.max(0, SESSION_COMPLETION_BONUS_BASE - (newSessionIncorrectCount * PENALTY_PER_WRONG_FOR_BONUS));
            let completionMessage = username ? `Amazing, ${username}!` : 'Congratulations!';
            let description = "You've spelled all words in this session!";

            if (calculatedBonus > 0) {
                addGoldenCoins(calculatedBonus);
                setLastAwardedCoins(calculatedBonus); 
                // setShowCoinsEarnedPopup(true); // Handled by ClientRootFeatures
                description += ` You earned ${calculatedBonus} bonus Golden Coins!`;
            } else {
                description += " Keep practicing for a bonus next time!";
            }
            
            toast({
                variant: "success",
                title: <div className="flex items-center gap-2"><Image src="/assets/images/golden_trophy_with_stars_illustration.png" alt="Trophy" width={24} height={24} />{completionMessage}</div>,
                description: description,
                duration: 7000,
            });
            if (soundEffectsEnabled) {
                playCompletionSound();
                speakText(`${completionMessage} ${description}`);
            }
        } else if (wordList.length > 1 && !sessionCompleted) {
            navigateWord('next');
        } else if (wordList.length === 1 && !sessionCompleted) { 
             setSessionCompleted(true); 
             const singleWordMessage = username ? `Fantastic, ${username}!` : 'Fantastic!';
             toast({
                variant: "success",
                title: <div className="flex items-center gap-2"><Image src="/assets/images/golden_trophy_with_stars_illustration.png" alt="Trophy" width={24} height={24} />{singleWordMessage}</div>,
                description: "You've spelled the word! Add more to keep practicing.",
                duration: 7000,
            });
            if (soundEffectsEnabled) {
                playCompletionSound();
                speakText(`${singleWordMessage} You've spelled the word!`);
            }
        }
    };
    
     const audioDelay = wasFirstAttemptCorrect ? 500 : 1200; 
    if (soundEffectsEnabled) {
        setTimeout(afterCurrentWordAudio, audioDelay); 
    } else {
       setTimeout(afterCurrentWordAudio, audioDelay + 700); 
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
    <div className="space-y-8 max-w-3xl mx-auto relative">
      {/* Popups handled globally */}
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
            src="https://plus.unsplash.com/premium_photo-1666739031994-147a1cc3894e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fHNwZWxsaW5nfGVufDB8fDB8fHww" 
            alt="Child focused on spelling with letter blocks"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="spelling learning child" 
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
        <Card className="w-full max-w-xl mx-auto shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-500 rounded-lg">
          <div className="relative h-80 md:h-96 w-full">
            <Image 
              src="https://plus.unsplash.com/premium_photo-1666739032149-5baca96d6d41?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3BlbGxpbmclMjB3b3Jkc3xlbnwwfHwwfHx8MA%3D%3D" 
              alt="Person spelling words with letter blocks"
              layout="fill"
              objectFit="cover"
              className="absolute inset-0"
              data-ai-hint="spelling words blocks"
            />
            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
              <Info className="h-12 w-12 text-primary mb-4" aria-hidden="true" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">No Words to Spell!</h2>
              <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-md">
                Your spelling list is empty. Please go to the Learn Words page to add some words.
              </p>
              <Button asChild variant="secondary" size="lg" className="btn-glow text-base md:text-lg px-6 py-3">
                <Link href="/learn">Go to Learn Words</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
            <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
              {sessionCompleted ? (
                 <Card className="shadow-lg w-full animate-in fade-in-0 zoom-in-95 duration-300">
                    <CardContent className="p-6">
                        <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50">
                            <div className="flex flex-col items-center gap-4 py-4">
                                <Image src="/assets/images/golden_trophy_with_stars_illustration.png" alt="Trophy" width={40} height={40} />
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
                <SpellingPractice 
                  wordToSpell={currentWord} 
                  onWordSpelled={handleWordSpelled} 
                />
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
