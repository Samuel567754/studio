
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, Repeat, ListOrdered, Volume2 } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TimesTableProblem {
  factor1: number; 
  factor2: number; 
  answer: number;
  questionText: string; // For display
  speechText: string;   // For TTS
}

const generateTimesTableProblem = (table: number, currentMultiplier: number): TimesTableProblem => {
  return {
    factor1: table,
    factor2: currentMultiplier,
    answer: table * currentMultiplier,
    questionText: `${table} × ${currentMultiplier} = ?`,
    speechText: `${table} times ${currentMultiplier} equals what?`,
  };
};

const MAX_MULTIPLIER = 12; 

export const TimesTableUI = () => {
  const [selectedTable, setSelectedTable] = useState<number>(2); 
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [currentProblem, setCurrentProblem] = useState<TimesTableProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [correctInARow, setCorrectInARow] = useState(0);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const tableOptions = useMemo(() => Array.from({ length: 11 }, (_, i) => i + 2), []); // Tables 2 to 12

  const loadProblemForTableAndMultiplier = useCallback(() => {
    setIsLoading(true);
    const newProblem = generateTimesTableProblem(selectedTable, currentMultiplier);
    setCurrentProblem(newProblem);
    setUserAnswer('');
    setFeedback(null);
    setShowCompletionMessage(false);
    setIsLoading(false);
    // Notification sound is played by handleTableChange or successful submit
  }, [selectedTable, currentMultiplier]);
  
  useEffect(() => {
    loadProblemForTableAndMultiplier();
  }, [loadProblemForTableAndMultiplier]);

  useEffect(() => {
    if (currentProblem && !isLoading && !showCompletionMessage && currentProblem.speechText) {
      speakText(currentProblem.speechText);
    }
  }, [currentProblem, isLoading, showCompletionMessage]);


  const handleTableChange = (value: string) => {
    const tableNum = parseInt(value, 10);
    setSelectedTable(tableNum);
    setCurrentMultiplier(1); 
    setCorrectInARow(0);
    playNotificationSound();
    // Problem will reload due to useEffect dependency on selectedTable & currentMultiplier
    // No need to call loadProblemForTableAndMultiplier here, useEffect handles it.
  };

  const handleSpeakQuestion = () => {
    if (currentProblem?.speechText) {
      speakText(currentProblem.speechText);
    }
  };

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
      const successMessage = `Correct! ${currentProblem.questionText.replace('?', currentProblem.answer.toString())}`;
      setFeedback({ type: 'success', message: successMessage });
      setCorrectInARow(prev => prev + 1);
      speakText(`Correct! ${currentProblem.factor1} times ${currentProblem.factor2} is ${currentProblem.answer}.`);
      playSuccessSound();
      
      setTimeout(() => {
        if (currentMultiplier < MAX_MULTIPLIER) {
          setCurrentMultiplier(prev => prev + 1);
          // Problem will reload due to useEffect
        } else {
          const completionMsg = `Congratulations! You've completed the ${selectedTable} times table!`;
          setShowCompletionMessage(true);
          setFeedback({ type: 'success', message: completionMsg }); // Update feedback for completion
          speakText(completionMsg);
        }
      }, 1200);
    } else {
      const errorMessage = `Not quite. ${currentProblem.factor1} × ${currentProblem.factor2} is ${currentProblem.answer}.`;
      setFeedback({ type: 'error', message: errorMessage });
      setCorrectInARow(0); 
      speakText(`Oops! ${currentProblem.factor1} times ${currentProblem.factor2} is ${currentProblem.answer}.`);
      playErrorSound();
    }
  };

  const handleRestartTable = () => {
    setCurrentMultiplier(1);
    setCorrectInARow(0);
    setShowCompletionMessage(false); // Ensure this is reset
    playNotificationSound();
    // loadProblemForTableAndMultiplier will be called by useEffect due to state change
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
        <CardDescription>Practice your multiplication for table: <span className="font-bold text-primary">{selectedTable}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Label htmlFor="table-select" className="text-md font-medium whitespace-nowrap">Practice Table:</Label>
          <Select value={selectedTable.toString()} onValueChange={handleTableChange} disabled={isLoading}>
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

        {currentProblem && !showCompletionMessage && (
          <div className="text-center space-y-4 animate-in fade-in-0 duration-300">
             <div className="flex justify-center items-center gap-4 my-2">
                <p 
                    className="text-5xl md:text-6xl font-bold text-gradient-primary-accent bg-clip-text text-transparent drop-shadow-sm py-2 select-none flex-grow text-center" 
                    aria-live="polite"
                    data-ai-hint="multiplication problem"
                >
                {currentProblem.questionText}
                </p>
                <Button variant="outline" size="icon" onClick={handleSpeakQuestion} aria-label="Read problem aloud">
                    <Volume2 className="h-6 w-6" />
                </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="times-table-answer" className="sr-only">Your Answer</Label>
                <Input
                  id="times-table-answer"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Answer"
                  className="text-2xl p-3 h-14 text-center shadow-sm focus:ring-2 focus:ring-accent"
                  aria-label={`Enter your answer for ${currentProblem.questionText.replace('?', '')}`}
                  disabled={(feedback?.type === 'success' && !showCompletionMessage) || isLoading}
                />
              </div>
              <Button type="submit" size="lg" className="w-full btn-glow !text-lg bg-accent hover:bg-accent/90" disabled={(feedback?.type === 'success' && !showCompletionMessage) || isLoading}>
                Check
              </Button>
            </form>
          </div>
        )}

        {feedback && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : feedback.type} className="mt-4 animate-in fade-in-0 zoom-in-95 duration-300">
            {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : feedback.type === 'error' ? <XCircle className="h-5 w-5" /> : null}
            <AlertTitle>{feedback.type === 'success' ? 'Excellent!' : feedback.type === 'error' ? 'Keep Trying!' : 'Info'}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
         {showCompletionMessage && (
             <Button onClick={handleRestartTable} variant="outline" size="lg" className="w-full mt-4">
                <Repeat className="mr-2 h-5 w-5" /> Practice {selectedTable}s Again
            </Button>
         )}
      </CardContent>
      <CardFooter className="text-center text-sm text-muted-foreground">
        Correct in a row for this table: {correctInARow}
      </CardFooter>
    </Card>
  );
};
