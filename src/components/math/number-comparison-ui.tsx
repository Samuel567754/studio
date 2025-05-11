
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Volume2, RefreshCw, Scaling, Mic, MicOff, Smile, Info } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';


interface ComparisonProblem {
  num1: number;
  num2: number;
  questionType: 'bigger' | 'smaller'; 
  correctAnswer: number;
  questionText: string;
  speechText: string;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const { username } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const loadNewProblem = useCallback(() => {
    setIsLoading(true);
    setFeedback(null);
    setSelectedAnswer(null);
    const newProblem = generateComparisonProblem();
    setCurrentProblem(newProblem);
    setIsLoading(false);
    playNotificationSound();
  }, []);

  const handleAnswer = useCallback((chosenNum: number) => {
    if (!currentProblem || selectedAnswer !== null) return; 

    setSelectedAnswer(chosenNum);
    const isCorrect = chosenNum === currentProblem.correctAnswer;

    if (isCorrect) {
      const successMessage = `${username ? username + ", y" : "Y"}ou got it right! ${chosenNum} is indeed the ${currentProblem.questionType} one.`;
      setFeedback({ type: 'success', message: successMessage });
      setScore(prev => prev + 1);
      playSuccessSound();
      const speechSuccessMsg = `${username ? username + ", y" : "Y"}ou got it! ${chosenNum} is ${currentProblem.questionType}.`;
      const utterance = speakText(speechSuccessMsg, undefined, () => {
        loadNewProblem();
      });
      if (!utterance && soundEffectsEnabled) { 
        setTimeout(loadNewProblem, 2000);
      } else if (!soundEffectsEnabled) {
        loadNewProblem();
      }
    } else {
      const errorMessage = `Not quite${username ? `, ${username}` : ''}. The ${currentProblem.questionType} number was ${currentProblem.correctAnswer}.`;
      setFeedback({ type: 'error', message: errorMessage });
      playErrorSound();
      const speechErrorMsg = `Oops! The ${currentProblem.questionType} number was ${currentProblem.correctAnswer}.`;
      const utterance = speakText(speechErrorMsg, undefined, () => {
        loadNewProblem();
      });
      if (!utterance && soundEffectsEnabled) { 
        setTimeout(loadNewProblem, 3000);
      } else if (!soundEffectsEnabled) {
         loadNewProblem();
      }
    }
  }, [currentProblem, selectedAnswer, loadNewProblem, username, soundEffectsEnabled]);

  useEffect(() => {
    loadNewProblem();
  }, [loadNewProblem]);

  useEffect(() => {
    if (currentProblem && !isLoading && currentProblem.speechText && soundEffectsEnabled) {
      speakText(currentProblem.speechText);
    }
  }, [currentProblem, isLoading, soundEffectsEnabled]);

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
    if (currentProblem?.speechText && soundEffectsEnabled) {
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
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (selectedAnswer !== null) return; 
      try {
        playNotificationSound();
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
  

  if (isLoading || !currentProblem) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl border-primary/20">
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
    <Card className="w-full max-w-md mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
           <Scaling className="mr-2 h-6 w-6" /> {`Which is ${currentProblem.questionType}?`}
        </CardTitle>
        <CardDescription>
          Current Score: <span className="font-bold text-accent">{score}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center items-center gap-4 my-4">
          <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read question aloud" disabled={isListening || !soundEffectsEnabled}>
            <Volume2 className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleListening}
            className={cn("h-10 w-10", isListening && "bg-destructive/20 text-destructive animate-pulse")}
            aria-label={isListening ? "Stop listening" : "Speak your answer"}
            disabled={selectedAnswer !== null || isLoading || !recognitionRef.current || !soundEffectsEnabled}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[currentProblem.num1, currentProblem.num2].map((num) => (
            <Button
              key={num}
              variant="outline"
              size="lg"
              className={cn(
                "text-4xl h-24 font-bold transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md",
                selectedAnswer === num && feedback?.type === 'success' && "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400 ring-2 ring-green-500",
                selectedAnswer === num && feedback?.type === 'error' && "bg-red-500/20 border-red-500 text-red-700 dark:text-red-400 ring-2 ring-red-500",
                selectedAnswer !== null && num === currentProblem.correctAnswer && feedback?.type === 'error' && "bg-green-500/10 border-green-500/50" 
              )}
              onClick={() => handleAnswer(num)}
              disabled={selectedAnswer !== null || isLoading || isListening}
              aria-pressed={selectedAnswer === num}
            >
              {num}
            </Button>
          ))}
        </div>
        {feedback && (
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
        <Button variant="outline" onClick={loadNewProblem} className="w-full" disabled={isLoading || isListening || (selectedAnswer === null && feedback !== null)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Skip / Next Problem
        </Button>
      </CardFooter>
    </Card>
  );
};
