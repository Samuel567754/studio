"use client";

import { useState, useEffect, useCallback } from 'react';
import { WordSuggestion } from '@/components/word-suggestion';
import { useToast } from "@/hooks/use-toast";
import {
  getStoredWordList, storeWordList,
  getStoredReadingLevel, storeReadingLevel,
  getStoredWordLength, storeWordLength,
  storeCurrentIndex, getStoredCurrentIndex
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UiCardDescription } from '@/components/ui/card'; // Renamed to avoid conflict
import { cn } from '@/lib/utils';

export default function LearnWordsPage() {
  const [readingLevel, setReadingLevel] = useState<string>('');
  const [wordLength, setWordLength] = useState<number>(0);
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentPracticingWord, setCurrentPracticingWord] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  const { toast } = useToast();

  // Load initial state from localStorage
  useEffect(() => {
    setReadingLevel(getStoredReadingLevel());
    setWordLength(getStoredWordLength());
    const storedList = getStoredWordList();
    setWordList(storedList);
    const storedIndex = getStoredCurrentIndex();
    if (storedList.length > 0 && storedIndex >= 0 && storedIndex < storedList.length) {
        setCurrentPracticingWord(storedList[storedIndex]);
    } else if (storedList.length > 0) { // if index is invalid but list exists
        setCurrentPracticingWord(storedList[0]);
        storeCurrentIndex(0);
    }
    setIsMounted(true);
  }, []);

  const updateWordList = useCallback((newWordList: string[]) => {
    setWordList(newWordList);
    storeWordList(newWordList);
  }, []);

  const handleWordSelected = useCallback((word: string) => {
    let newWordList = [...wordList];
    if (!newWordList.includes(word)) {
      newWordList.push(word);
      updateWordList(newWordList);
    }
    const wordIndex = newWordList.indexOf(word);
    storeCurrentIndex(wordIndex);
    setCurrentPracticingWord(word);
    toast({ title: "Word Selected!", description: `Focusing on: ${word}. Practice spelling or add to a reading passage!` });
  }, [wordList, updateWordList, toast]);
  
  const handleNewSuggestedWordsList = useCallback((suggestedWords: string[]) => {
    // This callback is mostly for information or future use.
    // WordSuggestion component handles displaying these.
    // Actual addition to practice list is via onWordSelected.
  }, []);

  const handleSettingsChange = useCallback((level: string, length: number) => {
    setReadingLevel(level);
    storeReadingLevel(level);
    setWordLength(length);
    storeWordLength(length);
    toast({ title: "Preferences Updated", description: `Suggestions will now target ${level} level, ${length}-letter words.` });
  }, [toast]);

  const handleRemoveWord = (wordToRemove: string) => {
    const newWordList = wordList.filter(w => w !== wordToRemove);
    updateWordList(newWordList); // This also calls storeWordList via setWordList

    toast({ title: "Word Removed", description: `"${wordToRemove}" removed from your practice list.` });

    if (newWordList.length === 0) {
        setCurrentPracticingWord('');
        storeCurrentIndex(0); 
    } else {
        // Determine the new word to focus on
        let newSelectedWord = currentPracticingWord;
        let newIndex = newWordList.indexOf(newSelectedWord);

        // If the currentPracticingWord was the one removed, or if it's no longer in the list (e.g. list was cleared and repopulated by another means)
        // or if currentPracticingWord was empty (e.g. after removing the last word)
        if (newIndex === -1 || currentPracticingWord === wordToRemove) {
            newSelectedWord = newWordList[0]; // Default to the first word in the new list
            newIndex = 0;
        }
        
        setCurrentPracticingWord(newSelectedWord);
        storeCurrentIndex(newIndex);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-6 md:space-y-8">
        {/* Skeleton for WordSuggestion */}
        <Card className="shadow-lg animate-pulse">
            <CardHeader className="p-4 md:p-6">
                <div className="h-6 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="h-4 w-1/3 bg-muted rounded mb-2"></div>
                        <div className="h-10 bg-muted rounded"></div>
                    </div>
                    <div>
                        <div className="h-4 w-1/3 bg-muted rounded mb-2"></div>
                        <div className="h-10 bg-muted rounded"></div>
                    </div>
                </div>
                <div className="h-12 bg-primary/50 rounded"></div>
            </CardContent>
        </Card>
         {/* Skeleton for Word List (conditionally shown) */}
        <Card className="shadow-lg animate-pulse">
            <CardHeader className="p-4 md:p-6">
                <div className="h-6 w-1/2 bg-muted rounded"></div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
                <div className="flex flex-wrap gap-2">
                    <div className="h-8 w-20 bg-muted rounded-full"></div>
                    <div className="h-8 w-24 bg-muted rounded-full"></div>
                    <div className="h-8 w-16 bg-muted rounded-full"></div>
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <WordSuggestion
        onWordSelected={handleWordSelected}
        onNewSuggestedWordsList={handleNewSuggestedWordsList}
        currentReadingLevel={readingLevel}
        currentWordLength={wordLength}
        onSettingsChange={handleSettingsChange}
        currentPracticingWord={currentPracticingWord}
      />

      {wordList.length > 0 && (
        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Your Practice Word List</CardTitle>
            <UiCardDescription className="text-base">
              Words you've selected. Click a word to make it active for spelling, or remove it.
            </UiCardDescription>
          </CardHeader>
          <CardContent>
            {wordList.length > 0 ? (
              <div className="flex flex-wrap gap-3 items-center">
                {wordList.map((word, index) => (
                  <div key={index} className="relative group rounded-full shadow-sm hover:shadow-md transition-shadow">
                    <Button
                      variant={currentPracticingWord === word ? "default" : "secondary"}
                      size="sm" 
                      onClick={() => handleWordSelected(word)}
                      className={cn(
                          "text-base md:text-lg py-2 pl-4 pr-10 rounded-full transition-all duration-200 ease-in-out",
                          currentPracticingWord === word && "ring-2 ring-primary-foreground dark:ring-primary ring-offset-2 ring-offset-primary dark:ring-offset-background scale-105 font-semibold",
                          !(currentPracticingWord === word) && "bg-secondary/70 hover:bg-secondary border border-transparent hover:border-primary/30"
                      )}
                      aria-pressed={currentPracticingWord === word}
                    >
                      {currentPracticingWord === word && <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70" />}
                      <span className={cn(currentPracticingWord === word && "ml-3")}>{word}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute top-1/2 right-1 transform -translate-y-1/2 h-8 w-8 p-0 opacity-60 group-hover:opacity-100 rounded-full",
                        currentPracticingWord === word ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                      )}
                      onClick={(e) => { e.stopPropagation(); handleRemoveWord(word); }}
                      aria-label={`Remove ${word} from practice list`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
                 <p className="text-muted-foreground">Your practice list is empty. Add some words using the suggestions above!</p>
            )}
          </CardContent>
        </Card>
      )}

      {wordList.length === 0 && isMounted && (
        <Alert variant="default" className="bg-card/90 border-primary/20 shadow">
          <Info className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold text-lg text-primary">Welcome to SightWords AI!</AlertTitle>
          <AlertDescription className="text-base">
            Start your learning journey:
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Use the "AI Word Suggestions" panel to set your reading level and desired word length.</li>
              <li>Click "Get New Words" to see AI-powered suggestions.</li>
              <li>Click on any suggested word to add it to your practice list below.</li>
              <li>Navigate to "Spell" or "Read" sections to practice your selected words!</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
