
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { WordDisplay } from '@/components/word-display';
import { WordIdentificationGame } from '@/components/word-identification-game';
import { useToast } from "@/hooks/use-toast";
import { getStoredWordList, getStoredCurrentIndex, storeCurrentIndex } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, Target, CheckCircle2, XCircle, Smile, ArrowLeft, Trophy, RefreshCcw, Gift } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { playNavigationSound, speakText, playSuccessSound, playErrorSound, playCompletionSound, playRewardClaimedSound } from '@/lib/audio';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';

export default function IdentifyWordPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const { username } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();
  const { toast } = useToast();

  const [practicedWordsInSession, setPracticedWordsInSession] = useState<Set<string>>(new Set());
  const [gameCompletedThisSession, setGameCompletedThisSession] = useState<boolean>(false);
  const [isRewardClaimedThisSession, setIsRewardClaimedThisSession] = useState<boolean>(false);

  const loadWordData = useCallback((isRestart: boolean = false) => {
    const storedList = getStoredWordList();
    setWordList(storedList);

    if (isRestart) {
      setPracticedWordsInSession(new Set());
      setGameCompletedThisSession(false);
      setIsRewardClaimedThisSession(false);
    }
    

    if (storedList.length > 0) {
      const storedIndex = getStoredCurrentIndex();
      let validIndex = (storedIndex >= 0 && storedIndex < storedList.length) ? storedIndex : 0;
      
      if (isRestart) {
        validIndex = 0;
      }

      setCurrentIndex(validIndex);
      const newWord = storedList[validIndex];
      setCurrentWord(newWord);
      if (newWord && soundEffectsEnabled && !gameCompletedThisSession) speakText(newWord);
      if (storedIndex !== validIndex || isRestart) {
        storeCurrentIndex(validIndex);
      }
    } else {
      setCurrentWord('');
      setCurrentIndex(0);
    }
  }, [gameCompletedThisSession, soundEffectsEnabled]);

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
    if (wordList.length === 0 || gameCompletedThisSession) return;
    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % wordList.length;
    } else {
      newIndex = (currentIndex - 1 + wordList.length) % wordList.length;
    }
    setCurrentIndex(newIndex);
    const newWordToSpeak = wordList[newIndex];
    setCurrentWord(newWordToSpeak);
    storeCurrentIndex(newIndex);
    if (newWordToSpeak && soundEffectsEnabled) speakText(newWordToSpeak);
    playNavigationSound();
  };

  const handleGameResult = (correct: boolean, selectedWord: string) => {
    const currentWordLowerCase = currentWord.toLowerCase();
    
    const afterCurrentWordAudio = () => {
        const newPracticedSet = new Set(practicedWordsInSession);
        if (correct) newPracticedSet.add(currentWordLowerCase); // Add only if correct for this game type
        setPracticedWordsInSession(newPracticedSet);

        if (newPracticedSet.size === wordList.length && wordList.length > 0 && !gameCompletedThisSession) {
            setGameCompletedThisSession(true);
            toast({
                variant: "success",
                title: <div className="flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-400" />{username ? `Superb, ${username}!` : 'Congratulations!'}</div>,
                description: "You've identified all words in this session!",
                duration: 7000,
            });
            playCompletionSound();
            if (soundEffectsEnabled) {
                speakText(username ? `Superb, ${username}! You've identified all words in this session! Time to claim your reward.` : "Congratulations! You've identified all words in this session! Time to claim your reward.");
            }
        } else if (wordList.length > 1 && !gameCompletedThisSession) {
            navigateWord('next');
        } else if (wordList.length === 1 && !gameCompletedThisSession && correct) { // Special case for single word list
            setGameCompletedThisSession(true);
            toast({
                variant: "success",
                title: <div className="flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-400" />{username ? `Awesome, ${username}!` : 'Awesome!'}</div>,
                description: "You've identified the word! Add more to keep practicing.",
                duration: 7000,
            });
            playCompletionSound();
             if (soundEffectsEnabled) speakText(username ? `Awesome, ${username}! You've identified the word! Time to claim your reward.` : "Awesome! You've identified the word! Time to claim your reward.");
        } else if (wordList.length === 1 && !gameCompletedThisSession && !correct) {
            // If only one word and incorrect, allow retry or just show message. Let's allow retry by not auto-navigating.
            // The WordIdentificationGame component will show the feedback for the incorrect attempt.
        }
    };


    if (correct) {
      playSuccessSound();
      toast({
        variant: "success",
        title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />{username ? `Correct, ${username}!` : 'Correct!'}</div>,
        description: `You identified "${currentWord}"!`,
      });
      
      const spokenFeedback = `Correct! You identified ${currentWord}.`;
      if (soundEffectsEnabled) {
        speakText(spokenFeedback, undefined, afterCurrentWordAudio);
      } else {
        setTimeout(afterCurrentWordAudio, 1200); 
      }

    } else {
      playErrorSound();
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Not quite...</div>,
        description: `You chose "${selectedWord}". The word was "${currentWord}".`,
      });

      const spokenFeedback = `Oops. You chose ${selectedWord}. The word was ${currentWord}.`;
      if (soundEffectsEnabled) {
        speakText(spokenFeedback, undefined, afterCurrentWordAudio);
      } else {
        setTimeout(afterCurrentWordAudio, 2200); 
      }
    }
  };

  const handleClaimReward = () => {
    setIsRewardClaimedThisSession(true);
    playRewardClaimedSound();
    toast({
      variant: "success",
      title: <div className="flex items-center gap-2"><Gift className="h-5 w-5 text-yellow-400" /> Reward Claimed!</div>,
      description: `Great job, ${username || 'learner'}! You've earned +10 Sparkle Points! ✨`,
      duration: 5000,
    });
     if (soundEffectsEnabled) {
        speakText(`Reward claimed! You've earned 10 Sparkle Points!`);
    }
  };
  
  if (!isMounted) {
    return (
      <div className="space-y-6 md:space-y-8" aria-live="polite" aria-busy="true">
        <Card className="shadow-lg animate-pulse">
            <div className="p-6 md:p-10 flex flex-col items-center justify-center gap-6 min-h-[250px] md:min-h-[300px]">
                <div className="h-20 w-3/4 bg-muted rounded"></div>
                <div className="h-12 w-1/2 bg-primary/50 rounded"></div>
            </div>
        </Card>
        <Card className="shadow-lg animate-pulse">
            <div className="p-6 space-y-4">
                <div className="h-10 w-full bg-muted rounded"></div>
                <div className="h-10 w-full bg-muted rounded"></div>
                <div className="h-10 w-full bg-muted rounded"></div>
                 <div className="h-10 w-full bg-muted rounded"></div>
            </div>
        </Card>
        <p className="sr-only">Loading word identification game...</p>
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
            src="https://images.unsplash.com/photo-1653276055789-26fdc328680f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTR8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D" 
            alt="Child pointing at a word, identifying it"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="word identification game" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Target className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Identify Words</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Listen and choose the correct word.</p>
          </div>
        </div>
      </header>

      {wordList.length < 2 && !gameCompletedThisSession ? (
        <Alert variant="info" className="max-w-xl mx-auto text-center bg-card shadow-md border-accent/20 animate-in fade-in-0 zoom-in-95 duration-500" aria-live="polite">
            <div className="flex flex-col items-center gap-4">
            <Image 
                src="https://picsum.photos/seed/magnifying-glass-words/200/150" 
                alt="Child with a magnifying glass looking at words"
                width={200}
                height={150}
                className="rounded-lg shadow-md mb-3"
                data-ai-hint="child magnifying glass words"
            />
            <Target className="h-6 w-6 text-primary" aria-hidden="true" />
            <AlertTitle className="text-xl font-semibold mb-2">Not Enough Words!</AlertTitle>
            <AlertDescription className="text-base">
                You need at least 2 words in your practice list to play the identification game.
                Please go to the{' '}
                <Button variant="link" asChild className="p-0 h-auto text-base"><Link href="/learn">Learn Words</Link></Button>
                {' '}page to add more words.
            </AlertDescription>
            </div>
        </Alert>
      ) : gameCompletedThisSession ? (
        <Card className="shadow-lg w-full animate-in fade-in-0 zoom-in-95 duration-300">
            <CardContent className="p-6">
                <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50">
                    <div className="flex flex-col items-center gap-4 py-4">
                        <Trophy className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
                        <AlertTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {username ? `Superb, ${username}!` : 'Session Complete!'}
                        </AlertTitle>
                        <AlertDescription className="text-base">
                            You've successfully identified all words in this session!
                        </AlertDescription>
                        {isRewardClaimedThisSession ? (
                            <div className="mt-3 text-lg font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                                <CheckCircle2 className="h-6 w-6 text-green-500" /> Reward Claimed! +10 ✨
                            </div>
                        ) : (
                            <Button onClick={handleClaimReward} size="lg" className="mt-3 btn-glow bg-yellow-500 hover:bg-yellow-600 text-white">
                                <Gift className="mr-2 h-5 w-5" /> Claim Your Reward!
                            </Button>
                        )}
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
        <>
            <WordDisplay word={currentWord} />
            <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
                <WordIdentificationGame 
                wordToIdentify={currentWord}
                allWords={wordList}
                onGameResult={handleGameResult}
                />
            </div>
            
            {!gameCompletedThisSession && wordList.length > 1 && ( 
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


