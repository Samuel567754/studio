
"use client";
import type { FC, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Sparkles, InfoIcon, Smile, Volume2 } from 'lucide-react';
import { playErrorSound, speakText } from '@/lib/audio'; 
import { addMasteredWord } from '@/lib/storage'; 
import { useUserProfileStore } from '@/stores/user-profile-store'; 

interface SpellingPracticeProps {
  wordToSpell: string;
  onCorrectSpell: () => void;
}

export const SpellingPractice: FC<SpellingPracticeProps> = ({ wordToSpell, onCorrectSpell }) => {
  const [attempt, setAttempt] = useState('');
  const [feedback, setFeedback] = useState<{type: 'success' | 'destructive' | 'info', message: string} | null>(null);
  const { username } = useUserProfileStore(); 

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
      const successMessage = `${username ? username + ", y" : "Y"}ou spelled it right: "${wordToSpell}"!`;
      setFeedback({type: 'success', message: successMessage});
      addMasteredWord(wordToSpell); 

      speakText(wordToSpell, undefined, () => {
        onCorrectSpell(); 
      });

      setTimeout(() => {
        setAttempt('');
      }, 2500);
    } else {
      setFeedback({type: 'destructive', message: `Not quite. The word is "${wordToSpell}". Keep trying!`});
      playErrorSound();
    }
  };

  const handleSpeakWordToSpell = () => {
    if (wordToSpell) {
      speakText(wordToSpell);
    }
  };

  if (!wordToSpell) {
    return (
       <Card className="shadow-lg w-full animate-in fade-in-0 zoom-in-95 duration-300">
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
        <div className="flex items-center justify-between">
            <CardDescription>Try spelling the word: <strong className="text-foreground">{wordToSpell}</strong></CardDescription>
            <Button variant="ghost" size="icon" onClick={handleSpeakWordToSpell} aria-label={`Listen to the word ${wordToSpell}`}>
                <Volume2 className="h-5 w-5"/>
            </Button>
        </div>
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
              disabled={feedback?.type === 'success'}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={feedback?.type === 'success'}>Check Spelling</Button>
        </form>
      </CardContent>
      {feedback && (
        <CardFooter className="animate-in fade-in-0 zoom-in-95 duration-300">
          <Alert variant={feedback.type} className="w-full">
            {feedback.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {feedback.type === 'destructive' && <XCircle className="h-5 w-5" />}
            {feedback.type === 'info' && <InfoIcon className="h-5 w-5" />}
            <AlertTitle>
                {feedback.type === 'success' ? <div className="flex items-center gap-1"><Smile className="h-5 w-5" /> {username ? `Great Job, ${username}!` : 'Correct!'}</div> : 
                 feedback.type === 'destructive' ? 'Try Again!' : 'Hint'}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
};
