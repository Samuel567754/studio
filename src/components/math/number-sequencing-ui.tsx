
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Volume2, RefreshCcw, ChevronsRight, Mic, MicOff, Smile, Info } from 'lucide-react';
import Image from 'next/image';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText, playCompletionSound, playCoinsEarnedSound, playCoinsDeductedSound } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup';

interface SequenceProblem {
  sequenceDisplay: (number | string)[];
  correctAnswer: number;
  questionText: string;
  speechText: string;
}

const PROBLEMS_PER_SESSION = 5;
const POINTS_PER_CORRECT_ANSWER = 1;
const POINTS_DEDUCTED_PER_WRONG_ANSWER = 1;
const SESSION_COMPLETION_BONUS = 5;
const PENALTY_PER_WRONG_FOR_BONUS = 1;

const generateSequenceProblem = (): SequenceProblem => {
  const start = Math.floor(Math.random() * 20) + 1;
  const diffTypes = [1, 2, 3, 5, 10];
  const difference = diffTypes[Math.floor(Math.random() * diffTypes.length)];
  const length = 4;
  const blankIndex = Math.floor(Math.random() * (length -1)) + 1;

  const fullSequence: number[] = [];
  for (let i = 0; i < length; i++) {
    fullSequence.push(start + i * difference);
  }

  const correctAnswer = fullSequence[blankIndex];
  const sequenceDisplay: (number | string)[] = fullSequence.map((num, idx) => (idx === blankIndex ? "__" : num));

  const questionText = `What number fits the blank: ${sequenceDisplay.join(', ')}?`;
  const speechText = `What number fits the blank in the sequence: ${sequenceDisplay.map(s => s === "__" ? "blank" : s).join(', ')}?`;

  return { sequenceDisplay, correctAnswer, questionText, speechText };
};

export const NumberSequencingUI = () => {
  const [currentProblem, setCurrentProblem] = useState<SequenceProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [problemsAttemptedInSession, setProblemsAttemptedInSession] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answerInBlank, setAnswerInBlank] = useState<string | number | null>(null);
  const [showCorrectAnswerAfterIncorrect, setShowCorrectAnswerAfterIncorrect] = useState(false);
  const [inputAnimation, setInputAnimation] = useState<'success' | 'error' | null>(null);

  const [showCoinsEarnedPopup, setShowCoinsEarnedPopup] = useState(false);
  const [showCoinsLostPopup, setShowCoinsLostPopup] = useState(false);
  const [lastAwardedCoins, setLastAwardedCoins] = useState(0);
  const [lastDeductedCoins, setLastDeductedCoins] = useState(0);


  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const answerInputRef = useRef<HTMLInputElement | null>(null);
  const { username, addGoldenCoins, deductGoldenCoins } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const loadNewProblem = useCallback((isNewSessionStart: boolean = false) => {
    if (sessionCompleted && !isNewSessionStart) return;
    if (isNewSessionStart) {
        setScore(0);
        setProblemsAttemptedInSession(0);
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

    const newProblem = generateSequenceProblem();
    setCurrentProblem(newProblem);
    setIsLoading(false);
    if (!isNewSessionStart && soundEffectsEnabled) playNotificationSound();
    answerInputRef.current?.focus();
  },[soundEffectsEnabled, sessionCompleted]);

  const handleSessionCompletion = useCallback((finalScore: number) => {
    setSessionCompleted(true);
    const wrongAnswersInSession = PROBLEMS_PER_SESSION - finalScore;
    const calculatedBonus = Math.max(0, SESSION_COMPLETION_BONUS - (wrongAnswersInSession * PENALTY_PER_WRONG_FOR_BONUS));

    if (calculatedBonus > 0) {
      addGoldenCoins(calculatedBonus);
      setLastAwardedCoins(calculatedBonus);
      setShowCoinsEarnedPopup(true);
      if (soundEffectsEnabled) playCoinsEarnedSound();
    }

    const completionMessage = username ? `Congratulations, ${username}!` : 'Session Complete!';
    const description = `You completed ${PROBLEMS_PER_SESSION} problems and scored ${finalScore}. ${calculatedBonus > 0 ? `You earned ${calculatedBonus} bonus Golden Coins!` : 'Keep practicing for a bonus!'}`;
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
    const correct = answerNum === currentProblem.correctAnswer;
    setIsCorrect(correct);
    setInputAnimation(correct ? 'success' : 'error');
    setTimeout(() => setInputAnimation(null), 700);

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
          title: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> +{POINTS_PER_CORRECT_ANSWER} Golden Coins!</div>,
          description: "Correct!",
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

    const newProblemsAttempted = problemsAttemptedInSession + 1;

    const afterFeedbackAudio = () => {
        setProblemsAttemptedInSession(newProblemsAttempted);

        if (newProblemsAttempted >= PROBLEMS_PER_SESSION) {
            handleSessionCompletion(newCurrentScore);
        } else {
            loadNewProblem();
        }
    };

    if (correct) {
      const successMessage = `${username ? username + ", y" : "Y"}ou got it! The number is ${currentProblem.correctAnswer}.`;
      setFeedback({ type: 'success', message: successMessage });
      if (soundEffectsEnabled) playSuccessSound();
      const speechSuccessMsg = `${username ? username + ", t" : "T"}hat's right! ${currentProblem.correctAnswer} completes the sequence.`;

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
        setAnswerInBlank(currentProblem.correctAnswer);
        setInputAnimation('success');
        setTimeout(() => setInputAnimation(null), 700);
        if (soundEffectsEnabled) {
            const correctAnswerSpeech = `The correct answer was ${currentProblem.correctAnswer}.`;
            const utteranceReveal = speakText(correctAnswerSpeech, undefined, () => setTimeout(afterFeedbackAudio, 500));
            if (!utteranceReveal) setTimeout(afterFeedbackAudio, 1800);
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
  }, [currentProblem, userAnswer, loadNewProblem, username, soundEffectsEnabled, problemsAttemptedInSession, handleSessionCompletion, sessionCompleted, score, addGoldenCoins, deductGoldenCoins, toast]);


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
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
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
            description: "Speak the missing number.",
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

  const handleSkipOrNextProblem = () => {
    if (sessionCompleted) {
        loadNewProblem(true);
    } else {
      // const newProblemsAttempted = problemsAttemptedInSession + 1;
      // if (newProblemsAttempted >= PROBLEMS_PER_SESSION) {
      //      setProblemsAttemptedInSession(newProblemsAttempted);
      //      handleSessionCompletion(score);
      // } else {
      //     setProblemsAttemptedInSession(newProblemsAttempted);
          loadNewProblem();
      // }
    }
  };

  const renderEquationWithBlank = () => {
    if (!currentProblem) return null;
    const { sequenceDisplay } = currentProblem;

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
        className="text-3xl md:text-4xl font-bold select-none flex-grow text-center flex items-center justify-center flex-wrap gap-x-1"
        aria-live="polite"
      >
        {sequenceDisplay.map((item, index) => (
          <React.Fragment key={`item-frag-${index}`}>
            {item === "__" ? (
              isAttempted && answerInBlank !== null ? (
                <span key={`blank-filled-${index}`} className={cn("inline-block px-2 py-0.5 rounded-md transition-colors duration-300 ease-in-out min-w-[40px] md:min-w-[50px] text-center text-4xl md:text-5xl", blankStyleClass)}>
                  {answerInBlank}
                </span>
              ) : (
                <span key={`blank-empty-${index}`} className="inline-block min-w-[40px] md:min-w-[50px] border-b-2 border-accent text-center text-4xl md:text-5xl align-bottom leading-none">?</span>
              )
            ) : (
              <span key={`item-${index}`} className="text-gradient-primary-accent text-4xl md:text-5xl align-bottom leading-none">
                {item}
              </span>
            )}
            {index < sequenceDisplay.length - 1 && (
              <span className="text-foreground/70 text-4xl md:text-5xl align-bottom leading-none mx-0.5">,</span>
            )}
          </React.Fragment>
        ))}
      </p>
    );
  };


  if (isLoading && !currentProblem) {
    return (
       <Card className="w-full max-w-lg mx-auto shadow-xl border-primary/20 relative">
         <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
         <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
            <ChevronsRight className="mr-2 h-6 w-6" /> Number Sequencing
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
    <Card className="w-full max-w-lg mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500 relative">
       <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
       <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
          <ChevronsRight className="mr-2 h-6 w-6" /> Complete the Sequence
        </CardTitle>
        <CardDescription>
          Score: <span className="font-bold text-accent">{score}</span> |
          Problem: <span className="font-bold text-accent">{Math.min(problemsAttemptedInSession + (!isAttempted && currentProblem ? 1:0), PROBLEMS_PER_SESSION)} / {PROBLEMS_PER_SESSION}</span>
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
          <div className="text-center space-y-4 animate-in fade-in-0 duration-300">
            <div className="flex justify-center items-center gap-4 my-2 min-h-[60px] bg-muted/30 p-4 rounded-lg">
                {renderEquationWithBlank()}
                <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read sequence problem aloud" disabled={isListening || !soundEffectsEnabled || sessionCompleted || isAttempted}>
                    <Volume2 className="h-5 w-5" />
                </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sequence-answer" className="sr-only">Your Answer for the blank</Label>
                <Input
                  id="sequence-answer"
                  ref={answerInputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type missing number"
                  className={cn(
                    "text-2xl p-3 h-14 text-center shadow-sm focus:ring-2 focus:ring-primary flex-grow",
                    inputAnimation === 'success' && "animate-flash-success",
                    inputAnimation === 'error' && "animate-shake-error animate-flash-error"
                  )}
                  aria-label="Enter the missing number in the sequence"
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
                {feedback.type === 'success' ? (username ? `Awesome, ${username}!` : 'Awesome!') : 'Keep Going!'}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
            variant="outline"
            onClick={handleSkipOrNextProblem}
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
