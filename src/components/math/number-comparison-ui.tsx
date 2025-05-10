
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, Volume2, RefreshCw, Scaling } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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

  const loadNewProblem = useCallback(() => {
    setIsLoading(true);
    setFeedback(null);
    setSelectedAnswer(null);
    const newProblem = generateComparisonProblem();
    setCurrentProblem(newProblem);
    setIsLoading(false);
    playNotificationSound();
  }, []);

  useEffect(() => {
    loadNewProblem();
  }, [loadNewProblem]);

  useEffect(() => {
    if (currentProblem && !isLoading && currentProblem.speechText) {
      speakText(currentProblem.speechText);
    }
  }, [currentProblem, isLoading]);

  const handleSpeakQuestion = () => {
    if (currentProblem?.speechText) {
      speakText(currentProblem.speechText);
    }
  };
  
  const handleAnswer = (chosenNum: number) => {
    if (!currentProblem || selectedAnswer !== null) return; 

    setSelectedAnswer(chosenNum);
    const isCorrect = chosenNum === currentProblem.correctAnswer;

    if (isCorrect) {
      setFeedback({ type: 'success', message: `Correct! ${chosenNum} is indeed the ${currentProblem.questionType} one.` });
      setScore(prev => prev + 1);
      playSuccessSound();
      const utterance = speakText(`Correct! ${chosenNum} is ${currentProblem.questionType}.`, undefined, () => {
        loadNewProblem();
      });
      if (!utterance) { // Fallback if speech doesn't start
        setTimeout(loadNewProblem, 2000);
      }
    } else {
      setFeedback({ type: 'error', message: `Not quite. The ${currentProblem.questionType} number was ${currentProblem.correctAnswer}.` });
      playErrorSound();
      const utterance = speakText(`Oops! The ${currentProblem.questionType} number was ${currentProblem.correctAnswer}.`, undefined, () => {
        loadNewProblem();
      });
      if (!utterance) { // Fallback if speech doesn't start
        setTimeout(loadNewProblem, 3000);
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
        <div className="flex justify-center items-center my-4">
          <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read question aloud">
            <Volume2 className="h-5 w-5" />
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
              disabled={selectedAnswer !== null || isLoading}
              aria-pressed={selectedAnswer === num}
            >
              {num}
            </Button>
          ))}
        </div>
        {feedback && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : feedback.type} className="mt-4 animate-in fade-in-0 zoom-in-95 duration-300">
            {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <AlertTitle>{feedback.type === 'success' ? 'Great Job!' : 'Try Again!'}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={loadNewProblem} className="w-full" disabled={isLoading || (selectedAnswer === null && feedback !== null)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Skip / Next Problem
        </Button>
      </CardFooter>
    </Card>
  );
};
