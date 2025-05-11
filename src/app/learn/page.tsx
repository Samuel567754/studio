
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
import { Trash2, CheckCircle, Info, CheckCircle2, AlertTriangle, CornerRightUp, Smile, GraduationCap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UiCardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { playSuccessSound, playNotificationSound, speakText } from '@/lib/audio';
import { useUserProfileStore } from '@/stores/user-profile-store';


export default function LearnPage() {
  const [readingLevel, setReadingLevel] = useState<string>('');
  const [wordLength, setWordLength] = useState<number>(0);
  const [wordList, setWordList] = useState<string[]>([]);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);
  const [currentPracticingWord, setCurrentPracticingWord] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [showProgressionAlert, setShowProgressionAlert] = useState(false);
  const { username } = useUserProfileStore();

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
      title: <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{username ? `${username}, word selected!` : 'Word Selected!'}</div>, 
      description: `Focusing on: ${word}. Practice spelling or add to a reading passage!` 
    });
    playSuccessSound();
    speakText(word); 
  }, [wordList, updateWordList, toast, username]);
  
  const handleNewSuggestedWordsList = useCallback((suggestedWords: string[]) => {
    // This callback is mostly for information or future use.
  }, []);

  const handleSettingsChange = useCallback((level: string, length: number) => {
    setReadingLevel(level);
    storeReadingLevel(level);
    setWordLength(length);
    storeWordLength(length);
    storeProgressionSuggestionDismissed(level, length, false); 
    setShowProgressionAlert(false); 
    toast({ 
      variant: "info", 
      title: <div className="flex items-center gap-2"><Info className="h-5 w-5" aria-hidden="true" />{username ? `${username}, preferences updated` : 'Preferences Updated'}</div>, 
      description: `Suggestions will now target ${level} level, ${length}-letter words.` 
    });
    playNotificationSound();
  }, [toast, username]);

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
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://plus.unsplash.com/premium_photo-1687819872154-9d4fd3cb7cca?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D" 
            alt="AI helping a child learn words"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="AI learning words" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <GraduationCap className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Learn New Words</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Get AI suggestions and build your practice list.</p>
          </div>
        </div>
      </header>

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
           <AlertTitle className="font-semibold text-lg text-accent">
             {username ? `Hey ${username}, ready for a new challenge?` : 'Ready for a New Challenge?'}
            </AlertTitle>
           <AlertDescription className="text-base">
             You're doing great and have mastered many words at the current settings! 
             Consider trying a higher reading level or different word length in the "AI Word Suggestions" panel above to keep growing.
           </AlertDescription>
           <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => {
                const wordSuggestionCard = document.querySelector('[class*="shadow-xl"]'); 
                wordSuggestionCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setShowProgressionAlert(false); 
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
              <div className="flex flex-wrap gap-3 md:gap-4 items-center" role="list" aria-labelledby="practice-list-heading">
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
        <Card className="shadow-lg border-accent/20 bg-card animate-in fade-in-0 zoom-in-95 duration-500 ease-out">
          <CardContent className="p-0"> 
            <Alert variant="info" className="bg-transparent border-0" aria-live="polite"> 
              <div className="flex flex-col sm:flex-row items-start gap-4 p-6"> 
                <div className='flex-shrink-0'>
                 <Info className="h-5 w-5 mt-1" aria-hidden="true" />
                </div>
                <div className="flex-grow">
                  <AlertTitle className="font-semibold text-lg">
                     {username ? `Welcome, ${username}!` : 'Welcome to ChillLearn AI!'}
                  </AlertTitle>
                  <AlertDescription className="text-base">
                    Start your learning journey:
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Use the "AI Word Suggestions" panel to set your reading level and desired word length.</li>
                      <li>Click "Get New Words" to see AI-powered suggestions.</li>
                      <li>Click on any suggested word to add it to your practice list below.</li>
                      <li>Navigate to "Spell" or "Read" sections to practice your selected words!</li>
                    </ol>
                  </AlertDescription>
                </div>
                <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-auto">
                  <Image
                    src="https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&id=M3wxMjA3fDB8MHxzZWFyY2h8NjZ8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D"
                    alt="Child smiling while learning on a laptop"
                    width={120}
                    height={120}
                    className="rounded-lg shadow-md"
                    data-ai-hint="child laptop learning" 
                  />
                </div>
              </div>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
