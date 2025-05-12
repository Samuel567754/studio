"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Zap, RefreshCcw, Volume2, Mic, MicOff, Smile, Info, Trophy } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText, playCompletionSound } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';

type Operation = '+' | '-' | '*' | '/';
interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
  questionText: string; 
  speechText: string;   
}

const PROBLEMS_PER_SESSION = 5; // Number of problems per session

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
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const answerInputRef = useRef<HTMLInputElement>(null);
  const { username } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const loadNewProblem = useCallback((isNewSessionStart: boolean = false) => {
    if (isNewSessionStart) {
        setScore(0);
        setProblemsSolvedInSession(0);
        setSessionCompleted(false);
    }
    setIsLoading(true);
    setFeedback(null);
    setUserAnswer('');
    const newProblem = generateProblem();
    setCurrentProblem(newProblem);
    setIsLoading(false);
    if (!isNewSessionStart && soundEffectsEnabled) playNotificationSound();
    answerInputRef.current?.focus();
  },[soundEffectsEnabled]);

  const handleSessionCompletion = useCallback(() => {
    setSessionCompleted(true);
    const completionMessage = username ? `Congratulations, ${username}!` : 'Session Complete!';
    const description = `You solved ${problemsSolvedInSession} problems and scored ${score}.`;
    toast({
      variant: "success",
      title: <div className="flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-400" />{completionMessage}</div>,
      description: description,
      duration: 7000,
    });
    playCompletionSound();
    if (soundEffectsEnabled) {
      speakText(`${completionMessage} ${description}`);
    }
  }, [username, soundEffectsEnabled, toast, problemsSolvedInSession, score]);

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
    
    const isCorrect = answerNum === currentProblem.answer;

    const afterFeedbackAudio = () => {
        if (isCorrect) {
            const newProblemsSolved = problemsSolvedInSession + 1;
            setProblemsSolvedInSession(newProblemsSolved);
            if (newProblemsSolved >= PROBLEMS_PER_SESSION) {
                handleSessionCompletion();
            } else {
                loadNewProblem();
            }
        } else {
            loadNewProblem(); // Always load new problem on incorrect for arithmetic
        }
    };

    if (isCorrect) {
      const successMessage = `${username ? username + ", that's c" : 'C'}orrect! ${currentProblem.questionText.replace('?', currentProblem.answer.toString())}`;
      setFeedback({ type: 'success', message: successMessage });
      setScore(prev => prev + 1);
      playSuccessSound();
      const speechSuccessMsg = `${username ? username + ", " : ""}Correct! The answer is ${currentProblem.answer}.`;
      
      if (soundEffectsEnabled) {
        const utterance = speakText(speechSuccessMsg, undefined, afterFeedbackAudio);
        if (!utterance) setTimeout(afterFeedbackAudio, 1500);
      } else {
        afterFeedbackAudio();
      }

    } else {
      const errorMessage = `Not quite${username ? `, ${username}` : ''}. The correct answer for ${currentProblem.questionText.replace('?', '')} was ${currentProblem.answer}. Try the next one!`;
      setFeedback({ type: 'error', message: errorMessage });
      playErrorSound();
      const speechErrorMsg = `Oops! The correct answer was ${currentProblem.answer}.`;

      if (soundEffectsEnabled) {
        const utterance = speakText(speechErrorMsg, undefined, afterFeedbackAudio);
        if (!utterance) setTimeout(afterFeedbackAudio, 2500);
      } else {
         afterFeedbackAudio();
      }
    }
  }, [currentProblem, userAnswer, loadNewProblem, username, soundEffectsEnabled, problemsSolvedInSession, handleSessionCompletion, sessionCompleted, score]);


  useEffect(() => {
    loadNewProblem(true); // Initial load is like starting a new session
  }, [loadNewProblem]);
  
  useEffect(() => {
    if (currentProblem && !isLoading && !sessionCompleted && currentProblem.speechText && soundEffectsEnabled) {
      speakText(currentProblem.speechText);
    }
  }, [currentProblem, isLoading, sessionCompleted, soundEffectsEnabled]);

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
           setTimeout(() => handleSubmitRef.current(), 50); // Auto-submit
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
    if (currentProblem?.speechText && soundEffectsEnabled && !sessionCompleted) {
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
    if (sessionCompleted) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        playNotificationSound(); 
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
        loadNewProblem(true); // Start a completely new session
    } else {
        loadNewProblem(); // Load the next problem in the current session
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500">
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
              <Trophy className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
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
                <p 
                    className="text-5xl md:text-6xl font-bold text-gradient-primary-accent bg-clip-text text-transparent drop-shadow-sm py-2 select-none flex-grow text-center" 
                    aria-live="polite"
                    data-ai-hint="math equation"
                >
                    {currentProblem.questionText}
                </p>
                <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read problem aloud" disabled={isListening || !soundEffectsEnabled || sessionCompleted}>
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
                  className="text-2xl p-3 h-14 text-center shadow-sm focus:ring-2 focus:ring-primary flex-grow"
                  aria-label="Enter your answer for the math problem"
                  disabled={feedback?.type === 'success' || isLoading || isListening || sessionCompleted}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={toggleListening} 
                    className={cn("h-14 w-14", isListening && "bg-destructive/20 text-destructive animate-pulse")}
                    aria-label={isListening ? "Stop listening" : "Speak your answer"}
                    disabled={feedback?.type === 'success' || isLoading || isListening || !recognitionRef.current || !soundEffectsEnabled || sessionCompleted}
                >
                    {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              </div>
              <Button type="submit" size="lg" className="w-full btn-glow !text-lg" disabled={feedback?.type === 'success' || isLoading || isListening || sessionCompleted}>
                Check Answer
              </Button>
            </form>
          </div>
        )}
        {feedback && !sessionCompleted && (
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
            disabled={isLoading || isListening}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> 
          {sessionCompleted ? "Start New Session" : "Skip / Next Problem"}
        </Button>
      </CardFooter>
    </Card>
  );
};
