
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, Repeat, ListOrdered } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TimesTableProblem {
  factor1: number; // The table number being practiced
  factor2: number; // The multiplier (1 through 12 or 10)
  answer: number;
  questionText: string;
}

const generateTimesTableProblem = (table: number, currentMultiplier: number): TimesTableProblem => {
  return {
    factor1: table,
    factor2: currentMultiplier,
    answer: table * currentMultiplier,
    questionText: `${table} × ${currentMultiplier} = ?`,
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

  const tableOptions = useMemo(() => Array.from({ length: 11 }, (_, i) => i + 2), []); // Tables 2 to 12

  const loadProblemForTableAndMultiplier = useCallback(() => {
    setCurrentProblem(generateTimesTableProblem(selectedTable, currentMultiplier));
    setUserAnswer('');
    setFeedback(null);
    setShowCompletionMessage(false);
  }, [selectedTable, currentMultiplier]);
  
  useEffect(() => {
    loadProblemForTableAndMultiplier();
  }, [loadProblemForTableAndMultiplier]);

  const handleTableChange = (value: string) => {
    const tableNum = parseInt(value, 10);
    setSelectedTable(tableNum);
    setCurrentMultiplier(1); 
    setCorrectInARow(0);
    playNotificationSound();
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
      setFeedback({ type: 'success', message: 'Correct!' });
      setCorrectInARow(prev => prev + 1);
      playSuccessSound();
      
      setTimeout(() => {
        if (currentMultiplier < MAX_MULTIPLIER) {
          setCurrentMultiplier(prev => prev + 1);
        } else {
          setShowCompletionMessage(true);
           setFeedback({ type: 'success', message: `Congratulations! You've completed the ${selectedTable} times table!` });
        }
         // setUserAnswer(''); // Keep for consistency if problem reloads, or clear if next problem auto-loads
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: `Not quite. The correct answer for ${currentProblem.factor1} × ${currentProblem.factor2} was ${currentProblem.answer}.` });
      setCorrectInARow(0); 
      playErrorSound();
    }
  };

  const handleRestartTable = () => {
    setCurrentMultiplier(1);
    setCorrectInARow(0);
    // loadProblemForTableAndMultiplier will be called by useEffect due to state change
    playNotificationSound();
  };

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
          <Select value={selectedTable.toString()} onValueChange={handleTableChange}>
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
             <p 
                className="text-5xl md:text-6xl font-bold text-gradient-primary-accent bg-clip-text text-transparent drop-shadow-sm py-2 select-none" 
                aria-live="polite"
                data-ai-hint="multiplication problem"
            >
              {currentProblem.questionText}
            </p>
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
                  disabled={feedback?.type === 'success' && !showCompletionMessage}
                />
              </div>
              <Button type="submit" size="lg" className="w-full btn-glow !text-lg bg-accent hover:bg-accent/90" disabled={feedback?.type === 'success' && !showCompletionMessage}>
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
