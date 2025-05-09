
"use client";

import { useState, useEffect, useCallback } from 'react';
import { WordSuggestion } from '@/components/word-suggestion';
import { useToast } from "@/hooks/use-toast";
import {
  getStoredWordList, storeWordList,
  getStoredReadingLevel, storeReadingLevel,
  getStoredWordLength, storeWordLength,
  storeCurrentIndex, getStoredCurrentIndex,
  getStoredMasteredWords,
  getProgressionSuggestionDismissed, storeProgressionSuggestionDismissed
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, Info, CheckCircle2, AlertTriangle, CornerRightUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UiCardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { playSuccessSound, playNotificationSound, speakText } from '@/lib/audio';


export default function LearnWordsPage() {
  const [readingLevel, setReadingLevel] = useState<string>('');
  const [wordLength, setWordLength] = useState<number>(0);
  const [wordList, setWordList] = useState<string[]>([]);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);
  const [currentPracticingWord, setCurrentPracticingWord] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [showProgressionAlert, setShowProgressionAlert] = useState(false);

  const { toast } = useToast();

  // Load initial state from localStorage
  useEffect(() => {
    const storedLevel = getStoredReadingLevel();
    const storedLength = getStoredWordLength();
    const storedList = getStoredWordList();
    const storedMasteredList = getStoredMasteredWords();
    
    setReadingLevel(storedLevel);
    setWordLength(storedLength);
    setWordList(storedList);
    setMasteredWords(storedMasteredList);

    const storedIndex = getStoredCurrentIndex();
    if (storedList.length > 0 && storedIndex >= 0 && storedIndex < storedList.length) {
        setCurrentPracticingWord(storedList[storedIndex]);
    } else if (storedList.length > 0) { 
        setCurrentPracticingWord(storedList[0]);
        storeCurrentIndex(0);
    }
    setIsMounted(true);
  }, []);

  // Effect for progression suggestion alert
  useEffect(() => {
    if (!isMounted) return;

    const isDismissed = getProgressionSuggestionDismissed(readingLevel, wordLength);
    if (isDismissed) {
      setShowProgressionAlert(false);
      return;
    }

    if (wordList.length > 5) { // Only suggest if there's a decent number of words
      const currentWordsMasteredCount = wordList.filter(w => masteredWords.includes(w)).length;
      const masteredThreshold = Math.ceil(wordList.length * 0.7); // 70% mastery of current list

      if (currentWordsMasteredCount >= masteredThreshold) {
        if ((readingLevel === "beginner" || readingLevel === "intermediate") || wordLength < 5) { // Simple condition for now
           setShowProgressionAlert(true);
        }
      } else {
        setShowProgressionAlert(false);
      }
    } else {
      setShowProgressionAlert(false);
    }

  }, [wordList, masteredWords, readingLevel, wordLength, isMounted]);


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
    toast({ 
      variant: "success", 
      title: <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />Word Selected!</div>, 
      description: `Focusing on: ${word}. Practice spelling or add to a reading passage!` 
    });
    playSuccessSound();
    speakText(word); 
  }, [wordList, updateWordList, toast]);
  
  const handleNewSuggestedWordsList = useCallback((suggestedWords: string[]) => {
    // This callback is mostly for information or future use.
  }, []);

  const handleSettingsChange = useCallback((level: string, length: number) => {
    setReadingLevel(level);
    storeReadingLevel(level);
    setWordLength(length);
    storeWordLength(length);
    // When settings change, new progression suggestion for the new settings should not be dismissed by default
    storeProgressionSuggestionDismissed(level, length, false); 
    setShowProgressionAlert(false); // Hide any current alert as settings are changing
    toast({ 
      variant: "info", 
      title: <div className="flex items-center gap-2"><Info className="h-5 w-5" aria-hidden="true" />Preferences Updated</div>, 
      description: `Suggestions will now target ${level} level, ${length}-letter words.` 
    });
    playNotificationSound();
  }, [toast]);

  const handleRemoveWord = (wordToRemove: string) => {
    const newWordList = wordList.filter(w => w !== wordToRemove);
    updateWordList(newWordList); 

    toast({ 
      variant: "info", 
      title: <div className="flex items-center gap-2"><Info className="h-5 w-5" aria-hidden="true" />Word Removed</div>, 
      description: `"${wordToRemove}" removed from your practice list.` 
    });
    playNotificationSound(); 

    if (newWordList.length === 0) {
        setCurrentPracticingWord('');
        storeCurrentIndex(0); 
    } else {
        let newSelectedWord = currentPracticingWord;
        let newIndex = newWordList.indexOf(newSelectedWord);

        if (newIndex === -1 || currentPracticingWord === wordToRemove) {
            newSelectedWord = newWordList[0]; 
            newIndex = 0;
        }
        
        setCurrentPracticingWord(newSelectedWord);
        storeCurrentIndex(newIndex);
    }
  };

  const handleDismissProgressionAlert = () => {
    storeProgressionSuggestionDismissed(readingLevel, wordLength, true);
    setShowProgressionAlert(false);
    playNotificationSound();
  };

  if (!isMounted) {
    return (
      <div className="space-y-6 md:space-y-8" aria-live="polite" aria-busy="true">
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
        <p className="sr-only">Loading learning page...</p>
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

      {showProgressionAlert && (
        <Alert variant="default" className="border-accent bg-accent/10 text-accent-foreground animate-in fade-in-0 zoom-in-95 duration-500" aria-live="polite">
           <AlertTriangle className="h-5 w-5 text-accent" aria-hidden="true" />
           <AlertTitle className="font-semibold text-lg text-accent">Ready for a New Challenge?</AlertTitle>
           <AlertDescription className="text-base">
             You're doing great and have mastered many words at the current settings! 
             Consider trying a higher reading level or different word length in the "AI Word Suggestions" panel above to keep growing.
           </AlertDescription>
           <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => {
                const wordSuggestionCard = document.querySelector('[class*="shadow-xl"]'); // A bit hacky, consider a ref
                wordSuggestionCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setShowProgressionAlert(false); // Hide after interaction
                playNotificationSound();
            }}>
                <CornerRightUp className="mr-2 h-4 w-4" aria-hidden="true"/>
                Update Settings
             </Button>
             <Button variant="ghost" size="sm" onClick={handleDismissProgressionAlert}>Maybe Later</Button>
           </div>
        </Alert>
      )}

      {wordList.length > 0 && (
        <Card className="shadow-lg border-primary/10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary" id="practice-list-heading">Your Practice Word List</CardTitle>
            <UiCardDescription className="text-base">
              Words you've selected. Click a word to make it active for spelling, or remove it.
            </UiCardDescription>
          </CardHeader>
          <CardContent>
            {wordList.length > 0 ? (
              <div className="flex flex-wrap gap-3 items-center" role="list" aria-labelledby="practice-list-heading">
                {wordList.map((word, index) => (
                  <div key={index} className="relative group rounded-full shadow-sm hover:shadow-md transition-all duration-200 ease-in-out hover:scale-105" role="listitem">
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
                      aria-label={`Select word: ${word}. ${currentPracticingWord === word ? 'Currently selected.' : ''}`}
                    >
                      {currentPracticingWord === word && <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70" aria-hidden="true" />}
                      <span className={cn(currentPracticingWord === word && "ml-3")}>{word}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute top-1/2 right-1 transform -translate-y-1/2 h-8 w-8 p-0 opacity-60 group-hover:opacity-100 rounded-full transition-opacity",
                        currentPracticingWord === word ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                      )}
                      onClick={(e) => { e.stopPropagation(); handleRemoveWord(word); }}
                      aria-label={`Remove ${word} from practice list`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
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

      {wordList.length === 0 && isMounted && !showProgressionAlert && (
        <Alert variant="info" className="bg-card/90 border-accent/20 shadow animate-in fade-in-0 zoom-in-95 duration-500 ease-out" aria-live="polite">
          <Info className="h-5 w-5" aria-hidden="true" />
          <AlertTitle className="font-semibold text-lg">Welcome to SightWords AI!</AlertTitle>
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
