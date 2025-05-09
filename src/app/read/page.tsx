
"use client";

import { useState, useEffect, useCallback } from 'react';
import { ReadingPractice } from '@/components/reading-practice';
import { getStoredWordList, getStoredReadingLevel } from '@/lib/storage';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ReadingPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [readingLevel, setReadingLevel] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  const loadReadingData = useCallback(() => {
    setWordList(getStoredWordList());
    setReadingLevel(getStoredReadingLevel("beginner")); // Ensure a default if not set
  }, []);
  
  useEffect(() => {
    loadReadingData();
    setIsMounted(true);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'sightwords_wordList_v1' || event.key === 'sightwords_readingLevel_v1') {
        loadReadingData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadReadingData]);

  if (!isMounted) {
     return (
      <div className="space-y-6 md:space-y-8">
        <Card className="shadow-lg animate-pulse">
            <div className="p-6">
                <div className="h-6 w-1/2 bg-muted rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
            </div>
            <div className="p-6 space-y-4">
                <div className="h-12 bg-primary/50 rounded"></div>
                <div className="h-40 bg-muted rounded"></div>
            </div>
        </Card>
      </div>
    );
  }

  if (wordList.length === 0) {
    return (
      <Alert variant="info" className="max-w-xl mx-auto text-center bg-card shadow-md border-accent/20 animate-in fade-in-0 zoom-in-95 duration-500">
        <Info className="h-6 w-6 mx-auto mb-2" />
        <AlertTitle className="text-xl font-semibold mb-2">No Words for Reading Practice!</AlertTitle>
        <AlertDescription className="text-base">
          To generate a reading passage, you need some words in your practice list.
          Please visit the {' '}
          <Button variant="link" asChild className="p-0 h-auto text-base"><Link href="/">Learn Words</Link></Button>
          {' '}page to select or add words.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out">
      <ReadingPractice wordsToPractice={wordList} readingLevel={readingLevel} />
    </div>
  );
}

