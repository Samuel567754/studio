
"use client";
import type { FC, FormEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Sparkles, InfoIcon, Smile, Volume2, Lightbulb } from 'lucide-react';
import { playErrorSound, playSuccessSound, speakText, playNotificationSound } from '@/lib/audio'; 
import { addMasteredWord } from '@/lib/storage'; 
import { useUserProfileStore } from '@/stores/user-profile-store'; 
import { useToast } from '@/hooks/use-toast';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { cn } from '@/lib/utils';

interface SpellingPracticeProps {
  wordToSpell: string;
  onCorrectSpell: () => void;
}

const MAX_WRONG_ATTEMPTS_FOR_HINT = 2;

export const SpellingPractice: FC<SpellingPracticeProps> = ({ wordToSpell, onCorrectSpell }) => {
  const [attempt, setAttempt] = useState('');
  const [feedback, setFeedback] = useState<{type: 'success' | 'destructive' | 'info', message: string} | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);

  const { username } = useUserProfileStore(); 
  const { toast } = useToast();
  const { soundEffectsEnabled } = useAppSettingsStore();

  useEffect(() => {
    setAttempt('');
    setFeedback(null);
    setWrongAttempts(0);
    setShowHint(false);
    setHintText(null);
    if (wordToSpell && soundEffectsEnabled) {
      speakText(`Spell the word: ${wordToSpell}`);
    }
  }, [wordToSpell, soundEffectsEnabled]);

  const generateHint = useCallback(() => {
    if (!wordToSpell) return null;
    const firstLetter = wordToSpell.charAt(0).toUpperCase();
    const length = wordToSpell.length;
    return `The word has ${length} letters and starts with "${firstLetter}".`;
  }, [wordToSpell]);

  const handleShowHint = () => {
    if (wordToSpell) {
      const newHint = generateHint();
      setHintText(newHint);
      setShowHint(true);
      playNotificationSound();
      if (newHint && soundEffectsEnabled) {
        speakText(`Hint: ${newHint}`);
      }
    }
  };

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

      const letters = wordToSpell.split('').join(', '); 
      const spelledOutMessage = `That's ${letters}.`;

      if (soundEffectsEnabled) {
        speakText(`Correct! You spelled ${wordToSpell}.`, undefined, () => {
          speakText(spelledOutMessage, undefined, () => {
            toast({
              variant: "success",
              title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />{username ? `Great Job, ${username}!` : 'Great Job!'}</div>,
              description: `You spelled "${wordToSpell}" correctly!`,
            });
            playSuccessSound(); 
            onCorrectSpell();
          });
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
      
      setWrongAttempts(0);
      setShowHint(false);
      setHintText(null);
      setTimeout(() => {
        setAttempt('');
      }, 1500);
    } else {
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
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

  const canShowHintButton = wrongAttempts >= MAX_WRONG_ATTEMPTS_FOR_HINT && !showHint;

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
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" className="w-full sm:flex-1" size="lg" disabled={feedback?.type === 'success' || !attempt.trim()}>Check Spelling</Button>
            {canShowHintButton && (
              <Button type="button" variant="outline" onClick={handleShowHint} className="w-full sm:w-auto" size="lg">
                <Lightbulb className="mr-2 h-5 w-5" /> Get Hint
              </Button>
            )}
          </div>
        </form>
        {showHint && hintText && (
          <Alert variant="info" className="mt-4 animate-in fade-in-0">
            <Lightbulb className="h-5 w-5" />
            <AlertTitle>Hint</AlertTitle>
            <AlertDescription>{hintText}</AlertDescription>
          </Alert>
        )}
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
