"use client";
import type { FC, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Sparkles, InfoIcon, Smile, Volume2 } from 'lucide-react';
import { playErrorSound, playSuccessSound, speakText } from '@/lib/audio'; 
import { addMasteredWord } from '@/lib/storage'; 
import { useUserProfileStore } from '@/stores/user-profile-store'; 
import { useToast } from '@/hooks/use-toast';
import { useAppSettingsStore } from '@/stores/app-settings-store';

interface SpellingPracticeProps {
  wordToSpell: string;
  onCorrectSpell: () => void;
}

export const SpellingPractice: FC<SpellingPracticeProps> = ({ wordToSpell, onCorrectSpell }) => {
  const [attempt, setAttempt] = useState('');
  const [feedback, setFeedback] = useState<{type: 'success' | 'destructive' | 'info', message: string} | null>(null);
  const { username } = useUserProfileStore(); 
  const { toast } = useToast();
  const { soundEffectsEnabled } = useAppSettingsStore();

  useEffect(() => {
    setAttempt('');
    setFeedback(null);
    if (wordToSpell && soundEffectsEnabled) {
      // Announce the word to be spelled when it changes
      speakText(`Spell the word: ${wordToSpell}`);
    }
  }, [wordToSpell, soundEffectsEnabled]);

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
      
      if (soundEffectsEnabled) {
        speakText(`Correct! You spelled ${wordToSpell}.`, undefined, () => {
             toast({
                variant: "success",
                title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />{username ? `Great Job, ${username}!` : 'Great Job!'}</div>,
                description: `You spelled "${wordToSpell}" correctly!`,
             });
             playSuccessSound(); 
             onCorrectSpell();
        });
      } else {
          toast({
            variant: "success",
            title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />{username ? `Great Job, ${username}!` : 'Great Job!'}</div>,
            description: `You spelled "${wordToSpell}" correctly!`,
          });
          playSuccessSound(); 
          onCorrectSpell();
      }
      

      setTimeout(() => {
        setAttempt('');
        // Feedback will be cleared by the parent component navigating or by wordToSpell changing
      }, 1500); // Keep feedback visible for a bit longer before parent potentially clears it
    } else {
      setFeedback({type: 'destructive', message: `Not quite. Press the audio icon to hear the word again. Keep trying!`});
      playErrorSound();
      if (soundEffectsEnabled) {
        speakText(`Not quite. Press the audio icon to hear the word again. Please try again.`);
      }
    }
  };

  const handleSpeakWordToSpell = () => {
    if (wordToSpell && soundEffectsEnabled) {
      speakText(wordToSpell);
    } else if (!soundEffectsEnabled) {
      toast({ variant: "info", title: <div className="flex items-center gap-2"><InfoIcon className="h-5 w-5" />Audio Disabled</div>, description: "Sound effects are turned off in settings." });
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
            <CardDescription>Press the audio icon to listen to the word again.</CardDescription>
            <Button variant="ghost" size="icon" onClick={handleSpeakWordToSpell} aria-label={`Listen to the word to spell`} disabled={!soundEffectsEnabled}>
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
              aria-label={`Spell the word you hear`}
              autoCapitalize="none"
              autoCorrect="off"
              disabled={feedback?.type === 'success'}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={feedback?.type === 'success' || !attempt.trim()}>Check Spelling</Button>
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