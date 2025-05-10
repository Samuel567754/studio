
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback, useRef } from 'react';
import { generateMathWordProblem, type GenerateMathWordProblemInput, type GenerateMathWordProblemOutput } from '@/ai/flows/generate-math-word-problem';
import { CheckCircle2, XCircle, Loader2, Brain, RefreshCw, Volume2, Mic, MicOff, Smile, Lightbulb } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { useUserProfileStore } from '@/stores/user-profile-store';

type DifficultyLevel = 'easy' | 'medium' | 'hard';
type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export const AiWordProblemGameUI = () => {
  const [currentProblem, setCurrentProblem] = useState<GenerateMathWordProblemOutput | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string | JSX.Element } | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [operation, setOperation] = useState<Operation>('addition');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const answerInputRef = useRef<HTMLInputElement>(null);
  const { username } = useUserProfileStore();

  const fetchNewProblem = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    setUserAnswer('');
    setCurrentProblem(null);
    playNotificationSound();

    try {
      const input: GenerateMathWordProblemInput = { difficultyLevel: difficulty, operation, username: username || undefined };
      const problemData = await generateMathWordProblem(input);
      setCurrentProblem(problemData);
      answerInputRef.current?.focus();
      if (problemData?.problemText) {
        speakText(problemData.problemText);
      }
    } catch (error) {
      console.error("Error generating math problem:", error);
      setFeedback({ type: 'error', message: 'Could not generate a problem. Please try again.' });
      playErrorSound();
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, operation, username]);

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

    if (answerNum === currentProblem.numericalAnswer) {
      const successMessage = `${username ? username + ", that's c" : 'C'}orrect! The answer is ${currentProblem.numericalAnswer}.`;
      setFeedback({ type: 'success', message: successMessage });
      setScore(prev => prev + 1);
      playSuccessSound();
      const speechSuccessMsg = `${username ? username + ", " : ""}Correct! ${currentProblem.problemText} The answer is ${currentProblem.numericalAnswer}.`;
      const utterance = speakText(speechSuccessMsg, undefined, () => {
        fetchNewProblem();
      });
      if (!utterance) { 
        setTimeout(fetchNewProblem, 1500);
      }
    } else {
      const errorMessage = (
        <>
          Not quite{username ? `, ${username}` : ''}. The correct answer was <strong>{currentProblem.numericalAnswer}</strong>.
          {currentProblem.explanation && <p className="mt-1 text-xs"><em>Explanation: {currentProblem.explanation}</em></p>}
          Try the next one!
        </>
      );
      setFeedback({ type: 'error', message: errorMessage });
      playErrorSound();
      const speechErrorMsg = `Oops! The correct answer was ${currentProblem.numericalAnswer}. ${currentProblem.explanation || ''}`;
      const utterance = speakText(speechErrorMsg, undefined, () => {
        fetchNewProblem();
      });
      if (!utterance) {
        setTimeout(fetchNewProblem, 2500);
      }
    }
  }, [currentProblem, userAnswer, fetchNewProblem, username]);

  useEffect(() => {
    fetchNewProblem();
  }, [fetchNewProblem]);
  
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
           toast({ title: "Heard you!", description: `You said: "${spokenText}". We interpreted: "${String(number)}".`, variant: "info" });
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
        if (recognitionRef.current) {
           recognitionRef.current.stop();
        }
    };
  }, [toast]);

  const handleSpeakProblem = () => {
    if (currentProblem?.problemText) {
      speakText(currentProblem.problemText + (currentProblem.explanation ? ` ${currentProblem.explanation}` : ''));
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
        toast({ title: "Listening...", description: "Speak your answer.", variant: "info" });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({ title: "Mic Error", description: "Could not start microphone. Check permissions.", variant: "destructive" });
        setIsListening(false);
      }
    }
  };
  
  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
          <Brain className="mr-2 h-6 w-6" /> AI Word Problem Solver
        </CardTitle>
        <CardDescription>Current Score: <span className="font-bold text-accent">{score}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="difficulty-select">Difficulty</Label>
            <Select value={difficulty} onValueChange={(val) => setDifficulty(val as DifficultyLevel)} disabled={isLoading}>
              <SelectTrigger id="difficulty-select" className="h-11">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="operation-select">Operation</Label>
            <Select value={operation} onValueChange={(val) => setOperation(val as Operation)} disabled={isLoading}>
              <SelectTrigger id="operation-select" className="h-11">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="addition">Addition (+)</SelectItem>
                <SelectItem value="subtraction">Subtraction (-)</SelectItem>
                <SelectItem value="multiplication">Multiplication (×)</SelectItem>
                <SelectItem value="division">Division (÷)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && ( 
          <div className="flex flex-col justify-center items-center min-h-[150px] space-y-2">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating an AI-mazing problem for you...</p>
            <p className="sr-only">Loading new problem...</p>
          </div>
        )}
        {!isLoading && currentProblem && (
          <div className="space-y-4 animate-in fade-in-0 duration-300">
            <Card className="bg-muted/30 p-4 rounded-lg shadow">
              <CardTitle className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent"/>
                Problem:
                <Button variant="ghost" size="icon" onClick={handleSpeakProblem} aria-label="Read problem aloud" className="ml-auto" disabled={isListening}>
                    <Volume2 className="h-5 w-5" />
                </Button>
              </CardTitle>
              <CardDescription className="text-lg text-foreground/90 leading-relaxed" aria-live="polite">
                {currentProblem.problemText}
              </CardDescription>
            </Card>
            
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
        <Button variant="outline" onClick={fetchNewProblem} className="w-full" disabled={isLoading || isListening}>
          <RefreshCw className="mr-2 h-4 w-4" /> Skip / New Problem
        </Button>
      </CardFooter>
    </Card>
  );
};
