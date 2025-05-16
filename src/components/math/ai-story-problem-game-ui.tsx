
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback, useRef } from 'react';
import { generateMathStoryProblem, type GenerateMathStoryProblemInput, type GenerateMathStoryProblemOutput } from '@/ai/flows/generate-math-story-problem';
import { CheckCircle2, XCircle, Loader2, BookOpen, RefreshCcw, Volume2, Mic, MicOff, Smile, Lightbulb, Info, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText, playCompletionSound, playCoinsEarnedSound, playCoinsDeductedSound } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { CoinsEarnedPopup } from '@/components/points-earned-popup';
import { CoinsLostPopup } from '@/components/points-lost-popup';


type DifficultyLevel = 'easy' | 'medium' | 'hard';
interface QuestionState {
  userAnswer: string;
  feedback: { type: 'success' | 'error' | 'info'; message: string | JSX.Element } | null;
  isCorrect: boolean | null;
  isSubmitted: boolean;
  inputAnimation: 'success' | 'error' | null;
}

const STORIES_PER_SESSION = 3;
const POINTS_PER_CORRECT_QUESTION = 1;
const POINTS_DEDUCTED_PER_WRONG_ANSWER = 1;
const SESSION_COMPLETION_BONUS = 5; // For completing the set of stories
const PENALTY_PER_WRONG_FOR_BONUS = 1; // Penalty for overall session bonus calculation

export const AiStoryProblemGameUI = () => {
  const [currentStoryProblem, setCurrentStoryProblem] = useState<GenerateMathStoryProblemOutput | null>(null);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const [currentStoryScore, setCurrentStoryScore] = useState(0);
  const [storiesCompletedInSession, setStoriesCompletedInSession] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [customTopics, setCustomTopics] = useState<string>('');
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // For dynamic bonus calculation
  const [sessionOverallCorrectAnswers, setSessionOverallCorrectAnswers] = useState(0);
  const [sessionOverallAttemptedQuestions, setSessionOverallAttemptedQuestions] = useState(0);

  const [showCoinsEarnedPopup, setShowCoinsEarnedPopup] = useState(false);
  const [showCoinsLostPopup, setShowCoinsLostPopup] = useState(false);
  const [lastAwardedCoins, setLastAwardedCoins] = useState(0);
  const [lastDeductedCoins, setLastDeductedCoins] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const answerInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { username, favoriteTopics, addGoldenCoins, deductGoldenCoins } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const fetchNewStoryProblem = useCallback(async (isNewSessionStart: boolean = false) => {
    if (sessionCompleted && !isNewSessionStart) return;
    setIsLoading(true);
    setQuestionStates([]);
    setCurrentStoryProblem(null);
    setCurrentStoryScore(0);
    if (!isNewSessionStart && soundEffectsEnabled) playNotificationSound();

    try {
      const topicsToUse = customTopics.trim() !== '' ? customTopics.trim() : favoriteTopics || undefined;
      const input: GenerateMathStoryProblemInput = {
        difficultyLevel: difficulty,
        topics: topicsToUse,
        username: username || undefined
      };
      const storyData = await generateMathStoryProblem(input);
      setCurrentStoryProblem(storyData);
      setQuestionStates(storyData.questions.map(() => ({ userAnswer: '', feedback: null, isCorrect: null, isSubmitted: false, inputAnimation: null })));
      if (storyData?.storyProblemText && soundEffectsEnabled) {
        const storyText = `Story time! ${storyData.overallTheme ? `The theme is ${storyData.overallTheme}.` : ''} ${storyData.storyProblemText}`;
        speakText(storyText, undefined, () => {
          if (storyData.questions && storyData.questions.length > 0 && soundEffectsEnabled) {
            speakText(`Question 1: ${storyData.questions[0].questionText}`);
          }
        });
      }
    } catch (error) {
      console.error("Error generating math story problem:", error);
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Error</div>,
        description: "Could not generate a story problem. Please try again."
      });
      if (soundEffectsEnabled) playErrorSound();
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, customTopics, favoriteTopics, username, toast, soundEffectsEnabled, sessionCompleted]);

  const startNewSession = useCallback(() => {
    setCurrentStoryScore(0);
    setStoriesCompletedInSession(0);
    setSessionOverallCorrectAnswers(0);
    setSessionOverallAttemptedQuestions(0);
    setSessionCompleted(false);
    fetchNewStoryProblem(true);
  }, [fetchNewStoryProblem]);


  const handleSessionCompletion = useCallback(() => {
    setSessionCompleted(true);
    const totalWrongAnswersInSession = sessionOverallAttemptedQuestions - sessionOverallCorrectAnswers;
    const calculatedBonus = Math.max(0, SESSION_COMPLETION_BONUS - (totalWrongAnswersInSession * PENALTY_PER_WRONG_FOR_BONUS));

    if (calculatedBonus > 0) {
      addGoldenCoins(calculatedBonus);
      setLastAwardedCoins(calculatedBonus);
      setShowCoinsEarnedPopup(true);
      if (soundEffectsEnabled) playCoinsEarnedSound();
    }

    const completionMessage = username ? `Fantastic, ${username}!` : 'Session Complete!';
    const description = `You've completed ${STORIES_PER_SESSION} stories. Overall you got ${sessionOverallCorrectAnswers} out of ${sessionOverallAttemptedQuestions} questions correct. ${calculatedBonus > 0 ? `You earned ${calculatedBonus} bonus Golden Coins!` : 'Well done!'}`;
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
  }, [username, soundEffectsEnabled, toast, addGoldenCoins, sessionOverallCorrectAnswers, sessionOverallAttemptedQuestions]);

  const handleSubmitAnswer = useCallback((questionIndex: number) => {
    if (sessionCompleted || !currentStoryProblem || !questionStates || questionStates.length <= questionIndex || !questionStates[questionIndex] || questionStates[questionIndex].userAnswer.trim() === '') {
      if (questionStates && questionStates.length > questionIndex && questionStates[questionIndex]) {
         setQuestionStates(prev => prev.map((qs, i) => i === questionIndex ? { ...qs, feedback: { type: 'info', message: 'Please enter an answer.' } } : qs));
      } else {
        console.error("Attempted to submit answer for an invalid question index or uninitialized state.");
        toast({
            variant: "destructive",
            title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Error</div>,
            description: "Something went wrong. Please try generating a new story."
        });
      }
      return;
    }

    const answerNum = parseFloat(questionStates[questionIndex].userAnswer.replace(',', '.'));
    if (isNaN(answerNum)) {
      setQuestionStates(prev => prev.map((qs, i) => i === questionIndex ? { ...qs, feedback: { type: 'info', message: 'Please enter a valid number.' } } : qs));
      return;
    }

    const question = currentStoryProblem.questions[questionIndex];
    const isCorrect = answerNum === question.numericalAnswer;

    let feedbackText: string | JSX.Element;
    let speechTextSegment: string;
    let newCurrentStoryScore = currentStoryScore;

    const animateInput = (type: 'success' | 'error') => {
        setQuestionStates(prev => prev.map((qs, i) => i === questionIndex ? { ...qs, inputAnimation: type } : qs));
        setTimeout(() => {
            setQuestionStates(prev => prev.map((qs, i) => i === questionIndex ? { ...qs, inputAnimation: null } : qs));
        }, 700);
    };

    if (isCorrect) {
      feedbackText = `${username ? username + ", y" : "Y"}ou got it right! The answer is ${question.numericalAnswer}.`;
      speechTextSegment = `Correct! The answer to: ${question.questionText} is ${question.numericalAnswer}.`;
      if(questionStates[questionIndex].isCorrect === null) {
         newCurrentStoryScore = currentStoryScore + 1;
         setCurrentStoryScore(newCurrentStoryScore);
         addGoldenCoins(POINTS_PER_CORRECT_QUESTION);
         setLastAwardedCoins(POINTS_PER_CORRECT_QUESTION);
         setShowCoinsEarnedPopup(true);
         if (soundEffectsEnabled) playCoinsEarnedSound();
         toast({
          variant: "success",
          title: <div className="flex items-center gap-1"><Image src="/assets/images/coin_with_dollar_sign_artwork.png" alt="Coin" width={16} height={16} /> +{POINTS_PER_CORRECT_QUESTION} Golden Coins!</div>,
          description: "Well done!",
          duration: 2000,
         });
      }
      if (soundEffectsEnabled) playSuccessSound();
      animateInput('success');
    } else {
      feedbackText = (
        <>
          Not quite{username ? `, ${username}` : ''}. The correct answer for "{question.questionText}" was <strong>{question.numericalAnswer}</strong>.
          {question.explanation && <p className="mt-1 text-xs"><em>Explanation: {question.explanation}</em></p>}
        </>
      );
      speechTextSegment = `Oops! The correct answer for "${question.questionText}" was ${question.numericalAnswer}.`;
      if (soundEffectsEnabled) playErrorSound();
      if(questionStates[questionIndex].isCorrect === null) { // Only deduct if not already marked incorrect
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
      animateInput('error');
    }

    const updatedQuestionStates = questionStates.map((qs, i) => i === questionIndex ? { ...qs, feedback: { type: isCorrect ? 'success' : 'error', message: feedbackText }, isCorrect: isCorrect, isSubmitted: true } : qs);
    setQuestionStates(updatedQuestionStates);

    const allCurrentStoryQuestionsAnswered = updatedQuestionStates.every(qs => qs.isSubmitted);

    const afterSpeechCallback = () => {
      if (allCurrentStoryQuestionsAnswered && !sessionCompleted) {
        setSessionOverallCorrectAnswers(prev => prev + newCurrentStoryScore);
        setSessionOverallAttemptedQuestions(prev => prev + currentStoryProblem.questions.length);

        const newStoriesCompletedCount = storiesCompletedInSession + 1;
        setStoriesCompletedInSession(newStoriesCompletedCount);

        if (newStoriesCompletedCount >= STORIES_PER_SESSION) {
          handleSessionCompletion();
        } else {
           toast({
             variant: "info",
             title: "Story Complete!",
             description: `Loading the next story... (${newStoriesCompletedCount + 1}/${STORIES_PER_SESSION})`,
             duration: 2000,
           });
           if(soundEffectsEnabled) {
             speakText("Story complete! Loading the next one.", undefined, () => {
                setTimeout(() => {
                    fetchNewStoryProblem();
                }, 500);
             });
           } else {
             setTimeout(() => {
                fetchNewStoryProblem();
             }, 800);
           }
        }
      } else if (!allCurrentStoryQuestionsAnswered && soundEffectsEnabled && questionIndex + 1 < currentStoryProblem.questions.length) {
        speakText(`Next question: ${currentStoryProblem.questions[questionIndex + 1].questionText}`);
      }
    };

    if (soundEffectsEnabled) {
      const utterance = speakText(speechTextSegment, undefined, afterSpeechCallback);
      if (!utterance) setTimeout(afterSpeechCallback, isCorrect ? 1500 : 2500);
    } else {
      afterSpeechCallback();
    }

  }, [currentStoryProblem, questionStates, username, toast, soundEffectsEnabled, storiesCompletedInSession, handleSessionCompletion, sessionCompleted, fetchNewStoryProblem, currentStoryScore, addGoldenCoins, deductGoldenCoins]);

  useEffect(() => {
    startNewSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitAnswerRef = useRef(handleSubmitAnswer);
  useEffect(() => {
    handleSubmitAnswerRef.current = handleSubmitAnswer;
  }, [handleSubmitAnswer]);

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
        if (number !== null && isListening !== null) {
          const qIndex = isListening;
          setQuestionStates(prev => prev.map((qs, i) => i === qIndex ? {...qs, userAnswer: String(number)} : qs ));
          toast({ title: "Heard you!", description: `You said: "${spokenText}". We interpreted: "${String(number)}".`, variant: "info" });
          setTimeout(() => handleSubmitAnswerRef.current(qIndex), 50);
        } else {
          toast({ title: "Couldn't understand", description: `Heard: "${spokenText}". Please try again or type the number.`, variant: "info" });
        }
        setIsListening(null);
      };
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({
            title: "Voice Input Error",
            description: `Could not recognize speech: ${event.error}. Try typing.`,
            variant: "destructive",
        });
        setIsListening(null);
      };
      recognitionRef.current.onend = () => setIsListening(null);
    }
    return () => recognitionRef.current?.stop();
  }, [toast, isListening]);

  const handleSpeak = (text: string, onEndCallback?: () => void) => {
      if(soundEffectsEnabled) {
          speakText(text, undefined, onEndCallback);
      } else {
          toast({ variant: "info", title: "Audio Disabled", description: "Sound effects are turned off in settings." });
          if (onEndCallback) onEndCallback();
      }
  }

  const toggleListening = (questionIndex: number) => {
    if (!recognitionRef.current) {
      toast({ title: "Voice Input Not Supported", description: "Your browser doesn't support voice input.", variant: "info", duration: 5000 });
      return;
    }
    if (!soundEffectsEnabled) {
        toast({ variant: "info", title: "Audio Disabled", description: "Voice input requires sound effects to be enabled in settings." });
        return;
    }
    if (sessionCompleted) return;
    if (isListening === questionIndex) {
      recognitionRef.current.stop();
      setIsListening(null);
    } else {
      if (questionStates[questionIndex]?.isSubmitted) return;
      try {
        if (soundEffectsEnabled) playNotificationSound();
        recognitionRef.current.start();
        setIsListening(questionIndex);
        toast({ title: "Listening...", description: `Speak your answer for question ${questionIndex + 1}.`, variant: "info" });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({
            title: "Mic Error",
            description: "Could not start microphone. Check permissions.",
            variant: "destructive",
        });
        setIsListening(null);
      }
    }
  };

  const handleNewProblemSet = () => {
    startNewSession();
  }

  const allQuestionsAnsweredForCurrentStory = currentStoryProblem && questionStates.every(qs => qs.isSubmitted);
  const displayedStoryNumber = storiesCompletedInSession + (currentStoryProblem && !allQuestionsAnsweredForCurrentStory ? 1 : 0);


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500 relative">
      <CoinsEarnedPopup coins={lastAwardedCoins} show={showCoinsEarnedPopup} onComplete={() => setShowCoinsEarnedPopup(false)} />
      <CoinsLostPopup coins={lastDeductedCoins} show={showCoinsLostPopup} onComplete={() => setShowCoinsLostPopup(false)} />
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
          <BookOpen className="mr-2 h-6 w-6" /> AI Math Story Time!
        </CardTitle>
        <CardDescription>
          Story <span className="font-bold text-accent">{Math.min(displayedStoryNumber, STORIES_PER_SESSION)} / {STORIES_PER_SESSION}</span> |
          Current Story Score: <span className="font-bold text-accent">{currentStoryScore}</span>
          {currentStoryProblem && currentStoryProblem.questions && ` / ${currentStoryProblem.questions.length}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="story-difficulty-select">Difficulty</Label>
            <Select value={difficulty} onValueChange={(val) => setDifficulty(val as DifficultyLevel)} disabled={isLoading || sessionCompleted}>
              <SelectTrigger id="story-difficulty-select" className="h-11">
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
            <Label htmlFor="story-topics">Custom Topics (optional)</Label>
            <Input
              id="story-topics"
              placeholder="e.g., animals, space"
              value={customTopics}
              onChange={(e) => setCustomTopics(e.target.value)}
              className="h-11"
              disabled={isLoading || sessionCompleted}
            />
            <p className="text-xs text-muted-foreground mt-1">Overrides your profile's favorite topics for this session if filled.</p>
          </div>
        </div>
         <Button onClick={handleNewProblemSet} variant="outline" className="w-full" disabled={isLoading && !sessionCompleted}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Generate New Story Set with Current Settings
        </Button>

        {sessionCompleted ? (
           <Alert variant="success" className="max-w-xl mx-auto text-center bg-card shadow-md border-green-500/50 animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="flex flex-col items-center gap-4 py-4">
               <Image src="/assets/images/golden_trophy_with_stars_illustration.png" alt="Trophy" width={40} height={40} />
              <AlertTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                {username ? `Congratulations, ${username}!` : 'Session Complete!'}
              </AlertTitle>
              <AlertDescription className="text-base">
                You've successfully completed {STORIES_PER_SESSION} stories in this session!
              </AlertDescription>
              <Button onClick={startNewSession} variant="default" size="lg" className="mt-4 btn-glow">
                <RefreshCcw className="mr-2 h-4 w-4" /> Play New Session
              </Button>
            </div>
          </Alert>
        ) :isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[200px] space-y-2">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Crafting an adventurous story for you...</p>
          </div>
        ) : currentStoryProblem ? (
          <div className="space-y-6 animate-in fade-in-0 duration-300">
            <Card className="bg-muted/30 p-4 rounded-lg shadow">
              <CardTitle className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent"/>
                Story: {currentStoryProblem.overallTheme && <span className="text-sm text-muted-foreground">({currentStoryProblem.overallTheme})</span>}
                <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleSpeak(`Story time! ${currentStoryProblem.overallTheme ? `The theme is ${currentStoryProblem.overallTheme}.` : ''} ${currentStoryProblem.storyProblemText}`); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleSpeak(`Story time! ${currentStoryProblem.overallTheme ? `The theme is ${currentStoryProblem.overallTheme}.` : ''} ${currentStoryProblem.storyProblemText}`); }}}
                    aria-label="Read story aloud"
                    className={cn("ml-auto p-1.5 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-1 focus:ring-primary", (!!isListening || !soundEffectsEnabled) && "opacity-50 cursor-not-allowed")}
                >
                    <Volume2 className="h-5 w-5" />
                </span>
              </CardTitle>
              <ScrollArea className="h-32">
                <CardDescription className="text-base text-foreground/90 leading-relaxed whitespace-pre-line" aria-live="polite">
                    {currentStoryProblem.storyProblemText}
                </CardDescription>
              </ScrollArea>
            </Card>

            <Accordion type="multiple" className="w-full space-y-2">
              {currentStoryProblem.questions.map((q, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border bg-card p-0 rounded-lg shadow-sm">
                  <AccordionTrigger
                    className={cn(
                      "text-left px-4 py-3 hover:no-underline hover:bg-secondary/50 rounded-t-lg transition-colors items-start sm:items-center",
                      questionStates[index]?.isCorrect === true && "bg-green-500/10 hover:bg-green-500/15 text-green-700 dark:text-green-400",
                      questionStates[index]?.isCorrect === false && "bg-red-500/10 hover:bg-red-500/15 text-red-700 dark:text-red-500",
                  )}>
                    <div className="flex-1 flex items-start sm:items-center gap-2 min-w-0">
                       <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); handleSpeak(q.questionText); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleSpeak(q.questionText); }}}
                        aria-label={`Read question ${index + 1} aloud`}
                        className={cn(
                            "p-1.5 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-1 focus:ring-primary flex-shrink-0 self-start sm:self-center",
                            (isListening === index || questionStates[index]?.isSubmitted || !soundEffectsEnabled) && "opacity-50 cursor-not-allowed"
                        )}
                       >
                        <Volume2 className="h-4 w-4" />
                       </span>
                        <div className="flex-1 min-w-0 text-left">
                            <span className="font-semibold">Question {index + 1}: </span>
                            <span className="break-words">{q.questionText}</span>
                        </div>
                    </div>
                    {questionStates[index]?.isCorrect === true && <CheckCircle2 className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />}
                    {questionStates[index]?.isCorrect === false && <XCircle className="h-5 w-5 text-red-500 ml-2 flex-shrink-0" />}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmitAnswer(index); }} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`story-q-${index}-answer`} className="sr-only">Answer for question {index + 1}</Label>
                        <Input
                          id={`story-q-${index}-answer`}
                          ref={el => answerInputRefs.current[index] = el}
                          type="text"
                          inputMode="decimal"
                          value={questionStates[index]?.userAnswer || ''}
                          onChange={(e) => setQuestionStates(prev => prev.map((qs, i) => i === index ? {...qs, userAnswer: e.target.value, feedback: null} : qs))}
                          placeholder="Your answer"
                          className={cn(
                            "text-lg p-2 h-12 text-center shadow-sm focus:ring-2 focus:ring-primary flex-grow",
                            questionStates[index]?.inputAnimation === 'success' && "animate-flash-success",
                            questionStates[index]?.inputAnimation === 'error' && "animate-shake-error animate-flash-error"
                           )}
                          disabled={questionStates[index]?.isSubmitted || isLoading || isListening === index}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => toggleListening(index)}
                            className={cn("h-12 w-12 flex-shrink-0", isListening === index && "bg-destructive/20 text-destructive animate-pulse")}
                            aria-label={isListening === index ? `Stop listening for question ${index + 1}` : `Speak answer for question ${index + 1}`}
                            disabled={questionStates[index]?.isSubmitted || isLoading || !recognitionRef.current || !soundEffectsEnabled}
                        >
                            {isListening === index ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                      </div>
                      <Button type="submit" size="default" className="w-full btn-glow" disabled={questionStates[index]?.isSubmitted || isLoading || isListening === index}>
                        Check Q{index + 1}
                      </Button>
                       {questionStates[index]?.feedback && (
                        <Alert variant={questionStates[index].feedback!.type === 'error' ? 'destructive' : questionStates[index].feedback!.type} className="mt-2 animate-in fade-in-0 zoom-in-95 duration-300">
                            {questionStates[index].feedback!.type === 'success' ? <Smile className="h-5 w-5" /> : questionStates[index].feedback!.type === 'error' ? <XCircle className="h-5 w-5" /> : <Info className="h-5 w-5"/>}
                            <AlertTitle>{questionStates[index].feedback!.type === 'success' ? 'Correct!' : questionStates[index].feedback!.type === 'error' ? 'Not Quite!' : 'Info'}</AlertTitle>
                            <AlertDescription>{questionStates[index].feedback!.message}</AlertDescription>
                        </Alert>
                        )}
                    </form>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : (
             <div className="flex flex-col justify-center items-center min-h-[200px] space-y-2">
                <Info className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Ready to start? Adjust settings and click "Generate New Story Set".</p>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="default"
          onClick={() => {
            if (soundEffectsEnabled) playNotificationSound();
            if (sessionCompleted) {
              startNewSession();
            } else {
              fetchNewStoryProblem();
            }
          }}
          className="w-full btn-glow"
          disabled={isLoading || (!!isListening && !allQuestionsAnsweredForCurrentStory && !!currentStoryProblem)}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          {sessionCompleted ? "Start New Session" : "Skip Story / Next Problem Set"}
        </Button>
      </CardFooter>
    </Card>
  );
};
