
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { WordDisplay } from '@/components/word-display';
import { useToast } from "@/hooks/use-toast";
import { getStoredWordList, getStoredCurrentIndex, storeCurrentIndex, getStoredReadingLevel } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, CheckCircle2, XCircle, Smile, Lightbulb, Loader2, RefreshCcw, BookOpenCheck, Volume2, ArrowLeft, Trophy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { playSuccessSound, playErrorSound, playNavigationSound, speakText, playCompletionSound, playCoinsEarnedSound, playCoinsDeductedSound } from '@/lib/audio';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { generateDefinitionMatchGame, type GenerateDefinitionMatchGameInput, type GenerateDefinitionMatchGameOutput } from '@/ai/flows/generate-definition-match-game';
import { cn } from '@/lib/utils';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup';

const POINTS_PER_CORRECT_DEFINITION = 2;
const SESSION_COMPLETION_BONUS_POINTS = 10;
const PENALTY_PER_WRONG_FOR_BONUS = 2;
const POINTS_DEDUCTED_PER_WRONG_ANSWER = 1;

export default function DefinitionMatchPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentWordForGame, setCurrentWordForGame] = useState<string>('');
  const [readingLevel, setReadingLevel] = useState<string>('beginner');
  const [isMounted, setIsMounted] = useState(false);
  const { username, addGoldenCoins, deductGoldenCoins } = useUserProfileStore();
  const { toast } = useToast();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const [gameData, setGameData] = useState<GenerateDefinitionMatchGameOutput | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [practicedWordsInSession, setPracticedWordsInSession] = useState<Set<string>>(new Set());
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [sessionIncorrectAnswersCount, setSessionIncorrectAnswersCount] = useState(0);

  const [showCoinsEarnedPopup, setShowCoinsEarnedPopup] = useState(false);
  const [lastAwardedCoins, setLastAwardedCoins] = useState(0);
  const [showCoinsLostPopup, setShowCoinsLostPopup] = useState(false);
  const [lastDeductedCoins, setLastDeductedCoins] = useState(0);


  const loadWordAndSettingsData = useCallback((isRestart: boolean = false) => {
    const storedList = getStoredWordList();
    setWordList(storedList);
    setReadingLevel(getStoredReadingLevel("beginner"));

    if (isRestart) {
      setPracticedWordsInSession(new Set());
      setSessionCompleted(false);
      setSessionIncorrectAnswersCount(0);
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
    if (!wordToDefine || sessionCompleted) return;
    setIsLoadingGame(true);
    setGameData(null);
    setSelectedOption(null);
    setIsAttempted(false);
    setIsCorrect(null);
    if (soundEffectsEnabled) playNavigationSound();

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
      if (soundEffectsEnabled) playErrorSound();
    } finally {
      setIsLoadingGame(false);
    }
  }, [readingLevel, wordList, username, toast, speakQuestionAndOptions, sessionCompleted, soundEffectsEnabled]);

  useEffect(() => {
    if (currentWordForGame && isMounted && !sessionCompleted) {
      fetchNewDefinitionGame(currentWordForGame);
    }
  }, [currentWordForGame, fetchNewDefinitionGame, isMounted, sessionCompleted]);

  const navigateWord = (direction: 'next' | 'prev') => {
    if (wordList.length === 0 || sessionCompleted) return;
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
    if (isAttempted || !gameData || sessionCompleted) return; 

    setSelectedOption(option);
    setIsAttempted(true);
    const correct = option.toLowerCase() === gameData.correctDefinition.toLowerCase();
    setIsCorrect(correct);
    const currentWordLowerCase = gameData.word.toLowerCase();


    const afterCurrentQuestionAudio = () => {
        if (practicedWordsInSession.size === wordList.length && wordList.length > 0 && !sessionCompleted) {
            setSessionCompleted(true);
            const calculatedBonus = Math.max(0, SESSION_COMPLETION_BONUS_POINTS - (sessionIncorrectAnswersCount * PENALTY_PER_WRONG_FOR_BONUS));
            let completionMessage = username ? `Amazing, ${username}!` : 'Congratulations!';
            let description = `You've completed all words in this Definition Match session!`;
            
            if (calculatedBonus > 0) {
              addGoldenCoins(calculatedBonus);
              setLastAwardedCoins(calculatedBonus);
              setShowCoinsEarnedPopup(true);
              if (soundEffectsEnabled) playCoinsEarnedSound();
              description += ` You earned ${calculatedBonus} bonus Golden Coins!`;
            } else {
              description += ` Keep practicing to earn a bonus next time!`;
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
        }
    };


    if (correct) {
      playSuccessSound();
      addGoldenCoins(POINTS_PER_CORRECT_DEFINITION);
      setLastAwardedCoins(POINTS_PER_CORRECT_DEFINITION);
      setShowCoinsEarnedPopup(true);
      if (soundEffectsEnabled) playCoinsEarnedSound();
      toast({
        variant: "success",
        title: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> +{POINTS_PER_CORRECT_DEFINITION} Golden Coins!</div>,
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
      setSessionIncorrectAnswersCount(prev => prev + 1);
      deductGoldenCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
      setLastDeductedCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
      setShowCoinsLostPopup(true);
      if (soundEffectsEnabled) playCoinsDeductedSound();

      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-1"><XCircle className="h-5 w-5" /> Oops! (-{POINTS_DEDUCTED_PER_WRONG_ANSWER} Coin)</div>,
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
  
  if (!isMounted) {
    return (
      <div className="space-y-6 md:space-y-8 relative" aria-live="polite" aria-busy="true">
        <Card className="shadow-lg animate-pulse"><CardContent className="p-6 min-h-[200px] bg-muted rounded-lg"></CardContent></Card>
        <Card className="shadow-lg animate-pulse"><CardContent className="p-6 min-h-[300px] bg-muted rounded-lg"></CardContent></Card>
        <p className="sr-only">Loading definition match game...</p>
      </div>
    );
  }

  if (wordList.length < 1) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto relative">
        <div className="mb-6">
          <Button asChild variant="outline" className="group">
            <Link href="/ai-games">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to AI Games
            </Link>
          </Button>
        </div>
        <Card className="w-full max-w-xl mx-auto shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-500 rounded-lg">
          <div className="relative h-80 md:h-96 w-full">
            <Image 
              src="https://plus.unsplash.com/premium_photo-1666739032226-63f36dbe95d3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fGxlYXJuaW5nJTIwd29yZHN8ZW58MHx8MHx8fDA%3D"
              alt="AI circuitry connecting ideas for definitions"
              layout="fill"
              objectFit="cover"
              className="absolute inset-0"
              data-ai-hint="AI definition"
            />
            <div className="absolute inset-0 bg-black/70" /> 
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
              <Lightbulb className="h-12 w-12 text-primary mb-4" aria-hidden="true" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Add Words to Play!</h2>
              <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-md">
                You need at least one word in your practice list to play the Word Definition Match game.
              </p>
              <Button asChild variant="secondary" size="lg" className="btn-glow text-base md:text-lg px-6 py-3">
                <Link href="/learn">Go to Learn Words</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto relative">
       <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
       <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
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
      
      <Card className="shadow-lg w-full animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100 relative">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-primary">
            <BookOpenCheck className="mr-2 h-5 w-5" /> Word Definition Match
          </CardTitle>
          <CardDescription>Choose the correct definition for the word displayed above.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 min-h-[300px]">
        {sessionCompleted ? (
             <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50 animate-in fade-in-0 zoom-in-95 duration-500">
               <div className="flex flex-col items-center gap-4">
                 <Image src="/assets/images/golden_trophy_with_stars_illustration.png" alt="Trophy" width={40} height={40} />
                 <AlertTitle className="text-2xl font-bold text-green-600 dark:text-green-400">{username ? `Congratulations, ${username}!` : 'Session Complete!'}</AlertTitle>
                 <AlertDescription className="text-base">
                   You've successfully practiced all words in this Definition Match session!
                   {lastAwardedCoins > 0 && ` You earned ${lastAwardedCoins} bonus Golden Coins!`}
                 </AlertDescription>
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
         {isAttempted && gameData && !sessionCompleted && (
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
      
      {!sessionCompleted && (
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

