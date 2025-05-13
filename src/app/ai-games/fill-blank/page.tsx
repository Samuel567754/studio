
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { WordDisplay } from '@/components/word-display';
import { useToast } from "@/hooks/use-toast";
import { getStoredWordList, getStoredCurrentIndex, storeCurrentIndex, getStoredReadingLevel } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, CheckCircle2, XCircle, Smile, Lightbulb, Loader2, RefreshCcw, Edit, Volume2, ArrowLeft, Trophy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { playSuccessSound, playErrorSound, playNavigationSound, speakText, playCompletionSound } from '@/lib/audio';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { generateFillInTheBlankGame, type GenerateFillInTheBlankGameInput, type GenerateFillInTheBlankGameOutput } from '@/ai/flows/generate-fill-in-the-blank-game';
import { cn } from '@/lib/utils';
import { useAppSettingsStore } from '@/stores/app-settings-store';

export default function FillInTheBlankPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentWordForGame, setCurrentWordForGame] = useState<string>('');
  const [readingLevel, setReadingLevel] = useState<string>('beginner');
  const [isMounted, setIsMounted] = useState(false);
  const { username } = useUserProfileStore();
  const { toast } = useToast();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const [gameData, setGameData] = useState<GenerateFillInTheBlankGameOutput | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showCorrectWordAfterIncorrectAttempt, setShowCorrectWordAfterIncorrectAttempt] = useState(false);

  const [practicedWordsInSession, setPracticedWordsInSession] = useState<Set<string>>(new Set());
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  const loadWordAndSettingsData = useCallback((isRestart: boolean = false) => {
    const storedList = getStoredWordList();
    setWordList(storedList);
    setReadingLevel(getStoredReadingLevel("beginner"));

    if (isRestart) {
      setPracticedWordsInSession(new Set());
      setSessionCompleted(false);
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

  const speakSentenceForUI = useCallback((sentence: string | undefined, forBlanked: boolean = true) => {
    if (sentence && soundEffectsEnabled) {
      const textToSpeak = forBlanked ? `Fill in the blank: ${sentence.replace(/_+/g, 'blank')}` : sentence;
      speakText(textToSpeak);
    }
  }, [soundEffectsEnabled]);

  const speakHint = useCallback((hint: string | undefined) => {
    if (hint && soundEffectsEnabled) {
      speakText(`Hint: ${hint}`);
    }
  }, [soundEffectsEnabled]);

  const fetchNewGameProblem = useCallback(async (wordToUse: string) => {
    if (!wordToUse || sessionCompleted) return; 
    setIsLoadingGame(true);
    setGameData(null);
    setSelectedOption(null);
    setIsAttempted(false);
    setIsCorrect(null);
    setShowCorrectWordAfterIncorrectAttempt(false); 
    playNavigationSound();

    try {
      const input: GenerateFillInTheBlankGameInput = {
        wordToPractice: wordToUse,
        readingLevel: readingLevel as 'beginner' | 'intermediate' | 'advanced',
        wordList: wordList.length > 0 ? wordList : undefined,
        username: username || undefined,
      };
      const result = await generateFillInTheBlankGame(input);
      setGameData(result);
      
      if (result?.sentenceWithBlank) {
        const sentenceToSpeak = `Fill in the blank: ${result.sentenceWithBlank.replace(/_+/g, 'blank')}`;
        if (soundEffectsEnabled) {
          speakText(
            sentenceToSpeak,
            undefined, 
            () => { 
              if (result.options && result.options.length > 0) {
                const optionsText = `Your options are: ${result.options.join(', ')}. Select one.`;
                speakText(optionsText); 
              }
            },
            undefined 
          );
        }
      }

    } catch (error) {
      console.error("Error generating fill-in-the-blank game:", error);
      toast({ 
        variant: "destructive", 
        title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Error</div>, 
        description: "Could not generate a game. Please try again or change words." 
      });
      playErrorSound();
    } finally {
      setIsLoadingGame(false);
    }
  }, [readingLevel, wordList, username, toast, soundEffectsEnabled, sessionCompleted]);

  useEffect(() => {
    if (currentWordForGame && isMounted && !sessionCompleted) {
      fetchNewGameProblem(currentWordForGame);
    }
  }, [currentWordForGame, fetchNewGameProblem, isMounted, sessionCompleted]);

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

    const correct = option.toLowerCase() === gameData.correctWord.toLowerCase();
    setIsCorrect(correct);
    const currentWordLowerCase = gameData.correctWord.toLowerCase();

    const afterCurrentQuestionAudio = () => {
      if (practicedWordsInSession.size === wordList.length && wordList.length > 0 && !sessionCompleted) {
        setSessionCompleted(true);
        toast({
          variant: "success",
          title: <div className="flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-400" />{username ? `Amazing, ${username}!` : 'Congratulations!'}</div>,
          description: "You've completed all words in this Fill-in-the-Blank session!",
          duration: 7000,
        });
        playCompletionSound();
        if (soundEffectsEnabled) {
          speakText(username ? `Amazing, ${username}! You've completed all words in this Fill-in-the-Blank session!` : "Congratulations! You've completed all words in this Fill-in-the-Blank session!");
        }
      } else if (wordList.length > 1 && !sessionCompleted) { 
        navigateWord('next');
      }
    };

    if (correct) {
      playSuccessSound();
      toast({
        variant: "success",
        title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />{username ? `Correct, ${username}!` : 'Correct!'}</div>,
        description: `"${gameData.correctWord}" is the right word!`,
      });

      setPracticedWordsInSession(prev => {
        const newSet = new Set(prev);
        if (!newSet.has(currentWordLowerCase)) {
          newSet.add(currentWordLowerCase);
        }
        return newSet;
      });
      
      const spokenSentence = gameData.sentenceWithBlank.replace(/_+/g, gameData.correctWord);
      if (soundEffectsEnabled) {
        speakText(spokenSentence, undefined, () => {
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
        description: `You chose "${option}". The word was "${gameData.correctWord}".`,
      });

      const incorrectDisplayDuration = 1500;
      if (soundEffectsEnabled) {
        const mistakeText = `Oops. You chose ${option}.`;
        speakText(mistakeText, undefined, () => {
          setTimeout(() => {
            setShowCorrectWordAfterIncorrectAttempt(true);
            const correctSentenceText = gameData.sentenceWithBlank.replace(/_+/g, gameData.correctWord);
            const explanationText = `The correct sentence is: ${correctSentenceText}.`;
            speakText(explanationText, undefined, () => {
              setTimeout(afterCurrentQuestionAudio, 1500); 
            });
          }, incorrectDisplayDuration);
        });
      } else {
        setTimeout(() => {
          setShowCorrectWordAfterIncorrectAttempt(true);
          setTimeout(afterCurrentQuestionAudio, 2500); 
        }, incorrectDisplayDuration);
      }
    }
  };
  
  if (!isMounted) {
    return (
      <div className="space-y-6 md:space-y-8" aria-live="polite" aria-busy="true">
        <Card className="shadow-lg animate-pulse"><CardContent className="p-6 min-h-[200px] bg-muted rounded-lg"></CardContent></Card>
        <Card className="shadow-lg animate-pulse"><CardContent className="p-6 min-h-[300px] bg-muted rounded-lg"></CardContent></Card>
        <p className="sr-only">Loading fill-in-the-blank game...</p>
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
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YWl8ZW58MHx8MHx8fDA%3D" 
              alt="AI brain generating word puzzle"
              width={200}
              height={150}
              className="rounded-lg shadow-md mb-3"
              data-ai-hint="AI brain puzzle"
            />
            <Lightbulb className="h-6 w-6 text-primary" aria-hidden="true" />
            <AlertTitle className="text-xl font-semibold mb-2">Add Words to Play!</AlertTitle>
            <AlertDescription className="text-base">
              You need at least one word in your practice list to play the Fill-in-the-Blank game.
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
            src="https://plus.unsplash.com/premium_photo-1682756540097-6a887bbcf9b0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fGFpfGVufDB8fDB8fHww"
            alt="AI creating a fill-in-the-blank sentence puzzle"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="AI sentence puzzle" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Edit className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Fill in the Blank</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Complete sentences with AI-generated challenges.</p>
          </div>
        </div>
      </header>

      <WordDisplay word={currentWordForGame} />
      
      <Card className="shadow-lg w-full animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-primary">
            <Edit className="mr-2 h-5 w-5" /> Fill in the Blank
          </CardTitle>
          <CardDescription>Choose the word that best completes the sentence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 min-h-[250px]">
          {sessionCompleted ? (
             <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50 animate-in fade-in-0 zoom-in-95 duration-500">
               <div className="flex flex-col items-center gap-4">
                 <Trophy className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
                 <AlertTitle className="text-2xl font-bold text-green-600 dark:text-green-400">{username ? `Congratulations, ${username}!` : 'Session Complete!'}</AlertTitle>
                 <AlertDescription className="text-base">
                   You've successfully practiced all words in this Fill-in-the-Blank session!
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
          ) : isLoadingGame ? (
            <div className="flex flex-col justify-center items-center p-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Crafting a sentence for you...</p>
            </div>
          ) : gameData ? (
            <>
              <div className="bg-muted/50 p-4 rounded-lg shadow-inner">
                <div className="flex items-center justify-between">
                    <p className="text-xl md:text-2xl text-foreground leading-relaxed text-center flex-grow flex flex-wrap items-center justify-center" aria-live="polite">
                      {gameData.sentenceWithBlank.split(/(__+)/g).map((part, index) => {
                          if (part.match(/__+/)) { 
                              let wordToShowInBlank = selectedOption;
                              let blankStyleClass = "";

                              if (isAttempted) {
                                  if (isCorrect) {
                                      wordToShowInBlank = selectedOption; 
                                      blankStyleClass = "text-green-700 dark:text-green-400 bg-green-500/20 border border-green-500/50";
                                  } else { 
                                      if (showCorrectWordAfterIncorrectAttempt) {
                                          wordToShowInBlank = gameData.correctWord;
                                          blankStyleClass = "text-green-600 dark:text-green-500 bg-green-500/10 border border-green-500/30 font-semibold";
                                      } else {
                                          wordToShowInBlank = selectedOption; 
                                          blankStyleClass = "text-red-700 dark:text-red-400 bg-red-500/20 border border-red-500/50";
                                      }
                                  }
                              }

                              if (isAttempted && wordToShowInBlank) {
                                  return (
                                      <span
                                          key={`blank-filled-${index}`}
                                          className={cn(
                                              "font-bold inline-block mx-1 px-2 py-0.5 rounded-md transition-colors duration-300 ease-in-out text-2xl md:text-3xl align-bottom",
                                              blankStyleClass
                                          )}
                                      >
                                          {wordToShowInBlank}
                                      </span>
                                  );
                              } else {
                                  return (
                                      <span key={`blank-empty-${index}`} className="font-bold text-accent inline-block min-w-[100px] border-b-2 border-accent mx-1 text-center align-bottom" style={{height: '2rem'}} />
                                  );
                              }
                          }
                          return <span key={`text-part-${index}`}>{part}</span>;
                      })}
                    </p>
                    {soundEffectsEnabled && (
                        <Button variant="ghost" size="icon" onClick={() => speakSentenceForUI(gameData.sentenceWithBlank, true)} aria-label="Read sentence aloud">
                            <Volume2 className="h-5 w-5"/>
                        </Button>
                    )}
                </div>
                {gameData.hint && !isAttempted && (
                  <div className="flex items-center justify-center text-sm text-muted-foreground mt-3 text-center">
                    <Lightbulb className="inline h-4 w-4 mr-1 text-yellow-500" />
                    Hint: {gameData.hint}
                    {soundEffectsEnabled && (
                        <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => speakHint(gameData.hint)} aria-label="Read hint aloud">
                            <Volume2 className="h-4 w-4"/>
                        </Button>
                    )}
                  </div>
                )}
              </div>
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4"
                role="radiogroup" 
                aria-label="Word options to fill the blank"
              >
                {gameData.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="lg"
                    className={cn(
                      "w-full text-lg md:text-xl py-6 h-auto justify-center transition-all duration-200 ease-in-out transform hover:scale-105 shadow-sm",
                      isAttempted && option === selectedOption && isCorrect && "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-500/30 ring-2 ring-green-500",
                      isAttempted && option === selectedOption && !isCorrect && !showCorrectWordAfterIncorrectAttempt && "bg-red-500/20 border-red-500 text-red-700 dark:text-red-400 hover:bg-red-500/30 ring-2 ring-red-500", 
                      isAttempted && option.toLowerCase() === gameData.correctWord.toLowerCase() && (!isCorrect || option !== selectedOption) && showCorrectWordAfterIncorrectAttempt && "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-500", 
                      !isAttempted && "hover:bg-primary/10 hover:border-primary"
                    )}
                    onClick={() => handleOptionClick(option)}
                    disabled={isAttempted || isLoadingGame}
                    aria-pressed={isAttempted && option === selectedOption}
                  >
                    {option}
                    {isAttempted && option === selectedOption && isCorrect && <CheckCircle2 className="ml-3 h-6 w-6 text-green-600 dark:text-green-500" />}
                    {isAttempted && option === selectedOption && !isCorrect && !showCorrectWordAfterIncorrectAttempt && <XCircle className="ml-3 h-6 w-6 text-red-600 dark:text-red-500" />}
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
                    <AlertDescription>
                    {isCorrect ? `You correctly chose "${gameData.correctWord}"!` : `You selected "${selectedOption}". The correct word was "${gameData.correctWord}".`}
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
                onClick={() => fetchNewGameProblem(currentWordForGame)} 
                aria-label="New problem for current word" 
                className="w-full sm:w-auto btn-glow" 
                disabled={isLoadingGame}
              >
                <RefreshCcw className="mr-1 md:mr-2 h-5 w-5" aria-hidden="true" /> New Sentence
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
