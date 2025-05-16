
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback, useRef } from 'react';
import { generateMathWordProblem, type GenerateMathWordProblemInput, type GenerateMathWordProblemOutput } from '@/ai/flows/generate-math-word-problem';
import { CheckCircle2, XCircle, Loader2, Brain, RefreshCcw, Volume2, Mic, MicOff, Smile, Lightbulb, Info } from 'lucide-react';
import Image from 'next/image';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText, playCompletionSound, playCoinsEarnedSound, playCoinsDeductedSound } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup';

type DifficultyLevel = 'easy' | 'medium' | 'hard';
type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'random';

const PROBLEMS_PER_SESSION = 5;
const POINTS_PER_CORRECT_ANSWER = 1;
const POINTS_DEDUCTED_PER_WRONG_ANSWER = 1;
const SESSION_COMPLETION_BONUS = 5;
const PENALTY_PER_WRONG_FOR_BONUS = 1;

export const AiWordProblemGameUI = () => {
  const [currentProblem, setCurrentProblem] = useState<GenerateMathWordProblemOutput | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string | JSX.Element } | null>(null);
  const [score, setScore] = useState(0);
  const [problemsSolvedInSession, setProblemsSolvedInSession] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [operation, setOperation] = useState<Operation>('addition');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [inputAnimation, setInputAnimation] = useState<'success' | 'error' | null>(null);

  const [showCoinsEarnedPopup, setShowCoinsEarnedPopup] = useState(false);
  const [showCoinsLostPopup, setShowCoinsLostPopup] = useState(false);
  const [lastAwardedCoins, setLastAwardedCoins] = useState(0);
  const [lastDeductedCoins, setLastDeductedCoins] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const answerInputRef = useRef<HTMLInputElement>(null);
  const { username, addGoldenCoins, deductGoldenCoins } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const fetchNewProblem = useCallback(async (isNewSessionStart: boolean = false) => {
    if(sessionCompleted && !isNewSessionStart) return;
    setIsLoading(true);
    setFeedback(null);
    setUserAnswer('');
    setCurrentProblem(null);
    setInputAnimation(null);
    if(!isNewSessionStart && soundEffectsEnabled) playNotificationSound();

    try {
      const input: GenerateMathWordProblemInput = { difficultyLevel: difficulty, operation, username: username || undefined };
      const problemData = await generateMathWordProblem(input);
      setCurrentProblem(problemData);
      answerInputRef.current?.focus();
      if (problemData?.problemText && soundEffectsEnabled) {
        speakText(problemData.problemText);
      }
    } catch (error) {
      console.error("Error generating math problem:", error);
      setFeedback({ type: 'error', message: 'Could not generate a problem. Please try again.' });
      if (soundEffectsEnabled) playErrorSound();
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, operation, username, soundEffectsEnabled, sessionCompleted]);

  const startNewSession = useCallback(() => {
    setScore(0);
    setProblemsSolvedInSession(0);
    setSessionCompleted(false);
    fetchNewProblem(true);
  }, [fetchNewProblem]);


  const handleSessionCompletion = useCallback((finalScore: number) => {
    setSessionCompleted(true);
    const wrongAnswersInSession = PROBLEMS_PER_SESSION - finalScore;
    const calculatedBonus = Math.max(0, SESSION_COMPLETION_BONUS - (wrongAnswersInSession * PENALTY_PER_WRONG_FOR_BONUS));

    if (calculatedBonus > 0) {
      addGoldenCoins(calculatedBonus);
      setLastAwardedCoins(calculatedBonus);
      setShowCoinsEarnedPopup(true);
      if (soundEffectsEnabled) playCoinsEarnedSound();
    }

    const completionMessage = username ? `Awesome, ${username}!` : 'Session Complete!';
    const description = `You solved ${PROBLEMS_PER_SESSION} problems. Great job! Final score: ${finalScore}. ${calculatedBonus > 0 ? `You earned ${calculatedBonus} bonus Golden Coins!` : 'Keep practicing for a bonus!'}`;
    toast({
      variant: "success",
      title: <div className="flex items-center gap-2">
               <Image src="/assets/images/golden_trophy_with_stars_illustration.png" alt="Trophy" width={24} height={24} />
               {completionMessage}
             </div>,
      description: description,
      duration: 7000,
    });
    if (soundEffectsEnabled) {
        playCompletionSound();
        speakText(`${completionMessage} ${description}`);
    }
  }, [username, soundEffectsEnabled, toast, addGoldenCoins]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (sessionCompleted || !currentProblem || userAnswer.trim() === '') {
      if (userAnswer.trim() === '') setFeedback({ type: 'info', message: 'Please enter an answer.' });
      return;
    }

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      setFeedback({ type: 'info', message: 'Please enter a valid number.' });
      return;
    }

    const isCorrect = answerNum === currentProblem.numericalAnswer;
    setInputAnimation(isCorrect ? 'success' : 'error');
    setTimeout(() => setInputAnimation(null), 700);

    let newCurrentScore = score;
    if(isCorrect) {
        newCurrentScore = score + 1;
        setScore(newCurrentScore);
        addGoldenCoins(POINTS_PER_CORRECT_ANSWER);
        setLastAwardedCoins(POINTS_PER_CORRECT_ANSWER);
        setShowCoinsEarnedPopup(true);
        if (soundEffectsEnabled) playCoinsEarnedSound();
        toast({
          variant: "success",
          title: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> +{POINTS_PER_CORRECT_ANSWER} Golden Coins!</div>,
          description: "Excellent!",
          duration: 2000,
        });
    } else {
        deductGoldenCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
        setLastDeductedCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
        setShowCoinsLostPopup(true);
        if (soundEffectsEnabled) playCoinsDeductedSound();
        toast({
          variant: "destructive",
          title: <div className="flex items-center gap-1"><XCircle className="h-5 w-5" /> Oops!</div>,
          description: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> -{POINTS_DEDUCTED_PER_WRONG_ANSWER} Golden Coin.</div>,
          duration: 2000,
        });
    }

    const afterFeedbackAudio = () => {
      const newProblemsSolved = problemsSolvedInSession + 1;
      setProblemsSolvedInSession(newProblemsSolved);

      if (newProblemsSolved >= PROBLEMS_PER_SESSION) {
        handleSessionCompletion(newCurrentScore);
      } else {
        fetchNewProblem();
      }
    };


    if (isCorrect) {
      let successMessage = `${username ? username + ", that's c" : 'C'}orrect! The answer is ${currentProblem.numericalAnswer}.`;
      if (operation === 'random' && currentProblem.operationUsed) {
        successMessage += ` (Operation: ${currentProblem.operationUsed})`;
      }
      setFeedback({ type: 'success', message: successMessage });
      if (soundEffectsEnabled) playSuccessSound();
      const speechSuccessMsg = `${username ? username + ", " : ""}Correct! ${currentProblem.problemText} The answer is ${currentProblem.numericalAnswer}.`;

      if (soundEffectsEnabled) {
        const utterance = speakText(speechSuccessMsg, undefined, afterFeedbackAudio);
        if (!utterance) setTimeout(afterFeedbackAudio, 1500);
      } else {
        setTimeout(afterFeedbackAudio, 1200);
      }

    } else {
      const errorMessage = (
        <>
          Not quite{username ? `, ${username}` : ''}. The correct answer was <strong>{currentProblem.numericalAnswer}</strong>.
          {currentProblem.explanation && <p className="mt-1 text-xs"><em>Explanation: {currentProblem.explanation}</em></p>}
          {operation === 'random' && currentProblem.operationUsed && <p className="mt-1 text-xs"><em>(AI chose: {currentProblem.operationUsed})</em></p>}
          Try the next one!
        </>
      );
      setFeedback({ type: 'error', message: errorMessage });
      if (soundEffectsEnabled) playErrorSound();
      const speechErrorMsg = `Oops! The correct answer was ${currentProblem.numericalAnswer}. ${currentProblem.explanation || ''}`;

      if (soundEffectsEnabled) {
        const utterance = speakText(speechErrorMsg, undefined, afterFeedbackAudio);
        if (!utterance) setTimeout(afterFeedbackAudio, 2500);
      } else {
        setTimeout(afterFeedbackAudio, 2000);
      }
    }
  }, [currentProblem, userAnswer, fetchNewProblem, username, operation, soundEffectsEnabled, problemsSolvedInSession, handleSessionCompletion, sessionCompleted, score, addGoldenCoins, deductGoldenCoins, toast]);

  useEffect(() => {
    startNewSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, operation]);

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        const number = parseSpokenNumber(spokenText);
        if (number !== null) {
          setUserAnswer(String(number));
           toast({
             title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Heard you!</div>,
             description: `You said: "${spokenText}". We interpreted: "${String(number)}".`,
             variant: "info"
            });
           setTimeout(() => handleSubmitRef.current(), 50);
        } else {
          toast({
            title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Couldn't understand</div>,
            description: `Heard: "${spokenText}". Please try again or type the number.`,
            variant: "info"
          });
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({
            title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Voice Input Error</div>,
            description: `Could not recognize speech: ${event.error}. Try typing.`,
            variant: "destructive"
        });
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
        if (recognitionRef.current) {
           recognitionRef.current.stop();
        }
    };
  }, [toast]);

  const handleSpeakProblem = () => {
    if (currentProblem?.problemText && soundEffectsEnabled) {
      speakText(currentProblem.problemText + (currentProblem.explanation ? ` ${currentProblem.explanation}` : ''));
    } else if (!soundEffectsEnabled) {
       toast({ variant: "info", title: "Audio Disabled", description: "Sound effects are turned off in settings." });
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
        toast({
            title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Voice Input Not Supported</div>,
            description: "Your browser doesn't support voice input. Please type your answer.",
            variant: "info",
            duration: 5000
        });
        return;
    }
    if (!soundEffectsEnabled) {
        toast({ variant: "info", title: "Audio Disabled", description: "Voice input requires sound effects to be enabled in settings." });
        return;
    }
    if (sessionCompleted) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        if (soundEffectsEnabled) playNotificationSound();
        recognitionRef.current.start();
        setIsListening(true);
        setFeedback(null);
        toast({
            title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Listening...</div>,
            description: "Speak your answer.",
            variant: "info"
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({
            title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Mic Error</div>,
            description: "Could not start microphone. Check permissions.",
            variant: "destructive"
        });
        setIsListening(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500 relative">
      <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
      <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
          <Brain className="mr-2 h-6 w-6" /> AI Word Problem Solver
        </CardTitle>
        <CardDescription>
          Score: <span className="font-bold text-accent">{score}</span> |
          Problems Solved: <span className="font-bold text-accent">{problemsSolvedInSession} / {PROBLEMS_PER_SESSION}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="difficulty-select">Difficulty</Label>
            <Select value={difficulty} onValueChange={(val) => setDifficulty(val as DifficultyLevel)} disabled={isLoading || sessionCompleted}>
              <SelectTrigger id="difficulty-select" className="h-11">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="operation-select">Operation</Label>
            <Select value={operation} onValueChange={(val) => setOperation(val as Operation)} disabled={isLoading || sessionCompleted}>
              <SelectTrigger id="operation-select" className="h-11">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="addition">Addition (+)</SelectItem>
                <SelectItem value="subtraction">Subtraction (-)</SelectItem>
                <SelectItem value="multiplication">Multiplication (×)</SelectItem>
                <SelectItem value="division">Division (÷)</SelectItem>
                <SelectItem value="random">Random (AI Chooses)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {sessionCompleted ? (
          <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50 animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="flex flex-col items-center gap-4 py-4">
               <Image src="/assets/images/golden_trophy_with_stars_illustration.png" alt="Trophy" width={40} height={40} />
              <AlertTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                {username ? `Congratulations, ${username}!` : 'Session Complete!'}
              </AlertTitle>
              <AlertDescription className="text-base">
                You've successfully completed {PROBLEMS_PER_SESSION} problems in this session! Your final score: {score}.
              </AlertDescription>
              <Button onClick={startNewSession} variant="outline" size="lg" className="mt-4">
                <RefreshCcw className="mr-2 h-4 w-4" /> Play New Session
              </Button>
            </div>
          </Alert>
        ) : isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[150px] space-y-2">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating an AI-mazing problem for you...</p>
            <p className="sr-only">Loading new problem...</p>
          </div>
        ) : currentProblem ? (
          <div className="space-y-4 animate-in fade-in-0 duration-300">
            <Card className="bg-muted/30 p-4 rounded-lg shadow">
              <CardTitle className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent"/>
                Problem: {currentProblem.operationUsed && operation === 'random' && <span className="text-sm text-muted-foreground">(Operation: {currentProblem.operationUsed})</span>}
                <Button variant="ghost" size="icon" onClick={handleSpeakProblem} aria-label="Read problem aloud" className="ml-auto" disabled={isListening || !soundEffectsEnabled}>
                    <Volume2 className="h-5 w-5" />
                </Button>
              </CardTitle>
              <CardDescription className="text-lg text-foreground/90 leading-relaxed" aria-live="polite">
                {currentProblem.problemText}
              </CardDescription>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="math-answer" className="sr-only">Your Answer</Label>
                <Input
                  id="math-answer"
                  ref={answerInputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Your answer"
                  className={cn(
                    "text-2xl p-3 h-14 text-center shadow-sm focus:ring-2 focus:ring-primary flex-grow",
                    inputAnimation === 'success' && "animate-flash-success",
                    inputAnimation === 'error' && "animate-shake-error animate-flash-error"
                  )}
                  aria-label="Enter your answer for the math problem"
                  disabled={!!feedback || isLoading || isListening}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={toggleListening}
                    className={cn("h-14 w-14", isListening && "bg-destructive/20 text-destructive animate-pulse")}
                    aria-label={isListening ? "Stop listening" : "Speak your answer"}
                    disabled={!!feedback || isLoading || !recognitionRef.current || !soundEffectsEnabled}
                >
                    {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              </div>
              <Button type="submit" size="lg" className="w-full btn-glow !text-lg" disabled={!!feedback || isLoading || isListening}>
                Check Answer
              </Button>
            </form>
          </div>
        ) : (
           <div className="flex flex-col justify-center items-center min-h-[150px] space-y-2">
                <Info className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Ready to start? Settings are above.</p>
            </div>
        )}
        {feedback && !sessionCompleted && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : feedback.type} className="mt-4 animate-in fade-in-0 zoom-in-95 duration-300">
            {feedback.type === 'success' ? <Smile className="h-5 w-5" /> : feedback.type === 'error' ? <XCircle className="h-5 w-5" /> : null}
            <AlertTitle>
              {feedback.type === 'success' ? (username ? `Well done, ${username}!` : 'Correct!') :
               feedback.type === 'error' ? 'Try Again!' : 'Info'}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => sessionCompleted ? startNewSession() : fetchNewProblem()} className="w-full" disabled={isLoading || isListening}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {sessionCompleted ? "Start New Session" : "Skip / New Problem"}
        </Button>
      </CardFooter>
    </Card>
  );
};
