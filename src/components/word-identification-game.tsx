
"use client";
import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Target, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClickSound, playSuccessSound, playErrorSound } from '@/lib/audio';

interface WordIdentificationGameProps {
  wordToIdentify: string;
  allWords: string[]; // Full list of practice words to pick distractors from
  onGameResult: (correct: boolean, selectedWord: string) => void;
  showNextButton?: boolean;
  onNextWord?: () => void;
}

const generateMcqOptions = (correctWord: string, wordPool: string[], numOptions: number = 4): string[] => {
  if (!correctWord) return [];
  
  const distractors = wordPool
    .filter(word => word.toLowerCase() !== correctWord.toLowerCase()) // Ensure distractors are different
    .filter((value, index, self) => self.indexOf(value) === index); // Unique distractors

  // Shuffle distractors
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }

  const selectedDistractors = distractors.slice(0, numOptions - 1);
  let options = [correctWord, ...selectedDistractors];

  // Ensure options are unique (in case correctWord was somehow in selectedDistractors after filtering if casing was an issue)
  options = options.filter((value, index, self) => self.map(w => w.toLowerCase()).indexOf(value.toLowerCase()) === index);


  // Shuffle final options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  
  // If not enough options generated (e.g. very small wordPool), ensure at least the correct word is there.
  // For a proper game, we'd want at least 2. The calling page should handle cases with <2 words.
  if (options.length < 2 && wordPool.length > 1) { // Try to add one more if possible
    const fallbackDistractor = wordPool.find(w => w.toLowerCase() !== correctWord.toLowerCase());
    if (fallbackDistractor && !options.map(o => o.toLowerCase()).includes(fallbackDistractor.toLowerCase())) {
        options.push(fallbackDistractor);
         // Re-Shuffle if we added one
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
    }
  }


  return options.length > 0 ? options : [correctWord]; // Fallback if options array is empty
};


export const WordIdentificationGame: FC<WordIdentificationGameProps> = ({
  wordToIdentify,
  allWords,
  onGameResult,
  showNextButton = false,
  onNextWord,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const setupNewWord = useCallback(() => {
    const newOptions = generateMcqOptions(wordToIdentify, allWords);
    setOptions(newOptions);
    setSelectedOption(null);
    setIsAttempted(false);
    setIsCorrect(null);
  }, [wordToIdentify, allWords]);

  useEffect(() => {
    if (wordToIdentify) {
      setupNewWord();
    }
  }, [wordToIdentify, setupNewWord]);

  const handleOptionClick = (option: string) => {
    if (isAttempted) return; // Prevent multiple attempts on the same question

    playClickSound();
    setSelectedOption(option);
    setIsAttempted(true);
    const correct = option.toLowerCase() === wordToIdentify.toLowerCase();
    setIsCorrect(correct);
    onGameResult(correct, option);

    if (correct) {
      playSuccessSound();
    } else {
      playErrorSound();
    }
  };

  if (!wordToIdentify || options.length === 0) {
    return (
      <Card className="shadow-lg w-full animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-primary">
            <Target className="mr-2 h-5 w-5" /> Identify the Word
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading word or options...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg w-full bg-gradient-to-br from-card via-card/90 to-secondary/10 dark:from-card dark:via-card dark:to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary">
          <Target className="mr-2 h-5 w-5" /> Which word is it?
        </CardTitle>
        <CardDescription>Listen to the word, then choose the correct option below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 animate-in fade-in-0 zoom-in-95 duration-500"
          role="radiogroup" // Semantically, it's like a radio group where only one can be "correctly" chosen
          aria-label="Word options"
        >
          {options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              size="lg"
              className={cn(
                "w-full text-lg md:text-xl py-6 h-auto justify-center transition-all duration-200 ease-in-out transform hover:scale-105",
                isAttempted && option === selectedOption && isCorrect && "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-500/30 ring-2 ring-green-500",
                isAttempted && option === selectedOption && !isCorrect && "bg-red-500/20 border-red-500 text-red-700 dark:text-red-400 hover:bg-red-500/30 ring-2 ring-red-500",
                isAttempted && option !== selectedOption && option.toLowerCase() === wordToIdentify.toLowerCase() && "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-500", // Highlight correct if wrong one selected
                !isAttempted && "hover:bg-primary/10 hover:border-primary"
              )}
              onClick={() => handleOptionClick(option)}
              disabled={isAttempted}
              aria-pressed={isAttempted && option === selectedOption}
              aria-label={`Select option: ${option}`}
            >
              {option}
              {isAttempted && option === selectedOption && isCorrect && <CheckCircle2 className="ml-3 h-6 w-6 text-green-600 dark:text-green-500" />}
              {isAttempted && option === selectedOption && !isCorrect && <XCircle className="ml-3 h-6 w-6 text-red-600 dark:text-red-500" />}
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 pt-4 border-t border-border/20">
        {isAttempted && isCorrect !== null && (
          <Alert variant={isCorrect ? "success" : "destructive"} className="w-full animate-in fade-in-0 zoom-in-95 duration-300">
            {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <AlertTitle>{isCorrect ? 'Correct!' : 'Not Quite!'}</AlertTitle>
            <AlertDescription>
              {isCorrect ? `You correctly identified "${wordToIdentify}"!` : `You selected "${selectedOption}". The correct word was "${wordToIdentify}".`}
            </AlertDescription>
          </Alert>
        )}
        {showNextButton && isAttempted && onNextWord && (
          <Button onClick={() => { setupNewWord(); onNextWord(); }} size="lg" className="w-full mt-2 btn-glow">
            <Lightbulb className="mr-2 h-5 w-5" /> Next Word
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

