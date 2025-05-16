
"use client";
import type { FC, FormEvent } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Sparkles, InfoIcon, Smile, Volume2, Lightbulb, Eye } from 'lucide-react';
import { playErrorSound, playSuccessSound, speakText, playNotificationSound, playCoinsDeductedSound, playCoinsEarnedSound } from '@/lib/audio';
import { addMasteredWord } from '@/lib/storage';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useToast } from '@/hooks/use-toast';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { cn } from '@/lib/utils';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup';

interface SpellingPracticeProps {
  wordToSpell: string;
  onCorrectSpell: () => void;
}

const MAX_WRONG_ATTEMPTS_FOR_HINT = 2;
const POINTS_PER_CORRECT_SPELL = 2;
const POINTS_DEDUCTED_PER_WRONG_ANSWER = 1;

export const SpellingPractice: FC<SpellingPracticeProps> = ({ wordToSpell, onCorrectSpell }) => {
  const [attempt, setAttempt] = useState('');
  const [feedback, setFeedback] = useState<{type: 'success' | 'destructive' | 'info', message: string} | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHintButton, setShowHintButton] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [isWordCorrectlySpelled, setIsWordCorrectlySpelled] = useState(false);
  const [showAnswerTemporarily, setShowAnswerTemporarily] = useState(false);
  const [displayedAttempt, setDisplayedAttempt] = useState<string | null>(null);


  const { username, addGoldenCoins, deductGoldenCoins } = useUserProfileStore();
  const { toast } = useToast();
  const { soundEffectsEnabled } = useAppSettingsStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [showCoinsEarnedPopup, setShowCoinsEarnedPopup] = useState(false);
  const [lastAwardedCoins, setLastAwardedCoins] = useState(0);
  const [showCoinsLostPopup, setShowCoinsLostPopup] = useState(false);
  const [lastDeductedCoins, setLastDeductedCoins] = useState(0);

  const resetForNewWord = useCallback(() => {
    setAttempt('');
    setFeedback(null);
    setWrongAttempts(0);
    setShowHintButton(false);
    setHintText(null);
    setIsWordCorrectlySpelled(false);
    setShowAnswerTemporarily(false);
    setDisplayedAttempt(null);
    if (wordToSpell && soundEffectsEnabled) {
      setTimeout(() => speakText(`Spell the word: ${wordToSpell}`), 100);
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
    setFeedback({ type: 'info', message: `The word was "${wordToSpell}". Let's move on.` });
    playNotificationSound();

    const afterRevealSequence = () => {
      setTimeout(() => {
        onCorrectSpell();
      }, 1500);
    };

    if (soundEffectsEnabled) {
      const initialRevealMessage = `Okay, ${username ? username : 'learner'}. The word was ${wordToSpell}.`;
      speakText(
        initialRevealMessage,
        undefined,
        () => {
          const letters = wordToSpell.split('').join(', ');
          const spelledOutMessage = `That's ${letters}. Let's try the next one.`;
          speakText(
            spelledOutMessage,
            undefined,
            afterRevealSequence,
            (errorEvent) => {
              console.error("Speech error during letter spelling:", errorEvent.error);
              afterRevealSequence();
            }
          );
        },
        (errorEvent) => {
          console.error("Speech error during initial reveal:", errorEvent.error);
          afterRevealSequence();
        }
      );
    } else {
      afterRevealSequence();
    }
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!wordToSpell || !attempt.trim()) {
      setFeedback({type: 'info', message: 'Please enter your spelling attempt.'});
      if (soundEffectsEnabled) speakText("Please type your spelling.");
      return;
    }

    const trimmedAttempt = attempt.trim();
    const isCorrect = trimmedAttempt.toLowerCase() === wordToSpell.toLowerCase();
    setDisplayedAttempt(trimmedAttempt);

    if (isCorrect) {
      const successMessage = `${username ? username + ", y" : "Y"}ou spelled it right: "${wordToSpell}"!`;
      setFeedback({type: 'success', message: successMessage});
      setIsWordCorrectlySpelled(true);
      playSuccessSound();
      addGoldenCoins(POINTS_PER_CORRECT_SPELL);
      setLastAwardedCoins(POINTS_PER_CORRECT_SPELL);
      setShowCoinsEarnedPopup(true);
      if(soundEffectsEnabled) playCoinsEarnedSound();

      toast({
        variant: "success",
        title: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> +{POINTS_PER_CORRECT_SPELL} Golden Coins!</div>,
        description: `You spelled "${wordToSpell}" correctly!`,
      });
      addMasteredWord(wordToSpell);

      const afterSpeechCallback = () => {
        setTimeout(() => {
          onCorrectSpell();
        }, 500);
      };

      const letters = wordToSpell.split('').join(', ');
      const spelledOutMessage = `That's ${letters}.`;

      if (soundEffectsEnabled) {
        speakText(`Correct! You spelled ${wordToSpell}.`, undefined, () => {
          speakText(spelledOutMessage, undefined, afterSpeechCallback,
            (err) => { console.error("Error speaking letters:", err.error); afterSpeechCallback(); });
        }, (err) => { console.error("Error speaking confirmation:", err.error); afterSpeechCallback(); });
      } else {
        afterSpeechCallback();
      }

      setWrongAttempts(0);
      setShowHintButton(false);
      setHintText(null);
    } else {
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      setFeedback({type: 'destructive', message: `Not quite. You spelled "${trimmedAttempt}". Hear the word again or use a hint!`});
      playErrorSound();
      deductGoldenCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
      setLastDeductedCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
      setShowCoinsLostPopup(true);
      if(soundEffectsEnabled) playCoinsDeductedSound();
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-1"><XCircle className="h-5 w-5" /> Oops!</div>,
        description: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> -{POINTS_DEDUCTED_PER_WRONG_ANSWER} Golden Coin.</div>,
      });

      if (soundEffectsEnabled) {
        speakText(`Not quite. You spelled "${trimmedAttempt}". Please try again.`, undefined, undefined, (err) => console.error("Error speaking 'not quite':", err.error));
      }
      if (newWrongAttempts >= MAX_WRONG_ATTEMPTS_FOR_HINT && !showHintButton) {
        setShowHintButton(true);
      }
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
       <Card className="shadow-lg w-full animate-in fade-in-0 zoom-in-95 duration-300 relative">
         <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
         <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
         <CardHeader>
           <CardTitle className="flex items-center text-xl font-semibold text-primary"><Sparkles className="mr-2 h-5 w-5"/>Spell the Word</CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-muted-foreground">Loading word or select one from your list to start spelling practice.</p>
         </CardContent>
       </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full relative">
      <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
      <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
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
        <div
          className={cn(
            "text-center py-4 my-2 min-h-[80px] md:min-h-[120px] flex items-center justify-center rounded-lg",
            (isWordCorrectlySpelled || showAnswerTemporarily || (displayedAttempt && feedback?.type === 'destructive')) && "bg-muted/50 dark:bg-muted/30 p-4 shadow-inner"
          )}
          aria-live="polite"
          role="status"
        >
            {isWordCorrectlySpelled && wordToSpell && (
            <p className="text-5xl md:text-7xl font-bold tracking-wider text-green-600 dark:text-green-400 flex justify-center items-center gap-x-1 md:gap-x-1.5">
                {wordToSpell.split('').map((letter, index) => (
                <span
                    key={`${letter}-${index}`}
                    className="inline-block animate-in fade-in-0 zoom-in-75 duration-300 ease-out"
                    style={{ animationDelay: `${index * 80}ms` }}
                >
                    {letter}
                </span>
                ))}
            </p>
            )}
            {showAnswerTemporarily && wordToSpell && (
            <>
                <p className="text-4xl md:text-5xl font-bold tracking-wider text-blue-600 dark:text-blue-400 flex justify-center items-center gap-x-1">
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
            </>
            )}
            {!isWordCorrectlySpelled && !showAnswerTemporarily && displayedAttempt && feedback?.type === 'destructive' && (
                 <p className="text-5xl md:text-7xl font-bold tracking-wider text-red-600 dark:text-red-400 flex justify-center items-center gap-x-1 md:gap-x-1.5">
                    {displayedAttempt.split('').map((letter, index) => (
                    <span
                        key={`attempt-${letter}-${index}`}
                        className="inline-block animate-shake"
                    >
                        {letter}
                    </span>
                    ))}
                </p>
            )}
            {!isWordCorrectlySpelled && !showAnswerTemporarily && !displayedAttempt && !feedback && (
                <p className="text-muted-foreground text-lg">Listen and type the word.</p>
            )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="spell-form-title">
          <h3 id="spell-form-title" className="sr-only">Spelling Input Area</h3>
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
                  feedback?.type === 'destructive' && !isWordCorrectlySpelled && !showAnswerTemporarily && "border-destructive ring-2 ring-destructive/50 focus-visible:ring-destructive"
              )}
              aria-label={`Spell the word you hear`}
              aria-describedby="feedback-alert"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isWordCorrectlySpelled || showAnswerTemporarily}
              autoFocus={!isWordCorrectlySpelled && !showAnswerTemporarily}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" className="w-full sm:flex-1" size="lg" disabled={isWordCorrectlySpelled || showAnswerTemporarily || !attempt.trim()}>Check Spelling</Button>
            {showHintButton && !hintText && !isWordCorrectlySpelled && !showAnswerTemporarily && (
              <Button type="button" variant="outline" onClick={handleShowHint} className="w-full sm:w-auto" size="lg" disabled={isWordCorrectlySpelled || showAnswerTemporarily}>
                <Lightbulb className="mr-2 h-5 w-5" /> Get Hint
              </Button>
            )}
            {wrongAttempts >= MAX_WRONG_ATTEMPTS_FOR_HINT + 2 && !isWordCorrectlySpelled && !showAnswerTemporarily && (
              <Button type="button" variant="destructive" onClick={handleRevealAnswer} className="w-full sm:w-auto" size="lg" disabled={isWordCorrectlySpelled || showAnswerTemporarily}>
                <Eye className="mr-2 h-5 w-5" /> Reveal Answer
              </Button>
            )}
          </div>
        </form>

        {hintText && !isWordCorrectlySpelled && !showAnswerTemporarily && (
          <Alert variant="info" className="mt-4 animate-in fade-in-0" role="status">
            <Lightbulb className="h-5 w-5" />
            <AlertTitle>Hint</AlertTitle>
            <AlertDescription>{hintText}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      {feedback && !isWordCorrectlySpelled && !showAnswerTemporarily && (
        <CardFooter className="animate-in fade-in-0 zoom-in-95 duration-300">
          <Alert variant={feedback.type} className="w-full" id="feedback-alert" role="alert">
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

