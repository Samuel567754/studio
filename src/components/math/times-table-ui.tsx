
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Repeat, ListOrdered, Volume2, Mic, MicOff, Smile, Info, Trophy, RefreshCcw } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText, playCompletionSound } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';

interface TimesTableProblem {
  factor1: number; 
  factor2: number; 
  answer: number;
  questionText: string; 
  speechText: string;   
}

const generateTimesTableProblem = (table: number, multiplier: number): TimesTableProblem => {
  return {
    factor1: table,
    factor2: multiplier,
    answer: table * multiplier,
    questionText: `${table} × ${multiplier} = ?`,
    speechText: `${table} times ${multiplier} equals what?`,
  };
};

const MAX_MULTIPLIER = 12; 

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const TimesTableUI = () => {
  const [selectedTable, setSelectedTable] = useState<number>(2); 
  const [shuffledMultipliers, setShuffledMultipliers] = useState<number[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [currentProblem, setCurrentProblem] = useState<TimesTableProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  const [score, setScore] = useState(0); // Tracks correct answers in the session
  const [problemsAttemptedInSession, setProblemsAttemptedInSession] = useState(0); // Tracks how many of the 12 multipliers have been presented
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  
  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answerInBlank, setAnswerInBlank] = useState<string | number | null>(null);
  const [showCorrectAnswerAfterIncorrect, setShowCorrectAnswerAfterIncorrect] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const answerInputRef = useRef<HTMLInputElement>(null);
  const { username } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const tableOptions = useMemo(() => Array.from({ length: 11 }, (_, i) => i + 2), []); 

  const resetProblemState = useCallback(() => {
    setUserAnswer('');
    setFeedback(null);
    setIsAttempted(false);
    setIsCorrect(null);
    setAnswerInBlank(null);
    setShowCorrectAnswerAfterIncorrect(false);
    answerInputRef.current?.focus();
  }, []);


  const handleSessionCompletion = useCallback((finalScore: number) => {
    setSessionCompleted(true);
    const completionMsg = `${username ? `Amazing job, ${username}!` : 'Table Complete!'} You scored ${finalScore} out of ${MAX_MULTIPLIER} for the ${selectedTable} times table.`;
    // Visual feedback is handled by the sessionCompleted state change
    if (soundEffectsEnabled) {
        playCompletionSound();
        speakText(completionMsg);
    }
    toast({
        variant: "success",
        title: <div className="flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-400" />Table Mastered!</div>,
        description: completionMsg,
        duration: 7000,
    });
  }, [selectedTable, username, soundEffectsEnabled, toast]);


  const loadNextProblem = useCallback((currentSessionScore: number) => {
    resetProblemState();
    if (currentProblemIndex < MAX_MULTIPLIER -1) {
      setCurrentProblemIndex(prev => prev + 1);
       if (soundEffectsEnabled) playNotificationSound();
    } else {
      handleSessionCompletion(currentSessionScore);
    }
  }, [currentProblemIndex, soundEffectsEnabled, resetProblemState, handleSessionCompletion]);


  const startNewTablePractice = useCallback((table: number, isInitialLoad: boolean = false) => {
    setIsLoading(true);
    const multipliers = Array.from({ length: MAX_MULTIPLIER }, (_, i) => i + 1);
    setShuffledMultipliers(shuffleArray(multipliers));
    setCurrentProblemIndex(0);
    setScore(0);
    setProblemsAttemptedInSession(0);
    setSessionCompleted(false);
    resetProblemState();
    if (!isInitialLoad && soundEffectsEnabled) playNotificationSound();
    setIsLoading(false); 
  }, [soundEffectsEnabled, resetProblemState]);
  
  useEffect(() => {
    startNewTablePractice(selectedTable, true);
  }, [selectedTable, startNewTablePractice]);

  useEffect(() => {
    if (shuffledMultipliers.length > 0 && currentProblemIndex < shuffledMultipliers.length && !sessionCompleted) {
      setIsLoading(true);
      const currentFactor2 = shuffledMultipliers[currentProblemIndex];
      const newProblem = generateTimesTableProblem(selectedTable, currentFactor2);
      setCurrentProblem(newProblem);
      resetProblemState(); // Ensure state is clean for new problem
      setIsLoading(false);
    }
  }, [selectedTable, shuffledMultipliers, currentProblemIndex, sessionCompleted, resetProblemState]);


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
    
    let newCurrentScore = score;
    if (correct) {
        newCurrentScore = score + 1;
        setScore(newCurrentScore);
    }
    setProblemsAttemptedInSession(prev => prev + 1);


    const afterFeedbackAudio = () => {
      // Pass the score that will be current after this problem's result
      loadNextProblem(newCurrentScore);
    };

    if (correct) {
      const successMessage = `${username ? username + ", t" : "T"}hat's right! ${currentProblem.questionText.replace('?', currentProblem.answer.toString())}`;
      setFeedback({ type: 'success', message: successMessage });
      if (soundEffectsEnabled) playSuccessSound();
      const speechSuccessMsg = `${username ? username + ", " : ""}Correct! The answer is ${currentProblem.answer}.`;
      
      if (soundEffectsEnabled) {
        const utterance = speakText(speechSuccessMsg, undefined, afterFeedbackAudio);
        if (!utterance) setTimeout(afterFeedbackAudio, 1500);
      } else {
        afterFeedbackAudio();
      }

    } else {
      const errorMessage = `Not quite${username ? `, ${username}` : ''}. You answered ${answerNum}.`;
      setFeedback({ type: 'error', message: errorMessage });
      if (soundEffectsEnabled) playErrorSound();
      const speechErrorMsg = `Oops! You answered ${answerNum}.`;

      const revealCorrectAndProceed = () => {
          setShowCorrectAnswerAfterIncorrect(true);
          setAnswerInBlank(currentProblem.answer); 
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
  }, [currentProblem, userAnswer, loadNextProblem, username, soundEffectsEnabled, sessionCompleted, score]);


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
           setTimeout(() => handleSubmitRef.current(), 0);
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
        recognitionRef.current?.stop();
    };
  }, [toast]);

  const handleTableChange = (value: string) => {
    const tableNum = parseInt(value, 10);
    setSelectedTable(tableNum); 
  };

  const handleSpeakQuestion = () => {
    if (currentProblem?.speechText && !sessionCompleted && soundEffectsEnabled && !isAttempted) {
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
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (sessionCompleted || isAttempted ) return; 
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

  const handleRestartOrNext = () => {
    if (sessionCompleted) {
        startNewTablePractice(selectedTable);
    } else {
        // Skip current problem - pass current score as it's not being updated by this "skip" action
        loadNextProblem(score); 
    }
  };
  
  const renderEquationWithBlank = () => {
    if (!currentProblem) return null;
    const { factor1, factor2 } = currentProblem;
    
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
        data-ai-hint="multiplication problem"
      >
        {factor1} <span className="mx-2 text-foreground/80">×</span> {factor2} <span className="mx-2 text-foreground/80">=</span> 
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
  
  if (isLoading && !currentProblem) { 
    return (
        <Card className="w-full max-w-lg mx-auto shadow-xl border-accent/20">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-accent flex items-center justify-center">
                    <ListOrdered className="mr-2 h-6 w-6" /> Times Table Challenge
                </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
                <p className="sr-only">Loading times table practice...</p>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-accent/20 animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-accent flex items-center justify-center">
          <ListOrdered className="mr-2 h-6 w-6" /> Times Table Challenge
        </CardTitle>
        <CardDescription>
          Practice Table: <span className="font-bold text-primary">{selectedTable}</span> | 
          Score: <span className="font-bold text-primary">{score} / {problemsAttemptedInSession}</span> |
          Problem: <span className="font-bold text-primary">{Math.min(currentProblemIndex + 1, MAX_MULTIPLIER)} / {MAX_MULTIPLIER}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Label htmlFor="table-select" className="text-md font-medium whitespace-nowrap">Practice Table:</Label>
          <Select value={selectedTable.toString()} onValueChange={handleTableChange} disabled={isLoading || isListening || (isAttempted && !sessionCompleted)}>
            <SelectTrigger id="table-select" className="flex-grow h-11 text-base shadow-sm focus:ring-accent" aria-label="Select times table to practice">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tableOptions.map(table => (
                <SelectItem key={table} value={table.toString()} className="text-base">
                  {table} Times Table
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {sessionCompleted ? (
            <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50 animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="flex flex-col items-center gap-4 py-4">
              <Trophy className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
              <AlertTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                {username ? `Amazing, ${username}!` : 'Table Complete!'}
              </AlertTitle>
              <AlertDescription className="text-base">
                You've practiced all problems for the {selectedTable} times table! Your score: {score}/{MAX_MULTIPLIER}.
              </AlertDescription>
            </div>
          </Alert>
        ) : currentProblem && (
          <div className="text-center space-y-4 animate-in fade-in-0 duration-300">
             <div className="flex justify-center items-center gap-4 my-2">
                {renderEquationWithBlank()}
                <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read problem aloud" disabled={isListening || !soundEffectsEnabled || isAttempted}>
                    <Volume2 className="h-6 w-6" />
                </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="times-table-answer" className="sr-only">Your Answer</Label>
                <Input
                  id="times-table-answer"
                  ref={answerInputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Answer"
                  className="text-2xl p-3 h-14 text-center shadow-sm focus:ring-2 focus:ring-accent flex-grow"
                  aria-label={`Enter your answer for ${currentProblem.questionText.replace('?', '')}`}
                  disabled={isAttempted || isLoading || isListening}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={toggleListening} 
                    className={cn("h-14 w-14", isListening && "bg-destructive/20 text-destructive animate-pulse")}
                    aria-label={isListening ? "Stop listening" : "Speak your answer"}
                    disabled={isAttempted || isLoading || !recognitionRef.current || !soundEffectsEnabled}
                >
                    {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              </div>
              <Button type="submit" size="lg" className="w-full btn-glow !text-lg bg-accent hover:bg-accent/90" disabled={isAttempted || isLoading || isListening}>
                Check
              </Button>
            </form>
          </div>
        )}

        {feedback && !sessionCompleted && isAttempted &&(
          <Alert variant={feedback.type === 'error' ? 'destructive' : feedback.type} className="mt-4 animate-in fade-in-0 zoom-in-95 duration-300">
            {feedback.type === 'success' ? <Smile className="h-5 w-5" /> : feedback.type === 'error' ? <XCircle className="h-5 w-5" /> : null}
            <AlertTitle>
                {feedback.type === 'success' ? (username ? `Excellent, ${username}!` : 'Excellent!') : 
                 feedback.type === 'error' ? 'Keep Trying!' : 'Info'}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
         <Button 
            variant="outline" 
            onClick={handleRestartOrNext} 
            className="w-full" 
            disabled={isLoading || isListening || (!isAttempted && currentProblem !== null && !sessionCompleted)}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> 
          {sessionCompleted ? "Practice New Table" : "Skip / Next"}
        </Button>
      </CardFooter>
    </Card>
  );
};

