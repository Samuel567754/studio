"use client";
import type { FC, FormEvent } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Sparkles, InfoIcon, Smile, Volume2, Lightbulb, Eye, EyeOff } from 'lucide-react';
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
  const [showHintButton, setShowHintButton] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [isWordCorrectlySpelled, setIsWordCorrectlySpelled] = useState(false);
  const [showAnswerTemporarily, setShowAnswerTemporarily] = useState(false);

  const { username } = useUserProfileStore(); 
  const { toast } = useToast();
  const { soundEffectsEnabled } = useAppSettingsStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const resetForNewWord = useCallback(() => {
    setAttempt('');
    setFeedback(null);
    setWrongAttempts(0);
    setShowHintButton(false);
    setHintText(null);
    setIsWordCorrectlySpelled(false);
    setShowAnswerTemporarily(false);
    if (wordToSpell && soundEffectsEnabled) {
      speakText(`Spell the word: ${wordToSpell}`);
    }
    inputRef.current?.focus();
  }, [wordToSpell, soundEffectsEnabled]);

  useEffect(() => {
    resetForNewWord();
  }, [wordToSpell, resetForNewWord]);

  const generateHint = useCallback(() => {
    if (!wordToSpell) return null;
    const firstLetter = wordToSpell.charAt(0).toUpperCase();
    const length = wordToSpell.length;
    let hint = `The word has ${length} letters and starts with "${firstLetter}".`;
    if (wrongAttempts >= MAX_WRONG_ATTEMPTS_FOR_HINT + 1 && length > 3) {
      hint += ` The second letter is "${wordToSpell.charAt(1)}".`;
    }
    if (wrongAttempts >= MAX_WRONG_ATTEMPTS_FOR_HINT + 2 && length > 5) {
       hint += ` It ends with "${wordToSpell.charAt(length - 1)}".`;
    }
    return hint;
  }, [wordToSpell, wrongAttempts]);

  const handleShowHint = () => {
    if (wordToSpell) {
      const newHint = generateHint();
      setHintText(newHint);
      playNotificationSound();
      if (newHint && soundEffectsEnabled) {
        speakText(`Hint: ${newHint}`);
      }
    }
  };

  const handleRevealAnswer = () => {
    setShowAnswerTemporarily(true);
    setHintText(`The word was: ${wordToSpell}. Let's try the next one after this.`);
    playNotificationSound();
    if (soundEffectsEnabled) {
        speakText(`Okay, ${username ? username : 'learner'}. The word was ${wordToSpell}. Let's move to the next word soon.`);
    }
    // Automatically move to next word after a delay
    setTimeout(() => {
        onCorrectSpell(); // Treat as "moving on" for the parent component
    }, 4000); 
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
      setIsWordCorrectlySpelled(true);

      const letters = wordToSpell.split('').join(', '); 
      const spelledOutMessage = `That's ${letters}.`;

      if (soundEffectsEnabled) {
        speakText(`Correct! You spelled ${wordToSpell}.`, undefined, () => {
          speakText(spelledOutMessage, undefined, () => {
            playSuccessSound(); 
            toast({
              variant: "success",
              title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />{username ? `Great Job, ${username}!` : 'Great Job!'}</div>,
              description: `You spelled "${wordToSpell}" correctly!`,
            });
            setTimeout(() => {
              onCorrectSpell();
            }, 500 + wordToSpell.length * 100); // Delay based on word length for animation to show
          });
        });
      } else {
          playSuccessSound(); 
          toast({
            variant: "success",
            title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />{username ? `Great Job, ${username}!` : 'Great Job!'}</div>,
            description: `You spelled "${wordToSpell}" correctly!`,
          });
          setTimeout(() => {
            onCorrectSpell();
          }, 500 + wordToSpell.length * 100);
      }
      
      setWrongAttempts(0);
      setShowHintButton(false);
      setHintText(null);
    } else {
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      setFeedback({type: 'destructive', message: `Not quite. Press the audio icon to hear the word again. Keep trying!`});
      playErrorSound();
      if (soundEffectsEnabled) {
        speakText(`Not quite. Press the audio icon to hear the word again. Please try again.`);
      }
      if (newWrongAttempts >= MAX_WRONG_ATTEMPTS_FOR_HINT && !showHintButton) {
        setShowHintButton(true);
      }
      // Shake animation for wrong answer
      if (inputRef.current) {
        inputRef.current.classList.add('animate-shake');
        setTimeout(() => inputRef.current?.classList.remove('animate-shake'), 500);
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
      <CardContent className="space-y-4">
        {isWordCorrectlySpelled && wordToSpell && (
          <div className="text-center py-4 my-2 bg-green-500/10 rounded-lg" aria-live="polite">
            <p className="text-5xl md:text-7xl font-bold tracking-wider text-green-600 dark:text-green-400 flex justify-center items-center gap-x-1 md:gap-x-1.5">
              {wordToSpell.split('').map((letter, index) => (
                <span 
                  key={`${letter}-${index}`} 
                  className="inline-block animate-in fade-in zoom-in-50 duration-200 ease-out"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {letter}
                </span>
              ))}
            </p>
          </div>
        )}
         {showAnswerTemporarily && (
          <div className="text-center py-4 my-2 bg-destructive/10 rounded-lg" aria-live="polite">
            <p className="text-4xl md:text-5xl font-bold tracking-wider text-destructive flex justify-center items-center gap-x-1">
              {wordToSpell.split('').map((letter, index) => (
                 <span 
                  key={`revealed-${letter}-${index}`} 
                  className="inline-block animate-in fade-in-0 zoom-in-75 duration-150 ease-out"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {letter}
                </span>
              ))}
            </p>
          </div>
        )}

        {!isWordCorrectlySpelled && !showAnswerTemporarily && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="spell-input" className="sr-only">Enter spelling</Label>
              <Input
                id="spell-input"
                ref={inputRef}
                type="text"
                value={attempt}
                onChange={(e) => setAttempt(e.target.value)}
                placeholder="Type your spelling here"
                className={cn(
                    "text-xl md:text-2xl p-3 md:p-4 h-auto shadow-inner",
                    feedback?.type === 'destructive' && "border-destructive ring-2 ring-destructive/50 focus-visible:ring-destructive"
                )}
                aria-label={`Spell the word you hear`}
                autoCapitalize="none"
                autoCorrect="off"
                disabled={feedback?.type === 'success'}
                autoFocus
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="w-full sm:flex-1" size="lg" disabled={feedback?.type === 'success' || !attempt.trim()}>Check Spelling</Button>
              {showHintButton && !hintText && (
                <Button type="button" variant="outline" onClick={handleShowHint} className="w-full sm:w-auto" size="lg">
                  <Lightbulb className="mr-2 h-5 w-5" /> Get Hint
                </Button>
              )}
              {wrongAttempts >= MAX_WRONG_ATTEMPTS_FOR_HINT + 2 && !showAnswerTemporarily && (
                <Button type="button" variant="destructive" onClick={handleRevealAnswer} className="w-full sm:w-auto" size="lg">
                  <Eye className="mr-2 h-5 w-5" /> Reveal Answer
                </Button>
              )}
            </div>
          </form>
        )}
        {hintText && !isWordCorrectlySpelled && (
          <Alert variant="info" className="mt-4 animate-in fade-in-0">
            <Lightbulb className="h-5 w-5" />
            <AlertTitle>Hint</AlertTitle>
            <AlertDescription>{hintText}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      {feedback && !isWordCorrectlySpelled && (
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
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </Card>
  );
};
