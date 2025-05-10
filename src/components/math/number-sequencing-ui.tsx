
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Volume2, RefreshCw, ChevronsRight, Mic, MicOff } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';

interface SequenceProblem {
  sequenceDisplay: (number | string)[]; 
  correctAnswer: number;
  questionText: string; 
  speechText: string;   
}

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

    if (answerNum === currentProblem.correctAnswer) {
      setFeedback({ type: 'success', message: `Correct! The number is ${currentProblem.correctAnswer}.` });
      setScore(prev => prev + 1);
      playSuccessSound();
      const utterance = speakText(`That's right! ${currentProblem.correctAnswer} completes the sequence.`, undefined, () => {
        loadNewProblem();
      });
      if (!utterance) { 
        setTimeout(loadNewProblem, 2000);
      }
    } else {
      setFeedback({ type: 'error', message: `Not quite. The correct number was ${currentProblem.correctAnswer}.` });
      playErrorSound();
      const utterance = speakText(`Oops! The correct number was ${currentProblem.correctAnswer}.`, undefined, () => {
        loadNewProblem();
      });
      if (!utterance) { 
        setTimeout(loadNewProblem, 3000);
      }
    }
  }, [currentProblem, userAnswer, loadNewProblem]);


  const loadNewProblem = useCallback(() => {
    setIsLoading(true);
    setFeedback(null);
    setUserAnswer('');
    const newProblem = generateSequenceProblem();
    setCurrentProblem(newProblem);
    setIsLoading(false);
    playNotificationSound();
    answerInputRef.current?.focus();
  }, []);

  useEffect(() => {
    loadNewProblem();
  }, [loadNewProblem]);

  useEffect(() => {
    if (currentProblem && !isLoading && currentProblem.speechText) {
      speakText(currentProblem.speechText);
    }
  }, [currentProblem, isLoading]);

  // Ref to hold the latest handleSubmit function
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
          toast({ title: "Heard you!", description: `You said: "${spokenText}". We interpreted: "${String(number)}".`, variant: "info" });
          // Auto-submit after setting the answer
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
  }, [toast]);

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
        playNotificationSound();
        recognitionRef.current.start();
        setIsListening(true);
        setFeedback(null);
        toast({ title: "Listening...", description: "Speak the missing number.", variant: "info" });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({ title: "Mic Error", description: "Could not start microphone. Check permissions.", variant: "destructive" });
        setIsListening(false);
      }
    }
  };
  
  if (isLoading || !currentProblem) {
    return (
       <Card className="w-full max-w-lg mx-auto shadow-xl border-primary/20">
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
    <Card className="w-full max-w-lg mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
          <ChevronsRight className="mr-2 h-6 w-6" /> Complete the Sequence
        </CardTitle>
        <CardDescription>
          Current Score: <span className="font-bold text-accent">{score}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center my-2 bg-muted/50 p-4 rounded-lg">
            <p className="text-3xl md:text-4xl font-bold text-gradient-primary-accent select-none" aria-live="polite">
            {currentProblem.sequenceDisplay.join(', ')}
            </p>
          <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read sequence problem aloud" disabled={isListening}>
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
              className="text-2xl p-3 h-14 text-center shadow-sm focus:ring-2 focus:ring-primary flex-grow"
              aria-label="Enter the missing number in the sequence"
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

        {feedback && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : feedback.type} className="mt-4 animate-in fade-in-0 zoom-in-95 duration-300">
            {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <AlertTitle>{feedback.type === 'success' ? 'Awesome!' : 'Keep Going!'}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={loadNewProblem} className="w-full" disabled={isLoading || isListening}>
          <RefreshCw className="mr-2 h-4 w-4" /> Skip / New Sequence
        </Button>
      </CardFooter>
    </Card>
  );
};

