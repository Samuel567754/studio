
'use client';
import React, { FC, ReactNode, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateReadingPassage, type GenerateReadingPassageInput } from '@/ai/flows/generate-reading-passage';
import { generateComprehensionQuestions, type GenerateComprehensionQuestionsInput, type GenerateComprehensionQuestionsOutput, type Question } from '@/ai/flows/generate-comprehension-questions';
import { Loader2, BookMarked, RefreshCcw, Info, Play, Pause, StopCircle, CheckCircle2, XCircle, ClipboardCopy, Smile, Edit2, BarChart2, Trophy, ArrowLeft, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { playSuccessSound, playErrorSound, playNotificationSound, speakText, playCompletionSound, playCoinsEarnedSound, playCoinsDeductedSound } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup';

interface ReadingPracticeProps {
  wordsToPractice: string[];
  readingLevel: string;
  masteredWords: string[];
  onSessionComplete: (score: number, totalQuestions: number) => void;
}

interface SpokenWordInfo {
  charIndex: number;
  charLength: number;
}

interface TestResult {
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  options?: string[];
  questionType: 'mcq' | 'true_false';
}

const PASSING_THRESHOLD_PERCENTAGE = 60;
const POINTS_PER_CORRECT_QUESTION = 3;
const POINTS_DEDUCTED_PER_WRONG_ANSWER = 1;

export const ReadingPractice: FC<ReadingPracticeProps> = ({ wordsToPractice, readingLevel, masteredWords, onSessionComplete }) => {
  const [passage, setPassage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [currentSpokenWordInfo, setCurrentSpokenWordInfo] = useState<SpokenWordInfo | null>(null);
  const { username, favoriteTopics, addGoldenCoins, deductGoldenCoins } = useUserProfileStore();

  const [questionsData, setQuestionsData] = useState<GenerateComprehensionQuestionsOutput | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isTestActive, setIsTestActive] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [gameCompletedThisSession, setGameCompletedThisSession] = useState(false);
  const [isShowingResults, setIsShowingResults] = useState(false);
  const [showRetryOption, setShowRetryOption] = useState(false);

  const [showCoinsEarnedPopup, setShowCoinsEarnedPopup] = useState(false);
  const [lastAwardedCoins, setLastAwardedCoins] = useState(0);
  const [showCoinsLostPopup, setShowCoinsLostPopup] = useState(false);
  const [lastDeductedCoins, setLastDeductedCoins] = useState(0);


  const { toast } = useToast();
  const soundEffectsEnabled = useAppSettingsStore(state => state.soundEffectsEnabled);

  const resetSpeechState = useCallback(() => {
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null);
    setCurrentSpokenWordInfo(null);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      resetSpeechState();
    }
  }, [resetSpeechState]);

  const resetStateForNewPassage = useCallback(() => {
    setPassage(null);
    setCurrentSpokenWordInfo(null);
    resetSpeechState();
    setQuestionsData(null);
    setIsTestActive(false);
    setUserAnswers(new Map());
    setTestResults(null);
    setOverallScore(null);
    setGameCompletedThisSession(false);
    setIsShowingResults(false);
    setShowRetryOption(false);
  }, [resetSpeechState]);

  const handleSpeechBoundary = useCallback((event: SpeechSynthesisEvent) => {
    if (event.name === 'word' && event.charLength > 0) {
      setCurrentSpokenWordInfo({ charIndex: event.charIndex, charLength: event.charLength });
    }
  }, []);

  const handleSpeechEnd = useCallback(() => {
    resetSpeechState();
  }, [resetSpeechState]);

  const handleSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
      if (event.error && event.error !== 'interrupted' && event.error !== 'canceled') {
          console.error("Speech synthesis error in ReadingPractice:", event.error, passage?.substring(event.charIndex));
          toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Audio Error</div>, description: `Could not play audio: ${event.error}.` });
          playErrorSound();
      } else if (event.error) {
        console.warn("Speech synthesis event (interrupted/canceled) in ReadingPractice:", event.error);
      }
      resetSpeechState();
  }, [toast, passage, resetSpeechState]);

  const fetchPassage = useCallback(async () => {
    if (wordsToPractice.length === 0) {
      toast({ variant: "info", title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />No Words to Practice</div>, description: "Please get some word suggestions and select a word first." });
      setPassage("Please get some word suggestions and select a word first. Then, try generating a passage.");
      return;
    }
    if (isSpeaking) stopSpeech();
    setIsLoading(true);
    resetStateForNewPassage();

    try {
      const input: GenerateReadingPassageInput = { words: wordsToPractice, readingLevel, masteredWords, favoriteTopics: favoriteTopics || undefined };
      const result = await generateReadingPassage(input);
      if (result.passage) {
        setPassage(result.passage);
        toast({ variant: "success", title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />{username ? `Passage for ${username}!` : 'Passage Generated!'}</div>, description: "Happy reading!" });
        playSuccessSound();
      } else {
        setPassage("Could not generate a passage. Try different words or settings.");
        toast({ variant: "info", title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />No Passage Generated</div>, description: "Try different words or settings." });
        playNotificationSound();
      }
    } catch (error) {
      console.error("Error generating passage:", error);
      setPassage("An error occurred. Please try again.");
      toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Error</div>, description: "Failed to generate passage." });
      playErrorSound();
    } finally {
      setIsLoading(false);
    }
  }, [wordsToPractice, readingLevel, masteredWords, favoriteTopics, toast, stopSpeech, isSpeaking, username, resetStateForNewPassage]);

  useEffect(() => {
    fetchPassage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch passage on initial mount and when key props change

  const handleGenerateTest = async () => {
    if (!passage) {
      toast({ variant: "info", title: "No Passage", description: "Generate a passage first to create a test." });
      return;
    }
    setIsTestLoading(true);
    setQuestionsData(null);
    setUserAnswers(new Map());
    setTestResults(null);
    setOverallScore(null);
    setIsShowingResults(false);
    setShowRetryOption(false);
    playNotificationSound();
    try {
      const input: GenerateComprehensionQuestionsInput = {
        passageText: passage,
        readingLevel: readingLevel as 'beginner' | 'intermediate' | 'advanced',
        numberOfQuestions: 3,
      };
      const result = await generateComprehensionQuestions(input);
      setQuestionsData(result);
      setIsTestActive(true);
      toast({ variant: "success", title: <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Test Ready!</div>, description: "Comprehension test generated."});
       if(soundEffectsEnabled) speakText("Your comprehension test is ready. Answer the questions.");
    } catch (error) {
      console.error("Error generating comprehension test:", error);
      toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Test Error</div>, description: "Could not generate comprehension test."});
      playErrorSound();
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => new Map(prev).set(questionIndex, answer));
  };

  const handleFinishSession = (finalScore: number, totalQuestions: number) => {
    setGameCompletedThisSession(true);
    onSessionComplete(finalScore, totalQuestions);
  };

  const handleSubmitTest = () => {
    if (!questionsData) return;

    if (userAnswers.size < questionsData.questions.length) {
      toast({
        variant: "info",
        title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Incomplete Test</div>,
        description: "Please answer all questions before submitting.",
      });
      if(soundEffectsEnabled) {
        playNotificationSound();
        speakText("Please answer all questions before submitting.");
      }
      return;
    }

    let correctCount = 0;
    const results: TestResult[] = questionsData.questions.map((q, index) => {
      const userAnswerText = userAnswers.get(index) || "";
      const isCorrect = userAnswerText.toLowerCase() === q.correctAnswer.toLowerCase();
      if (isCorrect) {
        correctCount++;
        addGoldenCoins(POINTS_PER_CORRECT_QUESTION);
        setLastAwardedCoins(POINTS_PER_CORRECT_QUESTION); // Assuming same points for all questions for popup
        setShowCoinsEarnedPopup(true);
        if(soundEffectsEnabled) playCoinsEarnedSound();
        toast({
            variant: "success",
            title: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> +{POINTS_PER_CORRECT_QUESTION} Golden Coins!</div>,
            description: `Correct for Q${index+1}!`,
            duration: 1500,
        });
      } else {
        deductGoldenCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
        setLastDeductedCoins(POINTS_DEDUCTED_PER_WRONG_ANSWER);
        setShowCoinsLostPopup(true);
        if(soundEffectsEnabled) playCoinsDeductedSound();
        toast({
            variant: "destructive",
            title: <div className="flex items-center gap-1"><XCircle className="h-5 w-5" /> Oops! (-{POINTS_DEDUCTED_PER_WRONG_ANSWER} Coin)</div>,
            description: `Incorrect for Q${index+1}.`,
            duration: 1500,
        });
      }
      return {
        questionText: q.questionText,
        userAnswer: userAnswerText,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        options: q.options,
        questionType: q.questionType,
      };
    });

    setTestResults(results);
    setOverallScore(correctCount);
    setIsTestActive(false);
    setIsShowingResults(true);
    // playNotificationSound(); // Sound played per question now

    const resultSpeech = `You scored ${correctCount} out of ${questionsData.questions.length}. `;

    const speakExplanationsSequentially = async () => {
      if (soundEffectsEnabled && results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          const res = results[i];
          let reviewText = `For question ${i + 1}: ${res.questionText}. `;
          reviewText += `You answered: ${res.userAnswer || "not answered"}. `;
          if (res.isCorrect) {
            reviewText += "That is correct. ";
          } else {
            reviewText += `The correct answer was: ${res.correctAnswer}. `;
          }
          if (res.explanation) {
            reviewText += `Explanation: ${res.explanation}. `;
          }

          await new Promise<void>((resolve) => {
            const utterance = speakText(reviewText, undefined, () => resolve(), (errEvent) => {
              console.error("Speech error during detailed review:", errEvent.error);
              resolve();
            });
            if (!utterance) resolve();
          });
        }
      }
      afterResultAndExplanationSpeechCallback();
    };

    const afterResultAndExplanationSpeechCallback = () => {
        const passingScore = Math.ceil(questionsData.questions.length * (PASSING_THRESHOLD_PERCENTAGE / 100));
        if (correctCount < passingScore) {
            setShowRetryOption(true);
            toast({
                variant: "info",
                title: "Test Graded",
                description: `You scored ${correctCount}/${questionsData.questions.length}. You can review your answers or try again.`,
                duration: 8000
            });
            if (soundEffectsEnabled) speakText("You can review your answers or try again.");
        } else {
            setShowRetryOption(false);
            handleFinishSession(correctCount, questionsData.questions.length);
        }
    };

    if(soundEffectsEnabled) {
        speakText(resultSpeech, undefined, speakExplanationsSequentially, (err) => {
            console.error("Speech error announcing score:", err.error);
            speakExplanationsSequentially();
        });
    } else {
        afterResultAndExplanationSpeechCallback();
    }
  };


  const handleRetryTest = () => {
    setIsTestActive(true);
    setUserAnswers(new Map());
    setTestResults(null);
    setOverallScore(null);
    setIsShowingResults(false);
    setShowRetryOption(false);
    playNotificationSound();
    if(soundEffectsEnabled) speakText("Okay, let's try the test again!");
  };

  const handleFinishSessionWithLowScore = () => {
     if (overallScore !== null && questionsData) {
        handleFinishSession(overallScore, questionsData.questions.length);
     }
     setShowRetryOption(false);
  };

  const speakQuestionWithOptions = (question: Question) => {
    if (!soundEffectsEnabled) return;
    let text = `${question.questionText} Your options are: `;
    question.options.forEach((opt, idx) => {
      text += `${opt}${idx < question.options.length - 1 ? ', ' : '.'}`;
    });
    speakText(text);
  };

  const toggleSpeech = useCallback(() => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis || !passage) {
        if (!passage && soundEffectsEnabled) toast({ variant: "info", title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />No Passage</div>, description: "Generate a passage first to read aloud." });
        return;
    }
    const speech = window.speechSynthesis;
    if (currentUtterance && isSpeaking) {
        if (isPaused) { speech.resume(); setIsPaused(false); playNotificationSound(); }
        else { speech.pause(); setIsPaused(true); playNotificationSound(); }
    } else {
      const utterance = speakText(passage, handleSpeechBoundary, handleSpeechEnd, handleSpeechError);
      if (utterance) { setCurrentUtterance(utterance); setIsSpeaking(true); setIsPaused(false); }
      else { resetSpeechState(); }
    }
  }, [passage, isSpeaking, isPaused, soundEffectsEnabled, handleSpeechBoundary, handleSpeechEnd, handleSpeechError, resetSpeechState, toast, currentUtterance]);

  const handleCopyPassage = useCallback(() => {
    if (passage && navigator.clipboard) {
      navigator.clipboard.writeText(passage)
        .then(() => { toast({ variant: "success", title: <div className="flex items-center gap-2"><ClipboardCopy className="h-5 w-5" />Copied!</div>, description: "Passage copied to clipboard." }); playSuccessSound(); })
        .catch(err => { console.error("Failed to copy passage: ", err); toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Copy Failed</div>, description: "Could not copy passage." }); playErrorSound(); });
    } else if (!navigator.clipboard) toast({ variant: "info", title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Not Supported</div>, description: "Clipboard API not available." });
  }, [passage, toast]);

  useEffect(() => { return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); resetSpeechState(); }; }, [resetSpeechState]);

  const renderHighlightedPassage = (): ReactNode[] => {
    if (!passage) return [];
    const elements: ReactNode[] = [];
    let keyCounter = 0;
    const processSegment = (textSegment: string, isSpoken: boolean) => {
      if (!textSegment) return;
      const tokens = textSegment.split(/(\b\w+\b|[^\w\s]+|\s+)/g).filter(Boolean);
      for (const token of tokens) {
        const isPractice = /\b\w+\b/.test(token) && wordsToPractice.some(pWord => pWord.toLowerCase() === token.toLowerCase());
        elements.push(
          <span
            key={`token-${keyCounter++}`}
            className={cn({
              'bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-colors duration-100 ease-in-out': isSpoken && /\b\w+\b/.test(token),
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2': isPractice && !isSpoken,
              'text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2 bg-accent/80 dark:bg-accent/60 text-accent-foreground px-0.5 rounded transition-colors duration-100 ease-in-out': isPractice && isSpoken && /\b\w+\b/.test(token),
            })}
          >
            {token}
          </span>
        );
      }
    };

    if (isSpeaking && currentSpokenWordInfo && passage) {
      const { charIndex, charLength } = currentSpokenWordInfo;
      const validCharIndex = Math.max(0, charIndex);
      const validCharLength = Math.max(0, charLength);

      if (validCharIndex < passage.length) {
        processSegment(passage.substring(0, validCharIndex), false);
        processSegment(passage.substring(validCharIndex, Math.min(passage.length, validCharIndex + validCharLength)), true);
        processSegment(passage.substring(Math.min(passage.length, validCharIndex + validCharLength)), false);
      } else {
        processSegment(passage, false);
      }
    } else if (passage) {
      processSegment(passage, false);
    }
    return elements;
  };

  const getPlayPauseAriaLabel = () => isSpeaking && !isPaused ? "Pause reading" : "Read passage aloud";
  const playPauseButtonText = () => isSpeaking && !isPaused ? 'Pause' : (isSpeaking && isPaused ? 'Resume' : 'Read Aloud');


  return (
    <Card className="shadow-xl w-full border-primary/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out relative">
      <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
      <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary">
          <BookMarked className="mr-2 h-5 w-5" aria-hidden="true" /> Practice Reading
        </CardTitle>
        <CardDescription>
          Read an AI-generated passage. You can also listen to it and take a comprehension test.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Passage Generation and Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={fetchPassage} disabled={isLoading || wordsToPractice.length === 0} className="w-full sm:flex-1 btn-glow" size="lg" aria-label={isLoading ? "Generating..." : "Generate New Passage"}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><RefreshCcw className="mr-2 h-4 w-4" />New Passage</>}
          </Button>
          {passage && !isLoading && (
            <>
              {soundEffectsEnabled && (
                <Button onClick={toggleSpeech} variant="outline" size="lg" className="w-full sm:w-auto" aria-label={getPlayPauseAriaLabel()} aria-pressed={isSpeaking && !isPaused} disabled={!passage}>
                  {isSpeaking && !isPaused ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}{playPauseButtonText()}
                </Button>
              )}
              {isSpeaking && <Button onClick={stopSpeech} variant="destructive" size="lg" className="w-full sm:w-auto" aria-label="Stop reading"><StopCircle className="mr-2 h-5 w-5" />Stop</Button>}
            </>
          )}
        </div>

        {isLoading && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="sr-only">Loading passage</span></div>}

        {/* Passage Display */}
        {passage && !isLoading && (
          <ScrollArea className="h-60 w-full rounded-md border p-4 bg-background/80 shadow-sm">
            <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-line">
              {renderHighlightedPassage().map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>)}
            </p>
          </ScrollArea>
        )}
        {!passage && !isLoading && wordsToPractice.length === 0 && (
           <Alert variant="info"><Info className="h-5 w-5" /><AlertTitle>Ready to Read?</AlertTitle><AlertDescription>Add words to your practice list first.</AlertDescription></Alert>
        )}
         {!passage && !isLoading && wordsToPractice.length > 0 && (
           <Alert variant="info"><Info className="h-5 w-5" /><AlertTitle>Generate a Passage</AlertTitle><AlertDescription>Click "New Passage" to start.</AlertDescription></Alert>
        )}

        {/* Comprehension Test Section */}
        {passage && !isLoading && !isTestActive && !isShowingResults && (
          <Button onClick={handleGenerateTest} disabled={isTestLoading} className="w-full mt-4" size="lg">
            {isTestLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generating Test...</> : <><Edit2 className="mr-2 h-5 w-5" />Take Comprehension Test</>}
          </Button>
        )}

        {isTestLoading && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="sr-only">Loading test</span></div>}

        {/* Test Active UI */}
        {isTestActive && questionsData && (
          <Card className="mt-6 bg-card/80 border-accent/30">
            <CardHeader><CardTitle className="text-lg text-accent">Comprehension Check</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {questionsData.questions.map((q, index) => (
                <div key={index} className="p-3 border rounded-md bg-background/50">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-foreground/90 flex-grow">{index + 1}. {q.questionText}</p>
                    {soundEffectsEnabled && (
                      <Button variant="ghost" size="icon" onClick={() => speakQuestionWithOptions(q)} aria-label={`Read question ${index + 1} and options`}>
                        <Volume2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  <RadioGroup onValueChange={(value) => handleAnswerChange(index, value)} value={userAnswers.get(index) || ""}>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt} id={`q${index}-opt${optIndex}`} />
                        <Label htmlFor={`q${index}-opt${optIndex}`} className="text-base font-normal">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              <Button onClick={handleSubmitTest} className="w-full btn-glow" size="lg">Submit Test</Button>
            </CardContent>
          </Card>
        )}

        {/* Test Results UI (when isShowingResults is true and not yet completed or retrying) */}
        {isShowingResults && testResults && !gameCompletedThisSession && (
          <Card className="mt-6 bg-card/80 border-blue-500/30">
            <CardHeader>
                <CardTitle className="text-lg text-blue-600 dark:text-blue-400">Test Results</CardTitle>
                <CardDescription>You scored: <strong className="text-xl">{overallScore} / {testResults.length}</strong></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResults.map((res, index) => (
                <Alert key={index} variant={res.isCorrect ? "success" : "destructive"} className={cn(
                  "p-3 transition-all duration-300",
                  res.isCorrect ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"
                )}>
                  {res.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  <AlertTitle className={cn("font-semibold", res.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                    Question {index + 1}: {res.questionText}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    Your answer: "{res.userAnswer || "Not answered"}"
                    {!res.isCorrect && <span className="block font-medium">Correct answer: "{res.correctAnswer}"</span>}
                    {res.explanation && <span className="block mt-1 text-xs italic">Explanation: {res.explanation}</span>}
                  </AlertDescription>
                  {res.options && (
                    <div className="mt-2 space-y-1">
                      {res.options.map(opt => (
                        <div key={opt} className={cn("text-xs px-2 py-1 rounded-md",
                          opt === res.correctAnswer ? "bg-green-500/20 text-green-800 dark:text-green-300" : "",
                          opt === res.userAnswer && !res.isCorrect ? "bg-red-500/20 text-red-800 dark:text-red-300 line-through" : "",
                          opt === res.userAnswer && res.isCorrect ? "bg-green-500/20 text-green-800 dark:text-green-300" : ""
                        )}>
                          {opt}
                          {opt === res.userAnswer && res.isCorrect && <CheckCircle2 className="inline h-3 w-3 ml-1" />}
                          {opt === res.userAnswer && !res.isCorrect && <XCircle className="inline h-3 w-3 ml-1" />}
                          {opt === res.correctAnswer && opt !== res.userAnswer && <CheckCircle2 className="inline h-3 w-3 ml-1 text-green-600" />}
                        </div>
                      ))}
                    </div>
                  )}
                </Alert>
              ))}
            </CardContent>
            {showRetryOption && (
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button onClick={handleRetryTest} variant="outline" size="lg" className="w-full sm:flex-1">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Try Test Again
                </Button>
                 <Button onClick={handleFinishSessionWithLowScore} size="lg" className="w-full sm:flex-1">
                    Continue & Finish Session
                </Button>
              </CardFooter>
            )}
          </Card>
        )}

      </CardContent>
      {passage && !isLoading && !gameCompletedThisSession && !isShowingResults && (
        <CardFooter className="border-t pt-4 flex-wrap gap-2 justify-between items-center">
            <p className="text-xs text-muted-foreground basis-full sm:basis-auto">Practice words are <strong className="text-primary font-semibold underline decoration-primary/50 decoration-wavy underline-offset-2">highlighted</strong>. Spoken words get background.</p>
            <Button onClick={handleCopyPassage} variant="ghost" size="sm" className="text-muted-foreground hover:text-primary basis-full sm:basis-auto">
              <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Passage
            </Button>
        </CardFooter>
      )}
    </Card>
  );
};
