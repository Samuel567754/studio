
"use client";

import { useState, useEffect, useCallback } from 'react';
import { WordDisplay } from '@/components/word-display';
import { SpellingPractice } from '@/components/spelling-practice';
import { useToast } from "@/hooks/use-toast";
import { getStoredWordList, getStoredCurrentIndex, storeCurrentIndex } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { playSuccessSound, playNavigationSound } from '@/lib/audio';

export default function SpellingPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  const { toast } = useToast();

  const loadWordData = useCallback(() => {
    const storedList = getStoredWordList();
    setWordList(storedList);
    if (storedList.length > 0) {
      const storedIndex = getStoredCurrentIndex();
      const validIndex = (storedIndex >= 0 && storedIndex < storedList.length) ? storedIndex : 0;
      setCurrentIndex(validIndex);
      setCurrentWord(storedList[validIndex]);
      if (storedIndex !== validIndex) { 
        storeCurrentIndex(validIndex); 
      }
    } else {
      setCurrentWord('');
      setCurrentIndex(0); 
    }
  }, []);

  useEffect(() => {
    loadWordData();
    setIsMounted(true);
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'sightwords_wordList_v1' || event.key === 'sightwords_currentIndex_v1') {
        loadWordData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadWordData]);


  const navigateWord = (direction: 'next' | 'prev') => {
    if (wordList.length === 0) return;
    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % wordList.length;
    } else {
      newIndex = (currentIndex - 1 + wordList.length) % wordList.length;
    }
    setCurrentIndex(newIndex);
    setCurrentWord(wordList[newIndex]);
    storeCurrentIndex(newIndex);
    playNavigationSound();
  };

  const handleCorrectSpell = () => {
    toast({
      title: "Great Job!",
      description: `You spelled "${currentWord}" correctly!`,
    });
    playSuccessSound();
    if (wordList.length > 1) {
      setTimeout(() => navigateWord('next'), 1200); 
    } else if (wordList.length === 1) {
        toast({
            title: "List Complete!",
            description: "You've spelled the only word in your list. Add more words to continue!",
            duration: 4000,
        });
    }
  };
  
  if (!isMounted) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Card className="shadow-lg animate-pulse">
            <CardHeader><div className="h-6 w-1/3 bg-muted rounded"></div></CardHeader>
            <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-6 min-h-[250px] md:min-h-[300px]">
                <div className="h-20 w-3/4 bg-muted rounded"></div>
                <div className="h-12 w-1/2 bg-primary/50 rounded"></div>
            </CardContent>
        </Card>
        <Card className="shadow-lg animate-pulse">
            <CardHeader>
                <div className="h-6 w-1/2 bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded mt-2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-12 bg-muted rounded"></div>
                <div className="h-12 bg-primary/50 rounded"></div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (wordList.length === 0) {
    return (
      <Alert variant="default" className="max-w-xl mx-auto text-center bg-card shadow-md border-primary/20">
        <Info className="h-6 w-6 mx-auto mb-2 text-primary" />
        <AlertTitle className="text-xl font-semibold mb-2">No Words to Spell!</AlertTitle>
        <AlertDescription className="text-base">
          Your spelling list is empty. Please go to the{' '}
          <Button variant="link" asChild className="p-0 h-auto text-base"><Link href="/">Learn Words</Link></Button>
          {' '}page to add some words.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <WordDisplay word={currentWord} />
      <SpellingPractice wordToSpell={currentWord} onCorrectSpell={handleCorrectSpell} />
      
      {wordList.length > 1 && (
        <Card className="shadow-md border-primary/10">
            <CardContent className="p-4 flex justify-between items-center gap-2 md:gap-4">
            <Button variant="outline" size="lg" onClick={() => navigateWord('prev')} aria-label="Previous word" className="flex-1 md:flex-none">
                <ChevronLeft className="mr-1 md:mr-2 h-5 w-5" /> Previous
            </Button>
            <span className="text-muted-foreground text-sm whitespace-nowrap font-medium">
                Word {currentIndex + 1} / {wordList.length}
            </span>
            <Button variant="outline" size="lg" onClick={() => navigateWord('next')} aria-label="Next word" className="flex-1 md:flex-none">
                Next <ChevronRight className="ml-1 md:ml-2 h-5 w-5" />
            </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
