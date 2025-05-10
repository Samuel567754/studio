
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, Zap, RefreshCw } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Operation = '+' | '-' | '*' | '/';
interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
  questionText: string;
}

const generateProblem = (): Problem => {
  const operation = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)] as Operation;
  let num1 = Math.floor(Math.random() * 12) + 1;
  let num2 = Math.floor(Math.random() * 12) + 1;
  let answer: number;
  let questionText = '';

  switch (operation) {
    case '+':
      answer = num1 + num2;
      questionText = `${num1} + ${num2} = ?`;
      break;
    case '-':
      if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure positive result for simplicity
      answer = num1 - num2;
      questionText = `${num1} - ${num2} = ?`;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 10) + 1; // Smaller numbers for multiplication
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
      questionText = `${num1} × ${num2} = ?`;
      break;
    case '/':
      answer = Math.floor(Math.random() * 10) + 1; // Ensure whole number division for answer
      num2 = Math.floor(Math.random() * ( Math.min(10, (answer > 0 ? Math.floor(50 / answer) : 10 ) ) ) ) + 1; // num2 that results in num1 <= 50
      num1 = answer * num2; // num1 is product
      if (num1 === 0 && num2 === 0) { // Avoid 0/0
          num2 = 1;
          num1 = answer * num2;
      } else if (num2 === 0) { // Avoid division by zero
          num2 = 1; // Change divisor to 1
          num1 = answer * num2; // Recalculate num1
      }
      questionText = `${num1} ÷ ${num2} = ?`;
      break;
  }
  return { num1, num2, operation, answer, questionText };
};

export const ArithmeticGameUI = () => {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNewProblem = useCallback(() => {
    setIsLoading(true);
    setFeedback(null);
    setUserAnswer('');
    setCurrentProblem(generateProblem());
    setIsLoading(false);
    playNotificationSound();
  },[]);

  useEffect(() => {
    loadNewProblem();
  }, [loadNewProblem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      setFeedback({ type: 'success', message: 'Correct! Well done!' });
      setScore(prev => prev + 1);
      playSuccessSound();
      setTimeout(() => {
        loadNewProblem();
      }, 1500); 
    } else {
      setFeedback({ type: 'error', message: `Not quite. The correct answer was ${currentProblem.answer}. Try the next one!` });
      playErrorSound();
       setTimeout(() => { 
        loadNewProblem();
      }, 2500);
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
        {isLoading && (
          <div className="flex justify-center items-center min-h-[100px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="sr-only">Loading new problem...</p>
          </div>
        )}
        {!isLoading && currentProblem && (
          <div className="text-center space-y-4 animate-in fade-in-0 duration-300">
            <p 
                className="text-5xl md:text-6xl font-bold text-gradient-primary-accent bg-clip-text text-transparent drop-shadow-sm py-2 select-none" 
                aria-live="polite"
                data-ai-hint="math equation"
            >
                {currentProblem.questionText}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="math-answer" className="sr-only">Your Answer</Label>
                <Input
                  id="math-answer"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Your answer"
                  className="text-2xl p-3 h-14 text-center shadow-sm focus:ring-2 focus:ring-primary"
                  aria-label="Enter your answer for the math problem"
                  disabled={feedback?.type === 'success'}
                />
              </div>
              <Button type="submit" size="lg" className="w-full btn-glow !text-lg" disabled={feedback?.type === 'success'}>
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
        <Button variant="outline" onClick={loadNewProblem} className="w-full" disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Skip / New Problem
        </Button>
      </CardFooter>
    </Card>
  );
};
