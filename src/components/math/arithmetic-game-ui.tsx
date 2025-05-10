
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Zap, RefreshCw, Volume2, Mic, MicOff } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';

type Operation = '+' | '-' | '*' | '/';
interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
  questionText: string; // For display
  speechText: string;   // For TTS
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const answerInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentProblem || userAnswer.trim() === '') {
      setFeedback({ type: 'info', message: 'Please enter an answer.' });
      return;
    }

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      setFeedback({ type: 'info', message: 'Please enter a valid number.' });
      return;
    }

    if (answerNum === currentProblem.answer) {
      const successMessage = `Correct! ${currentProblem.questionText.replace('?', currentProblem.answer.toString())}`;
      setFeedback({ type: 'success', message: successMessage });
      setScore(prev => prev + 1);
      playSuccessSound();
      const utterance = speakText(`Correct! The answer is ${currentProblem.answer}.`, undefined, () => {
        loadNewProblem();
      });
      if (!utterance) { 
        setTimeout(loadNewProblem, 1500);
      }
    } else {
      const errorMessage = `Not quite. The correct answer for ${currentProblem.questionText.replace('?', '')} was ${currentProblem.answer}. Try the next one!`;
      setFeedback({ type: 'error', message: errorMessage });
      playErrorSound();
      const utterance = speakText(`Oops! The correct answer was ${currentProblem.answer}.`, undefined, () => {
        loadNewProblem();
      });
      if (!utterance) {
        setTimeout(loadNewProblem, 2500);
      }
    }
  }, [currentProblem, userAnswer, loadNewProblem]);


  const loadNewProblem = useCallback(() => {
    setIsLoading(true);
    setFeedback(null);
    setUserAnswer('');
    const newProblem = generateProblem();
    setCurrentProblem(newProblem);
    setIsLoading(false);
    playNotificationSound();
    answerInputRef.current?.focus();
  },[]);

  useEffect(() => {
    loadNewProblem();
  }, [loadNewProblem]);
  
  useEffect(() => {
    if (currentProblem && !isLoading && currentProblem.speechText) {
      speakText(currentProblem.speechText);
    }
  }, [currentProblem, isLoading]);

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
           toast({ title: "Heard you!", description: `You said: "${spokenText}". We interpreted: "${String(number)}".`, variant: "info" });
           // Auto-submit after setting the answer
           // Use a slight delay to ensure state update before submit if needed, but direct call might be fine
           setTimeout(() => handleSubmitRef.current(), 0);
        } else {
          toast({ title: "Couldn't understand", description: `Heard: "${spokenText}". Please try again or type the number.`, variant: "info" });
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({ title: "Voice Input Error", description: `Could not recognize speech: ${event.error}. Try typing.`, variant: "destructive" });
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
        recognitionRef.current?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // handleSubmit will be called via ref

  // Ref to hold the latest handleSubmit function
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);


  const handleSpeakQuestion = () => {
    if (currentProblem?.speechText) {
      speakText(currentProblem.speechText);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
        toast({ title: "Voice Input Not Supported", description: "Your browser doesn't support voice input. Please type your answer.", variant: "info", duration: 5000 });
        return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        playNotificationSound(); // Sound for mic activation
        recognitionRef.current.start();
        setIsListening(true);
        setFeedback(null); 
        toast({ title: "Listening...", description: "Speak your answer.", variant: "info" });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({ title: "Mic Error", description: "Could not start microphone. Check permissions.", variant: "destructive" });
        setIsListening(false);
      }
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
          <Zap className="mr-2 h-6 w-6" /> Quick Maths!
        </CardTitle>
        <CardDescription>Solve the problem below. Current Score: <span className="font-bold text-accent">{score}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && !currentProblem && ( 
          <div className="flex justify-center items-center min-h-[100px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="sr-only">Loading new problem...</p>
          </div>
        )}
        {!isLoading && currentProblem && (
          <div className="text-center space-y-4 animate-in fade-in-0 duration-300">
            <div className="flex justify-center items-center gap-4 my-2">
                <p 
                    className="text-5xl md:text-6xl font-bold text-gradient-primary-accent bg-clip-text text-transparent drop-shadow-sm py-2 select-none flex-grow text-center" 
                    aria-live="polite"
                    data-ai-hint="math equation"
                >
                    {currentProblem.questionText}
                </p>
                <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read problem aloud" disabled={isListening}>
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
                  disabled={feedback?.type === 'success' || isLoading || isListening}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={toggleListening} 
                    className={cn("h-14 w-14", isListening && "bg-destructive/20 text-destructive animate-pulse")}
                    aria-label={isListening ? "Stop listening" : "Speak your answer"}
                    disabled={feedback?.type === 'success' || isLoading || !recognitionRef.current}
                >
                    {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              </div>
              <Button type="submit" size="lg" className="w-full btn-glow !text-lg" disabled={feedback?.type === 'success' || isLoading || isListening}>
                Check Answer
              </Button>
            </form>
          </div>
        )}
        {feedback && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : feedback.type} className="mt-4 animate-in fade-in-0 zoom-in-95 duration-300">
            {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : feedback.type === 'error' ? <XCircle className="h-5 w-5" /> : null}
            <AlertTitle>{feedback.type === 'success' ? 'Correct!' : feedback.type === 'error' ? 'Try Again!' : 'Info'}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={loadNewProblem} className="w-full" disabled={(isLoading && !!currentProblem) || isListening}>
          <RefreshCw className="mr-2 h-4 w-4" /> Skip / New Problem
        </Button>
      </CardFooter>
    </Card>
  );
};

