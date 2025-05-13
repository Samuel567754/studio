
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { WordDisplay } from '@/components/word-display';
import { useToast } from "@/hooks/use-toast";
import { getStoredWordList, getStoredCurrentIndex, storeCurrentIndex, getStoredReadingLevel } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, CheckCircle2, XCircle, Smile, Lightbulb, Loader2, RefreshCcw, BookOpenCheck, Volume2, ArrowLeft, Trophy, Gift } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { playSuccessSound, playErrorSound, playNavigationSound, speakText, playCompletionSound, playRewardClaimedSound } from '@/lib/audio';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { generateDefinitionMatchGame, type GenerateDefinitionMatchGameInput, type GenerateDefinitionMatchGameOutput } from '@/ai/flows/generate-definition-match-game';
import { cn } from '@/lib/utils';
import { useAppSettingsStore } from '@/stores/app-settings-store';

export default function DefinitionMatchPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentWordForGame, setCurrentWordForGame] = useState<string>('');
  const [readingLevel, setReadingLevel] = useState<string>('beginner');
  const [isMounted, setIsMounted] = useState(false);
  const { username } = useUserProfileStore();
  const { toast } = useToast();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const [gameData, setGameData] = useState<GenerateDefinitionMatchGameOutput | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [practicedWordsInSession, setPracticedWordsInSession] = useState<Set<string>>(new Set());
  const [gameCompletedThisSession, setGameCompletedThisSession] = useState<boolean>(false);
  const [isRewardClaimedThisSession, setIsRewardClaimedThisSession] = useState<boolean>(false);


  const loadWordAndSettingsData = useCallback((isRestart: boolean = false) => {
    const storedList = getStoredWordList();
    setWordList(storedList);
    setReadingLevel(getStoredReadingLevel("beginner"));

    if (isRestart) {
      setPracticedWordsInSession(new Set());
      setGameCompletedThisSession(false);
      setIsRewardClaimedThisSession(false);
    }


    if (storedList.length > 0) {
      const storedIndex = getStoredCurrentIndex();
      let validIndex = (storedIndex >= 0 && storedIndex < storedList.length) ? storedIndex : 0;
      if (isRestart) validIndex = 0;

      setCurrentIndex(validIndex);
      setCurrentWordForGame(storedList[validIndex]);
      if (storedIndex !== validIndex || isRestart) { 
        storeCurrentIndex(validIndex); 
      }
    } else {
      setCurrentWordForGame('');
      setCurrentIndex(0); 
    }
  }, []);

  useEffect(() => {
    loadWordAndSettingsData();
    setIsMounted(true);
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'sightwords_wordList_v1' || 
          event.key === 'sightwords_currentIndex_v1' ||
          event.key === 'sightwords_readingLevel_v1') {
        loadWordAndSettingsData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadWordAndSettingsData]);
  
  const speakQuestionAndOptions = useCallback((word: string | undefined, options: string[] | undefined, hint?: string) => {
    if (!word || !soundEffectsEnabled) return;
    
    let textToSpeak = `What is the definition of ${word}?`;
    if (hint) {
        textToSpeak += ` Hint: ${hint}.`;
    }
    if (options && options.length > 0) {
        textToSpeak += ` Your options are: ${options.join(', ')}. Select one.`;
    }
    speakText(textToSpeak);

  }, [soundEffectsEnabled]);

  const speakHintOnly = useCallback((hint: string | undefined) => {
    if (hint && soundEffectsEnabled) {
      speakText(`Hint: ${hint}`);
    }
  }, [soundEffectsEnabled]);


  const fetchNewDefinitionGame = useCallback(async (wordToDefine: string) => {
    if (!wordToDefine || gameCompletedThisSession) return;
    setIsLoadingGame(true);
    setGameData(null);
    setSelectedOption(null);
    setIsAttempted(false);
    setIsCorrect(null);
    playNavigationSound();

    try {
      const input: GenerateDefinitionMatchGameInput = {
        wordToDefine: wordToDefine,
        readingLevel: readingLevel as 'beginner' | 'intermediate' | 'advanced',
        wordList: wordList.length > 0 ? wordList : undefined,
        username: username || undefined,
      };
      const result = await generateDefinitionMatchGame(input);
      setGameData(result);
      speakQuestionAndOptions(result?.word, result?.options, result?.hint);
    } catch (error) {
      console.error("Error generating definition match game:", error);
      toast({ 
        variant: "destructive", 
        title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Error</div>, 
        description: "Could not generate a game. Please try again or change words." 
      });
      playErrorSound();
    } finally {
      setIsLoadingGame(false);
    }
  }, [readingLevel, wordList, username, toast, speakQuestionAndOptions, gameCompletedThisSession]);

  useEffect(() => {
    if (currentWordForGame && isMounted && !gameCompletedThisSession) {
      fetchNewDefinitionGame(currentWordForGame);
    }
  }, [currentWordForGame, fetchNewDefinitionGame, isMounted, gameCompletedThisSession]);

  const navigateWord = (direction: 'next' | 'prev') => {
    if (wordList.length === 0 || gameCompletedThisSession) return;
    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % wordList.length;
    } else {
      newIndex = (currentIndex - 1 + wordList.length) % wordList.length;
    }
    setCurrentIndex(newIndex);
    const newWord = wordList[newIndex];
    setCurrentWordForGame(newWord); 
    storeCurrentIndex(newIndex);
  };

  const handleOptionClick = (option: string) => {
    if (isAttempted || !gameData || gameCompletedThisSession) return; 

    setSelectedOption(option);
    setIsAttempted(true);
    const correct = option.toLowerCase() === gameData.correctDefinition.toLowerCase();
    setIsCorrect(correct);
    const currentWordLowerCase = gameData.word.toLowerCase();


    const afterCurrentQuestionAudio = () => {
        if (practicedWordsInSession.size === wordList.length && wordList.length > 0 && !gameCompletedThisSession) {
            setGameCompletedThisSession(true);
            toast({
            variant: "success",
            title: <div className="flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-400" />{username ? `Amazing, ${username}!` : 'Congratulations!'}</div>,
            description: "You've completed all words in this Definition Match session!",
            duration: 7000,
            });
            playCompletionSound();
            if (soundEffectsEnabled) {
            speakText(username ? `Amazing, ${username}! You've completed all words in this Definition Match session! Time to claim your reward.` : "Congratulations! You've completed all words in this Definition Match session! Time to claim your reward.");
            }
        } else if (wordList.length > 1 && !gameCompletedThisSession) { 
            navigateWord('next');
        }
    };


    if (correct) {
      playSuccessSound();
      toast({
        variant: "success",
        title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />{username ? `Correct, ${username}!` : 'Correct!'}</div>,
        description: `That's the right definition for "${gameData.word}"!`,
      });

      setPracticedWordsInSession(prev => {
        const newSet = new Set(prev);
        if (!newSet.has(currentWordLowerCase)) {
          newSet.add(currentWordLowerCase);
        }
        return newSet;
      });
      
      const spokenFeedback = `Correct! ${option} is the right definition for ${gameData.word}.`;
      if (soundEffectsEnabled) {
        speakText(spokenFeedback, undefined, () => {
          setTimeout(afterCurrentQuestionAudio, 500); 
        });
      } else {
        setTimeout(afterCurrentQuestionAudio, 1500); 
      }

    } else {
      playErrorSound();
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Not quite...</div>,
        description: `The correct definition for "${gameData.word}" was: "${gameData.correctDefinition}".`,
      });

      const spokenFeedback = `Oops. The correct definition for ${gameData.word} was: ${gameData.correctDefinition}.`;
       if (soundEffectsEnabled) {
        speakText(spokenFeedback, undefined, () => {
          setTimeout(afterCurrentQuestionAudio, 1500); 
        });
      } else {
        setTimeout(afterCurrentQuestionAudio, 2500); 
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
        <Card className="shadow-lg animate-pulse"><CardContent className="p-6 min-h-[200px] bg-muted rounded-lg"></CardContent></Card>
        <Card className="shadow-lg animate-pulse"><CardContent className="p-6 min-h-[300px] bg-muted rounded-lg"></CardContent></Card>
        <p className="sr-only">Loading definition match game...</p>
      </div>
    );
  }

  if (wordList.length < 1) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" className="group">
            <Link href="/ai-games">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to AI Games
            </Link>
          </Button>
        </div>
        <Alert variant="info" className="max-w-xl mx-auto text-center bg-card shadow-md border-accent/20 animate-in fade-in-0 zoom-in-95 duration-500" aria-live="polite">
          <div className="flex flex-col items-center gap-4">
            <Image 
              src="https://images.unsplash.com/photo-1727434032773-af3cd98375ba?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fGFpfGVufDB8fDB8fHww"
              alt="AI circuitry connecting ideas for definitions"
              width={200}
              height={150}
              className="rounded-lg shadow-md mb-3"
              data-ai-hint="AI circuit definition"
            />
            <Lightbulb className="h-6 w-6 text-primary" aria-hidden="true" />
            <AlertTitle className="text-xl font-semibold mb-2">Add Words to Play!</AlertTitle>
            <AlertDescription className="text-base">
              You need at least one word in your practice list to play the Word Definition Match game.
              Please go to the{' '}
              <Button variant="link" asChild className="p-0 h-auto text-base"><Link href="/learn">Learn Words</Link></Button>
              {' '}page to add words.
            </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
       <div className="mb-6">
        <Button asChild variant="outline" className="group">
          <Link href="/ai-games">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to AI Games
          </Link>
        </Button>
      </div>

       <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://plus.unsplash.com/premium_photo-1725907643701-9ba38affe7bb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzd8fGFpfGVufDB8fDB8fHww"
            alt="AI connecting words to definitions"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="AI definition match" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <BookOpenCheck className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Word Definition Match</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Match words to their AI-generated definitions.</p>
          </div>
        </div>
      </header>

      <WordDisplay word={currentWordForGame} /> 
      
      <Card className="shadow-lg w-full animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-primary">
            <BookOpenCheck className="mr-2 h-5 w-5" /> Word Definition Match
          </CardTitle>
          <CardDescription>Choose the correct definition for the word displayed above.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 min-h-[300px]">
        {gameCompletedThisSession ? (
             <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50 animate-in fade-in-0 zoom-in-95 duration-500">
               <div className="flex flex-col items-center gap-4">
                 <Trophy className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
                 <AlertTitle className="text-2xl font-bold text-green-600 dark:text-green-400">{username ? `Congratulations, ${username}!` : 'Session Complete!'}</AlertTitle>
                 <AlertDescription className="text-base">
                   You've successfully practiced all words in this Definition Match session!
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
                 <div className="flex flex-col sm:flex-row gap-3 mt-3 w-full max-w-xs">
                    <Button onClick={() => loadWordAndSettingsData(true)} variant="outline" className="w-full">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Play Again
                    </Button>
                    <Button asChild className="w-full">
                        <Link href="/ai-games"><ArrowLeft className="mr-2 h-4 w-4" /> Back to AI Games</Link>
                    </Button>
                 </div>
               </div>
             </Alert>
          ) :isLoadingGame ? (
            <div className="flex flex-col justify-center items-center p-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Thinking of definitions...</p>
            </div>
          ) : gameData ? (
            <>
              {gameData.hint && !isAttempted && (
                  <div className="flex items-center justify-center text-sm text-muted-foreground mt-0 mb-3 text-center bg-muted/50 p-2 rounded-md whitespace-normal break-words">
                    <Lightbulb className="inline h-4 w-4 mr-1 text-yellow-500" />
                    Hint: {gameData.hint}
                    {soundEffectsEnabled && (
                         <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => speakHintOnly(gameData.hint)} aria-label="Read hint aloud">
                             <Volume2 className="h-4 w-4"/>
                         </Button>
                     )}
                  </div>
                )}
              <div 
                className="grid grid-cols-1 gap-3 md:gap-4"
                role="radiogroup" 
                aria-label="Definition options"
              >
                {gameData.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="lg"
                    className={cn(
                      "w-full text-left text-base md:text-lg py-4 h-auto justify-start leading-normal transition-all duration-200 ease-in-out transform hover:scale-105 shadow-sm whitespace-normal break-words",
                      isAttempted && option === selectedOption && isCorrect && "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-500/30 ring-2 ring-green-500",
                      isAttempted && option === selectedOption && !isCorrect && "bg-red-500/20 border-red-500 text-red-700 dark:text-red-400 hover:bg-red-500/30 ring-2 ring-red-500",
                      isAttempted && option !== selectedOption && option.toLowerCase() === gameData.correctDefinition.toLowerCase() && "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-500", 
                      !isAttempted && "hover:bg-primary/10 hover:border-primary"
                    )}
                    onClick={() => handleOptionClick(option)}
                    disabled={isAttempted || isLoadingGame}
                    aria-pressed={isAttempted && option === selectedOption}
                  >
                    {option}
                    {isAttempted && option === selectedOption && isCorrect && <CheckCircle2 className="ml-auto h-6 w-6 text-green-600 dark:text-green-500 flex-shrink-0" />}
                    {isAttempted && option === selectedOption && !isCorrect && <XCircle className="ml-auto h-6 w-6 text-red-600 dark:text-red-500 flex-shrink-0" />}
                  </Button>
                ))}
              </div>
            </>
          ) : (
             <div className="flex flex-col justify-center items-center p-10">
                <Info className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Could not load game. Try refreshing the word.</p>
            </div>
          )}
        </CardContent>
         {isAttempted && gameData && !gameCompletedThisSession && (
            <CardFooter className="border-t pt-4">
                 <Alert variant={isCorrect ? "success" : "destructive"} className="w-full">
                    {isCorrect ? <Smile className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    <AlertTitle>
                    {isCorrect ? (username ? `That's it, ${username}!` : 'Correct!') : 'Not this time!'}
                    </AlertTitle>
                    <AlertDescription className="whitespace-normal break-words">
                    {isCorrect ? `You correctly chose the definition for "${gameData.word}"!` : `The correct definition for "${gameData.word}" was: "${gameData.correctDefinition}".`}
                    </AlertDescription>
                </Alert>
            </CardFooter>
        )}
      </Card>
      
      {!gameCompletedThisSession && (
        <Card className="shadow-md border-primary/10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-200">
            <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigateWord('prev')} 
                aria-label="Previous word" 
                className="w-full sm:w-auto order-2 sm:order-1"
                disabled={isLoadingGame}
            >
                <ChevronLeft className="mr-1 md:mr-2 h-5 w-5" aria-hidden="true" /> Previous
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 order-1 sm:order-2 w-full sm:w-auto">
                <Button 
                variant="default" 
                size="lg" 
                onClick={() => fetchNewDefinitionGame(currentWordForGame)} 
                aria-label="New definitions for current word" 
                className="w-full sm:w-auto btn-glow" 
                disabled={isLoadingGame}
                >
                <RefreshCcw className="mr-1 md:mr-2 h-5 w-5" aria-hidden="true" /> New Game
                </Button>
                <span className="text-muted-foreground text-sm whitespace-nowrap font-medium" aria-live="polite" aria-atomic="true">
                Word {currentIndex + 1} / {wordList.length}
                </span>
            </div>

            <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigateWord('next')} 
                aria-label="Next word" 
                className="w-full sm:w-auto order-3"
                disabled={isLoadingGame}
            >
                Next <ChevronRight className="ml-1 md:ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}


