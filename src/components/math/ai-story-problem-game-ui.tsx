
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback, useRef } from 'react';
import { generateMathStoryProblem, type GenerateMathStoryProblemInput, type GenerateMathStoryProblemOutput } from '@/ai/flows/generate-math-story-problem';
import { CheckCircle2, XCircle, Loader2, BookOpen, RefreshCw, Volume2, Mic, MicOff, Smile, Lightbulb } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound, speakText } from '@/lib/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { parseSpokenNumber } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAppSettingsStore } from '@/stores/app-settings-store';

type DifficultyLevel = 'easy' | 'medium' | 'hard';
interface QuestionState {
  userAnswer: string;
  feedback: { type: 'success' | 'error' | 'info'; message: string | JSX.Element } | null;
  isCorrect: boolean | null;
}

export const AiStoryProblemGameUI = () => {
  const [currentStoryProblem, setCurrentStoryProblem] = useState<GenerateMathStoryProblemOutput | null>(null);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState<number | null>(null); // Index of question being listened to
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [customTopics, setCustomTopics] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const answerInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { username, favoriteTopics } = useUserProfileStore();
  const { soundEffectsEnabled } = useAppSettingsStore();

  const fetchNewStoryProblem = useCallback(async () => {
    setIsLoading(true);
    setQuestionStates([]);
    setCurrentStoryProblem(null);
    setScore(0); 
    playNotificationSound();

    try {
      const topicsToUse = customTopics.trim() !== '' ? customTopics.trim() : favoriteTopics || undefined;
      const input: GenerateMathStoryProblemInput = { 
        difficultyLevel: difficulty, 
        topics: topicsToUse,
        username: username || undefined 
      };
      const storyData = await generateMathStoryProblem(input);
      setCurrentStoryProblem(storyData);
      setQuestionStates(storyData.questions.map(() => ({ userAnswer: '', feedback: null, isCorrect: null })));
      if (storyData?.storyProblemText && soundEffectsEnabled) {
        speakText(storyData.storyProblemText);
      }
    } catch (error) {
      console.error("Error generating math story problem:", error);
      toast({ 
        variant: "destructive", 
        title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Error</div>, 
        description: "Could not generate a story problem. Please try again." 
      });
      playErrorSound();
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, customTopics, favoriteTopics, username, toast, soundEffectsEnabled]);

  const handleSubmitAnswer = useCallback((questionIndex: number) => {
    if (!currentStoryProblem || !questionStates || questionStates.length <= questionIndex || !questionStates[questionIndex] || questionStates[questionIndex].userAnswer.trim() === '') {
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
    if (answerNum === question.numericalAnswer) {
      let successMessage = `${username ? username + ", y" : "Y"}ou got it right! The answer is ${question.numericalAnswer}.`;
      if(questionStates[questionIndex].isCorrect === null) { 
         setScore(prev => prev + 1);
      }
      setQuestionStates(prev => prev.map((qs, i) => i === questionIndex ? { ...qs, feedback: {type: 'success', message: successMessage}, isCorrect: true } : qs));
      playSuccessSound();
      if (soundEffectsEnabled) speakText(`Correct! The answer to: ${question.questionText} is ${question.numericalAnswer}.`);
    } else {
      const errorMessage = (
        <>
          Not quite{username ? `, ${username}` : ''}. The correct answer for "{question.questionText}" was <strong>{question.numericalAnswer}</strong>.
          {question.explanation && <p className="mt-1 text-xs"><em>Explanation: {question.explanation}</em></p>}
        </>
      );
      setQuestionStates(prev => prev.map((qs, i) => i === questionIndex ? { ...qs, feedback: {type: 'error', message: errorMessage}, isCorrect: false } : qs));
      playErrorSound();
      if (soundEffectsEnabled) speakText(`Oops! The correct answer was ${question.numericalAnswer}. ${question.explanation || ''}`);
    }
  }, [currentStoryProblem, questionStates, username, toast, soundEffectsEnabled]);

  useEffect(() => {
    fetchNewStoryProblem();
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

  const handleSpeak = (text: string) => {
      if(soundEffectsEnabled) {
          speakText(text);
      } else {
          toast({ variant: "info", title: "Audio Disabled", description: "Sound effects are turned off in settings." });
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
    if (isListening === questionIndex) {
      recognitionRef.current.stop();
      setIsListening(null);
    } else {
      try {
        playNotificationSound();
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

  const allQuestionsAnswered = currentStoryProblem && questionStates.every(qs => qs.isCorrect !== null);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
          <BookOpen className="mr-2 h-6 w-6" /> AI Math Story Time!
        </CardTitle>
        <CardDescription>
          Read the story and answer the questions. Score: <span className="font-bold text-accent">{score}</span>
          {currentStoryProblem && currentStoryProblem.questions && ` / ${currentStoryProblem.questions.length}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="story-difficulty-select">Difficulty</Label>
            <Select value={difficulty} onValueChange={(val) => setDifficulty(val as DifficultyLevel)} disabled={isLoading}>
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
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">Overrides your profile's favorite topics for this session if filled.</p>
          </div>
        </div>

        {isLoading && ( 
          <div className="flex flex-col justify-center items-center min-h-[200px] space-y-2">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Crafting an adventurous story for you...</p>
          </div>
        )}
        {!isLoading && currentStoryProblem && (
          <div className="space-y-6 animate-in fade-in-0 duration-300">
            <Card className="bg-muted/30 p-4 rounded-lg shadow">
              <CardTitle className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent"/>
                Story: {currentStoryProblem.overallTheme && <span className="text-sm text-muted-foreground">({currentStoryProblem.overallTheme})</span>}
                <Button variant="ghost" size="icon" onClick={() => handleSpeak(currentStoryProblem.storyProblemText)} aria-label="Read story aloud" className="ml-auto" disabled={!!isListening || !soundEffectsEnabled}>
                    <Volume2 className="h-5 w-5" />
                </Button>
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
                  <AccordionTrigger className={cn(
                    "text-left px-4 py-3 hover:no-underline hover:bg-secondary/50 rounded-t-lg transition-colors",
                    questionStates[index]?.isCorrect === true && "bg-green-500/10 hover:bg-green-500/15 text-green-700 dark:text-green-400",
                    questionStates[index]?.isCorrect === false && "bg-red-500/10 hover:bg-red-500/15 text-red-700 dark:text-red-500",
                  )}>
                    <div className="flex-1">
                        <span className="font-semibold">Question {index + 1}: </span>{q.questionText}
                    </div>
                    {questionStates[index]?.isCorrect === true && <CheckCircle2 className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />}
                    {questionStates[index]?.isCorrect === false && <XCircle className="h-5 w-5 text-red-500 ml-2 flex-shrink-0" />}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmitAnswer(index); }} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleSpeak(q.questionText + (q.explanation ? `. Explanation: ${q.explanation}` : ''))} aria-label={`Read question ${index + 1} aloud`} className="flex-shrink-0" disabled={isListening === index || questionStates[index]?.isCorrect === true || !soundEffectsEnabled}>
                            <Volume2 className="h-5 w-5" />
                        </Button>
                        <Label htmlFor={`story-q-${index}-answer`} className="sr-only">Answer for question {index + 1}</Label>
                        <Input
                          id={`story-q-${index}-answer`}
                          ref={el => answerInputRefs.current[index] = el}
                          type="text" 
                          inputMode="decimal" 
                          value={questionStates[index]?.userAnswer || ''}
                          onChange={(e) => setQuestionStates(prev => prev.map((qs, i) => i === index ? {...qs, userAnswer: e.target.value} : qs))}
                          placeholder="Your answer"
                          className="text-lg p-2 h-12 text-center shadow-sm focus:ring-2 focus:ring-primary flex-grow"
                          disabled={questionStates[index]?.isCorrect !== null || isLoading || isListening === index}
                        />
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={() => toggleListening(index)} 
                            className={cn("h-12 w-12 flex-shrink-0", isListening === index && "bg-destructive/20 text-destructive animate-pulse")}
                            aria-label={isListening === index ? `Stop listening for question ${index + 1}` : `Speak answer for question ${index + 1}`}
                            disabled={questionStates[index]?.isCorrect !== null || isLoading || !recognitionRef.current || !soundEffectsEnabled}
                        >
                            {isListening === index ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                      </div>
                      <Button type="submit" size="default" className="w-full btn-glow" disabled={questionStates[index]?.isCorrect !== null || isLoading || isListening === index}>
                        Check Q{index + 1}
                      </Button>
                       {questionStates[index]?.feedback && (
                        <Alert variant={questionStates[index].feedback!.type === 'error' ? 'destructive' : questionStates[index].feedback!.type} className="mt-2 animate-in fade-in-0 zoom-in-95 duration-300">
                            {questionStates[index].feedback!.type === 'success' ? <Smile className="h-5 w-5" /> : questionStates[index].feedback!.type === 'error' ? <XCircle className="h-5 w-5" /> : null}
                            <AlertTitle>{questionStates[index].feedback!.type === 'success' ? 'Correct!' : questionStates[index].feedback!.type === 'error' ? 'Try Again!' : 'Info'}</AlertTitle>
                            <AlertDescription>{questionStates[index].feedback!.message}</AlertDescription>
                        </Alert>
                        )}
                    </form>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={fetchNewStoryProblem} className="w-full" disabled={isLoading || (!!isListening && !allQuestionsAnswered)}>
          <RefreshCw className="mr-2 h-4 w-4" /> New Story & Problems
        </Button>
      </CardFooter>
    </Card>
  );
};
