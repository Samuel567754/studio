"use client";
import type { FC, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface SpellingPracticeProps {
  wordToSpell: string;
  onCorrectSpell: () => void;
}

export const SpellingPractice: FC<SpellingPracticeProps> = ({ wordToSpell, onCorrectSpell }) => {
  const [attempt, setAttempt] = useState('');
  const [feedback, setFeedback] = useState<{type: 'correct' | 'incorrect' | 'info', message: string} | null>(null);

  useEffect(() => {
    setAttempt('');
    setFeedback(null);
  }, [wordToSpell]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!wordToSpell || !attempt.trim()) {
      setFeedback({type: 'info', message: 'Please enter your spelling attempt.'});
      return;
    }

    if (attempt.trim().toLowerCase() === wordToSpell.toLowerCase()) {
      setFeedback({type: 'correct', message: 'Excellent! You spelled it right.'});
      onCorrectSpell();
      setTimeout(() => {
        setAttempt('');
         // setFeedback(null); // Optionally clear feedback after more time
      }, 2500);
    } else {
      setFeedback({type: 'incorrect', message: `Not quite. The word is "${wordToSpell}". Keep trying!`});
    }
  };

  if (!wordToSpell) {
    return (
       <Card className="shadow-lg w-full">
         <CardHeader>
           <CardTitle className="flex items-center text-xl font-semibold text-primary"><Sparkles className="mr-2 h-5 w-5"/>Spell the Word</CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-muted-foreground">Select a word or get suggestions to start spelling practice.</p>
         </CardContent>
       </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary"><Sparkles className="mr-2 h-5 w-5"/>Spell the Word</CardTitle>
        <CardDescription>Try spelling the word: <strong className="text-foreground">{wordToSpell}</strong></CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="spell-input" className="sr-only">Enter spelling</Label>
            <Input
              id="spell-input"
              type="text"
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              placeholder="Type your spelling here"
              className="text-xl md:text-2xl p-3 md:p-4 h-auto"
              aria-label={`Spell the word ${wordToSpell}`}
              autoCapitalize="none"
              autoCorrect="off"
              disabled={feedback?.type === 'correct'}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={feedback?.type === 'correct'}>Check Spelling</Button>
        </form>
      </CardContent>
      {feedback && (
        <CardFooter>
          <Alert variant={feedback.type === 'correct' ? 'default' : feedback.type === 'incorrect' ? 'destructive' : 'default'} className="w-full">
            {feedback.type === 'correct' && <CheckCircle2 className="h-5 w-5" />}
            {feedback.type === 'incorrect' && <XCircle className="h-5 w-5" />}
            <AlertTitle>{feedback.type === 'correct' ? 'Correct!' : feedback.type === 'incorrect' ? 'Try Again!' : 'Hint'}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
};
