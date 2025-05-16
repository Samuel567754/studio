
"use client";

import * as React from 'react'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Zap, RefreshCcw, Volume2, Mic, MicOff, Smile, Info } from 'lucide-react';
import Image from 'next/image'; 
import { playSuccessSound, playErrorSound, playNotificationSound, speakText, playCompletionSound, playCoinsEarnedSound, playCoinsDeductedSound } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup'; // Import CoinsLostPopup

type Operation = '+' | '-' | '*' | '/';
interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
  questionText: string; 
  speechText: string;   
}

const PROBLEMS_PER_SESSION = 5; 
const POINTS_PER_CORRECT_ANSWER = 1;
const POINTS_DEDUCTED_PER_WRONG_ANSWER = 1;
const SESSION_COMPLETION_BONUS = 5;

const generateProblem = (): Problem => {
  const operation = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)] as Operation;
  let num1 = Math.floor(Math.random() * 12) + 1;
  let num2 = Math.floor(Math.random() * 12) + 1;
  let answer: number;
  let questionText = '';
  let speechText = '';

  switch (operation) {
    case '+':
      answer = num1 + num2;
      questionText = `${num1} + ${num2} = ?`;
      speechText = `${num1} plus ${num2} equals what?`;
      break;
    case '-':
      if (num1 < num2) [num1, num2] = [num2, num1]; 
      answer = num1 - num2;
      questionText = `${num1} - ${num2} = ?`;
      speechText = `${num1} minus ${num2} equals what?`;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 10) + 1; 
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
      questionText = `${num1} × ${num2} = ?`;
      speechText = `${num1} times ${num2} equals what?`;
      break;
    case '/':
      answer = Math.floor(Math.random() * 10) + 1; 
      num2 = Math.floor(Math.random() * ( Math.min(10, (answer > 0 ? Math.floor(50 / answer) : 10 ) ) ) ) + 1;
      num1 = answer * num2; 
      if (num1 === 0 && num2 === 0) { 
          num2 = 1;
          num1 = answer * num2;
      } else if (num2 === 0) { 
          num2 = 1; 
          num1 = answer * num2; 
      }
      questionText = `${num1} ÷ ${num2} = ?`;
      speechText = `${num1} divided by ${num2} equals what?`;
      break;
  }
  return { num1, num2, operation, answer, questionText, speechText };
};

export const ArithmeticGameUI = () => {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [problemsSolvedInSession, setProblemsSolvedInSession] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  
  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answerInBlank, setAnswerInBlank] = useState<string | number | null>(null);
  const [showCorrectAnswerAfterIncorrect, setShowCorrectAnswerAfterIncorrect] = useState(false);

  const [showCoinsEarnedPopup, setShowCoinsEarnedPopup] = useState(false);
  const [showCoinsLostPopup, setShowCoinsLostPopup] = useState(false);
  const [lastAwardedCoins, setLastAwardedCoins] = useState(0);
  const [lastDeductedCoins, setLastDeductedCoins] = useState(0);
  const [inputAnimation, setInputAnimation] = useState<'success' | 'error' | null>(null);


  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const answerInputRef = useRef<HTMLInputElement>(null);
  const { username, addGoldenCoins, deductGoldenCoins } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const loadNewProblem = useCallback((isNewSessionStart: boolean = false) => {
    if (sessionCompleted && !isNewSessionStart) return;
    if (isNewSessionStart) {
        setScore(0);
        setProblemsSolvedInSession(0);
        setSessionCompleted(false);
    }
    setIsLoading(true);
    setFeedback(null);
    setUserAnswer('');
    setIsAttempted(false);
    setIsCorrect(null);
    setAnswerInBlank(null);
    setShowCorrectAnswerAfterIncorrect(false);
    setInputAnimation(null);

    const newProblem = generateProblem();
    setCurrentProblem(newProblem);
    setIsLoading(false);
    if (!isNewSessionStart && soundEffectsEnabled) playNotificationSound();
    answerInputRef.current?.focus();
  },[soundEffectsEnabled, sessionCompleted]);

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

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (sessionCompleted || !currentProblem || userAnswer.trim() === '') {
      if (userAnswer.trim() === '') setFeedback({ type: 'info', message: 'Please enter an answer.' });
      return;
    }

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      setFeedback({ type: 'info', message: 'Please enter a valid number.' });
      return;
    }
    
    setIsAttempted(true);
    setAnswerInBlank(answerNum);
    const correct = answerNum === currentProblem.answer;
    setIsCorrect(correct);
    setInputAnimation(correct ? 'success' : 'error');
    setTimeout(() => setInputAnimation(null), 700); // Match animation duration

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
    
    const afterFeedbackAudio = () => {
        const newProblemsSolved = problemsSolvedInSession + 1;
        setProblemsSolvedInSession(newProblemsSolved);

        if (newProblemsSolved >= PROBLEMS_PER_SESSION) {
            handleSessionCompletion(newCurrentScore); 
        } else {
            loadNewProblem();
        }
    };

    if (correct) {
      const successMessage = `${username ? username + ", that's c" : 'C'}orrect! ${currentProblem.questionText.replace('?', currentProblem.answer.toString())}`;
      setFeedback({ type: 'success', message: successMessage });
      if (soundEffectsEnabled) playSuccessSound();
      const speechSuccessMsg = `${username ? username + ", " : ""}Correct! The answer is ${currentProblem.answer}.`;
      
      if (soundEffectsEnabled) {
        const utterance = speakText(speechSuccessMsg, undefined, afterFeedbackAudio);
        if (!utterance) setTimeout(afterFeedbackAudio, 1500);
      } else {
        setTimeout(afterFeedbackAudio,1200);
      }

    } else {
      const errorMessage = `Not quite${username ? `, ${username}` : ''}. You answered ${answerNum}.`;
      setFeedback({ type: 'error', message: errorMessage });
      if (soundEffectsEnabled) playErrorSound();
      const speechErrorMsg = `Oops! You answered ${answerNum}.`;

      const revealCorrectAndProceed = () => {
          setShowCorrectAnswerAfterIncorrect(true);
          setAnswerInBlank(currentProblem.answer); 
          setInputAnimation('success'); // Flash green for correct answer reveal
          setTimeout(() => setInputAnimation(null), 700);
          if (soundEffectsEnabled) {
              const correctAnswerSpeech = `The correct answer was ${currentProblem.answer}.`;
              const utteranceReveal = speakText(correctAnswerSpeech, undefined, () => setTimeout(afterFeedbackAudio, 500));
              if(!utteranceReveal) setTimeout(afterFeedbackAudio, 1800);
          } else {
              setTimeout(afterFeedbackAudio, 1500);
          }
      };

      if (soundEffectsEnabled) {
        const utterance = speakText(speechErrorMsg, undefined, () => setTimeout(revealCorrectAndProceed, 1200));
        if (!utterance) setTimeout(revealCorrectAndProceed, 1500); 
      } else {
         setTimeout(revealCorrectAndProceed, 1200);
      }
    }
  }, [currentProblem, userAnswer, loadNewProblem, username, soundEffectsEnabled, problemsSolvedInSession, handleSessionCompletion, sessionCompleted, score, addGoldenCoins, deductGoldenCoins, toast]);


  useEffect(() => {
    loadNewProblem(true); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (currentProblem && !isLoading && !sessionCompleted && currentProblem.speechText && soundEffectsEnabled && !isAttempted) {
      speakText(currentProblem.speechText);
    }
  }, [currentProblem, isLoading, sessionCompleted, soundEffectsEnabled, isAttempted]);

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);


  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        const number = parseSpokenNumber(spokenText);
        if (number !== null) {
          setUserAnswer(String(number));
           toast({ 
            title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Heard you!</div>, 
            description: `You said: "${spokenText}". We interpreted: "${String(number)}".`, 
            variant: "info" 
           });
           setTimeout(() => handleSubmitRef.current(), 50); 
        } else {
          toast({ 
            title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Couldn't understand</div>, 
            description: `Heard: "${spokenText}". Please try again or type the number.`, 
            variant: "info" 
          });
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({ 
            title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Voice Input Error</div>, 
            description: `Could not recognize speech: ${event.error}. Try typing.`, 
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
  }, [toast]);


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
            description: "Your browser doesn't support voice input. Please type your answer.", 
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
            description: "Speak your answer.", 
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
        loadNewProblem(true); 
    } else {
        loadNewProblem(); 
    }
  };
  
  const renderEquationWithBlank = () => {
    if (!currentProblem) return null;
    const { num1, num2, operation } = currentProblem;
    let operatorSymbol = '';
    switch(operation) {
      case '+': operatorSymbol = '+'; break;
      case '-': operatorSymbol = '-'; break;
      case '*': operatorSymbol = '×'; break;
      case '/': operatorSymbol = '÷'; break;
    }

    let blankStyleClass = "";
    if (isAttempted) {
        if (isCorrect) {
            blankStyleClass = "text-green-600 dark:text-green-400 bg-green-500/20 border-green-500/50";
        } else if (showCorrectAnswerAfterIncorrect) {
            blankStyleClass = "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/30 font-semibold";
        } else {
            blankStyleClass = "text-red-600 dark:text-red-400 bg-red-500/20 border-red-500/50";
        }
    }

    return (
      <p 
        className="text-5xl md:text-6xl font-bold text-gradient-primary-accent bg-clip-text text-transparent drop-shadow-sm py-2 select-none flex-grow text-center flex items-center justify-center" 
        aria-live="polite"
        data-ai-hint="math equation"
      >
        {num1} <span className="mx-2 text-foreground/80">{operatorSymbol}</span> {num2} <span className="mx-2 text-foreground/80">=</span> 
        {isAttempted && answerInBlank !== null ? (
          <span className={cn("inline-block px-2 py-0.5 rounded-md transition-colors duration-300 ease-in-out min-w-[60px] text-center", blankStyleClass)}>
            {answerInBlank}
          </span>
        ) : (
          <span className="inline-block min-w-[60px] border-b-2 border-accent text-center">?</span>
        )}
      </p>
    );
  };


  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500 relative">
      <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
      <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
          <Zap className="mr-2 h-6 w-6" /> Quick Maths!
        </CardTitle>
        <CardDescription>
          Score: <span className="font-bold text-accent">{score}</span> | 
          Problem: <span className="font-bold text-accent">{Math.min(problemsSolvedInSession + (currentProblem && !sessionCompleted ? 1 : 0), PROBLEMS_PER_SESSION)} / {PROBLEMS_PER_SESSION}</span>
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
        ) :isLoading && !currentProblem ? ( 
          <div className="flex justify-center items-center min-h-[100px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="sr-only">Loading new problem...</p>
          </div>
        ) : currentProblem && (
          <div className="text-center space-y-4 animate-in fade-in-0 duration-300">
            <div className="flex justify-center items-center gap-4 my-2">
                {renderEquationWithBlank()}
                <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read problem aloud" disabled={isListening || !soundEffectsEnabled || sessionCompleted || isAttempted}>
                    <Volume2 className="h-6 w-6" />
                </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="math-answer" className="sr-only">Your Answer</Label>
                <Input
                  id="math-answer"
                  ref={answerInputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Your answer"
                  className={cn(
                    "text-2xl p-3 h-14 text-center shadow-sm focus:ring-2 focus:ring-primary flex-grow",
                    inputAnimation === 'success' && "animate-flash-success",
                    inputAnimation === 'error' && "animate-shake-error animate-flash-error"
                  )}
                  aria-label="Enter your answer for the math problem"
                  disabled={isAttempted || isLoading || isListening || sessionCompleted}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={toggleListening} 
                    className={cn("h-14 w-14", isListening && "bg-destructive/20 text-destructive animate-pulse")}
                    aria-label={isListening ? "Stop listening" : "Speak your answer"}
                    disabled={isAttempted || isLoading || isListening || !recognitionRef.current || !soundEffectsEnabled || sessionCompleted}
                >
                    {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              </div>
              <Button type="submit" size="lg" className="w-full btn-glow !text-lg" disabled={isAttempted || isLoading || isListening || sessionCompleted}>
                Check Answer
              </Button>
            </form>
          </div>
        )}
        {feedback && !sessionCompleted && isAttempted && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : feedback.type} className="mt-4 animate-in fade-in-0 zoom-in-95 duration-300">
            {feedback.type === 'success' ? <Smile className="h-5 w-5" /> : feedback.type === 'error' ? <XCircle className="h-5 w-5" /> : null}
            <AlertTitle>
              {feedback.type === 'success' ? (username ? `Well done, ${username}!` : 'Correct!') : 
               feedback.type === 'error' ? 'Try Again!' : 'Info'}
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
          {sessionCompleted ? "Start New Session" : "Skip / Next Problem"}
        </Button>
      </CardFooter>
    </Card>
  );
};
