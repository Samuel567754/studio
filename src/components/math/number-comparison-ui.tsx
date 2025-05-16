
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Volume2, RefreshCcw, Scaling, Mic, MicOff, Smile, Info } from 'lucide-react';
import Image from 'next/image'; 
import { playSuccessSound, playErrorSound, playNotificationSound, speakText, playCompletionSound, playCoinsEarnedSound, playCoinsDeductedSound } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup'; // Import CoinsLostPopup


interface ComparisonProblem {
  num1: number;
  num2: number;
  questionType: 'bigger' | 'smaller'; 
  correctAnswer: number;
  questionText: string;
  speechText: string;
}

const PROBLEMS_PER_SESSION = 5; 
const POINTS_PER_CORRECT_ANSWER = 1;
const POINTS_DEDUCTED_PER_WRONG_ANSWER = 1;
const SESSION_COMPLETION_BONUS = 5;

const generateComparisonProblem = (): ComparisonProblem => {
  let num1 = Math.floor(Math.random() * 100) + 1; 
  let num2 = Math.floor(Math.random() * 100) + 1;
  while (num2 === num1) { 
    num2 = Math.floor(Math.random() * 100) + 1;
  }

  const questionType = Math.random() < 0.5 ? 'bigger' : 'smaller';
  const correctAnswer = questionType === 'bigger' ? Math.max(num1, num2) : Math.min(num1, num2);
  const questionText = `Which is ${questionType}: ${num1} or ${num2}?`;
  const speechText = `Which number is ${questionType}: ${num1} or ${num2}?`;

  return { num1, num2, questionType, correctAnswer, questionText, speechText };
};

export const NumberComparisonUI = () => {
  const [currentProblem, setCurrentProblem] = useState<ComparisonProblem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [problemsSolvedInSession, setProblemsSolvedInSession] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedButton, setSelectedButton] = useState<number | null>(null); 
  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showCorrectAnswerHighlight, setShowCorrectAnswerHighlight] = useState(false); 
  const [buttonAnimation, setButtonAnimation] = useState<{ index: number; type: 'success' | 'error' } | null>(null);


  const [showCoinsEarnedPopup, setShowCoinsEarnedPopup] = useState(false);
  const [showCoinsLostPopup, setShowCoinsLostPopup] = useState(false);
  const [lastAwardedCoins, setLastAwardedCoins] = useState(0);
  const [lastDeductedCoins, setLastDeductedCoins] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const { username, addGoldenCoins, deductGoldenCoins } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const loadNewProblem = useCallback((isNewSessionStart: boolean = false) => {
    if (sessionCompleted && !isNewSessionStart) return;
    if (!isNewSessionStart && soundEffectsEnabled) playNotificationSound();
    setIsLoading(true);
    setFeedback(null);
    setSelectedButton(null);
    setIsAttempted(false);
    setIsCorrect(null);
    setShowCorrectAnswerHighlight(false);
    setButtonAnimation(null);

    const newProblem = generateComparisonProblem();
    setCurrentProblem(newProblem);
    setIsLoading(false);
  }, [soundEffectsEnabled, sessionCompleted]);

  const startNewSession = useCallback(() => {
    setScore(0);
    setProblemsSolvedInSession(0);
    setSessionCompleted(false);
    loadNewProblem(true);
  }, [loadNewProblem]);

  const handleSessionCompletion = useCallback((finalScore: number) => {
    setSessionCompleted(true);
    addGoldenCoins(SESSION_COMPLETION_BONUS);
    setLastAwardedCoins(SESSION_COMPLETION_BONUS);
    setShowCoinsEarnedPopup(true);
    const completionMessage = username ? `Congratulations, ${username}!` : 'Session Complete!';
    const description = `You solved ${PROBLEMS_PER_SESSION} problems and scored ${finalScore}. You earned ${SESSION_COMPLETION_BONUS} bonus Golden Coins!`;
    toast({
      variant: "success",
      title: <div className="flex items-center gap-2">
               <Image src="/assets/images/golden_trophy_with_stars_illustration.png" alt="Trophy" width={24} height={24} />
               {completionMessage}
             </div>,
      description: description,
      duration: 7000,
    });
    if (soundEffectsEnabled) {
        playCompletionSound();
        speakText(`${completionMessage} ${description}`);
    }
  }, [username, soundEffectsEnabled, toast, addGoldenCoins]);

  const handleAnswer = useCallback((chosenNum: number) => {
    if (!currentProblem || isAttempted || sessionCompleted) return; 

    setIsAttempted(true);
    setSelectedButton(chosenNum);
    const correct = chosenNum === currentProblem.correctAnswer;
    setIsCorrect(correct);
    
    const buttonIndex = currentProblem.num1 === chosenNum ? 0 : 1;
    setButtonAnimation({ index: buttonIndex, type: correct ? 'success' : 'error' });
    setTimeout(() => setButtonAnimation(null), 700);
    
    let newCurrentScore = score;
    if(correct) {
        newCurrentScore = score + 1;
        setScore(newCurrentScore);
        addGoldenCoins(POINTS_PER_CORRECT_ANSWER);
        setLastAwardedCoins(POINTS_PER_CORRECT_ANSWER);
        setShowCoinsEarnedPopup(true);
        if (soundEffectsEnabled) playCoinsEarnedSound();
        toast({
          variant: "success",
          description: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> +{POINTS_PER_CORRECT_ANSWER} Golden Coins!</div>,
          duration: 2000,
        });
    } else {
        deductGoldenCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
        setLastDeductedCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
        setShowCoinsLostPopup(true);
        if (soundEffectsEnabled) playCoinsDeductedSound();
        toast({
          variant: "destructive",
          title: <div className="flex items-center gap-1"><XCircle className="h-5 w-5" /> Oops!</div>,
          description: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> -{POINTS_DEDUCTED_PER_WRONG_ANSWER} Golden Coin.</div>,
          duration: 2000,
        });
    }
    
    const newProblemsSolvedCount = problemsSolvedInSession + 1;
    

    const afterFeedbackAudio = () => {
      setProblemsSolvedInSession(newProblemsSolvedCount); 
      if (newProblemsSolvedCount >= PROBLEMS_PER_SESSION) {
        handleSessionCompletion(newCurrentScore);
      } else {
        loadNewProblem();
      }
    };

    if (correct) {
      const successMessage = `${username ? username + ", y" : "Y"}ou got it right! ${chosenNum} is indeed the ${currentProblem.questionType} one.`;
      setFeedback({ type: 'success', message: successMessage });
      if (soundEffectsEnabled) playSuccessSound();
      const speechSuccessMsg = `${username ? username + ", y" : "Y"}ou got it! ${chosenNum} is ${currentProblem.questionType}.`;
      
      if (soundEffectsEnabled) {
        const utterance = speakText(speechSuccessMsg, undefined, () => setTimeout(afterFeedbackAudio, 500));
        if (!utterance) setTimeout(afterFeedbackAudio, 1500); 
      } else {
        setTimeout(afterFeedbackAudio, 1200);
      }

    } else {
      const errorMessage = `Not quite${username ? `, ${username}` : ''}. You chose ${chosenNum}.`;
      setFeedback({ type: 'error', message: errorMessage });
      if (soundEffectsEnabled) playErrorSound();
      const speechErrorMsg = `Oops! You chose ${chosenNum}.`;

      const revealCorrectAnswerAndProceed = () => {
        setShowCorrectAnswerHighlight(true);
        setFeedback({type: 'error', message: `The ${currentProblem.questionType} one was ${currentProblem.correctAnswer}.`});
        // Highlight the correct button green
        const correctButtonIndex = currentProblem.num1 === currentProblem.correctAnswer ? 0 : 1;
        setButtonAnimation({ index: correctButtonIndex, type: 'success' });
        setTimeout(() => setButtonAnimation(null), 700);

        if (soundEffectsEnabled) {
            const correctAnswerSpeech = `The ${currentProblem.questionType} number was ${currentProblem.correctAnswer}.`;
            const utterance = speakText(correctAnswerSpeech, undefined, () => setTimeout(afterFeedbackAudio, 500));
            if (!utterance) setTimeout(afterFeedbackAudio, 1800);
        } else {
            setTimeout(afterFeedbackAudio, 1500);
        }
      };
      
      if (soundEffectsEnabled) {
        const utterance = speakText(speechErrorMsg, undefined, () => setTimeout(revealCorrectAnswerAndProceed, 1200));
        if (!utterance) setTimeout(revealCorrectAnswerAndProceed, 1500);
      } else {
        setTimeout(revealCorrectAnswerAndProceed, 1200);
      }
    }
  }, [currentProblem, isAttempted, loadNewProblem, username, soundEffectsEnabled, problemsSolvedInSession, score, handleSessionCompletion, sessionCompleted, addGoldenCoins, deductGoldenCoins, toast]);

  useEffect(() => {
    startNewSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentProblem && !isLoading && !sessionCompleted && currentProblem.speechText && soundEffectsEnabled && !isAttempted) {
      speakText(currentProblem.speechText);
    }
  }, [currentProblem, isLoading, sessionCompleted, soundEffectsEnabled, isAttempted]);

  const handleAnswerRef = useRef(handleAnswer);
  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        const number = parseSpokenNumber(spokenText);
        
        if (number !== null && currentProblem) {
          if (number === currentProblem.num1) {
            handleAnswerRef.current(currentProblem.num1); 
            toast({ 
                title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Heard you!</div>, 
                description: `You said: "${spokenText}". Choosing ${currentProblem.num1}.`, 
                variant: "info" 
            });
          } else if (number === currentProblem.num2) {
            handleAnswerRef.current(currentProblem.num2); 
            toast({ 
                title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Heard you!</div>, 
                description: `You said: "${spokenText}". Choosing ${currentProblem.num2}.`, 
                variant: "info" 
            });
          } else {
            toast({ 
                title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Couldn't match</div>, 
                description: `Heard: "${spokenText}". That's not one of the options. Try again or click.`, 
                variant: "info" 
            });
          }
        } else {
          toast({ 
            title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Couldn't understand</div>, 
            description: `Heard: "${spokenText}". Please try again or click an option.`, 
            variant: "info" 
            });
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({ 
            title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Voice Input Error</div>, 
            description: `Could not recognize speech: ${event.error}. Try clicking.`, 
            variant: "destructive" 
        });
        setIsListening(false);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, [toast, currentProblem]);

  const handleSpeakQuestion = () => {
    if (currentProblem?.speechText && soundEffectsEnabled && !sessionCompleted && !isAttempted) {
      speakText(currentProblem.speechText);
    } else if (!soundEffectsEnabled) {
        toast({ variant: "info", title: "Audio Disabled", description: "Sound effects are turned off in settings." });
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
        toast({ 
            title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Voice Input Not Supported</div>, 
            description: "Your browser doesn't support voice input. Please click an option.", 
            variant: "info", 
            duration: 5000 
        });
        return;
    }
    if (!soundEffectsEnabled) {
        toast({ variant: "info", title: "Audio Disabled", description: "Voice input requires sound effects to be enabled in settings." });
        return;
    }
    if (sessionCompleted || isAttempted) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        if (soundEffectsEnabled) playNotificationSound();
        recognitionRef.current.start();
        setIsListening(true);
        setFeedback(null);
        toast({ 
            title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Listening...</div>, 
            description: "Say one of the numbers.", 
            variant: "info" 
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({ 
            title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Mic Error</div>, 
            description: "Could not start microphone. Check permissions.", 
            variant: "destructive" 
        });
        setIsListening(false);
      }
    }
  };
  
  const handleNextProblemOrNewSession = () => {
    if (sessionCompleted) {
        startNewSession();
    } else {
        loadNewProblem();
    }
  };

  if (isLoading && !currentProblem) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl border-primary/20 relative">
         <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
         <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
            <Scaling className="mr-2 h-6 w-6" /> Number Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="sr-only">Loading new problem...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500 relative">
       <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
       <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
           <Scaling className="mr-2 h-6 w-6" /> {currentProblem ? `Which is ${currentProblem.questionType}?` : "Number Comparison"}
        </CardTitle>
        <CardDescription>
          Score: <span className="font-bold text-accent">{score}</span> | Problem: <span className="font-bold text-accent">{Math.min(problemsSolvedInSession + (!isAttempted && currentProblem ? 1:0), PROBLEMS_PER_SESSION)} / {PROBLEMS_PER_SESSION}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sessionCompleted ? (
             <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50 animate-in fade-in-0 zoom-in-95 duration-500">
                <div className="flex flex-col items-center gap-4 py-4">
                <Image src="/assets/images/golden_trophy_with_stars_illustration.png" alt="Trophy" width={40} height={40} />
                <AlertTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {username ? `Congratulations, ${username}!` : 'Session Complete!'}
                </AlertTitle>
                <AlertDescription className="text-base">
                    You've successfully completed {PROBLEMS_PER_SESSION} problems! Final score: {score}.
                </AlertDescription>
                </div>
            </Alert>
        ) : currentProblem && (
            <>
                <div className="flex justify-center items-center gap-4 my-4">
                <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read question aloud" disabled={isListening || !soundEffectsEnabled || sessionCompleted || isAttempted}>
                    <Volume2 className="h-5 w-5" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={toggleListening}
                    className={cn("h-10 w-10", isListening && "bg-destructive/20 text-destructive animate-pulse")}
                    aria-label={isListening ? "Stop listening" : "Speak your answer"}
                    disabled={isAttempted || isLoading || !recognitionRef.current || !soundEffectsEnabled || sessionCompleted}
                >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                {[currentProblem.num1, currentProblem.num2].map((num, index) => {
                    const isSelected = selectedButton === num;
                    const isActualCorrect = num === currentProblem!.correctAnswer;
                    let buttonSpecificClasses = "";

                    if (isAttempted) {
                        if (isSelected) { 
                            if (isCorrect) {
                                buttonSpecificClasses = "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-500/30 ring-2 ring-green-500";
                            } else { 
                                buttonSpecificClasses = "bg-red-500/20 border-red-500 text-red-700 dark:text-red-400 hover:bg-red-500/30 ring-2 ring-red-500";
                            }
                        } else { 
                            if (showCorrectAnswerHighlight && isActualCorrect) { 
                                buttonSpecificClasses = "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-500";
                            }
                        }
                    }
                    
                    if (buttonAnimation && buttonAnimation.index === index) {
                        buttonSpecificClasses = cn(buttonSpecificClasses, buttonAnimation.type === 'success' ? 'animate-flash-success' : 'animate-flash-error');
                    }


                    return (
                        <Button
                        key={num}
                        variant={"outline"}
                        size="lg"
                        className={cn(
                            "text-4xl h-24 font-bold transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md",
                            buttonSpecificClasses
                        )}
                        onClick={() => handleAnswer(num)}
                        disabled={isAttempted || isLoading || isListening || sessionCompleted}
                        aria-pressed={selectedButton === num}
                        >
                        {num}
                        </Button>
                    );
                })}
                </div>
            </>
        )}
        {feedback && !sessionCompleted && isAttempted && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : feedback.type} className="mt-4 animate-in fade-in-0 zoom-in-95 duration-300">
             {feedback.type === 'success' ? <Smile className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <AlertTitle>
                {feedback.type === 'success' ? (username ? `Great Job, ${username}!` : 'Great Job!') : 'Try Again!'}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
            variant="outline" 
            onClick={handleNextProblemOrNewSession} 
            className="w-full" 
            disabled={isLoading || isListening || (!isAttempted && currentProblem !== null && !sessionCompleted)}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> 
          {sessionCompleted ? "Play New Session" : "Skip / Next Problem"}
        </Button>
      </CardFooter>
    </Card>
  );
};
